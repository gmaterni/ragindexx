"use strict";

/**
 * Gestore dell'invio degli eventi analytics.
 * Si occupa di raccogliere metadati e inviare dati al backend.
 */
export const UaSender = function(config = {}) {
    
    // 1. STATO PRIVATO
    const _workerUrl = config.workerUrl || "http://localhost:8788";
    const _storageKey = "ragindex_user_id";
    
    // 2. FUNZIONI PRIVATE

    /**
     * Genera o recupera un ID utente persistente.
     */
    const _getUserId = function() {
        let userId = localStorage.getItem(_storageKey);
        
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem(_storageKey, userId);
        }
        
        return userId;
    };

    /**
     * Raccoglie i metadati del browser.
     */
    const _getMetadata = function() {
        const metadata = {
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            referrer: document.referrer,
            urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
            timestamp: Math.floor(Date.now() / 1000)
        };
        return metadata;
    };

    // 3. FUNZIONI PUBBLICHE

    /**
     * Invia un evento al backend.
     */
    const sendEventAsync = async function(appName, actionName) {
        // Fail Fast
        if (!appName || !actionName) {
            console.error("UaSender.sendEventAsync: parametri mancanti");
            return null;
        }

        const payload = {
            appName: appName,
            actionName: actionName,
            userId: _getUserId(),
            ..._getMetadata()
        };

        let result = null;

        try {
            const response = await fetch(`${_workerUrl}/api/analytics`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Errore server");
            }

            const data = await response.json();
            result = data;
        } catch (error) {
            console.error("UaSender.sendEventAsync:", error);
            result = null;
        }

        return result;
    };

    // 4. API PUBBLICA
    const api = {
        sendEventAsync: sendEventAsync
    };
    return api;
};
