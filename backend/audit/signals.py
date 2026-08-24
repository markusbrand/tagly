import logging

from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.forms.models import model_to_dict

from .middleware import get_current_ip, get_current_user
from .models import AuditLog

logger = logging.getLogger(__name__)

AUDITED_MODELS = [
    'Asset', 'Customer', 'BorrowRecord',
    'CustomFieldDefinition', 'CustomFieldValue', 'StickerTemplate',
]


def _should_audit(sender):
    return sender.__name__ in AUDITED_MODELS


def _serialize_instance(instance):
    try:
        data = model_to_dict(instance)
        return {k: str(v) for k, v in data.items()}
    except Exception:
        return {'id': str(instance.pk)}


@receiver(pre_save)
def audit_pre_save(sender, instance, **kwargs):
    if not _should_audit(sender):
        return
    if instance.pk:
        try:
            instance._audit_old_value = _serialize_instance(sender.objects.get(pk=instance.pk))
        except sender.DoesNotExist:
            instance._audit_old_value = None
    else:
        instance._audit_old_value = None


@receiver(post_save)
def audit_post_save(sender, instance, created, **kwargs):
    if not _should_audit(sender):
        return
    user = get_current_user()
    AuditLog.objects.create(
        user=user,
        action=AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE,
        entity_type=sender.__name__,
        entity_id=instance.pk,
        old_value=getattr(instance, '_audit_old_value', None),
        new_value=_serialize_instance(instance),
        ip_address=get_current_ip(),
    )


@receiver(pre_delete)
def audit_pre_delete(sender, instance, **kwargs):
    if not _should_audit(sender):
        return
    user = get_current_user()
    AuditLog.objects.create(
        user=user,
        action=AuditLog.Action.DELETE,
        entity_type=sender.__name__,
        entity_id=instance.pk,
        old_value=_serialize_instance(instance),
        new_value=None,
        ip_address=get_current_ip(),
    )
