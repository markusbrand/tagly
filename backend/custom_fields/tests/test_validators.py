import pytest

from custom_fields.models import CustomFieldDefinition
from custom_fields.validators import (
    validate_asset_custom_fields_for_asset_create,
    validate_asset_custom_fields_payload,
)


def _asset_field(**kwargs):
    defaults = {
        "entity_type": CustomFieldDefinition.EntityType.ASSET,
        "name": "Field",
        "field_type": CustomFieldDefinition.FieldType.STRING,
        "is_mandatory": False,
        "options": {},
        "validation_rules": {},
        "display_order": 0,
    }
    defaults.update(kwargs)
    return CustomFieldDefinition.objects.create(**defaults)


@pytest.mark.django_db
class TestValidateAssetCustomFieldsPayload:
    def test_no_definitions_empty_values(self):
        assert validate_asset_custom_fields_payload({}) == {}
        assert validate_asset_custom_fields_payload(None) == {}

    def test_mandatory_missing_key(self):
        f = _asset_field(name="Serial", is_mandatory=True)
        assert validate_asset_custom_fields_payload({}) == {
            str(f.pk): '"Serial" is required.'
        }

    def test_mandatory_empty_string(self):
        f = _asset_field(name="Serial", is_mandatory=True)
        assert validate_asset_custom_fields_payload({str(f.pk): ""}) == {
            str(f.pk): '"Serial" is required.'
        }

    def test_optional_omitted_ok(self):
        _asset_field(name="Note", is_mandatory=False)
        assert validate_asset_custom_fields_payload({}) == {}

    def test_string_min_max_length(self):
        f = _asset_field(
            field_type=CustomFieldDefinition.FieldType.STRING,
            validation_rules={"min_length": 2, "max_length": 4},
        )
        fid = str(f.pk)
        assert "Minimum length" in validate_asset_custom_fields_payload({fid: "a"})[fid]
        assert "Maximum length" in validate_asset_custom_fields_payload({fid: "abcde"})[fid]
        assert validate_asset_custom_fields_payload({fid: "ab"}) == {}

    def test_string_pattern(self):
        f = _asset_field(
            field_type=CustomFieldDefinition.FieldType.STRING,
            validation_rules={"pattern": r"^\d{3}$"},
        )
        fid = str(f.pk)
        assert validate_asset_custom_fields_payload({fid: "12a"})[fid] == (
            "Value does not match the required pattern."
        )
        assert validate_asset_custom_fields_payload({fid: "123"}) == {}

    def test_string_wrong_type(self):
        f = _asset_field(field_type=CustomFieldDefinition.FieldType.STRING)
        fid = str(f.pk)
        assert validate_asset_custom_fields_payload({fid: 99})[fid] == "Expected a string."

    def test_date_empty_optional_skipped_valid_string_ok(self):
        f = _asset_field(
            name="Due",
            field_type=CustomFieldDefinition.FieldType.DATE,
            is_mandatory=False,
        )
        fid = str(f.pk)
        # Optional + empty is omitted from type checks (same as missing key).
        assert validate_asset_custom_fields_payload({fid: ""}) == {}
        assert validate_asset_custom_fields_payload({fid: "2026-04-02"}) == {}

    def test_date_mandatory_empty_rejected(self):
        f = _asset_field(
            name="Due",
            field_type=CustomFieldDefinition.FieldType.DATE,
            is_mandatory=True,
        )
        fid = str(f.pk)
        assert validate_asset_custom_fields_payload({fid: ""})[fid] == '"Due" is required.'

    def test_number_integer_only_and_bounds(self):
        f = _asset_field(
            field_type=CustomFieldDefinition.FieldType.NUMBER,
            validation_rules={"min": 1, "max": 10},
        )
        fid = str(f.pk)
        assert validate_asset_custom_fields_payload({fid: 1.5})[fid] == "Expected an integer."
        assert validate_asset_custom_fields_payload({fid: 0})[fid] == "Must be >= 1."
        assert validate_asset_custom_fields_payload({fid: 11})[fid] == "Must be <= 10."
        assert validate_asset_custom_fields_payload({fid: 5}) == {}

    def test_decimal_bounds(self):
        f = _asset_field(
            field_type=CustomFieldDefinition.FieldType.DECIMAL,
            validation_rules={"min": "0.5", "max": "2.5"},
        )
        fid = str(f.pk)
        assert validate_asset_custom_fields_payload({fid: "nope"})[fid] == (
            "Expected a decimal number."
        )
        assert validate_asset_custom_fields_payload({fid: "0.1"})[fid] == "Must be >= 0.5."
        assert validate_asset_custom_fields_payload({fid: "3"})[fid] == "Must be <= 2.5."
        assert validate_asset_custom_fields_payload({fid: "1.25"}) == {}

    def test_single_and_multi_select(self):
        single = _asset_field(
            field_type=CustomFieldDefinition.FieldType.SINGLE_SELECT,
            options={"choices": ["a", "b"]},
        )
        multi = _asset_field(
            field_type=CustomFieldDefinition.FieldType.MULTI_SELECT,
            options={"choices": ["x", "y"]},
            display_order=1,
        )
        sid, mid = str(single.pk), str(multi.pk)
        assert validate_asset_custom_fields_payload({sid: "c"})[sid] == "Select a valid option."
        assert validate_asset_custom_fields_payload({sid: "a", mid: ["x"]}) == {}
        assert validate_asset_custom_fields_payload({mid: ["z"]})[mid] == (
            "One or more selected values are not allowed."
        )

    def test_multi_select_non_list_treated_as_empty(self):
        f = _asset_field(
            field_type=CustomFieldDefinition.FieldType.MULTI_SELECT,
            options={"choices": ["x"]},
            is_mandatory=False,
        )
        fid = str(f.pk)
        # Non-list counts as empty for MULTI_SELECT; optional fields are skipped.
        assert validate_asset_custom_fields_payload({fid: "x"}) == {}

    def test_multi_select_mandatory_non_list_is_required(self):
        f = _asset_field(
            name="Tags",
            field_type=CustomFieldDefinition.FieldType.MULTI_SELECT,
            options={"choices": ["x"]},
            is_mandatory=True,
        )
        fid = str(f.pk)
        assert validate_asset_custom_fields_payload({fid: "x"})[fid] == '"Tags" is required.'


@pytest.mark.django_db
class TestValidateAssetCustomFieldsForAssetCreate:
    def test_rejects_payload_when_no_definitions(self):
        err = validate_asset_custom_fields_for_asset_create({"1": "x"})
        assert err["1"].startswith("No asset custom fields are configured")

    def test_all_definition_keys_required(self):
        a = _asset_field(name="A", display_order=0)
        b = _asset_field(name="B", display_order=1)
        err = validate_asset_custom_fields_for_asset_create({str(a.pk): ""})
        assert str(b.pk) in err
        assert "missing from custom_fields" in err[str(b.pk)]

    def test_unknown_field_id(self):
        f = _asset_field()
        err = validate_asset_custom_fields_for_asset_create(
            {str(f.pk): "", "999999": "bad"},
        )
        assert "999999" in err
        assert err["999999"] == "Unknown custom field id."

    def test_success_with_all_keys_optional_empty(self):
        f = _asset_field(is_mandatory=False)
        fid = str(f.pk)
        assert validate_asset_custom_fields_for_asset_create({fid: ""}) == {}

    def test_mandatory_enforced(self):
        f = _asset_field(name="Need", is_mandatory=True)
        fid = str(f.pk)
        err = validate_asset_custom_fields_for_asset_create({fid: ""})
        assert err[fid] == '"Need" is required.'
