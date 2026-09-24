#!/usr/bin/env python3
"""
Dust 1947 Python API Importer
Importiert 459 Einheiten über die HTTP API
"""

import json
import requests
import time
import sys

API_BASE = "http://localhost:8180/admin_api.php"
API_KEY = "local-dev-key-12345"
JSON_FILE = r"D:\private\apps\dust1947\dust1947_import_data.json"

def call_api(action, method="GET", data=None):
    """Call the admin API"""
    url = f"{API_BASE}?action={action}"
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        else:
            return {"error": f"Unknown method: {method}"}

        if response.status_code >= 400:
            return {"error": f"HTTP {response.status_code}: {response.text}"}

        return response.json()
    except Exception as e:
        return {"error": str(e)}

print("\n╔════════════════════════════════════════════════════════════════╗")
print("║         DUST 1947 PYTHON API IMPORT                          ║")
print("╚════════════════════════════════════════════════════════════════╝\n")

# Load JSON
print("📖 Loading JSON...")
try:
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    units = data['units']
    print(f"✅ Loaded {len(units)} units\n")
except Exception as e:
    print(f"❌ ERROR: {e}")
    sys.exit(1)

# Ensure Game System
print("🎮 Setting up Game System...")
result = call_api("game_systems.list", "GET")
game_system_id = 1

if isinstance(result, list):
    for sys in result:
        if sys.get('name') == 'Dust 1947':
            game_system_id = sys.get('id')
            print(f"✅ Found existing: ID {game_system_id}\n")
            break

# Import units
print(f"📥 Importing {len(units)} units...")
print("─" * 60)

stats = {
    'total': 0,
    'success': 0,
    'failed': 0,
    'errors': []
}

start_time = time.time()

for idx, unit in enumerate(units):
    stats['total'] += 1

    unit_data = {
        'name': unit['card_id'],
        'type': unit.get('type', 'I'),
        'level': int(unit.get('level', 1)),
        'points': int(unit.get('points', 10)),
        'health': int(unit.get('health', 1)),
        'speed': int(unit.get('speed', 4)),
        'march_speed': int(unit.get('march_speed', 2)),
        'image_url': unit.get('image_url', ''),
        'notes': f"Card: {unit['card_id']}",
        'game_system_id': game_system_id
    }

    result = call_api("units.create", "POST", unit_data)

    if 'id' in result and result['id']:
        stats['success'] += 1
    else:
        stats['failed'] += 1
        if 'error' in result:
            stats['errors'].append({
                'unit': unit['card_id'],
                'error': result['error']
            })

    if (idx + 1) % 50 == 0:
        pct = int((idx + 1) / len(units) * 100)
        print(f"[{pct:3d}%] {idx + 1}/{len(units)} units imported")

end_time = time.time()
duration = round(end_time - start_time, 2)

# Summary
print("─" * 60 + "\n")
print("IMPORT SUMMARY")
print("═" * 60)
print(f"Total:     {stats['total']}")
print(f"Success:   {stats['success']}")
print(f"Failed:    {stats['failed']}")
print(f"Duration:  {duration} seconds")
if stats['total'] > 0:
    print(f"Speed:     {int(stats['total'] / duration)} units/sec")
print("═" * 60)

if stats['errors']:
    print("\nErrors (first 5):")
    for err in stats['errors'][:5]:
        print(f"  {err['unit']}: {err['error'][:50]}")

print("\n✅ Import finished!\n")

sys.exit(0 if stats['failed'] == 0 else 1)

