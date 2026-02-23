#!/bin/bash
# Move up one directory so python recognizes the 'backend' package
cd ..
export PYTHONPATH=$PYTHONPATH:$(pwd)
# Start uvicorn from the root directory so 'backend.main:app' resolves
uvicorn backend.main:app --host 0.0.0.0 --port 10000
