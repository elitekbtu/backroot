# Realtime Voice API

This module provides real-time voice communication using OpenAI's Realtime API. It allows users to have natural conversations with AI through WebSocket connections.

## Features

- Real-time voice input and output
- Text input support
- Session management
- Conversation history
- Error handling
- Connection health monitoring

## Endpoints

### WebSocket Endpoints

#### `/api/v1/streaming/realtime/{user_id}`
- **Type**: WebSocket
- **Description**: Main realtime voice communication endpoint
- **Parameters**:
  - `user_id`: Unique identifier for the user session

#### `/api/v1/streaming/realtime`
- **Type**: WebSocket (Authenticated)
- **Description**: Authenticated realtime voice communication endpoint
- **Authentication**: Bearer token required

### HTTP Endpoints

#### `GET /api/v1/streaming/realtime/status`
- **Description**: Get realtime service status
- **Response**: Service status and connection count

#### `GET /api/v1/streaming/realtime/health`
- **Description**: Health check endpoint
- **Response**: Health status

## Message Types

### Request Types

#### `session.update`
Update session configuration:
```json
{
  "type": "session.update",
  "session_update": {
    "voice": "alloy",
    "language": "en",
    "instructions": "You are a helpful AI assistant.",
    "temperature": 0.8,
    "max_response_output_tokens": 4096
  }
}
```

#### `conversation.item.input`
Send input to the AI:
```json
{
  "type": "conversation.item.input",
  "conversation_item_input": {
    "type": "input_audio_buffer",
    "audio": "base64_encoded_audio_data"
  }
}
```

Or for text input:
```json
{
  "type": "conversation.item.input",
  "conversation_item_input": {
    "type": "input_text",
    "text": "Hello, how are you?"
  }
}
```

#### `ping`
Test connection:
```json
{
  "type": "ping",
  "ping": {
    "timestamp": 1234567890.123
  }
}
```

### Response Types

#### `session.update`
Session configuration updated:
```json
{
  "type": "session.update",
  "session": {
    "id": "session_123",
    "voice": "alloy",
    "language": "en"
  }
}
```

#### `response.audio`
Audio response from AI:
```json
{
  "type": "response.audio",
  "response": {
    "audio": "base64_encoded_audio_data",
    "timestamp": 1234567890.123
  }
}
```

#### `response.delta`
Partial text response:
```json
{
  "type": "response.delta",
  "response": {
    "delta": {
      "content": "Hello! How can I help you today?"
    },
    "timestamp": 1234567890.123
  }
}
```

#### `response.done`
Response complete:
```json
{
  "type": "response.done",
  "response": {
    "usage": {
      "input_tokens": 10,
      "output_tokens": 20
    },
    "timestamp": 1234567890.123
  }
}
```

#### `error`
Error response:
```json
{
  "type": "error",
  "error": {
    "code": "internal_error",
    "message": "Something went wrong"
  }
}
```

#### `pong`
Ping response:
```json
{
  "type": "pong",
  "timestamp": 1234567890.123
}
```

## Configuration

### Environment Variables

Add to your `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01
```

### Model Configuration

The realtime API uses the following default configuration:
- **Model**: `gpt-4o-realtime-preview-2024-10-01`
- **Voice**: `alloy`
- **Language**: `en`
- **Input Audio Format**: `pcm16`
- **Output Audio Format**: `pcm16`
- **Temperature**: `0.8`
- **Max Response Tokens**: `4096`

## Usage Examples

### JavaScript/TypeScript

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/streaming/realtime/test_user');

ws.onopen = () => {
  // Send session update
  ws.send(JSON.stringify({
    type: 'session.update',
    session_update: {
      voice: 'alloy',
      language: 'en'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send text input
ws.send(JSON.stringify({
  type: 'conversation.item.input',
  conversation_item_input: {
    type: 'input_text',
    text: 'Hello, how are you?'
  }
}));
```

### Python

```python
import asyncio
import websockets
import json

async def connect_realtime():
    uri = "ws://localhost:8000/api/v1/streaming/realtime/test_user"
    
    async with websockets.connect(uri) as websocket:
        # Send session update
        await websocket.send(json.dumps({
            "type": "session.update",
            "session_update": {
                "voice": "alloy",
                "language": "en"
            }
        }))
        
        # Send text input
        await websocket.send(json.dumps({
            "type": "conversation.item.input",
            "conversation_item_input": {
                "type": "input_text",
                "text": "Hello, how are you?"
            }
        }))
        
        # Listen for responses
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(connect_realtime())
```

## Testing

Use the provided test client:
```bash
cd backroot/backend
python test_realtime_client.py
```

## Frontend Integration

The frontend includes a React component `RealtimeVoice` that provides:
- WebSocket connection management
- Audio recording and playback
- Text input
- Real-time message display
- Error handling

## Error Handling

The API includes comprehensive error handling:
- Connection errors
- Authentication errors
- Message parsing errors
- OpenAI API errors
- WebSocket disconnection handling

## Security

- WebSocket connections are validated
- User sessions are managed securely
- Error messages don't expose sensitive information
- Rate limiting can be implemented at the application level

## Performance

- Efficient WebSocket message handling
- Async/await pattern for non-blocking operations
- Connection pooling for OpenAI API
- Memory-efficient audio processing