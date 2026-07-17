# WatsonX Nodes

A subscription-based notification platform powered by IBM Watson Assistant. Users create **Nodes** (e.g. Announcements, Deadlines, Releases), post updates with per-post alert schedules, and subscribers receive alerts via **Slack**, **Microsoft Teams**, or **WhatsApp**.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (local Docker or Supabase) |
| AI / Bot | IBM Watson Assistant |
| Channels | Slack Webhooks, Teams Power Automate, Twilio WhatsApp |
| Scheduler | node-cron |
| Auth | JWT |

---

## Key Concepts

### Nodes
A Node is a named information channel (e.g. *Announcements*, *Deadlines*, *Product Releases*). Node owners create and manage nodes, post updates to them, and control the alert schedule per post.

### Posts (Updates)
Each post inside a node carries its own alert schedule set by the node owner at the time of posting. Posts can be:
- **Open** — active, alerts fire according to schedule
- **Closed** — deactivated, no further alerts sent

### Alert Schedule (Per Post)
| Type | Behaviour |
|---|---|
| **Immediate** | Alert dispatched instantly when the post is published |
| **Specific Date & Time** | Alert fires once at the exact datetime chosen |
| **Specific Days** | Alert fires on selected days of the week at a set time |
| **Every X Days** | Alert repeats every X days at a set time |

### Subscriptions
Subscribers choose their preferred delivery channel (Slack, Teams, or WhatsApp) when subscribing to a node. Alert scheduling is controlled by the node owner per post — subscribers only choose where alerts are delivered.

---

## Quick Start

### 1. Clone & configure environment

```bash
cp .env.example .env
# Fill in all values in .env
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Start the database (Docker)

```bash
docker-compose up db
```

### 4. Run migrations

```bash
cd backend && npm run migrate
```

### 5. Start backend

```bash
cd backend && npm run dev
# API runs at http://localhost:5000/api
```

### 6. Start frontend

```bash
cd frontend && npm start
# App runs at http://localhost:3000
```

---

## Run everything with Docker Compose

```bash
cp .env.example .env   # fill in values first
docker-compose up --build
```

---

## Environment Variables

See [`.env.example`](.env.example) for all variables with descriptions.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase or local PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `WATSON_API_KEY` | IBM Watson Assistant API key |
| `WATSON_INSTANCE_URL` | IBM Watson Assistant instance URL |
| `WATSON_ASSISTANT_ID` | Watson Assistant ID |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender (e.g. `whatsapp:+14155238886`) |
| `REACT_APP_API_URL` | Frontend → backend URL (default: `http://localhost:5000/api`) |

---

## Project Structure

```
watsonx-nodes/
├── .env.example
├── docker-compose.yml
├── README.md
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                        # Express entry point
│       ├── db/
│       │   ├── pool.js                     # PostgreSQL connection
│       │   └── migrate.js                  # Run schema migrations
│       ├── middleware/
│       │   └── authenticate.js             # JWT middleware
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── nodeController.js
│       │   ├── updateController.js
│       │   └── subscriptionController.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── nodes.js
│       │   ├── updates.js
│       │   ├── subscriptions.js
│       │   └── bot.js
│       ├── services/
│       │   └── notificationService.js      # Slack / Teams / WhatsApp dispatch
│       └── jobs/
│           └── scheduler.js                # node-cron jobs
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.js
        ├── index.js
        ├── context/
        │   └── AuthContext.js              # JWT auth state
        ├── services/
        │   ├── api.js                      # Axios (production)
        │   └── mockApi.js                  # In-memory mock (demo)
        ├── components/
        │   ├── Navbar.js
        │   ├── NodeCard.js
        │   ├── SubscribeModal.js
        │   └── ScheduleSelector.js         # 4-mode alert schedule widget
        └── pages/
            ├── Login.js
            ├── Register.js
            ├── Dashboard.js
            ├── CreateNode.js
            ├── NodeDetail.js               # Post, edit, close, reopen
            ├── Discover.js
            └── Profile.js
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |

### Nodes
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/nodes` | All public nodes |
| GET    | `/api/nodes/mine` | Nodes owned by current user |
| GET    | `/api/nodes/subscribed` | Nodes subscribed to by current user |
| GET    | `/api/nodes/:id` | Node detail |
| POST   | `/api/nodes` | Create node |
| PUT    | `/api/nodes/:id` | Update node |
| DELETE | `/api/nodes/:id` | Delete node |

### Updates (Posts)
| Method | Endpoint | Description |
|---|---|---|
| GET   | `/api/nodes/:id/updates` | List posts for a node |
| POST  | `/api/nodes/:id/updates` | Create post with alert schedule |
| PUT   | `/api/updates/:id` | Edit post content and/or schedule |
| PATCH | `/api/updates/:id/close` | Close a post |
| PATCH | `/api/updates/:id/reopen` | Reopen a closed post |

### Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/nodes/:id/subscription` | Check subscription status |
| POST   | `/api/nodes/:id/subscribe` | Subscribe with channel config |
| DELETE | `/api/nodes/:id/subscribe` | Unsubscribe |

### Bot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bot/webhook` | Watson Assistant fulfillment webhook |

---

## Notification Channels

### Slack
1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create App → Incoming Webhooks
2. Add webhook to workspace → copy the `https://hooks.slack.com/services/...` URL
3. Subscriber pastes URL into their channel settings when subscribing

### Microsoft Teams
1. In a Teams channel → `...` → Workflows → *"Post to a channel when a webhook request is received"*
2. Copy the generated Power Automate webhook URL
3. Subscriber pastes URL into their channel settings when subscribing

### WhatsApp (Twilio)
1. Sign up at [twilio.com](https://www.twilio.com) → enable WhatsApp Sandbox
2. Subscriber enters their phone number with country code (e.g. `+639xxxxxxxxx`)

---

## Post Alert Schedule Types

| Schedule Type | `schedule_type` value | Config fields |
|---|---|---|
| Immediate | `immediate` | _(none)_ |
| Specific Date & Time | `specific_datetime` | `datetime` (ISO string) |
| Specific Days | `specific_days` | `days` (array), `time` (HH:MM) |
| Every X Days | `every_x_days` | `every_x_days` (int), `time` (HH:MM) |

### Example post payload

```json
{
  "content": "Q3 report deadline is this Friday at 5PM.",
  "schedule_type": "specific_days",
  "schedule_config": {
    "days": ["Mon", "Wed", "Fri"],
    "time": "09:00"
  }
}
```

---

## Watson Assistant Bot Commands

| Intent | Example Message | Response |
|---|---|---|
| `latest_update` | "What's the latest on Deadlines?" | Most recent post from that node |
| `list_subscriptions` | "What am I subscribed to?" | List of active subscriptions |
| `subscribe_node` | "Subscribe me to Announcements" | Confirms and asks for channel |
| `unsubscribe_node` | "Unsubscribe me from Releases" | Confirms removal |
| `help` | "Help" | Lists available commands |

---

## Deployment (Option B — Mixed Cloud, Free Tier)

| Component | Provider | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | `vercel deploy` from `/frontend` |
| Backend | [Railway](https://railway.app) | Connect GitHub repo, set env vars |
| Database | [Supabase](https://supabase.com) | Copy connection string to `DATABASE_URL` |
| Watson Assistant | [IBM Cloud](https://cloud.ibm.com) | Lite plan — free |
| WhatsApp | [Twilio](https://twilio.com) | Free trial sandbox |
