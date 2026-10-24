from pathlib import Path
import importlib.util


# =========================================================
# PATH
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

RETRIEVER_PATH = (
    PROJECT_ROOT
    / "rag_final"
    / "rag"
    / "retriever.py"
)


# =========================================================
# LOAD FINAL RAG
# =========================================================

if not RETRIEVER_PATH.exists():
    raise FileNotFoundError(
        f"ไม่พบ RAG Final Retriever: {RETRIEVER_PATH}"
    )


spec = importlib.util.spec_from_file_location(
    "lumamind_final_retriever",
    RETRIEVER_PATH
)

if spec is None or spec.loader is None:
    raise ImportError(
        f"ไม่สามารถโหลด RAG Retriever จาก {RETRIEVER_PATH}"
    )


retriever_module = importlib.util.module_from_spec(spec)

spec.loader.exec_module(
    retriever_module
)

retrieve = retriever_module.retrieve


print("=" * 60)
print("LumaMind RAG Final พร้อมใช้งาน ✅")
print("RAG Type: BM25 Character N-gram")
print("=" * 60)


# =========================================================
# RETRIEVE CONTEXT
# =========================================================

def retrieve_context(query: str) -> str:
    """
    ค้นข้อมูลจาก LumaMind RAG Final
    และส่งผลลัพธ์อันดับแรกให้ LLM ใช้เป็น Context

    หมายเหตุ:
    ขณะนี้ใช้ top_k=1 เพื่อทดสอบผลของปริมาณ Context
    ต่อคุณภาพคำตอบของ LumaMind
    """

    query = query.strip()

    if not query:
        return ""

    try:
        results = retrieve(
            query,
            top_k=1
        )

    except Exception as e:
        print(f"RAG Retrieval Error: {e}")
        return ""

    if not results:
        return ""

    context_parts = []

    for result in results:

        text = result.get(
            "text",
            ""
        ).strip()

        if not text:
            continue

        title = result.get(
            "title",
            "ไม่ระบุชื่อเอกสาร"
        )

        organization = result.get(
            "organization",
            "ไม่ระบุหน่วยงาน"
        )

        page = result.get(
            "page",
            "ไม่ระบุ"
        )

        source_url = result.get(
            "source_url",
            ""
        )

        context_part = (
            f"แหล่งข้อมูล: {organization}\n"
            f"เอกสาร: {title}\n"
            f"หน้า: {page}\n"
            f"URL: {source_url}\n"
            f"เนื้อหา:\n{text}"
        )

        context_parts.append(
            context_part
        )

    if not context_parts:
        return ""

    return "\n\n---\n\n".join(
        context_parts
    )