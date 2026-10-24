import json
import math
import re

from pathlib import Path
from collections import Counter, defaultdict


# =========================================================
# PATH
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

CHUNK_FILE = PROJECT_ROOT / "data" / "rag_chunks.json"
INDEX_FILE = PROJECT_ROOT / "data" / "rag_index.json"


# =========================================================
# LOAD DATA
# =========================================================

with open(
    CHUNK_FILE,
    "r",
    encoding="utf-8"
) as f:
    chunks = json.load(f)


with open(
    INDEX_FILE,
    "r",
    encoding="utf-8"
) as f:
    index_data = json.load(f)


postings = index_data["postings"]
idf = index_data["idf"]

document_lengths = index_data["document_lengths"]

average_document_length = index_data[
    "average_document_length"
]

ngram_size = index_data.get(
    "ngram_size",
    3
)


# =========================================================
# CHARACTER N-GRAM
# =========================================================

def make_ngrams(text, n=3):

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

        if gram.strip():
            grams.append(gram)

    return grams


# =========================================================
# RETRIEVE
# =========================================================

def retrieve(
    query,
    top_k=3
):

    query_terms = make_ngrams(
        query,
        n=ngram_size
    )

    query_counts = Counter(
        query_terms
    )


    scores = defaultdict(
        float
    )


    # BM25 parameters
    k1 = 1.5
    b = 0.75


    for term, query_frequency in query_counts.items():

        if term not in postings:
            continue

        term_idf = idf.get(
            term,
            0.0
        )


        for doc_index, term_frequency in postings[term]:

            doc_length = document_lengths[
                doc_index
            ]


            denominator = (
                term_frequency
                +
                k1
                *
                (
                    1
                    -
                    b
                    +
                    b
                    *
                    (
                        doc_length
                        /
                        average_document_length
                    )
                )
            )


            bm25_score = (

                term_idf
                *
                (
                    term_frequency
                    *
                    (
                        k1
                        +
                        1
                    )
                )
                /
                denominator

            )


            scores[
                doc_index
            ] += (
                bm25_score
                *
                query_frequency
            )


    ranked = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True
    )


    results = []


    for doc_index, score in ranked[:top_k]:

        result = chunks[
            doc_index
        ].copy()

        result["score"] = round(
            score,
            4
        )

        results.append(
            result
        )


    return results


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    print(
        "\nRAG Retrieval Test"
    )

    print(
        "พิมพ์ exit เพื่อออก"
    )


    while True:

        query = input(
            "\nQuestion: "
        )


        if query.lower() == "exit":
            break


        results = retrieve(
            query,
            top_k=3
        )


        if not results:

            print(
                "\nไม่พบข้อมูลที่เกี่ยวข้อง"
            )

            continue


        for i, result in enumerate(
            results,
            start=1
        ):

            print(
                "\n================================"
            )

            print(
                f"Result {i}"
            )

            print(
                f"Score: "
                f"{result['score']}"
            )

            print(
                f"Source: "
                f"{result['organization']}"
            )

            print(
                f"Title: "
                f"{result['title']}"
            )

            print(
                f"Page: "
                f"{result['page']}"
            )

            print(
                f"URL: "
                f"{result['source_url']}"
            )

            print(
                "\nText:"
            )

            print(
                result["text"][:1000]
            )