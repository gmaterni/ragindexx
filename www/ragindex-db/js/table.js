"use strict";

/**
 * Gestore del rendering dinamico delle tabelle e visibilità colonne.
 */
export const UaTable = function(containerId) {
    
    // 1. STATO PRIVATO
    const _head = document.getElementById("results-head");
    const _body = document.getElementById("results-body");
    const _columnsList = document.getElementById("columns-list");
    
    let _hiddenColumns = new Set(JSON.parse(sessionStorage.getItem("ragindex_hidden_cols") || "[]"));
    let _currentData = [];

    // 2. FUNZIONI PRIVATE

    /**
     * Salva lo stato della visibilità in sessionStorage.
     */
    const _saveVisibility = function() {
        sessionStorage.setItem("ragindex_hidden_cols", JSON.stringify(Array.from(_hiddenColumns)));
    };

    /**
     * Aggiorna la lista dei checkbox per il toggle colonne.
     */
    const _updateColumnControls = function(columns) {
        _columnsList.innerHTML = "";
        
        columns.forEach(col => {
            const label = document.createElement("label");
            label.className = "column-toggle";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = !_hiddenColumns.has(col);
            
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    _hiddenColumns.delete(col);
                } else {
                    _hiddenColumns.add(col);
                }
                _saveVisibility();
                render(_currentData); // Rirendering immediato
            });
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(col));
            _columnsList.appendChild(label);
        });
    };

    // 3. FUNZIONI PUBBLICHE

    /**
     * Renderizza i dati nella tabella.
     */
    const render = function(data) {
        _currentData = data;
        
        if (!data || data.length === 0) {
            _head.innerHTML = "";
            _body.innerHTML = "<tr><td colspan='100'>Nessun risultato</td></tr>";
            return;
        }

        const columns = Object.keys(data[0]);
        _updateColumnControls(columns);

        const visibleColumns = columns.filter(col => !_hiddenColumns.has(col));

        // Header
        _head.innerHTML = "";
        const headerRow = document.createElement("tr");
        visibleColumns.forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            headerRow.appendChild(th);
        });
        _head.appendChild(headerRow);

        // Body
        _body.innerHTML = "";
        data.forEach(row => {
            const tr = document.createElement("tr");
            visibleColumns.forEach(col => {
                const td = document.createElement("td");
                const val = row[col];
                
                if (val !== null && typeof val === "object") {
                    td.textContent = JSON.stringify(val);
                } else if (col === "created_at" || col === "timestamp") {
                    td.textContent = val; // Potremmo formattare qui
                } else {
                    td.textContent = val !== null ? val : "NULL";
                }
                
                tr.appendChild(td);
            });
            _body.appendChild(tr);
        });
    };

    /**
     * Svuota la tabella.
     */
    const clear = function() {
        _head.innerHTML = "";
        _body.innerHTML = "";
        _columnsList.innerHTML = "";
        _currentData = [];
    };

    // 4. API PUBBLICA
    const api = {
        render: render,
        clear: clear
    };
    return api;
};
