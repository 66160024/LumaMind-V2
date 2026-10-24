from fastapi import FastAPI
from pydantic import BaseModel

from backend.services.rag_service import retrieve_context
from backend.services.llm_service import generate_response
from backend.services.safety_service import (
    detect_risk_type,
    get_current_crisis_response,
    get_past_risk_response,
    get_other_person_risk_response
)

app = FastAPI(
    title="LumaMind AI Backend",
    description="Backend API สำหรับเชื่อม LumaMind กับ RAG และ AI Model",
    version="1.0.0"
)


class ChatRequest(BaseModel):
    message: str


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "LumaMind FastAPI is running"
    }


@app.post("/chat")
def chat(request: ChatRequest):
    user_message = request.message.strip()

    if not user_message:
        return {
            "success": False,
            "response": "ไม่พบข้อความ"
        }

    # -------------------------------------------------
    # 1. ตรวจประเภทความเสี่ยงก่อนเข้า RAG และ AI
    # -------------------------------------------------
    risk_type = detect_risk_type(user_message)

    # ผู้ใช้มีความเสี่ยงในปัจจุบัน
    if risk_type == "current_self":
        return {
            "success": True,
            "risk_detected": True,
            "risk_type": "current_self",
            "user_message": user_message,
            "context": "",
            "response": get_current_crisis_response()
        }

    # ผู้ใช้พูดถึงเหตุการณ์เสี่ยงในอดีต
    if risk_type == "past_self":
        return {
            "success": True,
            "risk_detected": True,
            "risk_type": "past_self",
            "user_message": user_message,
            "context": "",
            "response": get_past_risk_response()
        }

    # ผู้ใช้พูดถึงบุคคลอื่นที่มีความเสี่ยง
    if risk_type == "other_person":
        return {
            "success": True,
            "risk_detected": True,
            "risk_type": "other_person",
            "user_message": user_message,
            "context": "",
            "response": get_other_person_risk_response()
        }

    # -------------------------------------------------
    # 2. ถ้าไม่พบข้อความเสี่ยง ให้ RAG ค้นข้อมูล
    # -------------------------------------------------
    context = retrieve_context(user_message)

    # -------------------------------------------------
    # 3. ส่งคำถาม + Context ให้ Qwen สร้างคำตอบ
    # -------------------------------------------------
    bot_response = generate_response(
        user_message=user_message,
        context=context
    )

    return {
        "success": True,
        "risk_detected": False,
        "risk_type": "none",
        "user_message": user_message,
        "context": context,
        "response": bot_response
    }