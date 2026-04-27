from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import List

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


@dataclass(frozen=True)
class DemoVariant:
    mutation_type: str
    suffix: str
    content: bytes


def _to_bytes(img: Image.Image, suffix: str) -> bytes:
    buf = BytesIO()
    fmt = "PNG" if suffix.lower() == ".png" else "JPEG"
    if fmt == "JPEG":
        img = img.convert("RGB")
        img.save(buf, format=fmt, quality=65, optimize=True)
    else:
        img.save(buf, format=fmt, optimize=True)
    return buf.getvalue()


def generate_demo_variants(root_image_path: str) -> List[DemoVariant]:
    with Image.open(root_image_path) as img:
        base = img.convert("RGB")
        variants: List[DemoVariant] = []

        w, h = base.size
        crop_box = (int(w * 0.1), int(h * 0.1), int(w * 0.9), int(h * 0.9))
        cropped = base.crop(crop_box)
        variants.append(DemoVariant("Crop", ".jpg", _to_bytes(cropped, ".jpg")))

        rotated = base.rotate(8, expand=True).resize((w, h))
        variants.append(DemoVariant("Rotate", ".jpg", _to_bytes(rotated, ".jpg")))

        desat = ImageEnhance.Color(base).enhance(0.25)
        contrast = ImageEnhance.Contrast(desat).enhance(1.15)
        variants.append(DemoVariant("Recolor", ".jpg", _to_bytes(contrast, ".jpg")))

        watermarked = base.copy()
        d = ImageDraw.Draw(watermarked)
        text = "ContentGenome Demo Copy"
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None
        d.text((10, 10), text, fill=(255, 255, 255), font=font)
        variants.append(DemoVariant("Watermark", ".png", _to_bytes(watermarked, ".png")))

        blurred = base.filter(ImageFilter.GaussianBlur(radius=2.0))
        variants.append(DemoVariant("Blur", ".jpg", _to_bytes(blurred, ".jpg")))

        return variants
