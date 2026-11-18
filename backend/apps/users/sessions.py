"""
Sign-in sessions.

A session is a refresh token held in an httpOnly cookie, plus a short-lived
access token the page keeps in memory. Two limits apply, both set in
``settings.AUTH_SESSION``:

* an absolute lifetime, counted from sign-in and never extended by use;
* an inactivity window, counted from the last time the session was renewed.

Every record of a session lives in the database (SimpleJWT's token
blacklist tables), so a deploy or restart signs nobody out.
"""

import time

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import datetime_from_epoch

LAST_ACTIVE_CLAIM = 'last_active'


def _config():
    return settings.AUTH_SESSION


def _now():
    return int(time.time())


def start_session(user, expires_at=None):
    """Create a refresh token for ``user``.

    ``expires_at`` (epoch seconds) carries the original sign-in deadline over
    to a renewed token, so renewing never extends the absolute lifetime.
    """
    token = RefreshToken.for_user(user)
    token[LAST_ACTIVE_CLAIM] = _now()
    if expires_at is not None:
        token.payload['exp'] = expires_at
        OutstandingToken.objects.filter(jti=token['jti']).update(
            expires_at=datetime_from_epoch(expires_at)
        )
    return token


def renew_session(raw_token):
    """Validate a refresh token and swap it for a fresh one.

    Raises ``TokenError`` if the token is invalid, revoked, past its absolute
    lifetime, idle for longer than the inactivity window, or belongs to a
    disabled or deleted account.
    """
    token = RefreshToken(raw_token)

    last_active = token.payload.get(LAST_ACTIVE_CLAIM)
    idle_limit = int(_config()['INACTIVITY_WINDOW'].total_seconds())
    if last_active is None or _now() - last_active > idle_limit:
        raise TokenError('Session has been inactive for too long.')

    user = get_user_model().objects.filter(
        pk=token[api_settings.USER_ID_CLAIM], is_active=True
    ).first()
    if user is None:
        raise TokenError('Account is not available.')

    renewed = start_session(user, expires_at=token['exp'])
    token.blacklist()
    return renewed


def end_session(raw_token):
    """Revoke one refresh token. Other sessions of the same user are untouched."""
    try:
        RefreshToken(raw_token).blacklist()
    except TokenError:
        pass


def end_all_sessions(user):
    """Revoke every session the user has, on every device."""
    for outstanding in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=outstanding)


def set_session_cookie(response, token):
    config = _config()
    response.set_cookie(
        config['COOKIE_NAME'],
        str(token),
        max_age=max(token['exp'] - _now(), 0),
        path=config['COOKIE_PATH'],
        secure=config['COOKIE_SECURE'],
        httponly=True,
        samesite=config['COOKIE_SAMESITE'],
    )


def clear_session_cookie(response):
    config = _config()
    response.delete_cookie(
        config['COOKIE_NAME'],
        path=config['COOKIE_PATH'],
        samesite=config['COOKIE_SAMESITE'],
    )


def read_session_cookie(request):
    return request.COOKIES.get(_config()['COOKIE_NAME'])
