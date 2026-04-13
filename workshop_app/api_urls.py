"""
api_urls.py — URL routes for the JSON API used by the React frontend.
"""

from django.conf.urls import url
from workshop_app import api_views

urlpatterns = [
    # CSRF bootstrap (GET before any POST)
    url(r'^csrf/$',                             api_views.api_csrf,                  name='api_csrf'),

    # Auth
    url(r'^me/$',                               api_views.api_me,                    name='api_me'),
    url(r'^login/$',                            api_views.api_login,                 name='api_login'),
    url(r'^logout/$',                           api_views.api_logout,                name='api_logout'),
    url(r'^register/$',                         api_views.api_register,              name='api_register'),

    # Workshops
    url(r'^workshops/my/$',                     api_views.api_my_workshops,          name='api_my_workshops'),
    url(r'^workshops/instructor/$',             api_views.api_instructor_workshops,  name='api_instructor_workshops'),
    url(r'^workshops/propose/$',                api_views.api_propose_workshop,      name='api_propose_workshop'),
    url(r'^workshops/by-coordinator/(?P<user_id>\d+)/$', api_views.api_workshops_by_coordinator, name='api_workshops_by_coordinator'),
    url(r'^workshops/(?P<workshop_id>\d+)/comments/$',   api_views.api_workshop_comments,         name='api_workshop_comments'),
    url(r'^workshops/(?P<workshop_id>\d+)/$',            api_views.api_workshop_detail,           name='api_workshop_detail'),

    # Workshop types
    url(r'^workshop-types/$',                   api_views.api_workshop_type_list,    name='api_workshop_type_list'),
    url(r'^workshop-types/(?P<pk>\d+)/$',       api_views.api_workshop_type_detail,  name='api_workshop_type_detail'),

    # Profiles
    url(r'^profile/me/$',                       api_views.api_own_profile,           name='api_own_profile'),
    url(r'^profile/(?P<user_id>\d+)/$',         api_views.api_profile_detail,        name='api_profile_detail'),
]
