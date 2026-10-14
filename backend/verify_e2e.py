import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def request_json(method, path, data=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data else None
    try:
        with urllib.request.urlopen(req, data=body) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = json.loads(e.read().decode("utf-8"))
        return e.code, error_body

def main():
    print("=== WATCHTOWER E2E INTEGRATION TEST SUITE ===\n")

    # 1. Health check
    status, health = request_json("GET", "/health")
    assert status == 200, f"Health check failed: {health}"
    print(f"[PASS] 1. Health check: {health['status']}")

    # 2. SSRF prevention checks
    print("\n[TEST] 2. Testing SSRF Rejection on Dangerous Endpoints...")
    dangerous = [
        "http://localhost:5173",
        "http://127.0.0.1:8000",
        "http://192.168.1.1",
        "http://10.0.0.1",
        "http://169.254.169.254/latest/meta-data/",
    ]
    for bad_url in dangerous:
        status, res = request_json("POST", "/targets", {
            "name": "Malicious Target",
            "url": bad_url,
            "check_interval": "Every 1m",
        })
        assert status == 400, f"Expected 400 Bad Request for {bad_url}, got {status}: {res}"
        print(f"  [BLOCKED 400 OK] {bad_url} -> {res.get('detail', res)}")

    # 3. List initial targets
    status, targets = request_json("GET", "/targets")
    assert status == 200, f"List targets failed: {targets}"
    print(f"\n[PASS] 3. List targets returned {len(targets)} targets from SQLite.")
    for t in targets:
        print(f"  Target: [{t['code']}] {t['name']} ({t['url']}) - Status: {t['status']} (Latency: {t['latency_ms']}ms)")

    # 4. Trigger manual Playwright check on first target
    target_id = targets[0]["id"]
    print(f"\n[TEST] 4. Triggering Playwright manual check on target '{target_id}' ({targets[0]['url']})...")
    status, check_res = request_json("POST", f"/targets/{target_id}/check")
    assert status == 200, f"Check failed: {check_res}"
    print(f"  [PASS] Check response: {check_res['message']} (HTTP {check_res['http_status']}, Latency: {check_res['latency_ms']}ms)")

    # 5. Retrieve snapshots
    status, snapshots = request_json("GET", f"/targets/{target_id}/snapshots")
    assert status == 200, f"List snapshots failed: {snapshots}"
    print(f"\n[PASS] 5. Target '{target_id}' has {len(snapshots)} snapshot(s) in SQLite.")
    for s in snapshots:
        print(f"  Snapshot [{s['version_tag']}]: {s['word_count']} words, excerpt: {s['text_content'][:70]}...")

    # 6. Test pause and resume
    print(f"\n[TEST] 6. Testing Pause and Resume on target '{target_id}'...")
    status, paused_target = request_json("POST", f"/targets/{target_id}/pause")
    assert status == 200 and paused_target["status"] == "paused"
    print(f"  [PASS] Target status after pause: {paused_target['status']}")

    status, resumed_target = request_json("POST", f"/targets/{target_id}/pause")
    assert status == 200 and resumed_target["status"] == "healthy"
    print(f"  [PASS] Target status after resume: {resumed_target['status']}")

    # 7. Check system stats
    status, stats = request_json("GET", "/stats")
    assert status == 200
    print(f"\n[PASS] 7. System Stats from SQLite: Total: {stats['total_targets']}, Healthy: {stats['healthy_targets']}, Avg Latency: {stats['avg_latency_ms']}ms, Operational: {stats['operational_percent']}")

    print("\n=== ALL E2E BACKEND & API TESTS PASSED! ===")

if __name__ == "__main__":
    main()
