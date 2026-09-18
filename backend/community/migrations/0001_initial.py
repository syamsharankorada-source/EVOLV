from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CoachProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('specialty', models.CharField(choices=[('nutrition', 'Nutrition'), ('strength', 'Strength Training'), ('yoga', 'Yoga & Mobility'), ('weight_loss', 'Weight Loss'), ('bodybuilding', 'Bodybuilding'), ('sports_performance', 'Sports Performance'), ('rehab', 'Rehab & Physio'), ('general_fitness', 'General Fitness')], default='general_fitness', max_length=30)),
                ('bio', models.TextField(blank=True, default='')),
                ('years_experience', models.PositiveIntegerField(default=0)),
                ('certification_name', models.CharField(blank=True, default='', max_length=255)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='coach_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='CommunityPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('nutrition', 'Nutrition'), ('strength', 'Strength Training'), ('yoga', 'Yoga & Mobility'), ('weight_loss', 'Weight Loss'), ('bodybuilding', 'Bodybuilding'), ('sports_performance', 'Sports Performance'), ('rehab', 'Rehab & Physio'), ('general_fitness', 'General Fitness'), ('recipe', 'Recipe'), ('tip', 'Quick Tip'), ('workout_plan', 'Workout Plan'), ('success_story', 'Success Story')], default='tip', max_length=30)),
                ('title', models.CharField(max_length=255)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='community_posts', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='HireRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField(blank=True, default='')),
                ('contact_preference', models.CharField(default='in_app', max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('coach', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hire_requests_received', to=settings.AUTH_USER_MODEL)),
                ('requester', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hire_requests_sent', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
