import torch
from transformers import AutoTokenizer, AutoModelForCausalLM


# =========================================================
# CONFIG
# =========================================================

BASE_MODEL = "Qwen/Qwen3-1.7B"


# =========================================================
# DEVICE
# =========================================================

if torch.cuda.is_available():
    DEVICE = "cuda"
    DTYPE = torch.float16
else:
    DEVICE = "cpu"
    DTYPE = torch.float32


print("=" * 60)
print("กำลังโหลด Base Qwen3-1.7B สำหรับทดสอบ...")
print(f"Device: {DEVICE}")
print("=" * 60)


# =========================================================
# LOAD BASE MODEL ONLY
# =========================================================

tokenizer = AutoTokenizer.from_pretrained(
    BASE_MODEL
)

model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    dtype=DTYPE
)

model = model.to(DEVICE)
model.eval()


print("=" * 60)
print("โหลด Base Qwen3-1.7B สำเร็จ")
print("ไม่มี LoRA / ไม่มี RAG")
print("=" * 60)


# =========================================================
# TEST
# =========================================================

system_prompt = """
คุณคือ LumaMind ผู้ช่วยพูดคุยด้านสุขภาพใจเบื้องต้น

ตอบเป็นภาษาไทยธรรมชาติ เหมือนคนทั่วไปที่สุภาพและใส่ใจกำลังพูดคุยกัน
ตอบให้ตรงกับสิ่งที่ผู้ใช้พูด ไม่ขยายไปเรื่องอื่นโดยไม่จำเป็น
ใช้คำง่าย ๆ ที่ใช้กันทั่วไปในชีวิตประจำวัน
รับฟังสิ่งที่ผู้ใช้พูดก่อน แล้วค่อยให้คำแนะนำสั้น ๆ ที่เกี่ยวข้อง
ไม่วินิจฉัยโรค และไม่อ้างว่าตนเองเป็นแพทย์หรือผู้เชี่ยวชาญ
""".strip()


user_message = "ช่วงนี้ฉันรู้สึกเหนื่อยมาก ไม่ค่อยมีแรงทำอะไรเลย"


messages = [
    {
        "role": "system",
        "content": system_prompt
    },
    {
        "role": "user",
        "content": user_message
    }
]


text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True,
    enable_thinking=False
)


inputs = tokenizer(
    text,
    return_tensors="pt"
)

inputs = {
    key: value.to(DEVICE)
    for key, value in inputs.items()
}


with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=220,
        do_sample=False
    )


input_length = inputs["input_ids"].shape[1]

new_tokens = outputs[0][input_length:]


response = tokenizer.decode(
    new_tokens,
    skip_special_tokens=True
).strip()


print("\nคำถาม:")
print(user_message)

print("\nคำตอบจาก Base Qwen3-1.7B:")
print(response)

print("\n" + "=" * 60)