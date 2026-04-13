"""
production_settings.py
======================
Imported by settings.py when DJANGO_ENV=production.
All secrets come from environment variables — never hardcoded.

Railway automatically injects PORT. Set these env vars in Railway dashboard:
  SECRET_KEY          — any random 50-char string
  ALLOWED_HOSTS       — your-app.up.railway.app
  EMAIL_HOST_USER     — shreyashsatadeve@gmail.com
  EMAIL_HOST_PASSWORD — your gmail app password
  DEBUG               — False
"""

from decouple import config

SECRET_KEY = config('SECRET_KEY', default='change-me-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

# HTTPS settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE   = True
CSRF_COOKIE_SECURE      = True

# Trust Railway's proxy
CSRF_TRUSTED_ORIGINS = [
    f"https://{host}" for host in ALLOWED_HOSTS if host != '*'
]
