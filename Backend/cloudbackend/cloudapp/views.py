from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CollaborationSession

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    data = request.data
    initial_code = data.get('initial_code', '')
    language = data.get('language', 'cpp')

    session = CollaborationSession.objects.create(
        code=initial_code,
        language=language,
        created_by=request.user
    )
    return Response({'token': session.token}, status=status.HTTP_201_CREATED)
