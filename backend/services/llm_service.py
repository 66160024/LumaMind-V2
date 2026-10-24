
import re
import time
from pathlib import Path

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel


# =========================================================
# CONFIG
# =========================================================

BASE_MODEL = "Qwen/Qwen3-1.7B"

PROJECT_ROOT = Path(__file__).resolve().parents[2]

LORA_PATH = (
    PROJECT_ROOT
    / "models"
    / "qwen3_lora"
    / "qwen3_lora_result_v4"
)

MAX_NEW_TOKENS = 160

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32


# =========================================================
# LOAD MODEL
# =========================================================

print("=" * 60)
print("Loading LumaMind AI...")
print(f"Base Model: {BASE_MODEL}")
print(f"LoRA Path: {LORA_PATH}")
print(f"Device: {DEVICE}")
print("=" * 60)

if not LORA_PATH.is_dir():
    raise FileNotFoundError(
        f"LoRA model not found: {LORA_PATH}"
    )

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    dtype=DTYPE
)

base_model = base_model.to(DEVICE)

model = PeftModel.from_pretrained(
    base_model,
    str(LORA_PATH)
)

model.eval()

print("Qwen3-1.7B + LoRA loaded successfully")


# =========================================================
# RAG ROUTING
# =========================================================

def should_use_context(user_message: str) -> bool:
    """
    ใช้ RAG เฉพาะคำถามเชิงความรู้
    ไม่ใช้กับการระบายความรู้สึกทั่วไป
    """

    message = user_message.lower()

    keywords = [
        "คืออะไร",
        "หมายถึงอะไร",
        "สุขภาพจิตคือ",
        "สุขภาวะทางใจคือ",
        "วิธีดูแลสุขภาพจิต",
        "ดูแลสุขภาพจิตอย่างไร",
        "ขอความช่วยเหลือจากใคร",
        "ขอความช่วยเหลือที่ไหน",
        "สายด่วน",
        "1323",
        "ช่องทางช่วยเหลือ",
        "ผู้เชี่ยวชาญ",
    ]

    return any(
        keyword in message
        for keyword in keywords
    )


# =========================================================
# SYSTEM PROMPT
# คง Prompt เวอร์ชันที่ทดสอบแล้ว
# =========================================================

SYSTEM_PROMPT = """
คุณคือ LumaMind ผู้ช่วยสนทนาภาษาไทยสำหรับรับฟังและดูแลสุขภาพใจเบื้องต้น

ตอบผู้ใช้อย่างสุภาพ อบอุ่น และตรงกับข้อความที่ได้รับ
ใช้ภาษาไทยที่เรียบง่าย ชัดเจน เหมือนกำลังพูดคุยกันจริง ๆ

เมื่อผู้ใช้เล่าความรู้สึก:
1. เริ่มด้วยการรับรู้ความรู้สึกของผู้ใช้อย่างจริงใจ
2. หากผู้ใช้ขอคำแนะนำ ให้เสนอวิธีเล็ก ๆ ที่ทำได้จริง
3. หากเหมาะสม สามารถถามกลับสั้น ๆ เพื่อให้ผู้ใช้เล่าเพิ่มเติม

อย่าเดาสาเหตุที่ผู้ใช้ไม่ได้บอก
อย่าพูดเป็นหลักการทั่วไปก่อนรับฟังผู้ใช้
อย่าใช้คำพูดวกวนหรือคำแนะนำที่ไม่เกี่ยวข้อง
อย่ารับประกันว่าความรู้สึกจะดีขึ้นแน่นอน

เมื่อผู้ใช้ถามข้อมูล ให้ตอบตามข้อเท็จจริง
เมื่อผู้ใช้ทักทายหรือขอบคุณ ให้ตอบสั้น ๆ เป็นมิตร

โดยทั่วไปตอบ 2-3 ประโยค ใช้ประโยคสมบูรณ์
ไม่จำเป็นต้องถามกลับทุกครั้ง

ไม่วินิจฉัยโรค ไม่แนะนำให้ใช้ยาเอง
หากพบความเสี่ยงทำร้ายตัวเอง ให้ให้ความสำคัญกับความปลอดภัย
และแนะนำการขอความช่วยเหลือที่เหมาะสม

น้ำเสียงในการสนทนา:
- ใช้ภาษาไทยง่าย ๆ เหมือนคนไทยพูดคุยกันจริง
- ใช้คำลงท้าย เช่น "นะ" "ค่ะ" "นะคะ" เมื่อเหมาะสม
- ไม่จำเป็นต้องมีคำลงท้ายทุกประโยค
- หลีกเลี่ยงคำทางการหรือคำประดิษฐ์ที่คนทั่วไปไม่ค่อยพูด
- ไม่เพิ่มคำหวานหรือคำปลอบใจที่เกินจริง
- อย่าเปลี่ยนประเด็นหรือเดาสิ่งที่ผู้ใช้ไม่ได้เล่า

เมื่อผู้ใช้ระบายความรู้สึก:
- รับฟังความรู้สึกก่อน แล้วค่อยให้คำแนะนำสั้น ๆ หากเหมาะสม
- ถ้าผู้ใช้ดูเครียด เศร้า เหงา หรือไม่มั่นใจ สามารถชวนคุยต่อได้
- ใช้คำถามธรรมชาติ เช่น "มีเรื่องไหนที่อยากเล่าให้ฟังเป็นพิเศษไหมคะ"
- ถามกลับเมื่อช่วยให้เข้าใจผู้ใช้มากขึ้น ไม่ต้องถามทุกครั้ง
- ถ้าผู้ใช้มีความเสี่ยงทำร้ายตัวเอง ให้เน้นความปลอดภัยก่อนคำถามชวนคุยทั่วไป
""".strip()


# =========================================================
# CLEAN RESPONSE
# =========================================================

def clean_response(response: str) -> str:
    """
    จัดรูปแบบคำตอบโดยไม่เปลี่ยนความหมาย
    """

    return re.sub(
        r"\s+",
        " ",
        response
    ).strip()


# =========================================================
# SHORT CONVERSATIONAL REPLIES
# =========================================================

def get_simple_reply(user_message: str):
    """
    ตอบเฉพาะข้อความสั้นที่ตรงกับรายการทั้งหมด
    ไม่ใช้การค้นหาคำบางส่วนในประโยค
    """

    normalized = re.sub(
        r"\s+",
        "",
        user_message
    ).lower()

    normalized = normalized.rstrip("!！.。~～")

    simple_replies = {
        "ขอบคุณ":
            "ยินดีค่ะ ถ้ามีอะไรอยากเล่าเพิ่มเติม ฉันพร้อมรับฟังนะคะ",

        "ขอบคุณนะ":
            "ยินดีนะคะ ถ้าอยากคุยต่อ ฉันพร้อมรับฟังค่ะ",

        "ขอบคุณค่ะ":
            "ยินดีค่ะ",

        "ขอบคุณครับ":
            "ยินดีค่ะ",

        "ขอบคุณมาก":
            "ยินดีมากเลยค่ะ",

        "ขอบคุณมากนะ":
            "ยินดีนะคะ",

        "สวัสดี":
            "สวัสดีค่ะ วันนี้เป็นยังไงบ้างคะ",

        "สวัสดีค่ะ":
            "สวัสดีค่ะ มีอะไรอยากเล่าให้ฟังไหมคะ",

        "สวัสดีครับ":
            "สวัสดีค่ะ วันนี้อยากคุยเรื่องอะไรดีคะ",

        "หวัดดี":
            "สวัสดีค่ะ วันนี้เป็นยังไงบ้างคะ",
    }

    return simple_replies.get(normalized)


# =========================================================
# GENERATE ONCE
# =========================================================

def generate_once(
    messages,
    max_new_tokens=160
):
    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=False
    )

    inputs = tokenizer(
        prompt,
        return_tensors="pt"
    )

    inputs = {
        key: value.to(DEVICE)
        for key, value in inputs.items()
    }

    start_time = time.perf_counter()

    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            repetition_penalty=1.12,
            pad_token_id=tokenizer.eos_token_id
        )

    elapsed = time.perf_counter() - start_time

    input_length = inputs["input_ids"].shape[1]

    new_tokens = outputs[0][input_length:]

    response = tokenizer.decode(
        new_tokens,
        skip_special_tokens=True
    ).strip()

    print(
        f"[LumaMind] Generated {len(new_tokens)} "
        f"tokens in {elapsed:.2f}s",
        flush=True
    )

    reached_limit = (
        len(new_tokens) >= max_new_tokens
    )

    return clean_response(response), reached_limit


# =========================================================
# MAIN RESPONSE FUNCTION
# =========================================================

def generate_response(
    user_message: str,
    context: str = ""
) -> str:

    user_message = user_message.strip()

    if not user_message:
        return "อยากเล่าเรื่องอะไรให้ฟังไหม?"

    # ระบบ Safety ต้องตรวจข้อความก่อนเรียกฟังก์ชันนี้
    # ตอบอัตโนมัติเฉพาะคำทักทายหรือขอบคุณที่ตรงทั้งข้อความ

    simple_reply = get_simple_reply(user_message)

    if simple_reply is not None:
        return simple_reply

    use_context = (
        bool(context)
        and should_use_context(user_message)
    )

    if use_context:
        user_content = (
            f"คำถาม: {user_message}\n\n"
            f"ข้อมูลอ้างอิง:\n{context[:1400]}\n\n"
            "ตอบคำถามโดยตรงด้วยภาษาไทยธรรมชาติ"
        )
    else:
        user_content = user_message

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": user_content
        }
    ]

    response, reached_limit = generate_once(
        messages,
        max_new_tokens=MAX_NEW_TOKENS
    )

    # Retry เฉพาะกรณีคำตอบว่างหรือชน Token Limit
    if not response or reached_limit:

        retry_messages = [
            {
                "role": "system",
                "content": (
                    SYSTEM_PROMPT
                    + "\nตอบให้กระชับและจบประโยคให้สมบูรณ์"
                )
            },
            {
                "role": "user",
                "content": user_content
            }
        ]

        retry_response, retry_limited = generate_once(
            retry_messages,
            max_new_tokens=200
        )

        if retry_response and not retry_limited:
            response = retry_response

    if not response:
        return (
            "ฉันพร้อมรับฟังนะ "
            "ถ้าอยากเล่าเพิ่มเติม ฉันอยู่ตรงนี้นะ"
        )

    return response
