# RAGINDEX - SPECIFICHE DI SVILUPPO

## ARCHITETTURA DI SISTEMA
Struttura del progetto basata su separazione Backend/Frontend.

```text
/ragindex       -> Backend (Cloudflare Worker + D1)
/www            -> Frontend (Static Files per Cloudflare Pages)
/www/index.html -> Portale Home
/www/ragindex-cli -> Test Client
/www/ragindex-db -> DB Explorer
```

## STACK TECNOLOGICO
- Runtime: Cloudflare Workers (v3+)
- Database: Cloudflare D1
- Frontend: Vanilla JavaScript (ES Modules)
- Protocollo: REST API / JSON

## WORKFLOW LOCALE
1. Inizializzazione DB: `cd ragindex && wrangler d1 migrations apply ragindex_db --local`
2. Avvio Backend: `cd ragindex && wrangler dev --port 8788`
3. Avvio Frontend: `npx serve www` (o server statico equivalente su cartella /www)

## CONFIGURAZIONE AMBIENTE (localStorage)
Le applicazioni utilizzano le seguenti chiavi in localStorage per mantenere lo stato:
- `ragindex_env`: ["local", "remote"] - Determina l'URL base.
- `ragindex_user_id`: [UUID] - Identificativo persistente dell'utente.
- `ragindex_remote_url`: [URL] - Cache dell'URL di produzione (opzionale, dedotto da codice).
