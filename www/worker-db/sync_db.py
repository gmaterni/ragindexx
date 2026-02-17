#!/usr/bin/env python3

import sqlite3
import json
import urllib.request
import os

# Configurazione
# URL del Worker remoto (recuperato da www/ragindex-db/js/app.js)
REMOTE_URL = "https://ragindex.workerua.workers.dev/api/query"
DB_NAME = "analytics_local.sqlite"

def fetch_remote_data(sql):
    """Esegue una query SELECT sul worker remoto."""
    req = urllib.request.Request(
        REMOTE_URL,
        data=json.dumps({"sql": sql}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("results", [])
    except Exception as e:
        print(f"Errore durante il recupero dei dati: {e}")
        return []

def main():
    # Assicura che il DB venga creato nella stessa cartella dello script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, DB_NAME)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Inizializzazione Schema Locale (identico a Cloudflare D1)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY,
            app_name TEXT NOT NULL,
            user_id TEXT NOT NULL,
            action_name TEXT NOT NULL,
            user_agent TEXT,
            timezone TEXT,
            language TEXT,
            referrer TEXT,
            url_params TEXT,
            timestamp INTEGER,
            created_at DATETIME
        )
    ''')
    
    # 2. Identifica l'ultimo aggiornamento locale
    cursor.execute("SELECT MAX(created_at) FROM analytics")
    last_date = cursor.fetchone()[0]
    
    if not last_date:
        last_date = "1970-01-01 00:00:00"
        print("Database locale vuoto. Avvio clonazione completa...")
    else:
        print(f"Ultimo aggiornamento locale: {last_date}")

    # 3. Recupera solo i nuovi record dal remoto
    sql = f"SELECT * FROM analytics WHERE created_at > '{last_date}' ORDER BY created_at ASC"
    print(f"Richiesta dati nuovi al worker remoto...")
    results = fetch_remote_data(sql)
    
    if not results:
        print("Nessun nuovo dato trovato in remoto. Il database è già aggiornato.")
    else:
        print(f"Ricevuti {len(results)} nuovi record. Inserimento in corso...")
        
        # 4. Inserimento dati (INSERT OR IGNORE per sicurezza contro duplicati)
        for r in results:
            cursor.execute('''
                INSERT OR IGNORE INTO analytics 
                (id, app_name, user_id, action_name, user_agent, timezone, language, referrer, url_params, timestamp, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                r.get('id'),
                r.get('app_name'),
                r.get('user_id'),
                r.get('action_name'),
                r.get('user_agent'),
                r.get('timezone'),
                r.get('language'),
                r.get('referrer'),
                r.get('url_params'),
                r.get('timestamp'),
                r.get('created_at')
            ))
        
        conn.commit()
        print(f"Sincronizzazione completata. Database locale aggiornato: {db_path}")
    
    conn.close()

if __name__ == "__main__":
    main()
