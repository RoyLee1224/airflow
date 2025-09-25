#!/usr/bin/env python3
"""
Simple test to check if our duration filter fix works
"""

def test_simple_duration_api():
    """Test only the duration filter through API"""
    import subprocess
    import json

    # Use curl to test the API directly
    try:
        result = subprocess.run([
            'curl', '-s',
            'http://localhost:8080/public/dags/~/dagRuns?duration_gte=200'
        ], capture_output=True, text=True)

        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                print(f"API Response: {data}")
                runs = data.get('dag_runs', [])
                run_ids = [run['dag_run_id'] for run in runs]
                print(f"Found runs with duration >= 200: {run_ids}")
                print(f"Expected: ['dag_run_2']")
                print(f"Test passed: {run_ids == ['dag_run_2']}")
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Raw response: {result.stdout}")
        else:
            print(f"Curl failed: {result.stderr}")

    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_simple_duration_api()