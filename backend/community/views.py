import json
from django.http import JsonResponse
from .models import CoachProfile, CommunityPost, HireRequest, SPECIALTY_CHOICES, POST_CATEGORY_CHOICES
from Fit_AI.security import sanitize_text, validate_int, validate_choice
from Fit_AI.rate_limiter import rate_limit


def _display_name(user):
    return user.first_name or ('Guest' if user.is_guest else user.username)


def coaches_list_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        raw_specialty = request.GET.get('specialty')
        specialty = sanitize_text(raw_specialty, max_length=50) if raw_specialty else None
        qs = CoachProfile.objects.filter(is_active=True).select_related('user')
        if specialty:
            qs = qs.filter(specialty=specialty)

        coaches = [{
            'id': c.id,
            'user_id': c.user_id,
            'name': _display_name(c.user),
            'specialty': c.specialty,
            'specialty_label': dict(SPECIALTY_CHOICES).get(c.specialty, c.specialty),
            'bio': c.bio,
            'years_experience': c.years_experience,
            'certification_name': c.certification_name,
            'post_count': CommunityPost.objects.filter(author=c.user).count(),
            'is_you': c.user_id == request.user.id,
        } for c in qs.order_by('-years_experience')]

        return JsonResponse({'success': True, 'data': {'coaches': coaches, 'specialties': SPECIALTY_CHOICES}})
    return JsonResponse({'success': False}, status=405)


def my_coach_profile_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    profile = CoachProfile.objects.filter(user=request.user).first()
    if not profile:
        return JsonResponse({'success': True, 'data': None})

    return JsonResponse({'success': True, 'data': {
        'specialty': profile.specialty,
        'bio': profile.bio,
        'years_experience': profile.years_experience,
        'certification_name': profile.certification_name,
    }})


@rate_limit(key_type='user', limit=10, period_seconds=60)
def become_coach_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            valid_specialties = [s[0] for s in SPECIALTY_CHOICES]
            specialty = validate_choice(data.get('specialty'), valid_specialties, default=None)
            bio = sanitize_text(data.get('bio', ''), max_length=2000)
            years_experience = validate_int(data.get('years_experience', 0), min_val=0, max_val=80, default=0)
            certification_name = sanitize_text(data.get('certification_name', ''), max_length=255)

            profile, _ = CoachProfile.objects.get_or_create(user=request.user)
            if specialty:
                profile.specialty = specialty
            profile.bio = bio
            profile.years_experience = years_experience
            profile.certification_name = certification_name
            profile.is_active = True
            profile.save()
            return JsonResponse({'success': True})
        except Exception as e:
            print("Become coach error:", e)
            return JsonResponse({'success': False, 'message': 'Could not save coach profile'}, status=500)

    return JsonResponse({'success': False}, status=405)


def posts_list_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        raw_category = request.GET.get('category')
        category = sanitize_text(raw_category, max_length=50) if raw_category else None
        qs = CommunityPost.objects.select_related('author')
        if category:
            qs = qs.filter(category=category)

        posts = []
        for p in qs[:50]:
            coach = CoachProfile.objects.filter(user=p.author).first()
            posts.append({
                'id': p.id,
                'title': p.title,
                'content': p.content,
                'category': p.category,
                'category_label': dict(POST_CATEGORY_CHOICES).get(p.category, p.category),
                'author_name': _display_name(p.author),
                'author_specialty': dict(SPECIALTY_CHOICES).get(coach.specialty) if coach else None,
                'created_at': p.created_at.isoformat(),
            })

        return JsonResponse({'success': True, 'data': {'posts': posts, 'categories': POST_CATEGORY_CHOICES}})
    return JsonResponse({'success': False}, status=405)


@rate_limit(key_type='user', limit=10, period_seconds=60)
def create_post_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        if not CoachProfile.objects.filter(user=request.user, is_active=True).exists():
            return JsonResponse({'success': False, 'message': 'Only registered coaches can post content'}, status=403)
        try:
            data = json.loads(request.body)
            title = sanitize_text(data.get('title', ''), max_length=255)
            content = sanitize_text(data.get('content', ''), max_length=5000)
            valid_cats = [c[0] for c in POST_CATEGORY_CHOICES]
            category = validate_choice(data.get('category', 'tip'), valid_cats, default='tip')
            if not title or not content:
                return JsonResponse({'success': False, 'message': 'Title and content are required'}, status=400)

            post = CommunityPost.objects.create(author=request.user, title=title, content=content, category=category)
            return JsonResponse({'success': True, 'data': {'id': post.id}})
        except Exception as e:
            print("Create post error:", e)
            return JsonResponse({'success': False, 'message': 'Could not create post'}, status=500)

    return JsonResponse({'success': False}, status=405)


@rate_limit(key_type='user', limit=10, period_seconds=60)
def hire_request_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            coach_user_id = validate_int(data.get('coach_user_id'), min_val=1, max_val=2147483647, default=None)
            if not coach_user_id:
                return JsonResponse({'success': False, 'message': 'Valid coach ID is required'}, status=400)

            message = sanitize_text(data.get('message', ''), max_length=1000)
            contact_pref = validate_choice(data.get('contact_preference', 'in_app'), ['in_app', 'email', 'phone'], default='in_app')

            coach_profile = CoachProfile.objects.filter(user_id=coach_user_id, is_active=True).first()
            if not coach_profile:
                return JsonResponse({'success': False, 'message': 'Coach not found'}, status=404)
            if coach_profile.user_id == request.user.id:
                return JsonResponse({'success': False, 'message': "You can't hire yourself"}, status=400)

            HireRequest.objects.create(
                requester=request.user,
                coach=coach_profile.user,
                message=message,
                contact_preference=contact_pref,
            )
            return JsonResponse({'success': True})
        except Exception as e:
            print("Hire request error:", e)
            return JsonResponse({'success': False, 'message': 'Could not send hire request'}, status=500)

    return JsonResponse({'success': False}, status=405)


def my_hire_requests_view(request):
    """Requests received, for coaches to see who wants to hire them."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    requests_qs = HireRequest.objects.filter(coach=request.user).select_related('requester')
    data = [{
        'id': r.id,
        'requester_name': _display_name(r.requester),
        'message': r.message,
        'contact_preference': r.contact_preference,
        'status': r.status,
        'created_at': r.created_at.isoformat(),
    } for r in requests_qs]

    return JsonResponse({'success': True, 'data': {'requests': data}})
