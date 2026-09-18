# Generated manually (Django not available in the build sandbox) to match
# the format Django's makemigrations would produce for wellness/models.py.

import django.db.models.deletion
import wellness.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('wellness', '0003_alter_wellnesslog_date'),
    ]

    operations = [
        migrations.CreateModel(
            name='DevicePairingToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(default=wellness.models._default_token, max_length=20, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(default=wellness.models._default_expiry)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pairing_tokens', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
