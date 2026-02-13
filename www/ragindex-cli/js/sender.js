"use strict";

/**
 * Stato globale del modulo (Singleton)
 */
let _globalConfig = {
    workerUrl: "http://localhost:8788", // Default locale
    isInitialized: false
};

const _storageKey = "ragindex_user_id";

/**
 * Funzioni di utilità interne
 */
const _getUserId = function() {
    let userId = localStorage.getItem(_storageKey);
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem(_storageKey, userId);
    }
    return userId;
};

const _getMetadata = function() {
    return {
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        referrer: document.referrer,
        urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
        timestamp: Math.floor(Date.now() / 1000)
    };
};

/**
 * Il modulo esporta sia la funzione factory che i metodi diretti.
 */
export const UaSender = {
    
    /**
     * Configura l'URL del worker una volta per tutte.
     */
    init: function(config = {}) {
        if (config.workerUrl) {
            _globalConfig.workerUrl = config.workerUrl;
        }
        _globalConfig.isInitialized = true;
        console.log(`[RAGINDEX] Inizializzato con URL: ${_globalConfig.workerUrl}`);
    },

    /**
     * Invia un evento usando la configurazione globale.
     */
    sendEventAsync: async function(appName, actionName) {
        if (!appName || !actionName) {
            console.error("UaSender: parametri mancanti");
            return null;
        }

        const payload = {
            appName,
            actionName,
            userId: _getUserId(),
            ..._getMetadata()
        };

        try {
            const response = await fetch(`${_globalConfig.workerUrl}/api/analytics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Errore server");
            return await response.json();
        } catch (error) {
            console.warn("UaSender: invio fallito (modalità silenziosa)", error);
            return null;
        }
    }
};
