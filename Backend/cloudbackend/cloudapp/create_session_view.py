from asgiref.sync import async_to_sync
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from server.codeforces_playwright import fetch_codeforces_problem_async


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fetch_codeforces_problem(request):
    contest_id = request.data.get("contest_id")
    problem_index = request.data.get("problem_index")

    if not contest_id or not problem_index:
        return Response(
            {"error": "contest_id and problem_index required"},
            status=400
        )

    try:
        data = async_to_sync(fetch_codeforces_problem_async)(
            contest_id,
            problem_index
        )
    except Exception as e:
        print("Playwright error:", e)
        return Response(
            {"error": "Failed to fetch problem"},
            status=502
        )

    return Response(data, status=200)
