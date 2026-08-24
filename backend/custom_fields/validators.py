"""
Validate custom field payloads against definitions (asset onboarding / updates).
"""

import logging
import re
from decimal import Decimal, InvalidOperation

from .models import CustomFieldDefinition

logger = logging.getLogger(__name__)


def _is_empty_value(value, field_type: str) -> bool:
    if value is None:
        return True
    if field_type == CustomFieldDefinition.FieldType.MULTI_SELECT:
        return not isinstance(value, list) or len(value) == 0
    if field_type in (
        CustomFieldDefinition.FieldType.NUMBER,
        CustomFieldDefinition.FieldType.DECIMAL,
    ):
        if value is None:
            return True
        if isinstance(value, str) and str(value).strip() == "":
            return True
        return False
    if isinstance(value, str):
        return value.strip() == ""
    return False


def is_custom_field_value_empty(value, field_type: str) -> bool:
    """True if the payload value means “no value” (matches strict create/update validation)."""
    return _is_empty_value(value, field_type)


def _coerce_rules(rules: dict) -> dict:
    """
    Normalize validation_rules from JSON.

    min_length / max_length are always integers. min / max are passed through for
    DECIMAL (Decimal(str(...)) must keep fractional strings like "0.5"). NUMBER
    comparisons coerce bounds to int separately.
    """
    out = {}
    for k, v in (rules or {}).items():
        if isinstance(v, (int, float)) and k in ("min", "max", "min_length", "max_length"):
            out[k] = int(v) if k.endswith("_length") else v
        elif isinstance(v, str):
            if k in ("min_length", "max_length"):
                try:
                    out[k] = int(float(v))
                except (TypeError, ValueError):
                    out[k] = v
            elif k in ("min", "max"):
                out[k] = v.strip() if v.strip() else v
            else:
                out[k] = v
        else:
            out[k] = v
    return out


def _int_bound(rule_val) -> int:
    """Integer lower/upper bound for NUMBER fields (JSON may store int, float, or numeric string)."""
    return int(float(rule_val))


def _validate_single(definition: CustomFieldDefinition, value) -> str | None:
    ft = definition.field_type
    rules = _coerce_rules(definition.validation_rules or {})
    choices = (definition.options or {}).get("choices") or []

    if ft == CustomFieldDefinition.FieldType.STRING:
        if not isinstance(value, str):
            return "Expected a string."
        s = value.strip()
        ml = rules.get("min_length")
        xl = rules.get("max_length")
        if ml is not None and len(s) < int(ml):
            return f"Minimum length is {ml}."
        if xl is not None and len(s) > int(xl):
            return f"Maximum length is {xl}."
        pat = rules.get("pattern")
        if pat and isinstance(pat, str):
            try:
                if not re.search(pat, s):
                    return "Value does not match the required pattern."
            except re.error:
                logger.warning("Invalid regex in custom field definition id=%s", definition.pk)
        return None

    if ft == CustomFieldDefinition.FieldType.DATE:
        if not isinstance(value, str) or not value.strip():
            return "Expected a date string."
        return None

    if ft == CustomFieldDefinition.FieldType.NUMBER:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return "Expected a number."
        if isinstance(value, float) and not value.is_integer():
            return "Expected an integer."
        n = int(value)
        if "min" in rules:
            try:
                if n < _int_bound(rules["min"]):
                    return f"Must be >= {rules['min']}."
            except (TypeError, ValueError):
                logger.warning(
                    "Invalid NUMBER min bound for custom field definition id=%s",
                    definition.pk,
                )
        if "max" in rules:
            try:
                if n > _int_bound(rules["max"]):
                    return f"Must be <= {rules['max']}."
            except (TypeError, ValueError):
                logger.warning(
                    "Invalid NUMBER max bound for custom field definition id=%s",
                    definition.pk,
                )
        return None

    if ft == CustomFieldDefinition.FieldType.DECIMAL:
        try:
            d = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            return "Expected a decimal number."
        if "min" in rules:
            if d < Decimal(str(rules["min"])):
                return f"Must be >= {rules['min']}."
        if "max" in rules:
            if d > Decimal(str(rules["max"])):
                return f"Must be <= {rules['max']}."
        return None

    if ft == CustomFieldDefinition.FieldType.SINGLE_SELECT:
        if not isinstance(value, str) or value not in choices:
            return "Select a valid option."
        return None

    if ft == CustomFieldDefinition.FieldType.MULTI_SELECT:
        if not isinstance(value, list):
            return "Expected a list of options."
        bad = [x for x in value if x not in choices]
        if bad:
            return "One or more selected values are not allowed."
        return None

    return None


def validate_asset_custom_fields_for_asset_create(values: dict | None) -> dict[str, str]:
    """
    Stricter validation for POST /assets/ (onboarding / inventory create).

    - If no asset field definitions exist: reject any non-empty custom_fields payload.
    - Otherwise: every definition id must appear as a key; unknown ids are rejected.
    - Mandatory fields must be non-empty; optional fields may be empty/null; types and
      validation_rules are enforced when a value is present.
    """
    definitions = list(
        CustomFieldDefinition.objects.filter(
            entity_type=CustomFieldDefinition.EntityType.ASSET,
        ).order_by("display_order", "name")
    )
    errors: dict[str, str] = {}
    values = values if isinstance(values, dict) else {}
    valid_ids = {str(d.pk) for d in definitions}

    if not definitions:
        for k in values:
            errors[str(k)] = (
                "No asset custom fields are configured; remove custom_fields entries "
                "or leave custom_fields empty."
            )
        return errors

    for k in values:
        ks = str(k)
        if ks not in valid_ids:
            errors[ks] = "Unknown custom field id."

    for d in definitions:
        fid = str(d.pk)
        if fid not in values:
            errors[fid] = f'"{d.name}" is missing from custom_fields.'
            continue

        raw = values[fid]

        if d.is_mandatory:
            if _is_empty_value(raw, d.field_type):
                errors[fid] = f'"{d.name}" is required.'
                continue

        if _is_empty_value(raw, d.field_type):
            continue

        msg = _validate_single(d, raw)
        if msg:
            errors[fid] = msg

    return errors


def validate_asset_custom_fields_payload(values: dict | None) -> dict[str, str]:
    """
    Returns a mapping field_definition_id (str) -> error message.
    Empty dict means valid.
    """
    definitions = list(
        CustomFieldDefinition.objects.filter(
            entity_type=CustomFieldDefinition.EntityType.ASSET,
        ).order_by("display_order", "name")
    )
    errors: dict[str, str] = {}
    values = values if isinstance(values, dict) else {}

    for d in definitions:
        fid = str(d.pk)
        if fid in values:
            raw = values[fid]
        else:
            raw = None

        if d.is_mandatory:
            if fid not in values or _is_empty_value(raw, d.field_type):
                errors[fid] = f'"{d.name}" is required.'
                continue

        if fid not in values or _is_empty_value(raw, d.field_type):
            continue

        msg = _validate_single(d, raw)
        if msg:
            errors[fid] = msg

    return errors
