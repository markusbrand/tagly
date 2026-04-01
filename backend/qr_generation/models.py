from django.db import models


class StickerTemplate(models.Model):
    name = models.CharField(max_length=255)
    label_width_mm = models.FloatField()
    label_height_mm = models.FloatField()
    h_pitch_mm = models.FloatField(help_text="Horizontal distance from label start to next label start")
    v_pitch_mm = models.FloatField(help_text="Vertical distance from label start to next label start")
    left_margin_mm = models.FloatField()
    top_margin_mm = models.FloatField()
    rows = models.PositiveIntegerField()
    columns = models.PositiveIntegerField()
    offset_x_mm = models.FloatField(default=0)
    offset_y_mm = models.FloatField(default=0)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "name"]
        verbose_name = "sticker template"
        verbose_name_plural = "sticker templates"

    def __str__(self):
        return f"{self.name} ({self.columns}x{self.rows})"
