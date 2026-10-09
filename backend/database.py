import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "avani.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            crop_name TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            
            disease_name TEXT NOT NULL,
            is_healthy INTEGER NOT NULL,
            confidence REAL NOT NULL,
            confidence_level TEXT NOT NULL,
            image_preview TEXT,
            follow_up_answers TEXT,
            guidance_summary TEXT
        )
    """)
    conn.commit()
    conn.close()

# Auto-initialize on import
init_db()

def save_scan(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    scan_id = scan_data.get("id") or f"scan_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:19]}"
    created_at = scan_data.get("created_at") or datetime.now().isoformat()
    
    cursor.execute("""
        INSERT OR REPLACE INTO scans 
        (id, created_at, crop_name, predicted_class, disease_name, is_healthy, confidence, confidence_level, image_preview, follow_up_answers, guidance_summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        scan_id,
        created_at,
        scan_data.get("crop_name", "Unknown Crop"),
        scan_data.get("predicted_class", "Uncertain"),
        scan_data.get("disease_name", "Pending Assessment"),
        1 if scan_data.get("is_healthy", False) else 0,
        float(scan_data.get("confidence", 0.0)),
        scan_data.get("confidence_level", "Medium"),
        scan_data.get("image_preview", ""),
        json.dumps(scan_data.get("follow_up_answers", {})),
        json.dumps(scan_data.get("guidance_summary", {}))
    ))
    conn.commit()
    conn.close()
    
    scan_data["id"] = scan_id
    scan_data["created_at"] = created_at
    return scan_data

def get_all_scans() -> List[Dict[str, Any]]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, created_at, crop_name, predicted_class, disease_name, is_healthy, confidence, confidence_level, image_preview, follow_up_answers, guidance_summary
        FROM scans
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        try:
            follow_up = json.loads(r[9]) if r[9] else {}
        except:
            follow_up = {}
        try:
            guidance = json.loads(r[10]) if r[10] else {}
        except:
            guidance = {}
            
        results.append({
            "id": r[0],
            "created_at": r[1],
            "crop_name": r[2],
            "predicted_class": r[3],
            "disease_name": r[4],
            "is_healthy": bool(r[5]),
            "confidence": r[6],
            "confidence_level": r[7],
            "image_preview": r[8],
            "follow_up_answers": follow_up,
            "guidance_summary": guidance
        })
    return results

def delete_scan(scan_id: str) -> bool:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
