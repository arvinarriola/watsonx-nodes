# WatsonX Nodes — V2 Roadmap

Features deferred from V1. Prioritised for the next development cycle.

---

## Feature: In-App Watson Chatbot

A floating chat widget available to all logged-in users, powered by IBM Watson Assistant v2.

### Scope

| # | Feature | Description | Effort |
|---|---|---|---|
| 1 | **Chat UI Widget** | Floating chat button + message panel, persistent across all pages. Message bubbles, input box, send button, Watson session per user. | ~15–20 coins |
| 2 | **Channel Setup Assistant** | Guided bot flow to help users configure Slack (Incoming Webhook), WhatsApp (Twilio sandbox + phone), and Teams (Power Automate webhook). Step-by-step with validation. | ~20–25 coins |
| 3 | **Search via Bot** | User asks bot to search nodes or posts by keyword. Bot queries Supabase and returns clickable results inside the chat. | ~15–20 coins |
| 4 | **Create Nodes & Posts via Bot** | User dictates a new node or post through chat. Bot confirms intent before calling the existing API. Multi-turn conversation with confirmation step. | ~25–30 coins |
| 5 | **Watson Dialog Configuration** | New intents and dialog nodes in Watson Assistant for all V2 flows. | ~10–15 coins |

**Total estimated cost: ~85–110 Bob Coins**

---

## What V1 Already Provides (No Re-work Needed)

- Watson session management — `backend/src/services/watsonService.js`
- Bot webhook endpoint — `POST /api/bot/webhook`
- Slack, WhatsApp, Teams notification service — `backend/src/services/notificationService.js`
- Full CRUD API — nodes, posts, subscriptions
- JWT auth + user sessions
- Supabase database — all 5 tables live

---

## Notes

- The chat widget should use the existing `watson.createSession()` / `watson.sendMessage()` flow
- Channel setup assistant replaces the current manual webhook URL entry in `SubscribeModal.js`
- Search results should render as `NodeCard` or inline post cards inside the chat panel
- Multi-turn dialog state (for create flows) should be managed server-side via Watson sessions
- Teams setup remains pending IT webhook approval — bot can still guide the user through the steps

---

*Documented: July 2026 — deferred from V1 by request*
