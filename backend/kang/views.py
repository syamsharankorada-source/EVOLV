import json
from django.http import JsonResponse
from kang.orchestrator import KangOrchestrator
from kang.models import KangChatHistory, KangChatSession
from Fit_AI.security import sanitize_text, validate_image_data, validate_int
from Fit_AI.rate_limiter import rate_limit


def _make_title(message: str) -> str:
    """Turn the first user message of a session into a short sidebar title."""
    clean = sanitize_text(message or '', max_length=40)
    if not clean:
        return 'New Chat'
    return clean[:40] + ('…' if len(clean) > 40 else '')


@rate_limit(key_type='user', limit=20, period_seconds=60)
def kang_chat_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            raw_msg = data.get('message', '')
            user_message = sanitize_text(raw_msg, max_length=2000)
            session_id = data.get('session_id')  # frontend sends this once a session exists

            if not user_message:
                return JsonResponse({'success': False, 'message': 'Empty or invalid message'}, status=400)

            # Resolve the session this message belongs to, or start a new one
            session = None
            if session_id:
                session = KangChatSession.objects.filter(id=session_id, user=request.user).first()
            if not session:
                session = KangChatSession.objects.create(user=request.user, title=_make_title(user_message))

            profile = getattr(request.user, 'fitness_profile', None)
            response_data = KangOrchestrator.get_response(user_message, profile, session=session)

            reply = response_data.get('reply', 'Hello! Let us stay fit.')
            emotion = response_data.get('emotion', 'focused')
            intent = response_data.get('intent', 'general_chat')
            safety_level = response_data.get('safety_level', 'SAFE')

            KangChatHistory.objects.create(
                session=session,
                user=request.user,
                user_message=user_message,
                kang_reply=reply,
                emotion=emotion,
                intent=intent,
                safety_level=safety_level,
            )

            # First message in a session sets its sidebar title; saving again bumps
            # updated_at so the session floats to the top of the history list.
            if session.messages.count() == 1:
                session.title = _make_title(user_message)
            session.save(update_fields=['title', 'updated_at'])

            return JsonResponse({
                'success': True,
                'reply': reply,
                'emotion': emotion,
                'intent': intent,
                'safety_level': safety_level,
                'session_id': session.id,
                'session_title': session.title,
            })
        except Exception as e:
            print(f"Kang Chat View Error: {e}")
            return JsonResponse({
                'success': True,
                'reply': "Grrr! I encountered a minor glitch. Let's keep moving forward!",
                'emotion': 'focused'
            })

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)


@rate_limit(key_type='user', limit=10, period_seconds=60)
def kang_analyze_form_view(request):
    """Called from the live Form Corrector's 'Ask KANG' button — sends a snapshot
    plus the client-side pose-tracker's rep/posture readout for qualitative feedback."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            image_data_url = data.get('image', '')
            exercise_label = sanitize_text(data.get('exercise', 'exercise'), max_length=100, default='exercise')
            reps = validate_int(data.get('reps', 0), min_val=0, max_val=1000, default=0)
            posture = sanitize_text(data.get('posture', 'Unknown'), max_length=100, default='Unknown')
            session_id = data.get('session_id')

            if not image_data_url:
                return JsonResponse({'success': False, 'message': 'No image provided'}, status=400)

            # Validate image payload and structure
            is_valid_img, img_err = validate_image_data(image_data_url, max_size_bytes=5 * 1024 * 1024)
            if not is_valid_img:
                return JsonResponse({'success': False, 'message': f'Invalid image: {img_err}'}, status=400)

            result = KangOrchestrator.analyze_form(image_data_url, exercise_label, reps, posture)
            reply = result.get('reply', "Nice work — keep it up!")

            session = None
            if session_id:
                session = KangChatSession.objects.filter(id=session_id, user=request.user).first()
            if not session:
                session = KangChatSession.objects.create(user=request.user, title=f"{exercise_label} Form Check")

            user_message = f"[Live Form Check] {exercise_label} — {reps} reps, posture: {posture}"
            KangChatHistory.objects.create(
                session=session,
                user=request.user,
                user_message=user_message,
                kang_reply=reply,
                emotion='focused',
                intent='form_correction',
                safety_level='SAFE',
            )
            session.save(update_fields=['updated_at'])

            return JsonResponse({'success': True, 'reply': reply, 'session_id': session.id})
        except Exception as e:
            print("Kang analyze-form error:", e)
            return JsonResponse({'success': True, 'reply': "Keep going — focus on slow, controlled reps!"})

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)


def kang_history_view(request):
    """Legacy flat history endpoint — kept so older frontend builds keep working."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        chats = KangChatHistory.objects.filter(user=request.user).order_by('-created_at')[:50]
        history = [
            {
                'user_message': c.user_message,
                'kang_reply': c.kang_reply,
                'emotion': c.emotion,
                'intent': c.intent,
                'safety_level': c.safety_level,
                'created_at': c.created_at.isoformat(),
                'session_id': c.session_id,
            }
            for c in chats
        ]
        return JsonResponse({'success': True, 'history': history})

    if request.method == 'DELETE':
        KangChatHistory.objects.filter(user=request.user).delete()
        KangChatSession.objects.filter(user=request.user).delete()
        return JsonResponse({'success': True})

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)


def kang_sessions_view(request):
    """List every chat thread for the right-side history sidebar, newest first."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        sessions = KangChatSession.objects.filter(user=request.user).order_by('-updated_at')
        data = [
            {
                'id': s.id,
                'title': s.title,
                'updated_at': s.updated_at.isoformat(),
                'created_at': s.created_at.isoformat(),
            }
            for s in sessions
        ]
        return JsonResponse({'success': True, 'sessions': data})

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)


def kang_new_session_view(request):
    """Create an empty session immediately when the user clicks 'New Chat'."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        session = KangChatSession.objects.create(user=request.user, title='New Chat')
        return JsonResponse({
            'success': True,
            'session_id': session.id,
            'session_title': session.title,
        })

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)


def kang_session_messages_view(request, session_id):
    """Full message thread for one session — used when the user clicks a session
    in the sidebar, and to delete a single thread."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    session = KangChatSession.objects.filter(id=session_id, user=request.user).first()
    if not session:
        return JsonResponse({'success': False, 'message': 'Session not found'}, status=404)

    if request.method == 'GET':
        messages = session.messages.order_by('created_at')
        data = [
            {
                'user_message': m.user_message,
                'kang_reply': m.kang_reply,
                'emotion': m.emotion,
                'created_at': m.created_at.isoformat(),
            }
            for m in messages
        ]
        return JsonResponse({'success': True, 'session_id': session.id, 'title': session.title, 'messages': data})

    if request.method == 'DELETE':
        session.delete()
        return JsonResponse({'success': True})

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)
