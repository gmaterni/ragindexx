# RAGINDEX - SPECIFICHE DI TEST

## REQUISITI PRE-TEST
- Worker attivo su localhost:8788
- Server statico attivo su cartella /www

## PROCEDURE DI TEST (CASE)

### T1: AUTO-LOGGING (Home)
- Caricare index.html.
- Evento atteso: POST /api/analytics { appName: "ragindex", actionName: "open" }
- Validazione UI: id="status-dot" con classe "status-active".

### T2: EVENTI MANUALI (CLI)
- Selezionare applicazione (es: "test-app").
- Inviare azione (es: "click").
- Validazione: Verifica record in tabella dinamica inferiore.

### T3: SQL QUERY (DB)
- Eseguire: `SELECT * FROM analytics ORDER BY created_at DESC`
- Validazione: Visualizzazione corretta metadati (userAgent, language, timezone).

### T4: PROTEZIONE E PULIZIA
- Tentare: `DELETE FROM analytics` via SQL Editor.
- Risultato atteso: 403 Forbidden.
- Eseguire: Click "Svuota Database".
- Risultato atteso: DELETE /api/analytics/clear con header X-Clear-Key.

### T5: FALLBACK USER_ID (Resilienza)
- Inizializzare `UaSender.init()` senza passare `userId`.
- Inviare un evento per un'app "dummy-app".
- Validazione DB: Il campo `user_id` deve contenere automaticamente la stringa "dummy-app_user_id".
