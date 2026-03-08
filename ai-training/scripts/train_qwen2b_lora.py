import json
import os
from pathlib import Path

from datasets import load_dataset
from trl import SFTTrainer, SFTConfig
from unsloth import FastLanguageModel


REPO_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = Path(os.getenv("DIGIURBAN_DATASET_PATH", REPO_ROOT / "ai-training" / "data" / "digiurban-lora-dataset.jsonl"))
OUTPUT_DIR = Path(os.getenv("DIGIURBAN_LORA_OUTPUT_DIR", REPO_ROOT / "ai-training" / "artifacts" / "qwen35-2b-lora"))
BASE_MODEL = os.getenv("DIGIURBAN_BASE_MODEL", "Qwen/Qwen3.5-2B-Base")
MAX_SEQ_LENGTH = int(os.getenv("DIGIURBAN_MAX_SEQ_LENGTH", "2048"))


def format_example(example):
    instruction = (example.get("instruction") or "").strip()
    user_input = (example.get("input") or "").strip()
    output = (example.get("output") or "").strip()

    prompt = "### Instrucao\n" + instruction + "\n\n"
    if user_input:
        prompt += "### Contexto\n" + user_input + "\n\n"
    prompt += "### Resposta\n" + output
    return {"text": prompt}


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset nao encontrado: {DATASET_PATH}")

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None,
        load_in_4bit=True,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )

    dataset = load_dataset("json", data_files=str(DATASET_PATH), split="train")
    dataset = dataset.map(format_example)

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        args=SFTConfig(
            output_dir=str(OUTPUT_DIR),
            per_device_train_batch_size=2,
            gradient_accumulation_steps=8,
            warmup_steps=10,
            max_steps=int(os.getenv("DIGIURBAN_MAX_STEPS", "240")),
            learning_rate=float(os.getenv("DIGIURBAN_LEARNING_RATE", "2e-4")),
            logging_steps=5,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="cosine",
            seed=3407,
            report_to=[],
            save_strategy="steps",
            save_steps=40,
        ),
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        packing=False,
    )

    trainer.train()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))

    metadata = {
      "base_model": BASE_MODEL,
      "dataset_path": str(DATASET_PATH),
      "output_dir": str(OUTPUT_DIR),
      "max_seq_length": MAX_SEQ_LENGTH,
    }
    (OUTPUT_DIR / "training-metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"LoRA salva em {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
