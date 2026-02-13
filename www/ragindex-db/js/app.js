"use strict";

import { UaQuery } from "./query.js";
import { UaTable } from "./table.js";

/**
 * Controller principale del DB Explorer.
 */
const UaApp = function() {
    
    // 1. STATO E CONFIG
    const _getWorkerUrl = function() {
        const env = localStorage.getItem("ragindex_env") || "local";
        const remoteBase = "https://ragindex.workerua.workers.dev"; 
        // XXX: Inserisci qui l'URL del tuo Worker Cloudflare
        
        // Sincronizza UI se presente (usiamo querySelector per evitare ReferenceError)
        const radio = document.querySelector(`input[name="env"][value="${env}"]`);
        if (radio) radio.checked = true;
        
        const urlDisplay = document.getElementById("current-url");
        if (urlDisplay) {
            urlDisplay.textContent = env === "local" ? "http://localhost:8788" : remoteBase;
        }

        return env === "local" ? "http://localhost:8788" : remoteBase;
    };

    const _workerUrl = _getWorkerUrl();
    
    // Inizializzazione Singleton per le query
    UaQuery.init({ workerUrl: _workerUrl });
    
    const _tableManager = UaTable();

    // Elementi DOM
    const _editor = document.getElementById("sql-editor");
    const _executeBtn = document.getElementById("execute-btn");
    const _clearBtn = document.getElementById("clear-btn");
    const _errorDisplay = document.getElementById("error-display");
    const _presetBtns = document.querySelectorAll(".preset-query");
    const _dangerClearBtn = document.getElementById("danger-clear-btn");

    // 2. FUNZIONI PRIVATE

    /**
     * Svuota il database tramite API protetta.
     */
    const _clearDatabaseAsync = async function() {
        const confirmed = confirm("Sei sicuro di voler cancellare TUTTI gli eventi dal database?");
        if (!confirmed) return;

        // Recupera l'ambiente attuale
        const env = localStorage.getItem("ragindex_env") || "local";
        
        // Se sei in remoto, usa la chiave che hai impostato con 'wrangler secret put'
        // Se sei in locale, usa la chiave di fallback
        const SECRET_KEY = env === "local" 
            ? "ragindex-secret-clear-2026" 
            : "INSERISCI_QUI_LA_TUA_CHIAVE_DI_PRODUZIONE"; 

        try {
            const response = await fetch(`${_workerUrl}/api/analytics/clear`, {
                method: "DELETE",
                headers: {
                    "X-Clear-Key": SECRET_KEY
                }
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Database svuotato! Righe eliminate: ${data.deleted}`);
                _tableManager.clear();
            } else {
                throw new Error(data.error || "Errore durante la cancellazione");
            }
        } catch (error) {
            _showError(`Errore cancellazione: ${error.message}`);
        }
    };

    /**
     * Mostra un errore nella UI.
     */
    const _showError = function(message) {
        if (!message) {
            _errorDisplay.style.display = "none";
            return;
        }
        _errorDisplay.textContent = message;
        _errorDisplay.style.display = "block";
    };

    /**
     * Esegue la query presente nell'editor.
     */
    const _runQueryAsync = async function() {
        const sql = _editor.value.trim();
        _showError(null);
        
        _executeBtn.disabled = true;
        _executeBtn.textContent = "Esecuzione...";

        try {
            // Utilizzo del metodo statico del Singleton UaQuery
            const result = await UaQuery.executeAsync(sql);
            if (result && result.results) {
                _tableManager.render(result.results);
            }
        } catch (error) {
            _showError(error.message);
        } finally {
            _executeBtn.disabled = false;
            _executeBtn.textContent = "Esecuzione Query (Ctrl+Enter)";
        }
    };

    /**
     * Gestisce il cambio ambiente.
     */
    const _handleEnvChange = function(e) {
        localStorage.setItem("ragindex_env", e.target.value);
        location.reload();
    };

    // 3. INIZIALIZZAZIONE
    const init = function() {
        // Event Listeners
        _executeBtn.addEventListener("click", _runQueryAsync);
        
        _clearBtn.addEventListener("click", () => {
            _tableManager.clear();
            _showError(null);
        });

        // Shortcut Ctrl+Enter
        _editor.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                _runQueryAsync();
            }
        });

        // Preset Queries
        _presetBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                _editor.value = btn.getAttribute("data-sql");
                _runQueryAsync();
            });
        });

        // Environment switch (Radio buttons)
        document.querySelectorAll('input[name="env"]').forEach(r => {
            r.addEventListener("change", _handleEnvChange);
        });

        // Danger actions
        _dangerClearBtn.addEventListener("click", _clearDatabaseAsync);

        console.log("RAGINDEX DB Explorer inizializzato.");
    };

    return {
        init: init
    };
};

// Avvio
document.addEventListener("DOMContentLoaded", () => {
    const app = UaApp();
    app.init();
});
