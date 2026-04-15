# Justmer PJ DocuWare Validation Service

This project provides a Node.js validation service for DocuWare Cloud.

## What it validates

- `TERMINAL_NAME` via `/validate-terminal`
- `CARRIER` via `/validate-carrier`

The service reads approved values from:

- `terminals.csv`
- `carriers.csv`

## Local setup

```bash
npm install
npm start
```

## Local URLs

- `http://localhost:3000/`
- `http://localhost:3000/health`
- `http://localhost:3000/validate-terminal`
- `http://localhost:3000/validate-carrier`

## Example terminal test

```bash
curl -X POST http://localhost:3000/validate-terminal \
  -H "Content-Type: application/json" \
  -d '{
    "Values": [
      {
        "FieldName": "TERMINAL_NAME",
        "Item": "Buckeye Newrk"
      }
    ]
  }'
```

## Example carrier test

```bash
curl -X POST http://localhost:3000/validate-carrier \
  -H "Content-Type: application/json" \
  -d '{
    "Values": [
      {
        "FieldName": "CARRIER",
        "Item": "Pilott"
      }
    ]
  }'
```

## Render environment variables

- `TERMINAL_FIELD=TERMINAL_NAME`
- `CARRIER_FIELD=CARRIER`
- `STRICT_THRESHOLD=0.95`
- `SUGGEST_THRESHOLD=0.85`

## DocuWare web service URLs

After deploying to Render, register these in DocuWare:

- `https://your-render-url.onrender.com/validate-terminal`
- `https://your-render-url.onrender.com/validate-carrier`

## Important

Replace the sample values in `terminals.csv` and `carriers.csv` with your real approved values before testing in production.
