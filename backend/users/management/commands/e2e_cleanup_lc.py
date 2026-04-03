"""Remove data created by Playwright LC full-lifecycle tests (lc-e2e- prefix)."""

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db import transaction

from assets.models import Asset
from borrowing.models import BorrowRecord
from custom_fields.models import CustomFieldDefinition, CustomFieldValue
from customers.models import Customer
from qr_generation.models import StickerTemplate

PREFIX = "lc-e2e-"
EMAIL_SUFFIX = "@lc-e2e.local"


class Command(BaseCommand):
    help = "Delete E2E lifecycle entities (asset names, field defs, customers with @lc-e2e.local)."

    def handle(self, *args, **options):
        with transaction.atomic():
            asset_qs = Asset.objects.filter(name__startswith=PREFIX)
            asset_ids = list(asset_qs.values_list("pk", flat=True))
            ct_asset = ContentType.objects.get_for_model(Asset)

            cust_qs = Customer.objects.filter(email__endswith=EMAIL_SUFFIX)
            cust_ids = list(cust_qs.values_list("pk", flat=True))
            ct_cust = ContentType.objects.get_for_model(Customer)

            # NotificationLog rows CASCADE when BorrowRecord is deleted.
            n_br = BorrowRecord.objects.filter(asset_id__in=asset_ids).delete()[0]

            CustomFieldValue.objects.filter(content_type=ct_asset, object_id__in=asset_ids).delete()
            n_assets = asset_qs.delete()[0]

            CustomFieldValue.objects.filter(content_type=ct_cust, object_id__in=cust_ids).delete()
            n_cust = cust_qs.delete()[0]

            n_defs = CustomFieldDefinition.objects.filter(name__startswith=PREFIX).delete()[0]

            n_tpl = StickerTemplate.objects.filter(name__startswith=PREFIX).delete()[0]

        self.stdout.write(
            self.style.SUCCESS(
                f"e2e_cleanup_lc: borrows={n_br} assets={n_assets} customers={n_cust} "
                f"field_defs={n_defs} sticker_templates={n_tpl}",
            ),
        )
