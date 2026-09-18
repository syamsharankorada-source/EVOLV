from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_is_guest'),
    ]

    operations = [
        migrations.AddField(
            model_name='fitnessprofile',
            name='target_weight_kg',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='fitnessprofile',
            name='workout_days_per_week',
            field=models.PositiveIntegerField(default=3),
        ),
        migrations.AddField(
            model_name='fitnessprofile',
            name='wearable_device',
            field=models.CharField(default='none', max_length=50),
        ),
        migrations.AddField(
            model_name='fitnessprofile',
            name='sleep_hours_avg',
            field=models.CharField(default='7_8', max_length=20),
        ),
        migrations.AddField(
            model_name='fitnessprofile',
            name='sitting_time',
            field=models.CharField(default='moderate', max_length=20),
        ),
        migrations.AddField(
            model_name='dietaryprofile',
            name='meals_per_day',
            field=models.PositiveIntegerField(default=3),
        ),
    ]
