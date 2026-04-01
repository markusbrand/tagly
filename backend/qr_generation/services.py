import io
import uuid
import logging

import segno
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas

logger = logging.getLogger(__name__)


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

                short_guid = str(guid)[:8] + "..."
                font_size = max(4, min(6, label_w / (len(short_guid) * 0.8)))
                c.setFont("Helvetica", font_size)
                text_y = y + 1 * mm
                c.drawCentredString(x + label_w / 2, text_y, short_guid)

        if page_num < num_pages - 1:
            c.showPage()

    c.save()
    buffer.seek(0)

    logger.info("Generated %d QR stickers across %d pages", len(guids_generated), num_pages)
    return buffer, guids_generated
