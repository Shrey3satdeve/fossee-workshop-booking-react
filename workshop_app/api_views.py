"""
api_views.py
============
Thin JSON API layer for the React frontend.

Design decisions:
- These views return JSON only — the existing template-based views are
  UNTOUCHED so the original site continues to work in parallel.
- We use Django's existing model layer and authentication decorators rather
  than adding DRF, keeping dependencies minimal and the code reviewable.
- All responses follow the same shape: either a dict (detail) or a list
  (collection), matching what the React pages expect.
"""

from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.db.models import Q
from django.utils import timezone

from .models import Profile, User, Workshop, WorkshopType, Comment, AttachmentFile
from .views  import is_instructor, is_email_checked


# ─── helpers ─────────────────────────────────────────────────────

def json_ok(data, status=200):
    return JsonResponse(data, safe=isinstance(data, dict), status=status)

def json_err(msg, status=400):
    return JsonResponse({'error': msg}, status=status)


def _workshop_data(w):
    """Serialise a Workshop model instance to a dict."""
    return {
        'id':                w.id,
        'workshop_type_id':  w.workshop_type_id,
        'workshop_type_name': str(w.workshop_type),
        'date':              str(w.date),
        'status':            w.status,
        'coordinator_id':    w.coordinator_id,
        'coordinator_name':  w.coordinator.get_full_name() if w.coordinator else '',
        'institute':         w.coordinator.profile.institute if w.coordinator else '',
        'instructor_id':     w.instructor_id,
        'instructor_name':   w.instructor.get_full_name() if w.instructor else None,
    }


def _profile_data(profile):
    return {
        'username':        profile.user.username,
        'user_first_name': profile.user.first_name,
        'user_last_name':  profile.user.last_name,
        'user_email':      profile.user.email,
        'phone_number':    profile.phone_number,
        'institute':       profile.institute,
        'department':      profile.department,
        'position':        profile.position,
        'location':        profile.location,
        'state':           profile.state,
    }


def _comment_data(c):
    return {
        'id':           c.id,
        'comment':      c.comment,
        'author_name':  c.author.get_full_name() or c.author.username,
        'author_id':    c.author_id,
        'public':       c.public,
        'created_date': c.created_date.isoformat() if c.created_date else None,
    }


def _workshop_type_data(wt):
    attachments = AttachmentFile.objects.filter(workshop_type=wt)
    return {
        'id':                  wt.id,
        'name':                wt.name,
        'duration':            wt.duration,
        'description':         wt.description if hasattr(wt, 'description') else '',
        'terms_and_conditions': wt.terms_and_conditions,
        'attachments': [
            {'url': a.attachments.url, 'name': a.attachments.name.split('/')[-1]}
            for a in attachments
        ],
    }


# ─── Auth ─────────────────────────────────────────────────────────

def api_me(request):
    """Return current authenticated user info, or 401."""
    if not request.user.is_authenticated:
        return json_err('Not authenticated.', status=401)
    u = request.user
    return json_ok({
        'id':         u.id,
        'username':   u.username,
        'first_name': u.first_name,
        'last_name':  u.last_name,
        'email':      u.email,
        'position':   'instructor' if is_instructor(u) else 'coordinator',
    })


# ─── Workshops ─────────────────────────────────────────────────────

@login_required
def api_my_workshops(request):
    """Coordinator: their own workshops."""
    if is_instructor(request.user):
        return json_err('Not a coordinator.', status=403)
    ws = Workshop.objects.filter(coordinator=request.user).order_by('-date')
    return json_ok([_workshop_data(w) for w in ws])


@login_required
def api_instructor_workshops(request):
    """Instructor: accepted + pending list."""
    if not is_instructor(request.user):
        return json_err('Not an instructor.', status=403)
    today = timezone.now().date()
    ws = Workshop.objects.filter(
        Q(instructor=request.user, date__gte=today) | Q(status=0)
    ).order_by('-date')
    return json_ok([_workshop_data(w) for w in ws])


@login_required
def api_workshop_detail(request, workshop_id):
    try:
        w = Workshop.objects.get(id=workshop_id)
    except Workshop.DoesNotExist:
        return json_err('Not found.', status=404)
    return json_ok(_workshop_data(w))


@login_required
def api_workshop_comments(request, workshop_id):
    try:
        w = Workshop.objects.get(id=workshop_id)
    except Workshop.DoesNotExist:
        return json_err('Not found.', status=404)

    if request.method == 'POST':
        text   = request.POST.get('comment', '').strip()
        public = request.POST.get('public', '') == 'on'
        if not text:
            return json_err('Comment cannot be empty.')
        if not is_instructor(request.user):
            public = True   # coordinators always post publicly
        c = Comment.objects.create(
            comment=text,
            author=request.user,
            workshop=w,
            public=public,
            created_date=timezone.now(),
        )
        return json_ok(_comment_data(c), status=201)

    # GET
    qs = Comment.objects.filter(workshop=w)
    if not is_instructor(request.user):
        qs = qs.filter(public=True)
    return json_ok([_comment_data(c) for c in qs])


@login_required
def api_workshops_by_coordinator(request, user_id):
    if not is_instructor(request.user):
        return json_err('Forbidden.', status=403)
    ws = Workshop.objects.filter(coordinator_id=user_id).order_by('-date')
    return json_ok([_workshop_data(w) for w in ws])


# ─── Workshop Types ────────────────────────────────────────────────

def api_workshop_type_list(request):
    types = WorkshopType.objects.all().order_by('id')
    return json_ok([_workshop_type_data(wt) for wt in types])


def api_workshop_type_detail(request, pk):
    try:
        wt = WorkshopType.objects.get(id=pk)
    except WorkshopType.DoesNotExist:
        return json_err('Not found.', status=404)
    return json_ok(_workshop_type_data(wt))


# ─── Profiles ─────────────────────────────────────────────────────

@login_required
def api_own_profile(request):
    profile = request.user.profile
    if request.method == 'POST':
        for field in ['phone_number', 'institute', 'department', 'location', 'state']:
            val = request.POST.get(field)
            if val is not None:
                setattr(profile, field, val)
        profile.save()
        for fname in ['first_name', 'last_name']:
            val = request.POST.get(fname)
            if val:
                setattr(request.user, fname, val)
        request.user.save()
        return json_ok({'ok': True})
    return json_ok(_profile_data(profile))


@login_required
def api_profile_detail(request, user_id):
    if not is_instructor(request.user):
        return json_err('Forbidden.', status=403)
    try:
        profile = Profile.objects.get(user_id=user_id)
    except Profile.DoesNotExist:
        return json_err('Not found.', status=404)
    return json_ok(_profile_data(profile))
