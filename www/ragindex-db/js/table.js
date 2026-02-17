"use strict";

/**
 * Gestore del rendering delle tabelle, visibilità colonne e ordinamento.
 */
export const UaTable = function(containerId) {

    // 1. STATO PRIVATO
    const _head = document.getElementById("results-head");
    const _body = document.getElementById("results-body");

    let _hiddenColumns = new Set(JSON.parse(sessionStorage.getItem("ragindex_hidden_cols") || "[]"));
    let _currentData = [];
    let _currentColumns = [];
    let _sortColumn = null;
    let _sortDirection = 'asc';

    // 2. FUNZIONI PRIVATE

    /**
     * Salva lo stato della visibilità in sessionStorage.
     */
    const _saveVisibility = function() {
        sessionStorage.setItem("ragindex_hidden_cols", JSON.stringify(Array.from(_hiddenColumns)));
    };

    /**
     * Ordina i dati per una colonna specifica.
     */
    const _sortData = function(data, column, direction) {
        if (!data || data.length === 0) return data;

        const sorted = [...data].sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (valA === null && valB === null) return 0;
            if (valA === null) return direction === 'asc' ? -1 : 1;
            if (valB === null) return direction === 'asc' ? 1 : -1;

            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            const isNumeric = !isNaN(numA) && !isNaN(numB);

            if (isNumeric) {
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA < strB) return direction === 'asc' ? -1 : 1;
            if (strA > strB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    };

    /**
     * Crea l'header della tabella con checkbox e ordinamento inline.
     */
    const _createHeader = function(columns) {
        const visibleColumns = columns.filter(col => !_hiddenColumns.has(col));

        const headerRow = document.createElement("tr");
        visibleColumns.forEach(col => {
            const th = document.createElement("th");
            
            const thContent = document.createElement("div");
            thContent.className = "th-content";
            
            // Checkbox + Label
            const label = document.createElement("label");
            label.title = "Mostra/Nascondi colonna";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = !_hiddenColumns.has(col);
            
            checkbox.addEventListener("change", (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    _hiddenColumns.delete(col);
                } else {
                    _hiddenColumns.add(col);
                }
                _saveVisibility();
                render(_currentData);
            });
            
            const colLabel = document.createElement("span");
            colLabel.className = "col-label";
            colLabel.textContent = col;
            
            label.appendChild(checkbox);
            label.appendChild(colLabel);
            
            // Icona ordinamento
            const sortIcon = document.createElement("span");
            sortIcon.className = "sort-icon";
            sortIcon.textContent = '⇅';
            sortIcon.title = "Ordina ascending/descending";
            
            if (_sortColumn === col) {
                sortIcon.classList.add("active");
                sortIcon.textContent = _sortDirection === 'asc' ? '▲' : '▼';
            }

            sortIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                
                if (_sortColumn === col) {
                    if (_sortDirection === 'asc') {
                        _sortDirection = 'desc';
                    } else {
                        _sortColumn = null;
                        _sortDirection = 'asc';
                    }
                } else {
                    _sortColumn = col;
                    _sortDirection = 'asc';
                }

                // Aggiorna tutte le icone
                const allIcons = _head.querySelectorAll('.sort-icon');
                allIcons.forEach(icon => {
                    icon.classList.remove("active");
                    icon.textContent = '⇅';
                });
                
                if (_sortColumn) {
                    sortIcon.classList.add("active");
                    sortIcon.textContent = _sortDirection === 'asc' ? '▲' : '▼';
                }

                // Riordina e renderizza i dati
                render(_currentData, false, true);
            });

            thContent.appendChild(label);
            thContent.appendChild(sortIcon);
            th.appendChild(thContent);
            headerRow.appendChild(th);
        });
        
        return headerRow;
    };

    // 3. FUNZIONI PUBBLICHE

    /**
     * Renderizza i dati nella tabella.
     * @param {Array} data - I dati da renderizzare
     * @param {boolean} updateHeader - Se aggiornare l'header
     * @param {boolean} applySort - Se applicare l'ordinamento
     */
    const render = function(data, updateHeader = true, applySort = false) {
        _currentData = data || [];

        if (!_currentData || _currentData.length === 0) {
            _head.innerHTML = "";
            _body.innerHTML = "<tr><td colspan='100'>Nessun risultato</td></tr>";
            return;
        }

        const columns = Object.keys(_currentData[0]);
        _currentColumns = columns;

        // Applica ordinamento se richiesto
        let renderData = _currentData;
        if (applySort && _sortColumn && columns.includes(_sortColumn)) {
            renderData = _sortData(_currentData, _sortColumn, _sortDirection);
        }

        const visibleColumns = columns.filter(col => !_hiddenColumns.has(col));

        // Header
        if (updateHeader) {
            _head.innerHTML = "";
            const headerRow = _createHeader(columns);
            _head.appendChild(headerRow);
        } else {
            // Aggiorna solo stato checkbox esistenti
            const existingThs = _head.querySelectorAll("th");
            existingThs.forEach((th, idx) => {
                if (idx < visibleColumns.length) {
                    const checkbox = th.querySelector('input[type="checkbox"]');
                    const col = visibleColumns[idx];
                    if (checkbox && col) {
                        checkbox.checked = !_hiddenColumns.has(col);
                    }
                }
            });
        }

        // Body
        _body.innerHTML = "";
        renderData.forEach(row => {
            const tr = document.createElement("tr");
            visibleColumns.forEach(col => {
                const td = document.createElement("td");
                const val = row[col];

                if (val !== null && typeof val === "object") {
                    td.textContent = JSON.stringify(val);
                } else if (col === "created_at" || col === "timestamp") {
                    td.textContent = val;
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
        _currentData = [];
        _currentColumns = [];
        _sortColumn = null;
        _sortDirection = 'asc';
    };

    /**
     * Mostra tutte le colonne.
     */
    const showAllColumns = function() {
        _hiddenColumns.clear();
        _saveVisibility();
        render(_currentData);
    };

    /**
     * Ottieni lo stato ordinamento.
     */
    const getSortState = function() {
        return { column: _sortColumn, direction: _sortDirection };
    };

    /**
     * Imposta lo stato di ordinamento.
     */
    const setSortState = function(column, direction) {
        _sortColumn = column;
        _sortDirection = direction;
    };

    // 4. API PUBBLICA
    return {
        render: render,
        clear: clear,
        showAllColumns: showAllColumns,
        getSortState: getSortState,
        setSortState: setSortState
    };
};
