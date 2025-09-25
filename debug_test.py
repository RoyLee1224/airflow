#!/usr/bin/env python3
"""
Debug test to see what's actually happening in the failing test
"""
import pytest
import sys
import os

# Add the airflow path
sys.path.insert(0, '/opt/airflow/airflow-core/src')

# Import test dependencies
from datetime import datetime, timedelta
from airflow._shared.timezones import timezone
from airflow.models import DagRun
from sqlalchemy import select, cast, Text
from airflow.api_fastapi.common.parameters import FilterParam, FilterOptionEnum

def debug_failing_test():
    """Debug the failing test to understand what's happening"""

    # This simulates what the failing test should do
    print("=== DEBUG: Testing conf_contains filter ===")

    # These are the values from our test setup
    test_data = {
        'dag_run_1': {"env": "development", "version": "1.0"},
        'dag_run_2': {"env": "production", "debug": True},
        'dag_run_3': {"env": "staging", "test_mode": True},
        'dag_run_4': {"env": "testing", "mode": "ci"}
    }

    # Test cases that are failing
    failing_tests = [
        ('query_params49', 'development', ['dag_run_2']),  # Expected but wrong
        ('query_params50', 'debug', ['dag_run_3']),        # Expected but wrong
        ('query_params51', 'version', ['dag_run_1', 'dag_run_4']),  # Expected but wrong
    ]

    print("Current test data:")
    for run_id, conf in test_data.items():
        print(f"  {run_id}: {conf}")

    print("\nFailing test expectations:")
    for test_name, search_term, expected in failing_tests:
        print(f"  {test_name}: searching '{search_term}' expects {expected}")

        # Check which runs actually contain the search term
        actual_matches = []
        for run_id, conf in test_data.items():
            conf_str = str(conf)
            if search_term in conf_str:
                actual_matches.append(run_id)

        print(f"    -> Actually matches: {actual_matches}")
        print(f"    -> Test expectation is {'CORRECT' if actual_matches == expected else 'WRONG'}")

    print("\n=== Conclusion ===")
    print("The test expectations are WRONG! They don't match the actual data.")
    print("We need to fix the test expectations, not the filter logic.")

if __name__ == "__main__":
    debug_failing_test()