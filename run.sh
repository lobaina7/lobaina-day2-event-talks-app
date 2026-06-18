#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=== BigQuery Release Notes Hub ==="

# Check virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    venv/bin/pip install --upgrade pip
    venv/bin/pip install -r requirements.txt
fi

# Activate environment and run application
echo "Starting Flask web application..."
echo "Open your browser at: http://localhost:5000"
venv/bin/python3 app.py
