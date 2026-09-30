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
            "Thêm các hành động và phụ kiện phù hợp như mặc áo phao an toàn, lướt sóng trên ván, "
            "kính râm, mũ đi biển, phao bơi, uống nước dừa, xây lâu đài cát, ngắm hoàng hôn và "
            "chơi với sóng. Chỉ dùng các chi tiết này ở những sticker phù hợp, không đưa đồ đi biển "
            "vào toàn bộ 16 sticker."
        )

    return (
        "CHỦ ĐỀ VÀ Ý TƯỞNG RIÊNG (ƯU TIÊN CAO NHẤT VỀ PHONG CÁCH NGHỆ THUẬT):\n"
        f"{prompt}\n\n"
        "Nếu phần trên có nêu phong cách (ví dụ: photorealistic / người thật / ảnh thật / 3D chibi / "
        "Pixar-like / cartoon / anime...), BẮT BUỘC theo đúng phong cách đó, chất lượng cao và đẹp. "
        "Không được đổi sang phong cách khác.\n\n"
        "KHUNG CỐ ĐỊNH (bố cục + danh tính — luôn giữ):\n"
        "Tạo 1 bộ sticker tỷ lệ khung hình 3:4 gồm đúng 16 ảnh của cùng một người dựa trên "
        "ảnh tham chiếu đã tải lên. Giữ nguyên khuôn mặt, kiểu tóc, màu da và các đặc điểm "
        "nhận diện của người trong ảnh ở mọi sticker; không thay bằng một người khác.\n"
        "Nếu CHỦ ĐỀ không nêu phong cách cụ thể, mặc định: photorealistic giống ảnh người thật đẹp, "
        "da tự nhiên, ánh sáng studio mềm, chi tiết mắt/tóc sắc, viền sticker trắng gọn, nền trắng sạch.\n"
        "Bố cục dọc 4 cột × 4 hàng, 16 sticker tách biệt, kích thước đồng đều, khoảng cách và "
        "lề bằng nhau, không chồng lấn, không cắt mất sticker, không thêm sticker thứ 17.\n"
        "Mỗi sticker có đúng 1 câu thoại tiếng Việt ngắn, dễ thương, chữ rõ ràng bằng font sans-serif "
        "bo tròn đậm; giữ nguyên dấu tiếng Việt. Nếu phần chủ đề có hơn 16 câu thoại, hãy chọn "
        "16 câu phù hợp nhất và dùng mỗi câu đúng một lần. Nếu chủ đề không có danh sách câu thoại, "
        "dùng các câu mặc định: “Lên đồ! 😎”, “Quẩy lên 💃”, “Hết nước chấm 💯”, “Alo nghe? 📞”, "
        "“Xe ôm đâu? 🛵”, “Cháy phố 🔥”, “Chill phết ☁️”, “Tới luôn 🚀”, “Đẹp trai lỗi tại ai? 😎”, "
        "“Bảnh chưa? ✨”, “Okela 👌”, “Bai bai 👋”, “Hẹn hò hơm? 🌹”, “Nẹt pô 💨”, “Khét lẹt 🚗”, "
        "“Về thôi 🏠”.\n"
        "Nếu phần chủ đề mâu thuẫn về số lượng sticker, tỷ lệ 3:4, nền trắng sạch hoặc bố cục lưới "
        "4×4 thì bỏ qua chỉ dẫn mâu thuẫn đó. Không ghi đè phong cách nghệ thuật đã nêu ở chủ đề.\n\n"
        f"{topic_specific_details}\n\n"
        "CẤM: face swap, mặt bị biến dạng, mặt trùng người khác, mắt/mũi/miệng thừa, tay hoặc ngón tay "
        "lỗi, chữ sai hoặc không đọc được, bố cục lệch, nền bẩn/nhiều chi tiết, watermark, logo lạ. "
        "Kết quả cuối cùng phải là đúng 16 sticker trong khung 3:4, đẹp và nhất quán khuôn mặt."
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
        combined_prompt += (
            "\n\nHướng dẫn thêm từ người dùng (ƯU TIÊN phong cách / trang phục / biểu cảm):\n"
            f"{additional_prompt.strip()}"
        )
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
