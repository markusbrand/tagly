import io
import logging

import xlsxwriter
from django.contrib.contenttypes.models import ContentType

from assets.models import Asset
from custom_fields.models import CustomFieldDefinition, CustomFieldValue

logger = logging.getLogger(__name__)


def export_assets_to_xlsx(queryset, include_custom_fields=True):
    """Export a queryset of assets to an Excel file."""
    buffer = io.BytesIO()
    workbook = xlsxwriter.Workbook(buffer, {'constant_memory': True})
    worksheet = workbook.add_worksheet('Assets')

    header_format = workbook.add_format({'bold': True, 'bg_color': '#1976d2', 'font_color': 'white'})
    date_format = workbook.add_format({'num_format': 'yyyy-mm-dd hh:mm'})

    headers = ['Name', 'GUID', 'Status', 'Created At', 'Updated At']

    custom_fields = []
    if include_custom_fields:
        custom_fields = list(
            CustomFieldDefinition.objects.filter(
                entity_type=CustomFieldDefinition.EntityType.ASSET,
            ).order_by('display_order', 'name')
        )
        headers.extend([f.name for f in custom_fields])

    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)

    asset_ct = ContentType.objects.get_for_model(Asset)
    asset_ids = list(queryset.values_list('id', flat=True))

    field_values = {}
    if custom_fields and asset_ids:
        for fv in CustomFieldValue.objects.filter(
            content_type=asset_ct,
            object_id__in=asset_ids,
        ).select_related('field_definition'):
            key = (fv.object_id, fv.field_definition_id)
            field_values[key] = fv.value

    for row_num, asset in enumerate(queryset.iterator(), start=1):
        worksheet.write(row_num, 0, asset.name)
        worksheet.write(row_num, 1, str(asset.guid))
        worksheet.write(row_num, 2, asset.status)
        worksheet.write_datetime(row_num, 3, asset.created_at.replace(tzinfo=None), date_format)
        worksheet.write_datetime(row_num, 4, asset.updated_at.replace(tzinfo=None), date_format)

        for col_offset, field_def in enumerate(custom_fields):
            value = field_values.get((asset.id, field_def.id), '')
            if isinstance(value, list):
                value = ', '.join(str(v) for v in value)
            worksheet.write(row_num, 5 + col_offset, str(value) if value else '')

    workbook.close()
    buffer.seek(0)
    logger.info("Exported %d assets to Excel", len(asset_ids))
    return buffer
