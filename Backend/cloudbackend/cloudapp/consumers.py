# firstapp/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CodeEditorConsumer(AsyncWebsocketConsumer):
    # This method is called when a connection is established (ws.onopen)
    async def connect(self):
        # 1. Get the document ID from the URL path
        self.document_id = self.scope['url_route']['kwargs']['document_id']
        # 2. Define the group name for this document
        self.document_group_name = f'editor_{self.document_id}'

        # 3. Add the new channel to the group (Joining the 'room')
        await self.channel_layer.group_add(
            self.document_group_name,
            self.channel_name
        )
        
        # 4. Accept the WebSocket connection
        await self.accept()

        # Optional: Send the current state of the document to the newly connected user
        # In a real app, you'd fetch this from a Django model/database.
        # For simplicity, we assume an initial state.
        initial_state = {
            "type": "full_state",
            "code": "/* Welcome! Start collaborating. */",
            "language": "cpp",
        }
        await self.send(text_data=json.dumps(initial_state))


    # This method is called when a message is received from the frontend (ws.send)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        # 1. Handle incoming code updates from a single user
        if message_type == 'code_update':
            code = text_data_json.get('code')
            
            # 2. Broadcast the update to the entire group (all other collaborators)
            await self.channel_layer.group_send(
                self.document_group_name,
                {
                    'type': 'code_message', # This calls the 'code_message' method below
                    'code': code,
                }
            )
        
        # 3. Handle language change updates from a single user
        elif message_type == 'language_update':
            language = text_data_json.get('language')
            
            # 4. Broadcast the language change to the entire group
            await self.channel_layer.group_send(
                self.document_group_name,
                {
                    'type': 'language_message',
                    'language': language,
                }
            )

    # This method is called when the connection closes (ws.onclose)
    async def disconnect(self, close_code):
        # Remove the channel from the group
        await self.channel_layer.group_discard(
            self.document_group_name,
            self.channel_name
        )

    # --- Handlers for sending messages to the group ---

    # Called when 'type': 'code_message' is sent to the group
    async def code_message(self, event):
        code = event['code']
        
        # Send the code update back to the WebSocket client
        await self.send(text_data=json.dumps({
            'type': 'code_update', # Matches the type expected by your React frontend
            'code': code
        }))

    # Called when 'type': 'language_message' is sent to the group
    async def language_message(self, event):
        language = event['language']
        
        # Send the language update back to the WebSocket client
        await self.send(text_data=json.dumps({
            'type': 'language_update',
            'language': language
        }))