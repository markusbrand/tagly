from django.db import migrations


def set_admin_role_for_superusers(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(is_superuser=True).exclude(role="ADMIN").update(role="ADMIN")


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(set_admin_role_for_superusers, migrations.RunPython.noop),
    ]
