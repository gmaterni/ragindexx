"use strict";

import { UaQuery } from "./query.js";
import { UaTable } from "./table.js";

/**
 * Controller principale del DB Explorer.
 */
const UaApp = function() {
    
    // 1. STATO
    const _getWorkerUrl = function() {
        const env = localStorage.getItem("ragindex_env") || "local";
        const remoteBase = "https://ragindex.tuo-subdominio.workers.dev"; // Modifica solo qui
        
        // Sincronizza UI esistente
        if (_envToggle) _envToggle.checked = (env === "remote");
        if (_urlDisplay) _urlDisplay.textContent = env === "local" ? "http://localhost:8788" : remoteBase;

        return env === "local" ? "http://localhost:8788" : remoteBase;
    };

    const _config = {
        workerUrl: "http://localhost:8788",
        prodUrl: "https://ragindex.tuo-subdominio.workers.dev" // Modifica solo qui
    };
    
    const _queryManager = UaQuery({ workerUrl: _getWorkerUrl() });
    const _tableManager = UaTable();

    // Elementi DOM
    const _editor = document.getElementById("sql-editor");
    const _executeBtn = document.getElementById("execute-btn");
    const _clearBtn = document.getElementById("clear-btn");
    const _errorDisplay = document.getElementById("error-display");
    const _envToggle = document.getElementById("env-toggle");
    const _urlDisplay = document.getElementById("current-url");
    const _presetBtns = document.querySelectorAll(".preset-query");
    const _dangerClearBtn = document.getElementById("danger-clear-btn");

    // 2. FUNZIONI PRIVATE

    /**
     * Svuota il database tramite API protetta.
     */
    const _clearDatabaseAsync = async function() {
        const confirmed = confirm("Sei sicuro di voler cancellare TUTTI gli eventi dal database?");
        if (!confirmed) return;

        const SECRET_KEY = "ragindex-secret-clear-2026"; // Chiave di default locale
        const url = _envToggle.checked ? _config.prodUrl : _config.workerUrl;

        try {
            const response = await fetch(`${url}/api/analytics/clear`, {
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
            const result = await _queryManager.executeAsync(sql);
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
    const _handleEnvChange = function() {
        const isProd = _envToggle.checked;
        localStorage.setItem("ragindex_env", isProd ? "remote" : "local");
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

        // Environment switch
        _envToggle.addEventListener("change", _handleEnvChange);

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
