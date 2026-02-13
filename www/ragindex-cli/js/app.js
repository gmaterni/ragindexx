"use strict";

import { UaSender } from "./sender.js";
import { UaReader } from "./reader.js";

/**
 * Controller principale dell'applicazione Test Client.
 */
const UaApp = function() {
    
    // 1. STATO E CONFIG
    const _getWorkerUrl = function() {
        const env = localStorage.getItem("ragindex_env") || "local";
        const remoteBase = "https://ragindex.workerua.workers.dev"; 
        // XXX: Inserisci qui l'URL del tuo Worker Cloudflare
        //https://ragindex.workerua.workers.dev

        // Sincronizza UI se presente
        const radio = document.querySelector(`input[name="env"][value="${env}"]`);
        if (radio) radio.checked = true;

        return env === "local" ? "http://localhost:8788" : remoteBase;
    };

    const _config = {
        workerUrl: _getWorkerUrl()
    };

    /**
     * Inizializzazione di UaSender e UaReader.
     * Entrambi usano ora il pattern Singleton per condividere l'URL del Worker.
     */
    UaSender.init({ workerUrl: _getWorkerUrl() });
    UaReader.init({ workerUrl: _getWorkerUrl() });

    // Eventi per lo switch
    document.querySelectorAll('input[name="env"]').forEach(r => {
        r.addEventListener("change", (e) => {
            localStorage.setItem("ragindex_env", e.target.value);
            location.reload();
        });
    });

    // Elementi DOM
    const _form = document.getElementById("event-form");
    const _appNameInput = document.getElementById("app-name");
    const _actionNameInput = document.getElementById("action-name");
    const _statusMsg = document.getElementById("status-message");
    const _tableBody = document.getElementById("events-body");
    const _submitBtn = document.getElementById("submit-btn");

    // 2. FUNZIONI PRIVATE

    /**
     * Mostra un messaggio di stato all'utente.
     */
    const _showStatus = function(message, isError = false) {
        _statusMsg.textContent = message;
        _statusMsg.className = isError ? "status-error" : "status-success";
        
        // Scompare dopo 5 secondi
        setTimeout(() => {
            _statusMsg.className = "";
            _statusMsg.textContent = "";
        }, 5000);
    };

    /**
     * Formatta una data ISO in stringa leggibile.
     */
    const _formatDate = function(isoString) {
        const date = new Date(isoString);
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        };
        const formatted = date.toLocaleString('it-IT', options);
        return formatted;
    };

    /**
     * Aggiorna la tabella degli eventi.
     */
    const _refreshTableAsync = async function() {
        const appName = _appNameInput.value.trim();
        const filters = { limit: 50 };
        
        // Se il nome app è specificato, lo aggiungiamo ai filtri
        if (appName) {
            filters.appName = appName;
        }

        // Chiamata al metodo statico del Singleton UaReader
        const events = await UaReader.fetchEventsAsync(filters);
        
        if (!events) {
            console.error("Errore caricamento eventi");
            return;
        }

        // Svuota tabella
        _tableBody.innerHTML = "";

        // Popola tabella
        events.forEach(event => {
            const row = document.createElement("tr");
            
            const dateCell = document.createElement("td");
            dateCell.textContent = _formatDate(event.created_at);
            
            const appCell = document.createElement("td");
            appCell.textContent = event.app_name;
            
            const actionCell = document.createElement("td");
            actionCell.textContent = event.action_name;
            
            const userCell = document.createElement("td");
            userCell.textContent = event.user_id.substring(0, 8) + "...";
            userCell.title = event.user_id;

            row.appendChild(dateCell);
            row.appendChild(appCell);
            row.appendChild(actionCell);
            row.appendChild(userCell);
            
            _tableBody.appendChild(row);
        });
    };

    /**
     * Gestisce l'invio del form.
     */
    const _handleFormSubmit = async function(event) {
        event.preventDefault();
        
        const appName = _appNameInput.value;
        const actionName = _actionNameInput.value;

        if (!appName || !actionName) {
            _showStatus("Compila tutti i campi", true);
            return;
        }

        _submitBtn.disabled = true;
        _submitBtn.textContent = "Invio in corso...";

        /**
         * Chiamata al metodo statico di UaSender.
         * Essendo stato inizializzato con .init(), conosce già l'URL di destinazione.
         */
        const result = await UaSender.sendEventAsync(appName, actionName);

        _submitBtn.disabled = false;
        _submitBtn.textContent = "Invia Evento";

        if (result && result.success) {
            _showStatus("Evento inviato con successo!");
            _actionNameInput.value = "";
            await _refreshTableAsync();
        } else {
            _showStatus("Errore nell'invio dell'evento", true);
        }
    };

    // 3. INIZIALIZZAZIONE
    const init = async function() {
        _form.addEventListener("submit", _handleFormSubmit);

        // Auto-log dell'apertura (T1: AUTO-LOGGING)
        UaSender.sendEventAsync("ragindex-cli", "open")
            .then(res => res && console.log("Apertura CLI registrata:", res.id));
        
        // Aggiorna tabella all'avvio
        await _refreshTableAsync();
        
        // Refresh periodico ogni 30 secondi
        setInterval(_refreshTableAsync, 30000);
        
        console.log("RAGINDEX Test Client inizializzato.");
    };

    return {
        init: init
    };
};

// Avvio applicazione
document.addEventListener("DOMContentLoaded", () => {
    const app = UaApp();
    app.init();
});
