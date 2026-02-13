"use strict";

/**
 * Gestore dell'esecuzione delle query SQL.
 */
export const UaQuery = function(config = {}) {
    
    // 1. STATO
    let _workerUrl = config.workerUrl || "http://localhost:8788";

    // 2. FUNZIONI PUBBLICHE

    /**
     * Aggiorna l'URL del worker.
     */
    const setWorkerUrl = function(url) {
        _workerUrl = url;
    };

    /**
     * Esegue una query SQL SELECT tramite il backend.
     */
    const executeAsync = async function(sql) {
        // Fail Fast
        if (!sql) {
            console.error("UaQuery.executeAsync: SQL mancante");
            return null;
        }

        let result = null;

        try {
            const response = await fetch(`${_workerUrl}/api/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ sql: sql })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Errore durante l'esecuzione della query");
            }

            result = data;
        } catch (error) {
            console.error("UaQuery.executeAsync:", error);
            throw error; // Rilanciamo l'errore per gestirlo nella UI
        }

        return result;
    };

    // 3. API PUBBLICA
    const api = {
        executeAsync: executeAsync,
        setWorkerUrl: setWorkerUrl
    };
    return api;
};
