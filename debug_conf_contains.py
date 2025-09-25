#!/usr/bin/env python3
"""
Simple debug script to test conf_contains filtering
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'airflow-core/src'))

from sqlalchemy import create_engine, Column, Integer, JSON, text, Text, cast, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class DagRun(Base):
    __tablename__ = 'dag_run'
    id = Column(Integer, primary_key=True)
    run_id = Column(Text)
    conf = Column(JSON)

def test_conf_contains():
    engine = create_engine('sqlite:///:memory:', echo=True)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 插入與測試相同的資料
    test_data = [
        (1, 'dag_run_1', {"env": "development", "version": "1.0"}),
        (2, 'dag_run_2', {"env": "production", "debug": True}),
        (3, 'dag_run_3', {"env": "staging", "test_mode": True}),
        (4, 'dag_run_4', {"env": "testing", "mode": "ci"}),
    ]

    for id_val, run_id, conf in test_data:
        session.add(DagRun(id=id_val, run_id=run_id, conf=conf))
    session.commit()

    print("=== Test Data ===")
    for dagrun in session.query(DagRun).all():
        print(f"ID: {dagrun.id}, run_id: {dagrun.run_id}, conf: {dagrun.conf}")

    print("\n=== Testing conf_contains filters ===")

    # 測試不同的搜索條件
    search_terms = ['development', 'debug', 'version', 'nonexistent_key']

    for term in search_terms:
        print(f"\n--- Searching for '{term}' ---")

        # Method 1: Using cast + contains (our current approach)
        result1 = session.execute(
            select(DagRun).where(cast(DagRun.conf, Text).contains(term))
        ).fetchall()
        print(f"cast + contains: {[r.DagRun.run_id for r in result1]}")

        # Method 2: Using JSON_EXTRACT (SQLite specific)
        try:
            result2 = session.execute(
                text(f"SELECT run_id FROM dag_run WHERE json_extract(conf, '$') LIKE '%{term}%'")
            ).fetchall()
            print(f"json_extract + like: {[r[0] for r in result2]}")
        except Exception as e:
            print(f"json_extract failed: {e}")

        # Method 3: Direct string search on serialized JSON
        result3 = session.execute(
            text(f"SELECT run_id FROM dag_run WHERE conf LIKE '%{term}%'")
        ).fetchall()
        print(f"direct like: {[r[0] for r in result3]}")

        # Check actual JSON strings
        all_runs = session.execute(select(DagRun)).fetchall()
        print("JSON strings:")
        for r in all_runs:
            json_str = str(r.DagRun.conf)
            contains_term = term in json_str
            print(f"  {r.DagRun.run_id}: {json_str} -> contains '{term}': {contains_term}")

if __name__ == "__main__":
    test_conf_contains()