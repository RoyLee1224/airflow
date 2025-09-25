#!/usr/bin/env python3
"""
Check actual conf values in database during test
Add this as a debug print in the test_filters method
"""

# Add this code snippet to the test_filters method right before the assertion:
debug_code = '''
# DEBUG: Check actual conf values
print("\\n=== DEBUG: Actual conf values ===")
from airflow.models import DagRun
from airflow.utils.session import provide_session
from sqlalchemy import select

@provide_session
def debug_conf_values(session=None):
    runs = session.execute(select(DagRun).where(DagRun.run_id.in_(['dag_run_1', 'dag_run_2', 'dag_run_3', 'dag_run_4']))).fetchall()
    for run in runs:
        dagrun = run[0] if isinstance(run, tuple) else run.DagRun if hasattr(run, 'DagRun') else run
        print(f"  {dagrun.run_id}: conf = {dagrun.conf} (type: {type(dagrun.conf)})")
        if dagrun.conf:
            conf_str = str(dagrun.conf)
            print(f"    as string: {conf_str}")
            print(f"    contains 'development': {'development' in conf_str}")
            print(f"    contains 'debug': {'debug' in conf_str}")
            print(f"    contains 'version': {'version' in conf_str}")

debug_conf_values()
print("=== END DEBUG ===\\n")
'''

print("Add this code to the test_filters method before the assertion:")
print(debug_code)