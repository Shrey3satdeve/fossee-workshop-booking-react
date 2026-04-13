#!/bin/bash

# Vercel / Railway Build Script
echo "--- Installing dependencies ---"
pip install -r requirements.txt

echo "--- Collecting static files ---"
# This puts all assets (Django Admin + React dist) into /staticfiles
python manage.py collectstatic --no-input

echo "--- Running migrations ---"
python manage.py migrate --no-input

echo "--- Build Complete ---"
