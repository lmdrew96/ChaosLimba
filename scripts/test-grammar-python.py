from transformers import T5ForConditionalGeneration, T5Tokenizer
import os

# Use your HF token
token = os.getenv('HUGGINGFACE_API_TOKEN')

print("Loading your model from HuggingFace...")
model = T5ForConditionalGeneration.from_pretrained(
    "lmdrew96/ro-grammar-mt5-small",
    token=token
)
tokenizer = T5Tokenizer.from_pretrained(
    "lmdrew96/ro-grammar-mt5-small",
    token=token
)

test_sentences = [
    "Eu merge la magazin",
    "Copiii joaca în parc",
    "Ea merge la școală",
]

for sentence in test_sentences:
    print(f"\n📝 Input: {sentence}")
    inputs = tokenizer(f"correct: {sentence}", return_tensors="pt", max_length=512, truncation=True)
    outputs = model.generate(inputs.input_ids, max_length=512, num_beams=5, early_stopping=True)
    corrected = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    if corrected == sentence:
        print(f"✅ Already correct!")
    else:
        print(f"✏️  Corrected: {corrected}")