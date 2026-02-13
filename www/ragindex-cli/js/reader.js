"use strict";

/**
 * Gestore della lettura degli eventi analytics.
 * Si occupa di interrogare l'API per visualizzare i dati.
 */
export const UaReader = function(config = {}) {
    
    // 1. STATO PRIVATO
    const _workerUrl = config.workerUrl || "http://localhost:8788";
    
    // 2. FUNZIONI PUBBLICHE

    /**
     * Recupera la lista degli ultimi eventi.
     */
    const fetchEventsAsync = async function(filters = {}) {
        let result = null;
        
        try {
            const url = new URL(`${_workerUrl}/api/analytics`);
            
            // Applica filtri se presenti
            if (filters.limit) url.searchParams.append("limit", filters.limit);
            if (filters.appName) url.searchParams.append("appName", filters.appName);
            if (filters.actionName) url.searchParams.append("actionName", filters.actionName);
            if (filters.userId) url.searchParams.append("userId", filters.userId);

            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error("Errore nel recupero eventi");
            }

            const data = await response.json();
            result = data;
        } catch (error) {
            console.error("UaReader.fetchEventsAsync:", error);
            result = null;
        }

        return result;
    };

    // 3. API PUBBLICA
    const api = {
        fetchEventsAsync: fetchEventsAsync
    };
    return api;
};
