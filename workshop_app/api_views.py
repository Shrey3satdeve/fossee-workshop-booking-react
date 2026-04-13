"""
api_views.py  (updated)
=======================
JSON API layer for the React frontend.

Changes in this update:
- Added api_register: handles coordinator signup, sends activation email, returns JSON
- Added api_login: authenticates, checks email verification, returns JSON
- Added api_logout: clears session, returns JSON
- All other existing endpoints unchanged
"""

from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Q
from django.utils import timezone
from datetime import date as date_type

from .models import Profile, User, Workshop, WorkshopType, Comment, AttachmentFile
from .views  import is_instructor, is_email_checked
from .forms  import UserRegistrationForm, UserLoginForm
from .send_mails import send_email


# ─── helpers ─────────────────────────────────────────────────────

def json_ok(data, status=200):
    return JsonResponse(data, safe=isinstance(data, dict), status=status)

def json_err(msg, status=400):
    return JsonResponse({'error': msg}, status=status)


def _workshop_data(w):
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
        'description':         getattr(wt, 'description', ''),
        'terms_and_conditions': wt.terms_and_conditions,
        'attachments': [
            {'url': a.attachments.url, 'name': a.attachments.name.split('/')[-1]}
            for a in attachments
        ],
    }


# ─── Auth ─────────────────────────────────────────────────────────

@ensure_csrf_cookie
def api_csrf(request):
    """GET this endpoint to set the csrftoken cookie before any POST."""
    return json_ok({'detail': 'CSRF cookie set.'})


def api_me(request):
    """Return current authenticated user info, or 401."""
    if not request.user.is_authenticated:
        return json_err('Not authenticated.', status=401)
    u = request.user
    return json_ok({
        'id':              u.id,
        'username':        u.username,
        'first_name':      u.first_name,
        'last_name':       u.last_name,
        'email':           u.email,
        'position':        'instructor' if is_instructor(u) else 'coordinator',
        'email_verified':  is_email_checked(u),
    })


@require_POST
def api_login(request):
    """Authenticate user and start a session. Returns user info or error."""
    form = UserLoginForm(request.POST)
    if form.is_valid():
        user = form.cleaned_data
        if not user.profile.is_email_verified:
            return json_err(
                'Your email address is not verified. '
                'Please check your inbox for the activation link.',
                status=403
            )
        login(request, user)
        return json_ok({
            'id':         user.id,
            'username':   user.username,
            'first_name': user.first_name,
            'last_name':  user.last_name,
            'email':      user.email,
            'position':   'instructor' if is_instructor(user) else 'coordinator',
        })
    # Collect form errors into a readable string
    errors = []
    for field, msgs in form.errors.items():
        errors.extend(msgs)
    return json_err(' '.join(errors) or 'Invalid username or password.', status=401)


@require_POST
def api_logout(request):
    logout(request)
    return json_ok({'detail': 'Logged out.'})


@require_POST
def api_register(request):
    """Register a new coordinator and send the activation email."""
    form = UserRegistrationForm(request.POST)
    if form.is_valid():
        username, password, key = form.save()
        new_user = authenticate(username=username, password=password)
        if new_user:
            login(request, new_user)
            try:
                send_email(
                    request,
                    call_on='Registration',
                    user_position=new_user.profile.position,
                    key=key,
                )
            except Exception as e:
                # Email failure should NOT block registration success
                print(f'[api_register] Email send failed: {e}')
        return json_ok({'detail': 'Registration successful. Activation email sent.'}, status=201)

    # Return human-readable form errors
    errors = {}
    for field, msgs in form.errors.items():
        errors[field] = ' '.join(msgs)
    return JsonResponse({'errors': errors}, status=400)


# ─── Workshops ─────────────────────────────────────────────────────

@login_required
def api_my_workshops(request):
    if is_instructor(request.user):
        return json_err('Not a coordinator.', status=403)
    ws = Workshop.objects.filter(coordinator=request.user).order_by('-date')
    return json_ok([_workshop_data(w) for w in ws])


@login_required
def api_instructor_workshops(request):
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
            public = True
        c = Comment.objects.create(
            comment=text,
            author=request.user,
            workshop=w,
            public=public,
            created_date=timezone.now(),
        )
        return json_ok(_comment_data(c), status=201)

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


# ─── Propose Workshop ──────────────────────────────────────────────

@login_required
@require_POST
def api_propose_workshop(request):
    """
    Coordinator proposes a workshop. Mirrors the Django propose_workshop view.
    POST params: workshop_type (id), date (YYYY-MM-DD), tnc_accepted (on)
    """
    user = request.user
    if is_instructor(user):
        return json_err('Instructors cannot propose workshops.', status=403)

    # Validate workshop type
    wt_id = request.POST.get('workshop_type', '').strip()
    if not wt_id:
        return json_err('Please select a workshop type.')
    try:
        workshop_type = WorkshopType.objects.get(id=int(wt_id))
    except (WorkshopType.DoesNotExist, ValueError):
        return json_err('Invalid workshop type.')

    # Validate date
    raw_date = request.POST.get('date', '').strip()
    if not raw_date:
        return json_err('Please select a workshop date.')
    try:
        from datetime import date as _date, timedelta
        ws_date = _date.fromisoformat(raw_date)
    except ValueError:
        return json_err('Invalid date format. Use YYYY-MM-DD.')

    min_date = timezone.now().date() + timezone.timedelta(days=3)
    if ws_date < min_date:
        return json_err(f'Workshop date must be at least 3 days from today (earliest: {min_date}).')

    # Validate T&C
    if request.POST.get('tnc_accepted') != 'on':
        return json_err('You must accept the terms and conditions.')

    # Deduplicate
    if Workshop.objects.filter(
        date=ws_date,
        workshop_type=workshop_type,
        coordinator=user
    ).exists():
        return json_err('You have already proposed this workshop type on that date.')

    # Create workshop
    workshop = Workshop.objects.create(
        workshop_type=workshop_type,
        date=ws_date,
        coordinator=user,
        tnc_accepted=True,
        status=0,           # pending
    )

    # Email every instructor
    instructors = Profile.objects.filter(position='instructor')
    for inst in instructors:
        try:
            send_email(
                request,
                call_on='Proposed Workshop',
                user_position='instructor',
                workshop_date=str(ws_date),
                workshop_title=str(workshop_type),
                user_name=user.get_full_name(),
                other_email=inst.user.email,
                phone_number=user.profile.phone_number,
                institute=user.profile.institute,
            )
        except Exception as e:
            print(f'[api_propose_workshop] Email to {inst.user.email} failed: {e}')

    return json_ok({
        'detail':      'Workshop proposed successfully.',
        'workshop_id': workshop.id,
    }, status=201)

