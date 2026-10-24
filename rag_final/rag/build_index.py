import json
import re
import math

from pathlib import Path
from collections import Counter, defaultdict

from pypdf import PdfReader


# =========================================================
# PATH CONFIG
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

SOURCE_FILE = PROJECT_ROOT / "data" / "sources.json"

CHUNK_FILE = PROJECT_ROOT / "data" / "rag_chunks.json"

INDEX_FILE = PROJECT_ROOT / "data" / "rag_index.json"


# =========================================================
# CLEAN TEXT
# =========================================================

def clean_text(text):

    text = text.replace("\x00", " ")

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# =========================================================
# CHUNK TEXT
# =========================================================

def chunk_text(
    text,
    chunk_size=1000,
    overlap=150
):

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


# =========================================================
# CHARACTER N-GRAM
# เหมาะกับภาษาไทย เพราะภาษาไทยไม่ได้เว้นวรรคทุกคำ
# =========================================================

def make_ngrams(
    text,
    n=3
):

    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    grams = []

    if len(text) < n:
        return grams

    for i in range(
        len(text) - n + 1
    ):

        gram = text[i:i+n]

        # ไม่เก็บ gram ที่เป็นช่องว่างล้วน
        if gram.strip():
            grams.append(gram)

    return grams


# =========================================================
# LOAD SOURCES
# =========================================================

print(
    "Loading source metadata..."
)

with open(
    SOURCE_FILE,
    "r",
    encoding="utf-8"
) as f:

    sources = json.load(f)


all_chunks = []


# =========================================================
# READ PDF
# =========================================================

for source in sources:

    pdf_path = (
        PROJECT_ROOT /
        source["file_path"]
    )

    print("\n================================")

    print(
        f'Document ID : '
        f'{source["document_id"]}'
    )

    print(
        f'Title       : '
        f'{source["title"]}'
    )

    print(
        f'Organization: '
        f'{source["organization"]}'
    )

    print(
        f'PDF         : '
        f'{pdf_path}'
    )

    print("================================")


    if not pdf_path.exists():

        print(
            f"ERROR: File not found -> "
            f"{pdf_path}"
        )

        continue


    reader = PdfReader(
        str(pdf_path)
    )


    print(
        f"Pages: {len(reader.pages)}"
    )


    for page_number, page in enumerate(
        reader.pages
    ):

        text = (
            page.extract_text()
            or ""
        )

        text = clean_text(
            text
        )


        if not text:
            continue


        chunks = chunk_text(
            text
        )


        for chunk_number, chunk in enumerate(
            chunks
        ):

            chunk_data = {

                "chunk_id": (
                    f'{source["document_id"]}'
                    f'_P{page_number + 1}'
                    f'_C{chunk_number + 1}'
                ),

                "document_id":
                    source["document_id"],

                "text":
                    chunk,

                "title":
                    source["title"],

                "organization":
                    source["organization"],

                "year":
                    source["year"],

                "audience":
                    source.get("audience", "general"),

                "topic":
                    source.get("topic", "general"),

                "page":
                    page_number + 1,

                "source_url":
                    source["source_url"]
            }


            all_chunks.append(
                chunk_data
            )


# =========================================================
# CHECK EXTRACTION
# =========================================================

if len(all_chunks) == 0:

    raise RuntimeError(
        "ไม่พบข้อความจาก PDF "
        "กรุณาตรวจสอบว่า PDF สามารถ extract text ได้"
    )


print("\n================================")

print(
    f"Total chunks: "
    f"{len(all_chunks)}"
)

print("================================")


# =========================================================
# BUILD RETRIEVAL INDEX
# Pure Python
# =========================================================

print(
    "\nBuilding retrieval index..."
)


document_frequencies = Counter()

term_frequencies = []

document_lengths = []


# -------------------------
# นับ term frequency
# -------------------------

for chunk in all_chunks:

    grams = make_ngrams(
        chunk["text"],
        n=3
    )

    counts = Counter(
        grams
    )

    term_frequencies.append(
        counts
    )

    document_lengths.append(
        sum(counts.values())
    )


    # document frequency
    for term in counts.keys():

        document_frequencies[
            term
        ] += 1


# -------------------------
# IDF
# -------------------------

number_of_documents = len(
    all_chunks
)


idf = {}


for term, df in document_frequencies.items():

    value = math.log(
        1
        +
        (
            number_of_documents
            - df
            + 0.5
        )
        /
        (
            df
            + 0.5
        )
    )

    idf[term] = value


# -------------------------
# Inverted index
# -------------------------

postings = defaultdict(
    list
)


for doc_index, counts in enumerate(
    term_frequencies
):

    for term, frequency in counts.items():

        postings[term].append(
            [
                doc_index,
                frequency
            ]
        )


average_document_length = (

    sum(document_lengths)
    / len(document_lengths)

)


# =========================================================
# SAVE CHUNKS
# =========================================================

with open(
    CHUNK_FILE,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        all_chunks,
        f,
        ensure_ascii=False,
        indent=2
    )


# =========================================================
# SAVE INDEX
# =========================================================

index_data = {

    "index_type":
        "BM25_character_ngram",

    "ngram_size":
        3,

    "number_of_documents":
        number_of_documents,

    "average_document_length":
        average_document_length,

    "document_lengths":
        document_lengths,

    "idf":
        idf,

    "postings":
        dict(postings)
}


with open(
    INDEX_FILE,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        index_data,
        f,
        ensure_ascii=False
    )


# =========================================================
# FINISHED
# =========================================================

print("\n================================")

print(
    "RAG retrieval index "
    "created successfully"
)

print("================================")


print(
    f"\nChunks:"
    f"\n{CHUNK_FILE}"
)


print(
    f"\nIndex:"
    f"\n{INDEX_FILE}"
)


print(
    "\nRetrieval method: "
    "BM25 Character 3-gram"
)


print(
    "\nReady for retrieval."
)