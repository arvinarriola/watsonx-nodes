# WatsonX Nodes

A subscription-based notification platform powered by IBM Watson Assistant. Users create **Nodes** (e.g. Announcements, Deadlines, Releases), post updates with per-post alert schedules, and subscribers receive alerts via **Slack**, **Microsoft Teams**, or **WhatsApp**.

## Live URLs

| Service | URL |
|---|---|
| **Frontend** | https://watsonx-nodes-70wtnjyae-wxb1.vercel.app |
| **Backend API** | https://watsonx-nodes-production.up.railway.app/api |
| **Health check** | https://watsonx-nodes-production.up.railway.app/api/health |
| **Watson check** | https://watsonx-nodes-production.up.railway.app/api/bot/test-watson |
| **GitHub** | https://github.com/arvinarriola/watsonx-nodes |

### Demo accounts
| Email | Password |
|---|---|
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |

---

## Stack

| Layer | Technology | Provider |
|---|---|---|
| Frontend | React 18 + Tailwind CSS | Vercel |
| Backend | Node.js 18 + Express | Railway |
| Database | PostgreSQL via Supabase JS client | Supabase (ap-northeast-2) |
| AI / Bot | IBM Watson Assistant v2 (SDK v12) | IBM Cloud (au-syd) |
| WhatsApp | Twilio WhatsApp Sandbox | Twilio |
| Slack | Incoming Webhooks | Slack |
| Teams | Power Automate Webhooks | Microsoft *(pending IT approval)* |
| Scheduler | node-cron (every minute) | Railway |
| Auth | JWT (7d expiry) | — |

---

## Key Concepts

### Nodes
A Node is a named information channel (e.g. *Announcements*, *Deadlines*, *Product Releases*). Node owners create and manage nodes, post updates to them, and set the alert schedule **per post**. Nodes can be public (discoverable by anyone) or private (owner only).

### Posts (Updates)
Each post carries its own alert schedule set by the node owner at publish time.

| Status | Behaviour |
|---|---|
| **Open** | Active — alerts fire according to the post's schedule |
| **Closed** | Deactivated — no further alerts sent for this post |

Owners can **edit**, **close**, and **reopen** posts at any time.

### Alert Schedule (Per Post)
| Type | `schedule_type` | Behaviour |
|---|---|---|
| Immediate | `immediate` | Alert dispatched instantly when the post is published |
| Specific Date & Time | `specific_datetime` | Alert fires once at the exact datetime chosen |
| Specific Days | `specific_days` | Alert fires on selected days of the week at a set time |
| Every X Days | `every_x_days` | Alert repeats every X days from publish date at a set time |

### Subscriptions
Subscribers choose their delivery channel (Slack, Teams, or WhatsApp) when subscribing to a node. The alert schedule is controlled entirely by the node owner per post — subscribers only choose **where** alerts are delivered.

---

## Quick Start (Local Development)

### 1. Clone and configure

```bash
git clone https://github.com/arvinarriola/watsonx-nodes.git
cd watsonx-nodes
cp .env.example .env
# Fill in all values in .env — see Environment Variables section below
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Start the backend

```bash
cd backend && npm run dev
# API runs at http://localhost:5000/api
```

### 4. Start the frontend

```bash
cd frontend && npm start
# App runs at http://localhost:3000
```

> **Database:** Uses Supabase (hosted). No local DB setup needed. Tables are already provisioned.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Backend port (default `5000`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (bypasses RLS) |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | JWT expiry (default `7d`) |
| `WATSON_API_KEY` | IBM Watson Assistant API key |
| `WATSON_INSTANCE_URL` | IBM Watson instance URL (region-specific) |
| `WATSON_ASSISTANT_ID` | Watson Assistant ID |
| `WATSON_ENVIRONMENT_ID` | Watson environment ID — run `node backend/src/scripts/listWatsonEnvironments.js` to find it |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender (e.g. `whatsapp:+14155238886`) |
| `SLACK_TEST_WEBHOOK_URL` | Optional test Slack webhook |
| `REACT_APP_API_URL` | Frontend → backend URL (e.g. `http://localhost:5000/api`) |
| `FRONTEND_URL` | Backend CORS allowlist (e.g. `http://localhost:3000`) |

> **Note on Watson API key format:** Some IBM Cloud credential exports prefix the key with `ApiKey-`. The backend SDK wrapper strips this prefix automatically — paste the full string as-is.

---

## Project Structure

```
watsonx-nodes/
├── .env.example                            ← environment variable template
├── .gitignore
├── nixpacks.toml                           ← Railway Node 22 build config (root)
├── package.json                            ← root monorepo entry
├── README.md
├── docker-compose.yml
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql          ← Supabase schema (already applied)
├── backend/
│   ├── nixpacks.toml                       ← Railway Node 22 build config (backend)
│   ├── railway.json                        ← Railway service config
│   ├── package.json                        ← Node >=22 engine declared
│   └── src/
│       ├── index.js                        ← Express entry, CORS, routes, scheduler
│       ├── db/
│       │   └── supabase.js                 ← Supabase JS client (replaces raw pg)
│       ├── middleware/
│       │   └── authenticate.js             ← JWT bearer token middleware
│       ├── controllers/
│       │   ├── authController.js           ← register, login, me
│       │   ├── nodeController.js           ← CRUD + subscriber/update counts
│       │   ├── updateController.js         ← create, edit, close, reopen posts
│       │   ├── subscriptionController.js   ← subscribe (upsert), unsubscribe
│       │   └── botController.js            ← Slack + WhatsApp inbound handlers
│       ├── routes/
│       │   ├── auth.js
│       │   ├── nodes.js
│       │   ├── updates.js
│       │   ├── updateActions.js
│       │   ├── subscriptions.js
│       │   └── bot.js                      ← /slack, /whatsapp, /webhook, /test-watson
│       ├── services/
│       │   ├── notificationService.js      ← Slack / Teams / WhatsApp dispatch + cron logic
│       │   └── watsonService.js            ← Watson SDK v2 wrapper (createSession, sendMessage)
│       ├── scripts/
│       │   └── listWatsonEnvironments.js   ← run once to get WATSON_ENVIRONMENT_ID
│       └── jobs/
│           └── scheduler.js                ← node-cron, runs every minute
└── frontend/
    ├── vercel.json                         ← Vercel SPA rewrites config
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.js                          ← routes, AuthProvider, PrivateRoute
        ├── context/
        │   └── AuthContext.js              ← JWT auth state, login/register/logout
        ├── services/
        │   ├── api.js                      ← Axios with JWT interceptor (active)
        │   └── mockApi.js                  ← in-memory mock (not wired, kept for reference)
        ├── components/
        │   ├── Navbar.js
        │   ├── NodeCard.js
        │   ├── SubscribeModal.js           ← channel selection (Slack/Teams/WhatsApp)
        │   └── ScheduleSelector.js         ← 4-mode alert schedule widget
        └── pages/
            ├── Login.js
            ├── Register.js
            ├── Dashboard.js                ← my nodes + subscribed nodes
            ├── CreateNode.js
            ├── NodeDetail.js               ← post, edit, close, reopen + subscribe
            ├── Discover.js                 ← search all public nodes
            └── Profile.js                  ← account info + active subscriptions
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET  | `/api/auth/me` | ✅ | Get current user profile |

### Nodes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET    | `/api/nodes` | ✅ | All public nodes + owned private nodes |
| GET    | `/api/nodes/mine` | ✅ | Nodes owned by current user |
| GET    | `/api/nodes/subscribed` | ✅ | Nodes subscribed to by current user |
| GET    | `/api/nodes/:id` | ✅ | Node detail with subscriber count |
| POST   | `/api/nodes` | ✅ | Create a node |
| PUT    | `/api/nodes/:id` | ✅ | Update node title/description/category |
| DELETE | `/api/nodes/:id` | ✅ | Delete node (owner only) |

### Posts (Updates)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET   | `/api/nodes/:id/updates` | ✅ | List all posts for a node |
| POST  | `/api/nodes/:id/updates` | ✅ | Create post with alert schedule (owner only) |
| PUT   | `/api/updates/:id` | ✅ | Edit post content and/or schedule |
| PATCH | `/api/updates/:id/close` | ✅ | Close a post (stops future alerts) |
| PATCH | `/api/updates/:id/reopen` | ✅ | Reopen a closed post |

### Subscriptions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET    | `/api/nodes/:id/subscription` | ✅ | Check current user's subscription status |
| POST   | `/api/nodes/:id/subscribe` | ✅ | Subscribe with channel config |
| DELETE | `/api/nodes/:id/subscribe` | ✅ | Unsubscribe |

### Bot
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bot/slack` | — | Slack slash command inbound handler |
| POST | `/api/bot/whatsapp` | — | Twilio WhatsApp inbound handler |
| POST | `/api/bot/webhook` | — | Watson Assistant intent fulfillment |
| GET  | `/api/bot/test-watson` | — | Verify Watson credentials |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Returns `{"status":"ok"}` |

---

## Post Payload Examples

### Immediate alert
```json
{
  "content": "Server maintenance tonight at 10PM.",
  "schedule_type": "immediate",
  "schedule_config": {}
}
```

### Specific datetime
```json
{
  "content": "Q3 submission deadline.",
  "schedule_type": "specific_datetime",
  "schedule_config": {
    "datetime": "2026-08-01T09:00"
  }
}
```

### Specific days
```json
{
  "content": "Weekly standup reminder.",
  "schedule_type": "specific_days",
  "schedule_config": {
    "days": ["Mon", "Wed", "Fri"],
    "time": "08:30"
  }
}
```

### Every X days
```json
{
  "content": "Bi-weekly progress check.",
  "schedule_type": "every_x_days",
  "schedule_config": {
    "every_x_days": 14,
    "time": "09:00"
  }
}
```

---

## Notification Channels

### Slack
1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create App → **Incoming Webhooks**
2. Enable → Add webhook to workspace → copy the `https://hooks.slack.com/services/...` URL
3. Paste that URL into the **Webhook URL** field when subscribing to a node

### Microsoft Teams *(pending IT webhook approval)*
1. In a Teams channel → `...` → **Workflows** → *"Post to a channel when a webhook request is received"*
2. Copy the generated Power Automate URL
3. Paste that URL into the **Webhook URL** field when subscribing to a node

### WhatsApp (Twilio Sandbox)
1. Sign up at [twilio.com](https://www.twilio.com) → enable **WhatsApp Sandbox**
2. Set the **inbound webhook** in Twilio console to: `https://watsonx-nodes-production.up.railway.app/api/bot/whatsapp`
3. Subscriber enters their phone number with country code (e.g. `+639xxxxxxxxx`) when subscribing

---

## Watson Assistant Bot

The bot handles inbound messages from Slack and WhatsApp via Watson Assistant v2.

### Supported intents
| Intent | Example message | Response |
|---|---|---|
| `list_subscriptions` | "What am I subscribed to?" | Lists your active subscriptions |
| `latest_update` | "Latest update on Announcements" | Most recent open post from that node |
| `unsubscribe` | "Unsubscribe from Deadlines" | Removes your subscription |
| `help` | "Help" | Lists available commands |

### Watson setup
1. Create a Watson Assistant instance on IBM Cloud (au-syd region)
2. Note the **API key**, **Instance URL**, and **Assistant ID**
3. Run the environment discovery script:
   ```bash
   node backend/src/scripts/listWatsonEnvironments.js
   ```
4. Copy the **draft** environment ID to `.env` as `WATSON_ENVIRONMENT_ID`
5. In Watson Assistant, configure a **Webhook** action pointing to: `https://watsonx-nodes-production.up.railway.app/api/bot/webhook`

---

## Deployment

### Backend → Railway
1. Go to [railway.app/new](https://railway.app/new) → Deploy from GitHub → select `watsonx-nodes`
2. Set **Root Directory** → `/backend`
3. Set **Start Command** → `node src/index.js`
4. Add all environment variables (Variables tab → Raw Editor)
5. Add `NIXPACKS_NODE_VERSION=22` to force Node 22
6. Settings → Networking → **Generate Domain**

### Frontend → Vercel
1. Go to [vercel.com/new](https://vercel.com/new) → Import → select `watsonx-nodes`
2. Set **Root Directory** → `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://watsonx-nodes-production.up.railway.app/api`
4. Deploy

### Database → Supabase
- Tables are already provisioned. Schema is in `database/migrations/001_initial_schema.sql`
- Uses `@supabase/supabase-js` v2.39.8 (pinned for Node 18 Railway compatibility)

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Registered accounts (id, name, email, password_hash) |
| `nodes` | Information channels (id, owner_id, title, description, category, is_public) |
| `updates` | Posts per node (id, node_id, author_id, content, schedule_type, schedule_config, status) |
| `subscriptions` | User↔Node subscriptions (id, user_id, node_id, channel, channel_config, is_active) |
| `notifications` | Notification delivery log (id, subscription_id, update_id, status, sent_at, error_message) |
