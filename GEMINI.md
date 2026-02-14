# RAGINDEX - Analytics Multi-App System

## Project Overview
RAGINDEX is a universal analytics and event tracking system designed for web applications. It leverages **Cloudflare Workers** for the backend logic and **Cloudflare D1** as a serverless SQLite database. The system is designed to be lightweight, with zero external dependencies, making it easy to integrate into any project.

### Architecture
- **Backend (`/ragindex`)**: A Cloudflare Worker that provides a REST API for event logging and data retrieval.
- **Frontend (`/www`)**: A management portal for monitoring events, testing integration, and executing SQL queries.
  - `ragindex-cli/`: A manual event sender for testing.
  - `ragindex-db/`: An interactive SQL explorer for data analysis.
- **Client Integration (`sender.js`)**: A reusable ES6 module located in `www/ragindex-db/js/sender.js` and `www/ragindex-cli/js/sender.js` for external apps to track events.

## Building and Running

### Prerequisites
- Node.js and npm installed.
- Cloudflare Wrangler CLI (`npm install -g wrangler`).

### Local Development Workflow
1.  **Initialize Local Database**:
    ```bash
    cd ragindex
    wrangler d1 migrations apply ragindex_db --local
    ```
2.  **Start Backend (Worker)**:
    ```bash
    cd ragindex
    wrangler dev --port 8788
    ```
3.  **Start Frontend**:
    Run a static server from the `www` directory:
    ```bash
    npx serve www
    ```
    Access the portal at `http://localhost:3000` (or the port provided by `serve`).

### Deployment
- **Deploy Backend**:
  ```bash
  cd ragindex
  wrangler deploy
  ```
- **Deploy Frontend (Cloudflare Pages)**:
  ```bash
  wrangler pages deploy www --project-name <your-project-name>
  ```

## Development Conventions

### Coding Style
- **Backend**: Standard JavaScript (ES Modules) for Cloudflare Workers. Logic is centralized in `ragindex/src/index.js`.
- **Frontend**: Vanilla JavaScript using ES Modules. No heavy frameworks (React/Vue) are used to keep the system lightweight and dependency-free.
- **API Design**:
  - `POST /api/analytics`: Register a new event.
  - `GET /api/analytics`: Retrieve events with filters.
  - `POST /api/query`: Execute raw SQL `SELECT` queries (restricted for security).
  - `DELETE /api/analytics/clear`: Wipe the analytics table (requires `X-Clear-Key` header).

### Configuration & State
- **localStorage**: The frontend uses `localStorage` to manage:
  - `ragindex_env`: Toggles between `local` (localhost:8788) and `remote` environments.
  - `ragindex_user_id`: A persistent UUID generated for tracking users across sessions.
- **CORS**: The Worker is configured with permissive CORS headers to allow tracking from any authorized domain.

### Documentation
Detailed specifications can be found in the `/docs` directory:
- `RAGINDEX_SPEC_DEV.md`: Environment setup and file structure.
- `RAGINDEX_SPEC_TEST.md`: Testing procedures and functional verification.
- `RAGINDEX_SPEC_DEPLOY.md`: Deployment instructions for Cloudflare.
- `GUIDA_INTEGRAZIONE_SENDER.md`: Detailed guide for using the `sender.js` module.
