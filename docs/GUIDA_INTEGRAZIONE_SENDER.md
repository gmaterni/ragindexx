# Guida all'Integrazione di `sender.js` (Versione Singleton)

Questa architettura permette di configurare l'URL del server e l'identità dell'utente **una sola volta** all'avvio dell'applicazione.

## 1. Configurazione Centrale (es. in `app.js`)

Imposta l'URL e l'ID utente (opzionale) all'inizio del tuo script principale.

```javascript
import { UaSender } from "./js/sender.js";

// SETTAGGIO UNICO
UaSender.init({
    workerUrl: "https://ragindex.tuo-subdominio.workers.dev",
    userId: "utente_123" // Opzionale: se omesso, userà "<appName>_user_id"
});
```

## 2. Gestione Identità (Consigliata)

È buona norma che la tua applicazione gestisca la persistenza dell'utente. Ecco un esempio di come inizializzare `UaSender` con un ID persistente:

```javascript
const getPersistentId = () => {
    let id = localStorage.getItem("mio_id_utente");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("mio_id_utente", id);
    }
    return id;
};

UaSender.init({
    workerUrl: "...",
    userId: getPersistentId()
});
```

## 3. Uso negli altri script (es. `form-handler.js`)

Negli altri script, ti basta importare `UaSender`. Non c'è bisogno di passare di nuovo la configurazione.

```javascript
import { UaSender } from "./js/sender.js";

// Se non hai passato un userId nell'init, 
// questo evento userà "mio-progetto_user_id" come default nel database
const salvaDati = () => {
    UaSender.sendEventAsync("mio-progetto", "salvataggio_form");
};
```

## Perché questa soluzione è migliore?

1.  **Agnosticismo**: `sender.js` non sa nulla di come salvi i dati (localStorage, Cookie, DB).
2.  **Fallback Sicuro**: Se ti dimentichi di configurare l'utente, il database riceve comunque un ID identificativo dell'app, evitando record anonimi orfani.
3.  **Sorgente Unica della Verità**: L'identità dell'utente è controllata dall'applicazione principale.
