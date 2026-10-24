
import gc
import re
from pathlib import Path

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

ROOT = Path(__file__).resolve().parent
BASE_MODEL = "Qwen/Qwen3-1.7B"
ADAPTER_ROOT = ROOT / "models" / "qwen3_lora"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

QUESTIONS = [
    "ช่วงนี้ฉันรู้สึกเหนื่อยมาก ไม่ค่อยมีแรงทำอะไรเลย",
    "ฉันเครียดเรื่องเรียนมาก ควรทำยังไงดี",
    "ฉันไม่มั่นใจในตัวเองเลย",
    "ฉันรู้สึกไม่ค่อยโอเคช่วงนี้",
]

SYSTEM_PROMPT = """
คุณคือ LumaMind ผู้ช่วยสนทนาภาษาไทยสำหรับรับฟังและดูแลสุขภาพใจเบื้องต้น
ตอบผู้ใช้อย่างสุภาพ อบอุ่น และตรงกับข้อความที่ได้รับ
ใช้ภาษาไทยเรียบง่าย เป็นธรรมชาติ
รับรู้ความรู้สึกก่อนให้คำแนะนำ
ไม่เดาสาเหตุที่ผู้ใช้ไม่ได้บอก
ไม่วินิจฉัยโรคหรือแนะนำให้ใช้ยาเอง
โดยทั่วไปตอบ 2-3 ประโยค
""".strip()


def test_model(label, adapter_path=None):
    print(f"\n{'=' * 60}")
    print(f"TESTING: {label}")
    print(f"{'=' * 60}")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    base = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        dtype=DTYPE
    ).to(DEVICE)

    if adapter_path is not None:
        if not adapter_path.is_dir():
            raise FileNotFoundError(adapter_path)

        model = PeftModel.from_pretrained(
            base,
            str(adapter_path)
        )
    else:
        model = base

    model.eval()

    for i, question in enumerate(QUESTIONS, 1):
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ]

        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
            enable_thinking=False
        )

        inputs = tokenizer(
            prompt,
            return_tensors="pt"
        ).to(DEVICE)

        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                max_new_tokens=160,
                do_sample=False,
                repetition_penalty=1.12,
                pad_token_id=tokenizer.eos_token_id
            )

        generated = outputs[0][inputs["input_ids"].shape[1]:]

        answer = tokenizer.decode(
            generated,
            skip_special_tokens=True
        ).strip()

        answer = re.sub(r"\s+", " ", answer)

        print(f"\nTC-{i:02d}")
        print(f"Question: {question}")
        print(f"Answer: {answer}", flush=True)

    del model
    del base
    gc.collect()

    if torch.cuda.is_available():
        torch.cuda.empty_cache()


if __name__ == "__main__":
    print(f"Device: {DEVICE}")

    test_model("Qwen3 Base")

    test_model(
        "LoRA Original",
        ADAPTER_ROOT / "lumamind_final"
    )

    test_model(
        "LoRA V3",
        ADAPTER_ROOT / "lumamind_v3"
    )

    print("\nComparison completed.")
