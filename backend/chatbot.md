# AI Chatbot API Documentation

## HTTP Endpoints

### Start AI Chat Session
**POST** `/chatbot/startAIChat/`

**Request Body:**
```json
{
  "session_name": "Optional session name",
  "is_public": false
}
```

**Response (201):**
```json
{
  "message": "AI Chat session created",
  "session_id": "uuid-string"
}
```

### Get AI Chat Messages
**GET** `/chatbot/getAIChatMessages/<chat_uuid>/`

**Response (200):**
```json
{
  "messages": [
    {
      "id": 1,
      "sender_type": "user",
      "sender": "username",
      "message": "Hello, how can I help?",
      "sent_at": "2025-11-12T10:30:00Z"
    }
  ]
}
```

## WebSocket Endpoint

### Real-time AI Chat
**WebSocket** `ws://domain/ai-chat/sessions/<session_id>/`

### Send Message Format
```json
{
  "message": "Your message to the AI"
}
```

### Receive Message Formats

**User Message Echo:**
```json
{
  "message": "Your message",
  "sender_type": "user",
  "sender": "username",
  "sent_at": "2025-11-12T10:30:00Z",
  "message_id": 123
}
```

**AI Response:**
```json
{
  "message": "AI response",
  "sender_type": "ai",
  "sender": "AI",
  "sent_at": "2025-11-12T10:30:05Z",
  "message_id": 124
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "sender_type": "system",
  "sender": "System",
  "sent_at": "2025-11-12T10:30:00Z"
}
```

## Safety Features

- **Pre-check:** Input validation for harmful content
- **In-check:** Conversation pattern monitoring
- **Post-check:** Output filtering for safety

## Implementation Notes

- Authentication optional for both HTTP and WebSocket
- AI accesses services, ebooks, blogs, newsletters database
- Session ID required for WebSocket connection
- Anonymous users supported