#!/usr/bin/env python3
"""
Populate Chapter.short_description using the OpenAI API.

Usage examples:
  python3 populate_chapter_short_descriptions.py
  python3 populate_chapter_short_descriptions.py --dry-run
  python3 populate_chapter_short_descriptions.py --overwrite
  python3 populate_chapter_short_descriptions.py --service-id <service_uuid>
  python3 populate_chapter_short_descriptions.py --chapter-id <chapter_uuid>
  python3 populate_chapter_short_descriptions.py --limit 10
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib import error, request


BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tci_backend.settings")

import django  # noqa: E402

django.setup()

from django.db.models import Q  # noqa: E402

from lms.models import Chapter  # noqa: E402


# Replace this before running the script.
OPENAI_API_KEY = "PASTE_YOUR_OPENAI_API_KEY_HERE"
OPENAI_MODEL = "gpt-5"
OPENAI_API_URL = "https://api.openai.com/v1/responses"

REQUEST_TIMEOUT_SECONDS = 60
SLEEP_BETWEEN_REQUESTS_SECONDS = 0.2
MAX_SOURCE_CHARACTERS = 12000
MAX_SUMMARY_WORDS = 15

SUMMARY_INSTRUCTIONS = """You write concise LMS chapter summaries.
Return exactly one plain-text summary for the chapter.
Rules:
- Maximum 15 words
- No markdown
- No bullets
- No quotation marks
- Focus on the practical topic of the chapter
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate short chapter descriptions with OpenAI."
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing chapter short descriptions.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print summaries without saving them.",
    )
    parser.add_argument(
        "--service-id",
        help="Only process chapters for the given service UUID.",
    )
    parser.add_argument(
        "--chapter-id",
        help="Only process one specific chapter UUID.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Stop after processing this many chapters. 0 means no limit.",
    )
    return parser.parse_args()


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    text = unescape(str(value))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def truncate_words(value: str, max_words: int) -> str:
    words = normalize_text(value).split()
    if not words:
        return ""
    truncated = " ".join(words[:max_words]).strip(" ,;:.")
    return truncated


def build_prompt(chapter: Chapter) -> str:
    chapter_text = normalize_text(chapter.description or chapter.content)
    if len(chapter_text) > MAX_SOURCE_CHARACTERS:
        chapter_text = chapter_text[:MAX_SOURCE_CHARACTERS].rsplit(" ", 1)[0]

    return (
        f"Service title: {chapter.service.title}\n"
        f"Chapter title: {chapter.title}\n"
        f"Chapter description: {chapter_text}"
    )


def extract_output_text(response_payload: dict) -> str:
    output_text_parts: list[str] = []

    for item in response_payload.get("output", []):
        for content_part in item.get("content", []):
            if content_part.get("type") == "output_text":
                text = content_part.get("text", "")
                if text:
                    output_text_parts.append(text)

    return normalize_text(" ".join(output_text_parts))


def call_openai(prompt: str) -> str:
    payload = {
        "model": OPENAI_MODEL,
        "instructions": SUMMARY_INSTRUCTIONS,
        "input": prompt,
        "text": {"format": {"type": "text"}},
        "max_output_tokens": 80,
    }

    req = request.Request(
        OPENAI_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(error_body)
            message = parsed.get("error", {}).get("message") or error_body
        except json.JSONDecodeError:
            message = error_body
        raise RuntimeError(f"OpenAI API HTTP {exc.code}: {message}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"OpenAI API request failed: {exc}") from exc

    summary = extract_output_text(response_payload)
    if not summary:
        raise RuntimeError("OpenAI API returned an empty summary.")

    return truncate_words(summary, MAX_SUMMARY_WORDS)


def get_queryset(args: argparse.Namespace) -> Iterable[Chapter]:
    queryset = Chapter.objects.select_related("service").order_by(
        "service__title", "week", "order", "created_at"
    )

    if args.service_id:
        queryset = queryset.filter(service_id=args.service_id)

    if args.chapter_id:
        queryset = queryset.filter(id=args.chapter_id)

    if not args.overwrite:
        queryset = queryset.filter(
            Q(short_description__isnull=True) | Q(short_description__exact="")
        )

    if args.limit and args.limit > 0:
        queryset = queryset[: args.limit]

    return queryset


def validate_api_key() -> None:
    if not OPENAI_API_KEY or OPENAI_API_KEY == "PASTE_YOUR_OPENAI_API_KEY_HERE":
        raise RuntimeError(
            "Set OPENAI_API_KEY in populate_chapter_short_descriptions.py before running."
        )


def main() -> int:
    args = parse_args()
    validate_api_key()

    chapters = list(get_queryset(args))
    if not chapters:
        print("No chapters matched the filters.")
        return 0

    print(f"Processing {len(chapters)} chapter(s) with model {OPENAI_MODEL}...")

    updated_count = 0
    skipped_count = 0

    for index, chapter in enumerate(chapters, start=1):
        source_text = normalize_text(chapter.description or chapter.content)
        if not source_text:
            skipped_count += 1
            print(
                f"[{index}/{len(chapters)}] Skipped chapter {chapter.id} ({chapter.title}) - no source description."
            )
            continue

        print(f"[{index}/{len(chapters)}] Summarizing: {chapter.title}")

        try:
            summary = call_openai(build_prompt(chapter))
        except Exception as exc:  # noqa: BLE001
            skipped_count += 1
            print(f"  Failed: {exc}")
            continue

        if not summary:
            skipped_count += 1
            print("  Failed: empty summary after cleanup.")
            continue

        print(f"  Summary: {summary}")

        if not args.dry_run:
            chapter.short_description = summary
            chapter.save(update_fields=["short_description"])

        updated_count += 1
        time.sleep(SLEEP_BETWEEN_REQUESTS_SECONDS)

    action = "would update" if args.dry_run else "updated"
    print(
        f"Done. {action.capitalize()} {updated_count} chapter(s), skipped {skipped_count} chapter(s)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
