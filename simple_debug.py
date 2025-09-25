#!/usr/bin/env python3
"""
Simple debug for testing in breeze environment
"""
import os
import sys

# Add airflow to path
sys.path.insert(0, 'airflow-core/src')

from airflow.models import DagRun
from sqlalchemy import JSON

# Test the column type
print(f"DagRun.conf.type: {DagRun.conf.type}")
print(f"Type class: {type(DagRun.conf.type)}")
print(f"isinstance(DagRun.conf.type, JSON): {isinstance(DagRun.conf.type, JSON)}")
print(f"str(DagRun.conf.type): {str(DagRun.conf.type)}")
print(f"str(DagRun.conf.type).upper(): {str(DagRun.conf.type).upper()}")

# Check the detection logic
from sqlalchemy import JSON
is_json_type = isinstance(DagRun.conf.type, JSON) or str(DagRun.conf.type).upper() in ("JSON", "JSONB")
print(f"Would be detected as JSON: {is_json_type}")