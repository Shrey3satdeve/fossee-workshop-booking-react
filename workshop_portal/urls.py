"""workshop_portal URL Configuration"""

from django.conf.urls import url, include
from django.conf.urls.static import static
from django.contrib import admin
from django.conf import settings
from django.http import FileResponse, HttpResponse
import os


def serve_react(request):
    """
    Catch-all: serve the React SPA's index.html so that React Router
    handles /login, /dashboard, /propose, etc. on the client side.

    In development (Vite proxy), this is never hit for React routes.
    In production, this serves the built index.html from frontend/dist/.
    """
    index_path = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'rb') as f:
            return HttpResponse(f.read(), content_type='text/html')
    # Fallback: redirect to Django workshop list
    from django.shortcuts import redirect
    return redirect('/workshop/')


from workshop_portal import views

urlpatterns = [
    url(r'^admin/',       admin.site.urls),
    url(r'^$',            serve_react),          # root → React SPA
    url(r'^workshop/',    include('workshop_app.urls')),
    url(r'^api/',         include('workshop_app.api_urls')),   # JSON API for React
    url(r'^reset/',       include('django.contrib.auth.urls')),
    url(r'^page/',        include('cms.urls')),
    url(r'^statistics/',  include('statistics_app.urls')),
    # React SPA routes — serve index.html for client-side routing
    url(r'^login/?$',     serve_react),
    url(r'^register/?$',  serve_react),
    url(r'^dashboard/?$', serve_react),
    url(r'^instructor/?$',serve_react),
    url(r'^propose/?$',   serve_react),
    url(r'^workshops',    serve_react),
    url(r'^workshop/\d+', serve_react),
    url(r'^profile',      serve_react),
    url(r'^stats/?$',     serve_react),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
