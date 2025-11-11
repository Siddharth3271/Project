import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from urllib.parse import parse_qs


@database_sync_to_async
def get_user_from_token(token_str):
    """
    Asynchronously get a user from a JWT token string.
    """
    from rest_framework_simplejwt.tokens import UntypedToken
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from django.contrib.auth.models import AnonymousUser
    from django.contrib.auth import get_user_model

    User = get_user_model()

    try:
        # Validate token
        UntypedToken(token_str)

        # Authenticate and get user
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token_str)
        user = jwt_auth.get_user(validated_token)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()
    except Exception as e:
        print(f"Error getting user from token: {e}")
        return AnonymousUser()


class CollaborativeEditorConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        from django.contrib.auth.models import AnonymousUser

        # Get token from query params
        query_params = parse_qs(self.scope["query_string"].decode())
        token = query_params.get("token", [None])[0]

        if not token:
            print("Connection attempt with no token.")
            await self.close(code=4001)
            return

        # Authenticate user
        self.user = await get_user_from_token(token)

        if isinstance(self.user, AnonymousUser):
            print("Connection attempt with invalid token.")
            await self.close(code=4002)
            return

        # Join room
        self.room_name = self.scope["url_route"]["kwargs"]["token"]
        self.room_group_name = f"editor_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"User {self.user.username} connected to room {self.room_group_name}")

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            print(f"User {self.user.username} disconnected.")

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        # 🟦 Handle typing event separately
        if msg_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_event",
                    "user": self.user.username,
                }
            )
            return

        # Otherwise, broadcast normal code/language updates
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_message",
                "data": data,
                "sender_username": self.user.username,
            }
        )

    async def broadcast_message(self, event):
        # Don't send message back to the sender
        if self.user.username == event["sender_username"]:
            return

        await self.send(text_data=json.dumps({
            "data": event["data"],
            "user": {"username": event["sender_username"]},
        }))

    # Handle typing event
    async def typing_event(self, event):
        # Send a small payload to all except sender
        if self.user.username == event["user"]:
            return

        await self.send(text_data=json.dumps({
            "data": {"type": "typing"},
            "user": {"username": event["user"]},
        }))
