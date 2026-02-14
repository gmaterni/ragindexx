# RAGINDEX - SPECIFICHE DI DEPLOY

## FASE 1: BACKEND (Worker)
1. Eseguire migrazioni: 
cd ragindex 
wrangler d1 migrations apply ragindex_db --remote

2. Eseguire deploy: 
wrangler deploy

3. Identificare ENDPOINT_URL risultante.
https://ragindex.workerua.workers.dev


## FASE 2: CONFIGURAZIONE URL REMOTO
Modificare la costante `remoteBase` (o `prodUrl`) nei seguenti file prima del deploy frontend:
1. `www/index.html`
2. `www/ragindex-cli/js/app.js`
3. `www/ragindex-db/js/app.js` (costanti `remoteBase` e `prodUrl`)

## FASE 3: FRONTEND (Pages)
1. Eseguire deploy dalla root: 
wrangler pages deploy www --project-name=ragindexx

2. Verificare che la directory di destinazione sia `www`.

## FASE 4: SICUREZZA
1. Configurare CLEAR_KEY: 
Mgiuseppe_0_
cd ragindex
wrangler secret put CLEAR_KEY

2. Valore atteso per operazioni DELETE: Header `X-Clear-Key`.

https://41e9bd82.ragindexx.pages.dev
