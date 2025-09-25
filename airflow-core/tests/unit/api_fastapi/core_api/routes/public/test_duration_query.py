#!/usr/bin/env python3
"""
Test duration query directly in breeze environment
"""
import os
import sys

# Set up environment for breeze
sys.path.insert(0, '/opt/airflow/airflow-core/src')
os.environ.setdefault('AIRFLOW__DATABASE__SQL_ALCHEMY_CONN', 'sqlite:////root/airflow/airflow.db')

from airflow.models.dagrun import DagRun
from sqlalchemy import select
from airflow.utils.session import provide_session

@provide_session
def test_duration_query(session=None):
    print("=== Testing Duration SQL Query in Breeze ===")

    try:
        # Test 1: Get all dag runs with their durations
        print("\n1. All DAG runs with durations:")
        all_runs = session.execute(
            select(DagRun.run_id, DagRun.duration).where(
                DagRun.run_id.in_(['dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4'])
            )
        ).fetchall()

        for run_id, duration in all_runs:
            print(f"  {run_id}: {duration}")

        # Test 2: Query with duration >= 200 using hybrid property
        print("\n2. DAG runs with duration >= 200 (using DagRun.duration):")
        try:
            filtered_runs = session.execute(
                select(DagRun.run_id, DagRun.duration).where(
                    DagRun.run_id.in_(['dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4']),
                    DagRun.duration >= 200
                )
            ).fetchall()

            for run_id, duration in filtered_runs:
                print(f"  {run_id}: {duration}")

            print(f"  Result: {[r[0] for r in filtered_runs]}")

        except Exception as e:
            print(f"  ERROR with DagRun.duration: {e}")

        # Test 3: Manual calculation using EXTRACT
        print("\n3. DAG runs with manual duration calculation:")
        from sqlalchemy import func, extract, case

        duration_expr = case(
            ((DagRun.end_date != None) & (DagRun.start_date != None),
             extract("epoch", DagRun.end_date - DagRun.start_date)),
            else_=None
        )

        manual_runs = session.execute(
            select(DagRun.run_id, duration_expr).where(
                DagRun.run_id.in_(['dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4']),
                duration_expr >= 200
            )
        ).fetchall()

        for run_id, duration in manual_runs:
            print(f"  {run_id}: {duration}")

        print(f"  Result: {[r[0] for r in manual_runs]}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_duration_query()