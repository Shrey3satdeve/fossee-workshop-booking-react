"""workshop_portal URL Configuration"""

from django.conf.urls import url, include
from django.conf.urls.static import static
from django.contrib import admin
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
import os


@ensure_csrf_cookie
def serve_react(request):
    """
    Catch-all: serve the React SPA's index.html.
    Client-side routing (React Router) takes over from here.
    """
    index_path = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'rb') as f:
            return HttpResponse(f.read(), content_type='text/html')
    # Fallback to a simple message if build is missing
    return HttpResponse(
        "React build missing accurately in frontend/dist. Please run 'npm run build'.", 
        status=404
    )


urlpatterns = [
    url(r'^admin/',       admin.site.urls),
    url(r'^workshop/',    include('workshop_app.urls')),
    url(r'^api/',         include('workshop_app.api_urls')),
    url(r'^reset/',       include('django.contrib.auth.urls')),
    url(r'^page/',        include('cms.urls')),
    url(r'^statistics/',  include('statistics_app.urls')),
    
    # Root and Catch-all for SPA (everything else goes to React)
    url(r'^$',            serve_react),
    url(r'^.*$',          serve_react),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
