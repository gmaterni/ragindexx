# Guida all'Integrazione di `sender.js` (Versione Singleton)

Questa architettura permette di configurare l'URL del server **una sola volta** all'avvio dell'applicazione. Tutti i successivi script utilizzeranno automaticamente quell'URL.

## 1. Configurazione Centrale (es. in `app.js`)

Imposta l'URL all'inizio del tuo script principale. Questo configurerà il modulo per tutta la durata della sessione.

```javascript
import { UaSender } from "./js/sender.js";

// SETTAGGIO UNICO: Da qui in poi, l'URL è memorizzato nel modulo
UaSender.init({
    workerUrl: "https://ragindex.tuo-subdominio.workers.dev"
});
```

## 2. Uso negli altri script (es. `form-handler.js`)

Negli altri script, ti basta importare `UaSender`. Non c'è bisogno di passare di nuovo la configurazione.

```javascript
import { UaSender } from "./js/sender.js";

// Questo userà automaticamente l'URL impostato in precedenza
const salvaDati = () => {
    UaSender.sendEventAsync("mio-progetto", "salvataggio_form");
};
```

## 3. Il Wrapper "Smart" definitivo

Ecco come implementare il wrapper con questa nuova struttura:

```javascript
import { UaSender } from "./js/sender.js";

/**
 * Wrapper centralizzato
 */
export const track = (appName, actionName) => {
    const isLocal = window.location.hostname === "localhost";

    if (isLocal) {
        console.log(`[DEBUG] ${appName} -> ${actionName}`);
    } else {
        // Usa il metodo statico del modulo già configurato
        UaSender.sendEventAsync(appName, actionName);
    }
};
```

## Perché questa soluzione è migliore?

1.  **Sorgente Unica della Verità**: Se cambi l'URL del Worker, devi farlo solo in un punto (la chiamata a `UaSender.init`).
2.  **Meno Codice**: Non devi istanziare oggetti o passare configurazioni in ogni file.
3.  **Sicurezza**: Il modulo `sender.js` incapsula l'URL e lo protegge, rendendolo disponibile solo tramite i suoi metodi.
