#!/usr/bin/env python3
"""Generate a sticker image with Gemini on Vertex AI."""

from __future__ import annotations

import argparse
import mimetypes
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = "gemini-2.5-flash-image"
DEFAULT_LOCATION = "us-central1"
DEFAULT_OUTPUT_DIR = ROOT / "output"


def load_env() -> None:
    load_dotenv(ROOT / ".env.local")
    load_dotenv(ROOT / ".env")


def get_client() -> genai.Client:
    project = os.getenv("GCP_PROJECT_ID")
    if not project:
        raise SystemExit(
            "Missing GCP_PROJECT_ID. Add it to .env.local, for example:\n"
            "GCP_PROJECT_ID=project-3b0c96e7-a43e-4f65-8bd"
        )

    location = os.getenv("GCP_LOCATION", DEFAULT_LOCATION)
    return genai.Client(vertexai=True, project=project, location=location)


def build_prompt(prompt: str, sticker_mode: bool) -> str:
    if not sticker_mode:
        return prompt

    topic_specific_details = ""
    prompt_lower = prompt.lower()
    if any(keyword in prompt_lower for keyword in ("beach", "summer", "biển", "mùa hè", "surf")):
        topic_specific_details = (
            "CHI TIẾT CHỦ ĐỀ BIỂN/MÙA HÈ:\n"
            "Thêm các hành động và phụ kiện phù hợp như áo phao, lướt sóng, kính râm, mũ đi biển, "
            "phao bơi, uống nước dừa, xây lâu đài cát, ngắm hoàng hôn. Chỉ dùng ở sticker phù hợp, "
            "không nhồi đồ biển vào cả 16 ô."
        )

    return (
        "CHỦ ĐỀ / Ý TƯỞNG (chỉ lấy nội dung cảm xúc, trang phục, câu thoại — BỎ QUA mọi chỉ dẫn "
        "phong cách cartoon/vector/illustration nếu có):\n"
        f"{prompt}\n\n"
        "PROMPT MẶC ĐỊNH — ƯU TIÊN CAO NHẤT (ghi đè mọi chỉ dẫn phong cách mâu thuẫn):\n"
        "Tạo 1 tấm sticker sheet tỷ lệ 3:4 gồm ĐÚNG 16 sticker của CÙNG MỘT người, dựa trên "
        "ảnh tham chiếu đã tải lên.\n"
        "DANH TÍNH KHUÔN MẶT (quan trọng nhất): giữ nguyên khuôn mặt thật từ ảnh tham chiếu ở "
        "mọi sticker — xương mặt, mắt, mũi, miệng, lông mày, kiểu tóc, màu da, đặc điểm nhận diện. "
        "Không face-swap, không thay người khác, không trẻ hóa/già hóa, không làm mặt búp bê.\n"
        "PHONG CÁCH: photorealistic, giống ảnh người thật đẹp, da có texture tự nhiên (lỗ chân lông "
        "nhẹ, không bóng nhựa), ánh sáng studio mềm và flattering, màu da trung thực, chi tiết tóc "
        "và mắt sắc nét. Nhìn như ảnh chụp chất lượng cao đã cut-out thành sticker, KHÔNG phải "
        "cartoon, anime, vector, 3D toy, plastic skin, airbrushed AI face.\n"
        "Mỗi sticker: nửa người hoặc bust-up, biểu cảm rõ và đẹp, trang phục phù hợp chủ đề, "
        "viền sticker trắng dày gọn, nền trắng sạch đồng nhất, có thể thêm icon nhỏ tối giản "
        "nếu hợp cảm xúc nhưng không che mặt.\n"
        "Bố cục: lưới đều 4 cột × 4 hàng, 16 sticker tách biệt, cùng kích thước, lề và khoảng cách "
        "đều, không chồng lấn, không cắt mất sticker, không ô thứ 17.\n"
        "Chữ: mỗi sticker đúng 1 câu tiếng Việt ngắn dễ thương, font sans-serif đậm bo tròn, "
        "dễ đọc, giữ đủ dấu. Nếu chủ đề có danh sách câu thoại thì dùng đúng các câu đó (tối đa 16). "
        "Nếu không có, dùng: “Lên đồ! 😎”, “Quẩy lên 💃”, “Hết nước chấm 💯”, “Alo nghe? 📞”, "
        "“Xe ôm đâu? 🛵”, “Cháy phố 🔥”, “Chill phết ☁️”, “Tới luôn 🚀”, “Đẹp trai lỗi tại ai? 😎”, "
        "“Bảnh chưa? ✨”, “Okela 👌”, “Bai bai 👋”, “Hẹn hò hơm? 🌹”, “Nẹt pô 💨”, “Khét lẹt 🚗”, "
        "“Về thôi 🏠”.\n"
        "Nếu chủ đề mâu thuẫn về số lượng, tỷ lệ, nền, hoặc yêu cầu cartoon/vector/illustration thì "
        "BỎ QUA và tuân theo prompt mặc định photorealistic này.\n\n"
        f"{topic_specific_details}\n\n"
        "CẤM: cartoon, anime, chibi, vector flat, illustration, hoạt hình 3D, da nhựa/sáp, đồ chơi "
        "plastic, face swap, mặt biến dạng, mắt/mũi/miệng thừa, tay/ngón lỗi, chữ sai dấu hoặc "
        "không đọc được, bố cục lệch, nền bẩn/nhiều chi tiết, watermark, logo lạ, trông như AI "
        "làm mịn quá đà. Kết quả phải là đúng 16 sticker photorealistic trong khung 3:4."
    )


def default_output_path() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return DEFAULT_OUTPUT_DIR / f"sticker-{timestamp}.png"


def generate_image(
    prompt: str,
    output: Path,
    model: str,
    sticker_mode: bool,
    reference_image: Path | None = None,
    reference_mime_type: str | None = None,
    additional_prompt: str = "",
) -> Path:
    client = get_client()
    combined_prompt = prompt
    if additional_prompt.strip():
        combined_prompt += f"\n\nAdditional user instruction for clothing or appearance: {additional_prompt.strip()}"
    final_prompt = build_prompt(combined_prompt, sticker_mode)

    print(f"Model: {model}")
    print(f"Prompt length: {len(final_prompt)} characters")
    print(f"Reference image: {'yes' if reference_image else 'no'}")
    print("Generating...")

    contents: str | list[types.Part | str] = final_prompt
    if reference_image:
        mime_type = reference_mime_type or mimetypes.guess_type(reference_image.name)[0] or "image/jpeg"
        contents = [
            types.Part.from_bytes(data=reference_image.read_bytes(), mime_type=mime_type),
            final_prompt,
        ]

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio="3:4",
            ),
        ),
    )

    if not response.candidates:
        raise RuntimeError("No candidates returned from the model.")

    output.parent.mkdir(parents=True, exist_ok=True)
    saved = False

    for candidate in response.candidates:
        if not candidate.content:
            continue
        for part in candidate.content.parts:
            if part.text:
                print(f"Model note: {part.text.strip()[:500]}")
            if part.inline_data and part.inline_data.data:
                output.write_bytes(part.inline_data.data)
                saved = True
                break
        if saved:
            break

    if not saved:
        raise RuntimeError("Model response did not include an image.")

    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate an image with Gemini on Vertex AI."
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        default="cute cartoon cat sticker",
        help="Image prompt",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output image path (default: output/sticker-YYYYMMDD-HHMMSS.png)",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("GEMINI_IMAGE_MODEL", DEFAULT_MODEL),
        help=f"Model name (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--no-sticker-style",
        action="store_true",
        help="Disable automatic sticker-style prompt suffix",
    )
    parser.add_argument("--image", type=Path, help="Reference image path")
    parser.add_argument("--mime-type", help="Validated MIME type of the reference image")
    parser.add_argument("--additional-prompt", default="", help="Optional user instruction")
    return parser.parse_args()


def main() -> None:
    load_env()
    args = parse_args()
    output = args.output or default_output_path()

    try:
        saved_path = generate_image(
            prompt=args.prompt,
            output=output,
            model=args.model,
            sticker_mode=not args.no_sticker_style,
            reference_image=args.image,
            reference_mime_type=args.mime_type,
            additional_prompt=args.additional_prompt,
        )
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1) from error

    print(f"Saved: {saved_path}")


if __name__ == "__main__":
    main()
