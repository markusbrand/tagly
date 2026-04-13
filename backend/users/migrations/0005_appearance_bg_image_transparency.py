from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_appearance_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="appearance_bg_image_transparency",
            field=models.PositiveSmallIntegerField(default=50),
        ),
    ]
