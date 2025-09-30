# cloudapp/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CollaborationSession
import json

@csrf_exempt # WARNING: Only use this for development/APIs without auth!
def create_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            initial_code = data.get('initial_code', '/* New session started. */')
            language = data.get('language', 'cpp')

            # Create and save a new session object
            session = CollaborationSession.objects.create(
                code=initial_code,
                language=language
            )
            
            # Return the generated token
            return JsonResponse({'token': session.token})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Must be a POST request'}, status=405)