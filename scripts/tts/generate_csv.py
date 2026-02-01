#!/usr/bin/env python3
"""
Generate romanian_month1_124k.csv from individual CEFR level text files.
Combines all texts, assigns voices, calculates metrics, and outputs CSV.
"""

import csv
import os
import sys

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from a1_texts import texts as a1_texts
from a2_texts import texts as a2_texts
from b1_texts import texts as b1_texts
from b2_c1_texts import texts as b2_c1_texts

# Voice IDs
MALE_VOICES = [
    "b4bnZ9y3ZRH0myLzE2B5",
    "8nBBDfYxYXmDNaqTCxPH",
    "HPdbgrGubKiBta6Pq21b",
]

FEMALE_VOICES = [
    "PoHUWWWMHFrA8z7Q88pu",
    "QtObtrglHRaER8xlDZsr",
    "gbLy9ep70G3JW53cTzFC",
    "gCte8DU5EgI3W1KcuLSA",
    "kZXTQfulCLOSFsxuZQHx",
    "GRHbHyXbUO8nF4YexVTa",
]

SPEED = 0.90

# Romanian TTS: ~135 wpm at 0.90 speed, avg word ~5.5 chars
# chars_per_second = (135 * 5.5) / 60 ≈ 12.4
# At 0.90 speed, duration is longer: chars_per_sec_effective = 12.4 * 0.90 = 11.16
CHARS_PER_SEC = 11.16


def assign_voice(gender: str, index: int) -> str:
    """Assign a voice ID based on gender, cycling through available voices."""
    if gender == "male":
        return MALE_VOICES[index % len(MALE_VOICES)]
    else:
        return FEMALE_VOICES[index % len(FEMALE_VOICES)]


def process_texts(all_texts: list[dict]) -> list[dict]:
    """Calculate metrics and assign voices for all texts."""
    male_idx = 0
    female_idx = 0

    for text in all_texts:
        romanian = text["text_romanian"]
        text["character_count"] = len(romanian)
        text["word_count"] = len(romanian.split())
        text["speed"] = SPEED
        text["estimated_duration_sec"] = round(text["character_count"] / CHARS_PER_SEC, 1)

        gender = text.get("speaker_gender", "female")
        text["speaker_gender"] = gender

        if gender == "male":
            text["voice_id"] = assign_voice("male", male_idx)
            male_idx += 1
        else:
            text["voice_id"] = assign_voice("female", female_idx)
            female_idx += 1

    return all_texts


def write_csv(all_texts: list[dict], output_path: str):
    """Write all texts to CSV."""
    fieldnames = [
        "id", "level", "text_romanian", "topic", "word_count",
        "character_count", "speaker_gender", "voice_id", "speed",
        "estimated_duration_sec"
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_texts)


def print_stats(all_texts: list[dict]):
    """Print summary statistics."""
    total_chars = sum(t["character_count"] for t in all_texts)
    total_words = sum(t["word_count"] for t in all_texts)
    total_duration = sum(t["estimated_duration_sec"] for t in all_texts)
    male_count = sum(1 for t in all_texts if t["speaker_gender"] == "male")
    female_count = sum(1 for t in all_texts if t["speaker_gender"] == "female")

    print(f"\n{'='*60}")
    print(f"Romanian TTS Content Generation Summary")
    print(f"{'='*60}")
    print(f"Total texts:      {len(all_texts)}")
    print(f"Total characters: {total_chars:,}")
    print(f"Total words:      {total_words:,}")
    print(f"Total duration:   {total_duration:,.1f} sec ({total_duration/60:,.1f} min)")
    print(f"Male speakers:    {male_count} ({male_count/len(all_texts)*100:.1f}%)")
    print(f"Female speakers:  {female_count} ({female_count/len(all_texts)*100:.1f}%)")
    print()

    for level in ["A1", "A2", "B1", "B2", "C1"]:
        level_texts = [t for t in all_texts if t["level"] == level]
        if not level_texts:
            continue
        level_chars = sum(t["character_count"] for t in level_texts)
        level_duration = sum(t["estimated_duration_sec"] for t in level_texts)
        avg_chars = level_chars / len(level_texts)
        min_chars = min(t["character_count"] for t in level_texts)
        max_chars = max(t["character_count"] for t in level_texts)
        print(f"  {level}: {len(level_texts):3d} texts | {level_chars:>6,} chars | "
              f"avg {avg_chars:>5.0f} | range {min_chars}-{max_chars} | "
              f"{level_duration:>6.1f}s ({level_duration/60:.1f}min)")

    print(f"\n{'='*60}")


def main():
    # Combine all texts in order
    all_texts = a1_texts + a2_texts + b1_texts + b2_c1_texts

    # Process: calculate metrics and assign voices
    all_texts = process_texts(all_texts)

    # Output path - write to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    output_path = os.path.join(project_root, "romanian_month1_124k.csv")

    # Write CSV
    write_csv(all_texts, output_path)

    # Print stats
    print_stats(all_texts)
    print(f"CSV written to: {output_path}")


if __name__ == "__main__":
    main()
