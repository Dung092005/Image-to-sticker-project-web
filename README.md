# StickAI — Personalized AI Sticker Sheet Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E.svg)](https://supabase.com/)
[![Google Vertex AI](https://img.shields.io/badge/Google_Cloud-Vertex_AI-4285F4.svg)](https://cloud.google.com/vertex-ai)
[![Model](https://img.shields.io/badge/Model-Gemini_2.5_Flash_Image-8E75C4.svg)](https://deepmind.google/technologies/gemini/)

> **StickAI** is a full-stack web application that transforms user portraits into a cohesive 16-sticker expression sheet using multimodal generative AI (**Google Gemini 2.5 Flash Image** on **Vertex AI**). Built with **React 19**, **Node.js**, **PostgreSQL (Supabase)**, and an asynchronous Python AI inference pipeline.

---

## Table of Contents

- [Abstract & Overview](#abstract--overview)
- [Academic Project Information](#academic-project-information)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Local Setup & Quickstart](#local-setup--quickstart)
- [Environment Configuration](#environment-configuration)
- [Database Schema & Migrations](#database-schema--migrations)
- [RESTful API Specification](#restful-api-specification)
- [AI Pipeline & Prompt Engineering](#ai-pipeline--prompt-engineering)
- [Production Deployment](#production-deployment)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [License & Acknowledgments](#license--acknowledgments)

---

## Abstract & Overview

Instant messaging and social networking platforms thrive on expressive digital stickers. However, existing sticker packs are generic, lacking personal identity. **StickAI** addresses this gap by providing an end-to-end web system where users upload a single facial portrait, select a thematic card, and generate a printable or digital sticker sheet containing **16 unique, culturally localized Vietnamese expressions** arranged in a structured 4×4 grid.

The application addresses critical challenges in generative image synthesis:
1. **Identity Consistency:** Preserving facial geometry, skin tone, hair color, and recognizable landmarks without distortion or uncanny artifacts.
2. **Structural Regularity:** Enforcing a strict 3:4 aspect ratio, die-cut white borders, uniform spacing, and a clean white background.
3. **Low-Latency User Experience:** Mitigating the 30–60 second latency of large image foundation models via an asynchronous job worker model with client-side short polling.

---

## Academic Project Information

- **Project type:** Group project for the Web Application Development curriculum.
- **Department:** ICT Department.
- **Project scope:** A full-stack web application for creating personalized AI sticker sheets, including authentication, sticker-card management, generation history, and an administration dashboard.
- **Team members and responsibilities:** Add the verified names, student IDs, and assigned responsibilities here before submission.

---

## System Architecture

The following diagram illustrates the end-to-end data flow and architectural tiers:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT TIER (Browser)                           │
│  React 19 SPA (Vite)  ──►  PublicRoute / Protected Guard  ──►  Components   │
│  (Landing, Collection, History, Admin)                                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         HTTP / REST API (fetch with Cookie)
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GATEWAY / PROXY TIER                               │
│  Vite Dev Proxy (Local :3000 ──► :3001)  /  Vercel Serverless Rewrite       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       APPLICATION SERVER TIER (Node.js)                     │
│  • server.js: HTTP Router, Multipart Parser, Session Cookie Auth (HttpOnly) │
│  • db.js: PostgreSQL Connection Pooler (pg), Migration Runner               │
│  • Job Dispatcher: Non-blocking Worker Spawner (child_process.spawn)        │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
           SQL Queries via Pool                  Asynchronous Spawn CLI
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│           DATABASE TIER              │  │         AI PIPELINE TIER          │
│  Supabase PostgreSQL                 │  │  scripts/generate_image.py        │
│  • users (Google OAuth accounts)     │  │  • Multimodal payload builder     │
│  • sessions (UUID session store)     │  │  • Two-tier Prompt Engineer       │
│  • sticker_cards (Theme catalog)     │  │  • google-genai Python SDK        │
│  • generated_stickers (Job tracking) │  └─────────────────┬─────────────────┘
└──────────────────────────────────────┘                    │
                                                gRPC / HTTPS API Request
                                                            │
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │      GOOGLE VERTEX AI CLOUD       │
                                          │   Model: gemini-2.5-flash-image   │
                                          │   Output: 3:4 16-Sticker PNG      │
                                          └───────────────────────────────────┘
```

---

## Key Features

- **Multimodal Facial Identity Retention:** Uses Google Gemini's multimodal visual grounding to help preserve key facial characteristics from the user's reference photo.
- **Dynamic Artistic Style Control:** Supports photorealistic, 3D chibi, and anime-style sticker generation through theme prompts and optional user instructions.
- **Asynchronous Job Pipeline:** The web server returns `HTTP 202 Accepted` with a `jobId`, then delegates image generation to a background Python worker. The client polls every 2.5 seconds while a job is processing.
- **Authentication:** Passwordless Google OAuth 2.0 integration with HttpOnly, SameSite session cookies.
- **Frontend Reliability:** Client-side photo previews use `URL.createObjectURL` with cleanup through `URL.revokeObjectURL`; submit-state controls help prevent duplicate requests; an Error Boundary displays interface errors without crashing the entire page.
- **Role-Based Access Control (RBAC):** Administrative dashboard for user lifecycle management, usage telemetry, and dynamic sticker card prompt editing.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React | 19.3.0 | Modern Single-Page Application (SPA) framework |
| **Routing** | React Router DOM | 6.30.1 | Client-side routing with public and protected route components |
| **Bundler & Tooling** | Vite | 7.1.5 | Development server and production build tool |
| **Backend Runtime** | Node.js | 20+ (Docker uses 22) | Native HTTP server and API routing |
| **Database** | PostgreSQL / Supabase | — | Relational data persistence and connection pooling |
| **Database Driver** | `pg` (node-postgres) | ^8.23.0 | PostgreSQL client and connection pool management |
| **AI Inference** | Python | >= 3.10 | Multimodal worker script invocation |
| **Google Cloud SDK** | `google-genai` | >= 1.0.0 | Official Google GenAI SDK for Vertex AI |
| **Environment Mgmt** | Custom Node.js loader / `python-dotenv` | `python-dotenv` >= 1.0.0 | Loads local environment configuration |
| **Authentication** | Google OAuth 2.0 | OpenID | Secure third-party identity verification |

---

## Project Directory Structure

```text
StickAI-Deploy/
├── .env.example                  # Template configuration file
├── .gitignore                    # Git tracking ignore rules
├── .dockerignore                 # Docker build ignore rules
├── Dockerfile                    # Containerization instructions
├── DEPLOY.md                     # Production deployment checklist
├── LICENSE                       # MIT Open Source License
├── package.json                  # Root workspace configuration
├── README.md                     # Project documentation
│
├── scripts/                      # AI Pipeline & LLM Worker scripts
│   ├── generate_image.py         # Gemini 2.5 Flash Image generator with prompt builder
│   └── requirements.txt          # Python dependencies (google-genai, python-dotenv)
│
├── server/                       # Backend Application Server
│   ├── db.js                     # PostgreSQL connection pool & data access layer
│   ├── package.json              # Server dependencies
│   ├── server.js                 # HTTP routing, authentication, and job orchestrator
│   ├── generated/                # Output storage for completed sticker images
│   ├── uploads/                  # Temporary staging directory for user uploads
│   └── migrations/               # Incremental SQL database schema migrations
│       ├── 001_users.sql
│       ├── 002_sessions.sql
│       ├── 003_sticker_cards.sql
│       ├── 004_generated_stickers.sql
│       ├── 005_remove_password_credentials.sql
│       ├── 006_remove_sticker_topic.sql
│       ├── 007_fix_card_images.sql
│       ├── 008_photorealistic_card_prompts.sql
│       └── 009_flexible_style_card_prompts.sql
│
└── web/                          # Frontend Application (Client)
    ├── index.html                # Single HTML entry point
    ├── package.json              # Client dependencies
    ├── vite.config.js            # Vite build & reverse proxy configuration
    ├── public/                   # Static assets (hero images, badges)
    └── src/                      # React source code
        ├── main.jsx              # DOM mount & BrowserRouter bootstrap
        ├── App.jsx               # Route definitions & Authentication guards
        ├── api.js                # Centralized fetch wrapper & credential handling
        ├── style.css             # Comprehensive stylesheet with CSS Variables
        ├── components/
        │   ├── Header.jsx        # Navigation bar with responsive drawer & auth menu
        │   └── DataTable.jsx     # Reusable admin table component
        └── pages/
            ├── Landing.jsx       # Public promotional page & OAuth entry point
            ├── Collection.jsx    # Card browser, photo uploader & job submitter
            ├── History.jsx       # Polling queue monitor & sticker viewer
            └── Admin.jsx         # Administrative user & card management dashboard
```

---

## Prerequisites

Before running the project locally, verify your system meets the following requirements:

1. **Node.js**: `v20.0.0` or higher ([Download Node.js](https://nodejs.org/)).
2. **Python**: `3.10` to `3.12` installed and added to your system `PATH` ([Download Python](https://www.python.org/)).
3. **Google Cloud Platform (GCP)** Account with:
   - An active project with **Vertex AI API** enabled.
    - Quota allocated for the configured Gemini image model (`gemini-2.5-flash-image`).
   - Authenticated environment via Google Cloud SDK (`gcloud auth application-default login`).
4. **PostgreSQL Database**:
   - A hosted Supabase project or any standard PostgreSQL instance.

---

## Local Setup & Quickstart

### 1. Clone the Repository

```bash
git clone https://github.com/Dung092005/Image_to_sticker_project.git stickai
cd stickai
```

### 2. Install Dependencies

Install all Node.js workspace dependencies from the root directory:

```bash
npm install
```

Install the Python AI pipeline dependencies:

```bash
pip install -r scripts/requirements.txt
```

### 3. Google Cloud Authentication

Authenticate your local machine to access Vertex AI resources:

```bash
gcloud auth application-default login
gcloud config set project YOUR_GCP_PROJECT_ID
```

*(Alternatively, configure a service account JSON key as outlined in the environment section).*

### 4. Configure Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials and GCP project identifier (refer to [Environment Configuration](#environment-configuration)).

### 5. Start the Application

Open two terminal windows:

**Terminal 1 — Backend Server:**
```bash
npm run server
```
*The server initializes database migrations and listens at `http://localhost:3001`.*

**Terminal 2 — Frontend Development Client:**
```bash
npm run web
```
*The Vite development server starts at `http://localhost:3000` with reverse proxy enabled.*

Open your browser and navigate to **`http://localhost:3000`**.

---

## Environment Configuration

The application expects the following configuration parameters inside `.env.local`:

| Variable | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | String | **Yes** | PostgreSQL connection URI (e.g. Supabase connection pooler string). |
| `APP_ORIGIN` | String | **Yes** | Allowed CORS origins for the frontend (e.g. `http://localhost:3000`). |
| `PORT` | Number | No | Backend HTTP server port (Default: `3001` in local dev, `3000` in Docker). |
| `GOOGLE_CLIENT_ID` | String | **Yes** | Google OAuth 2.0 Web Client ID. |
| `GOOGLE_CLIENT_SECRET` | String | **Yes** | Google OAuth 2.0 Client Secret. |
| `GOOGLE_REDIRECT_URI` | String | **Yes** | Callback URI (e.g. `http://localhost:3001/api/auth/google/callback`). |
| `GCP_PROJECT_ID` | String | **Yes** | GCP Project ID where Vertex AI is enabled. |
| `GCP_LOCATION` | String | No | Vertex AI region (Defaults to `us-central1`). |
| `GEMINI_IMAGE_MODEL` | String | No | Model name (Defaults to `gemini-2.5-flash-image`). |
| `STICKAI_PYTHON` | String | No | Custom absolute path to the Python executable. |
| `ADMIN_EMAILS` | String | No | Comma-separated list of emails granted administrative privileges. |
| `COOKIE_SECURE` | Boolean | No | Set to `true` in production (forces HTTPS cookies). |
| `COOKIE_SAMESITE` | String | No | Cookie SameSite policy (`Lax` or `None`). |
| `DATABASE_POOL_MAX` | Number | No | Maximum concurrent database pool connections (Default: `5`). |

---

## Database Schema & Migrations

Database evolution is managed via SQL migrations located in `server/migrations/`. When the server boots, it evaluates the `schema_migrations` audit table and executes pending files sequentially:

| Migration File | Description |
| :--- | :--- |
| `001_users.sql` | Creates the core users table |
| `002_sessions.sql` | Adds cryptographic session management with cascade deletion |
| `003_sticker_cards.sql` | Seeds and creates thematic sticker collections |
| `004_generated_stickers.sql` | Establishes async job records and tracking |
| `005_remove_password_credentials.sql` | Deprecates legacy password fields |
| `006_remove_sticker_topic.sql` | Normalizes thematic categorization |
| `007_fix_card_images.sql` | Remaps legacy card illustration assets |
| `008_photorealistic_card_prompts.sql` | Introduces realism prompts |
| `009_flexible_style_card_prompts.sql` | Unlocks multi-style overrides |

### Core Relational Entities

1. **`users`**:
   - `id`: BIGSERIAL (Primary Key)
   - `email`: TEXT UNIQUE (Google verified email)
   - `name`: TEXT (User profile display name)
   - `avatar_url`: TEXT (Google profile picture)
   - `role`: TEXT (`user` or `admin`)
   - `sticker_creations`: INTEGER (Cumulative creation counter)
2. **`sessions`**:
   - `id`: UUID (Primary Key, stored in HttpOnly cookie)
   - `user_id`: BIGINT (Foreign Key referencing `users.id`)
   - `expires_at`: TIMESTAMPTZ (7-day validity TTL)
3. **`sticker_cards`**:
   - `id`: TEXT (Primary Key slug, e.g. `summer-sticker-pack`)
   - `title`: TEXT (Vietnamese display title)
   - `alias`: TEXT (Subtitle description)
   - `image`: TEXT (Preview cover image URL)
   - `prompt`: TEXT (System generation directive sent to Gemini)
4. **`generated_stickers`**:
   - `id`: UUID (Job identifier)
   - `user_id`: BIGINT (Foreign Key referencing `users.id`)
   - `card_id`: TEXT (Associated collection identifier)
   - `image`: TEXT (Path to generated image `/api/generated/:id`)
   - `status`: TEXT (`processing`, `completed`, `error`)
   - `error_message`: TEXT (Diagnostics if inference fails)

---

## RESTful API Specification

| Method | Endpoint | Auth | Success Code | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/health` | Public | `200 OK` | Healthcheck and database connectivity ping. |
| `GET` | `/api/auth/me` | Public | `200` / `401` | Returns currently authenticated user context. |
| `GET` | `/api/auth/google` | Public | `302 Found` | Initiates Google OAuth 2.0 authorization redirect. |
| `GET` | `/api/auth/google/callback` | Public | `302 Found` | Exchanges OAuth code, updates user, and sets cookie. |
| `POST`| `/api/auth/logout` | Session | `200 OK` | Invalidates active database session and clears cookie. |
| `GET` | `/api/cards` | Public | `200 OK` | Retrieves all available thematic sticker cards. |
| `POST`| `/api/generate` | Session | `202 Accepted`| Accepts multipart payload (`file`, `cardId`, `customPrompt`) and queues AI job. |
| `GET` | `/api/history` | Session | `200 OK` | Fetches generation history and job statuses for the user. |
| `GET` | `/api/generated/:id` | Session | `200 OK` | Streams completed sticker PNG with authorization checks. |
| `GET` | `/api/admin` | Admin | `200 OK` | Retrieves system telemetry, user rosters, and card configs. |
| `PUT` | `/api/admin/users/:id` | Admin | `200 OK` | Updates user details or elevates roles. |
| `DELETE`|`/api/admin/users/:id` | Admin | `200 OK` | Permanently deletes a user and cascades sessions/jobs. |
| `POST`| `/api/admin/cards` | Admin | `201 Created` | Creates a new thematic sticker card. |
| `PUT` | `/api/admin/cards/:id` | Admin | `200 OK` | Modifies sticker pack title, image, or AI prompts. |
| `DELETE`|`/api/admin/cards/:id` | Admin | `200 OK` | Deletes a thematic sticker card. |

---

## AI Pipeline & Prompt Engineering

The system implements a specialized **Two-Tier Multimodal Prompt Architecture** inside `scripts/generate_image.py`:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 1: USER CREATIVE INTENT                    │
│   Theme Description + User Overrides (e.g., "3D Chibi", "Sunglasses")  │
│   (Given highest creative authority for art style and accessories)    │
├────────────────────────────────────────────────────────────────────────┤
│                        TIER 2: RIGID SYSTEM CONSTRAINTS                │
│   • Identity Invariance: Preserve facial geometry, hair, skin tone.    │
│   • Geometry: Aspect Ratio 3:4, exact 4x4 grid (16 discrete stickers). │
│   • Die-cut Isolation: Pure clean white background, white borders.     │
│   • Cultural Localization: 16 unique Vietnamese phrases with diacritics│
│   • Negative Constraints: Strictly forbid face swaps, watermarks,      │
│     distortions, extra digits, or 3D plastic artifacts.                │
└────────────────────────────────────────────────────────────────────────┘
```

### Multimodal Invocation Sample

```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        final_prompt,
    ],
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="3:4"),
    ),
)
```

---

## Production Deployment

The project includes a Dockerfile and a deployment guide for a Vercel frontend with a Render backend. See [DEPLOY.md](DEPLOY.md) for the complete deployment sequence and required production environment variables.

---

## Troubleshooting & FAQ

#### 1. HTTP 500 on `/api/auth/me` or `/api/cards`
- **Cause:** Database connection timeout or missing `DATABASE_URL`.
- **Solution:** Verify your Supabase PostgreSQL connection string in `.env.local`. If your password contains special characters (`#`, `@`, `%`), ensure it is URL-encoded.

#### 2. AI Generation Fails with `Thiếu GCP_PROJECT_ID`
- **Cause:** Python cannot read cloud credentials.
- **Solution:** Verify `GCP_PROJECT_ID` is defined in `.env.local`. Run `gcloud auth application-default login` on your host machine to refresh local Application Default Credentials (ADC).

#### 3. Python executable not found on Windows
- **Cause:** Node cannot locate `python` on the system `PATH`.
- **Solution:** Specify the full path in `.env.local`:
  ```bash
  STICKAI_PYTHON=C:\Users\<username>\AppData\Local\Programs\Python\Python312\python.exe
  ```

---

## License & Acknowledgments

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

### Academic & Project Team Acknowledgments
- Developed as part of the Web Application Development curriculum (ICT Department).
- Special thanks to **Google Cloud Vertex AI** for providing foundational model infrastructure.
- Powered by open-source libraries: React, Vite, Node.js, and Supabase.
