#!/usr/bin/env python3
"""
Comprehensive debug script for conf_contains filter issues in breeze environment.
Run this in breeze to understand what's happening with the failing tests.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'airflow-core/src'))

from datetime import datetime, timedelta
from airflow._shared.timezones import timezone
from airflow.models import DagRun, DagModel
from airflow.api_fastapi.common.parameters import FilterParam, FilterOptionEnum
from sqlalchemy import select, cast, Text, JSON
from airflow.utils.session import provide_session

@provide_session
def debug_conf_contains_in_breeze(session=None):
    """Debug the actual conf_contains behavior in breeze environment"""
    print("=== BREEZE CONF_CONTAINS DEBUG ===")

    # First, let's see what DagRuns exist with conf values
    print("\n1. Existing DAG runs with conf:")
    existing_runs = session.execute(select(DagRun)).fetchall()
    for run in existing_runs:
        dagrun = run[0] if isinstance(run, tuple) else run.DagRun if hasattr(run, 'DagRun') else run
        print(f"  ID: {dagrun.id}, run_id: {dagrun.run_id}, conf: {dagrun.conf}, conf_type: {type(dagrun.conf)}")

    # Check the column type
    print(f"\n2. DagRun.conf column type: {DagRun.conf.type}")
    print(f"   Is JSON type: {isinstance(DagRun.conf.type, JSON)}")
    print(f"   String representation: {str(DagRun.conf.type)}")

    # Test the FilterParam logic directly
    print("\n3. Testing FilterParam logic:")
    test_cases = [
        ('development', ['dag_run_2']),  # This should match dag_run_1 actually
        ('debug', ['dag_run_3']),        # This should match dag_run_2 actually
        ('version', ['dag_run_1', 'dag_run_4']),  # This should match dag_run_1 actually
    ]

    for search_term, expected in test_cases:
        print(f"\n--- Testing '{search_term}' ---")

        # Create FilterParam and apply it
        filter_param = FilterParam(
            attribute=DagRun.conf,
            value=search_term,
            filter_option=FilterOptionEnum.CONTAINS
        )

        # Get the base query
        base_query = select(DagRun).where(DagRun.run_id.in_(['dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4']))

        # Apply the filter
        try:
            filtered_query = filter_param.to_orm(base_query)
            print(f"  Generated query: {filtered_query}")

            # Execute the query
            results = session.execute(filtered_query).fetchall()
            actual_run_ids = []
            for result in results:
                dagrun = result[0] if isinstance(result, tuple) else result.DagRun if hasattr(result, 'DagRun') else result
                actual_run_ids.append(dagrun.run_id)

            print(f"  Expected: {expected}")
            print(f"  Actual: {actual_run_ids}")
            print(f"  Match: {sorted(actual_run_ids) == sorted(expected)}")

        except Exception as e:
            print(f"  ERROR: {e}")
            import traceback
            traceback.print_exc()

    # Test manual SQL queries to see what works
    print("\n4. Testing manual SQL approaches:")
    for search_term in ['development', 'debug', 'version']:
        print(f"\n--- Manual SQL for '{search_term}' ---")

        # Test 1: cast to text + contains
        try:
            from sqlalchemy import text as sql_text
            query1 = session.execute(
                sql_text("SELECT run_id, conf FROM dag_run WHERE run_id IN ('dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4') AND CAST(conf AS TEXT) LIKE :pattern"),
                {"pattern": f"%{search_term}%"}
            ).fetchall()
            print(f"  CAST(conf AS TEXT) LIKE: {[r[0] for r in query1]}")
        except Exception as e:
            print(f"  CAST query failed: {e}")

        # Test 2: direct conf LIKE
        try:
            query2 = session.execute(
                sql_text("SELECT run_id, conf FROM dag_run WHERE run_id IN ('dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4') AND conf LIKE :pattern"),
                {"pattern": f"%{search_term}%"}
            ).fetchall()
            print(f"  conf LIKE: {[r[0] for r in query2]}")
        except Exception as e:
            print(f"  Direct LIKE query failed: {e}")

        # Test 3: Show actual conf values as strings
        try:
            query3 = session.execute(
                sql_text("SELECT run_id, conf, CAST(conf AS TEXT) FROM dag_run WHERE run_id IN ('dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4')")
            ).fetchall()
            print(f"  Actual conf strings:")
            for r in query3:
                conf_str = str(r[2]) if r[2] else str(r[1])
                contains_term = search_term in conf_str
                print(f"    {r[0]}: {conf_str} -> contains '{search_term}': {contains_term}")
        except Exception as e:
            print(f"  String check failed: {e}")

    print("\n=== DEBUG COMPLETE ===")

if __name__ == "__main__":
    debug_conf_contains_in_breeze()