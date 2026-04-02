import io
import uuid
import logging

import segno
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas

logger = logging.getLogger(__name__)

# Center logo must stay small so QR (error level H) remains scannable (~≤25% of QR width).
_LOGO_OUTER_R = 0.10  # white knockout radius as fraction of qr_size
_LOGO_INNER_R = 0.078  # brand circle radius
_LOGO_FONT_FRAC = 0.09  # "T" height relative to qr_size


def _draw_tagly_logo_center(
    c: pdf_canvas.Canvas,
    cx: float,
    cy: float,
    qr_size: float,
) -> None:
    """Draw a small Tagly mark (white pad + blue disc + T) centered on the QR code."""
    c.saveState()
    try:
        r_outer = qr_size * _LOGO_OUTER_R
        r_inner = qr_size * _LOGO_INNER_R

        c.setFillColor(colors.white)
        c.setStrokeColor(colors.white)
        c.circle(cx, cy, r_outer, stroke=0, fill=1)

        # Brand blue (~Material primary)
        c.setFillColorRGB(0.09, 0.46, 0.71)
        c.circle(cx, cy, r_inner, stroke=0, fill=1)

        font_size = max(5.0, min(14.0, qr_size * _LOGO_FONT_FRAC))
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", font_size)
        # Baseline tweak so "T" looks vertically centered in the circle
        c.drawCentredString(cx, cy - font_size * 0.32, "T")
    finally:
        c.restoreState()


def generate_sticker_pdf(template, num_pages: int) -> tuple[io.BytesIO, list[str]]:
    """Generate a PDF with QR code stickers based on a template layout."""
    buffer = io.BytesIO()
    page_width, page_height = A4
    c = pdf_canvas.Canvas(buffer, pagesize=A4)

    guids_generated = []

    for page_num in range(num_pages):
        for row in range(template.rows):
            for col in range(template.columns):
                guid = uuid.uuid4()
                guids_generated.append(str(guid))

                x = (template.left_margin_mm + col * template.h_pitch_mm + template.offset_x_mm) * mm
                y_from_top = (template.top_margin_mm + row * template.v_pitch_mm + template.offset_y_mm) * mm
                y = page_height - y_from_top - template.label_height_mm * mm

                qr = segno.make(str(guid), error='H')
                qr_buffer = io.BytesIO()
                qr.save(qr_buffer, kind='png', scale=8, border=1)
                qr_buffer.seek(0)

                qr_image = ImageReader(qr_buffer)

                label_w = template.label_width_mm * mm
                label_h = template.label_height_mm * mm
                qr_size = min(label_w, label_h) * 0.85

                qr_x = x + (label_w - qr_size) / 2
                qr_y = y + (label_h - qr_size) / 2

                c.drawImage(qr_image, qr_x, qr_y, width=qr_size, height=qr_size)

                cx = qr_x + qr_size / 2
                cy = qr_y + qr_size / 2
                _draw_tagly_logo_center(c, cx, cy, qr_size)

        if page_num < num_pages - 1:
            c.showPage()

    c.save()
    buffer.seek(0)

    logger.info("Generated %d QR stickers across %d pages", len(guids_generated), num_pages)
    return buffer, guids_generated
