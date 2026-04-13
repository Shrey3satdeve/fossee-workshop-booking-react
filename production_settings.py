"""
production_settings.py
======================
Imported by settings.py when DJANGO_ENV=production.
All secrets come from environment variables.
"""

import os

# ── Security ────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me-in-production')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Allowed Hosts
_raw_hosts = os.environ.get('ALLOWED_HOSTS', '*')
ALLOWED_HOSTS = [h.strip() for h in _raw_hosts.split(',') if h.strip()]

# ── HTTPS settings ──────────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE   = True
CSRF_COOKIE_SECURE      = True

# ── CSRF ────────────────────────────────────────────────────────────
# Trust production hosts for CSRF
CSRF_TRUSTED_ORIGINS = [
    f"https://{host}" for host in ALLOWED_HOSTS if host != '*'
]
