from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('fitness', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MealLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('meal_name', models.CharField(default='Meal', max_length=255)),
                ('calories', models.PositiveIntegerField(default=0)),
                ('protein_g', models.FloatField(default=0)),
                ('carbs_g', models.FloatField(default=0)),
                ('fats_g', models.FloatField(default=0)),
                ('fiber_g', models.FloatField(default=0)),
                ('logged_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meal_logs', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
