# Streaming Behavior Documentation

## Overview
This document describes how the streaming system handles messages and actions in the AI assistant interface.

## Message Types

### 1. Text Messages
Text messages are now streamed as **multiple separate fragments** instead of one long message. This creates a more conversational and engaging experience.

**How it works:**
- The AI's text is streamed in real-time using `text-delta` events
- When a sentence boundary is detected (`.`, `!`, `?` followed by space), the current chunk is sent as a complete `text-message` event
- No minimum or maximum chunk length - splits only on natural sentence boundaries
- Each `text-message` event creates a **separate message bubble** in the UI
- This allows the AI to send multiple short messages during task execution

**Example flow:**
```
AI: "Dobra, zaraz sprawdzę co mamy na ekranie."
[Action: screenshot]
AI: "Widzę przeglądarkę. Teraz kliknę w pasek adresu."
[Action: left_click]
AI: "Super, pole jest aktywne. Wpiszę teraz adres."
[Action: type]
```

### 2. Actions (computer_use)
Actions are displayed as **separate elements** from text messages:
- Each action appears as a distinct card showing the action type and parameters
- Screenshots are displayed inline after the action completes
- Actions never appear mixed with text in the same message bubble

## No Duplication
The system prevents message duplication by:
1. Sending text incrementally during streaming (`text-delta` for live display)
2. Sending complete fragments as `text-message` events (creates message bubbles)
3. Only adding to chat history after streaming, without re-sending

## Task Completion (!isfinish)

The AI can signal task completion using the `!isfinish` command:

**How to use:**
- The AI includes `!isfinish` in its final text message
- The system detects this command and breaks the streaming loop
- The command is removed from the displayed text

**Example:**
```
AI: "Zakończyłem zadanie! Wszystko działa poprawnie. !isfinish"
```

**Important notes:**
- `!isfinish` must be in a text message, NOT in a computer_use action
- It can be at the beginning or end of the message
- It will be automatically stripped from the displayed text

## Technical Details

### Backend (route.ts)
- Streaming chunks are accumulated into `fullText` for AI context
- `currentTextChunk` tracks text since last fragment send
- Text is sent as `text-message` on sentence boundaries (`.`, `!`, `?` followed by space)
- No minimum or maximum chunk length - splits naturally on sentences
- Improved regex handles quotes after punctuation and Polish text
- Final chunk is sent after streaming completes
- Already-sent text is NOT re-sent to avoid duplication
- `!isfinish` command is case-insensitive and filtered from all displayed text

### Frontend (realtime-session.ts)
- `text-delta` events accumulate into current message for live display
- `text-message` events create new separate messages
- `currentTextId` is reset after `text-message` to ensure next delta starts fresh
- Each message has a unique ID based on timestamp + random value

## Benefits

1. **Better UX**: Multiple short messages feel more conversational
2. **Clear Separation**: Text and actions are visually distinct
3. **No Duplication**: Each piece of content appears exactly once
4. **Flexible Communication**: AI can send multiple messages per task
5. **Proper Completion**: !isfinish provides clean task termination
