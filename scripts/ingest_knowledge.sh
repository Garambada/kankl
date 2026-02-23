#!/bin/bash
# Ingest the technical documents
export PYTHONPATH=$PYTHONPATH:.

echo "Ingesting: 박태웅 AI 강의 및 정책 제언.pdf"
backend/venv/bin/python ai_engine/ingest.py --file "/Users/sungjaekang/Downloads/박태웅 AI 강의 및 정책 제언.pdf"

echo "Ingesting: 박태웅_샘플.pdf"
backend/venv/bin/python ai_engine/ingest.py --file "/Users/sungjaekang/Desktop/Antigravity/boardroom-club/docs/박태웅_샘플.pdf"
