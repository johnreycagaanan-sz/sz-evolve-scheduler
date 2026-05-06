# Schedule App (Frontend Only)

This project provides a simple frontend form for nurse duty assignment.
Persistence is handled by your Lambda/API endpoint (no backend server in this repo).

## What it includes

- Date picker (calendar input)
- Location dropdown
- Nurses-on-duty multiline input
- Save button that POSTs directly to your Lambda/API endpoint

## Setup

1. Copy environment file:

```bash
# PowerShell
Copy-Item .env.example .env

# or bash
cp .env.example .env
```

2. Update `.env` with your save endpoint:

```env
VITE_SAVE_SCHEDULE_URL=https://your-api-gateway-url/schedule
```

## Run

```bash
npm install
npm run dev
```

Runs frontend at `http://localhost:5173`.

## Expected save API contract

- Method: `POST`
- Request body shape:

```js
{
  id: "random-uuid",
  date: "2026-04-02",
  location: "FORT WORTH/BRIDGEWAY",
  nursesOnDuty: [
    "P. MICHELLE MAYS, RN",
    "BRITTANY LOVE, RNAC"
  ],
  createdAt: "2026-04-30T14:00:00.000Z"
}
```
