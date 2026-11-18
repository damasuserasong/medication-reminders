from urllib.parse import urlsplit

from django.conf import settings
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission


def _origin_of(url):
    parts = urlsplit(url)
    return f'{parts.scheme}://{parts.netloc}' if parts.scheme and parts.netloc else None


class TrustedOrigin(BasePermission):
    """Refuse requests that a page on another site started.

    The session cookie is sent by the browser on its own, so the cookie alone
    cannot tell a request from our pages from one forged by another site.
    Browsers state where a POST came from in the ``Origin`` header (or, failing
    that, ``Referer``); it must be this server or a configured front end.
    Requests with neither header are not from a browser page, and are allowed.
    """

    message = 'This request came from an origin that is not allowed.'

    def has_permission(self, request, view):
        origin = request.META.get('HTTP_ORIGIN')
        if origin is None:
            referer = request.META.get('HTTP_REFERER')
            if not referer:
                return True
            origin = _origin_of(referer)

        trusted = set(settings.AUTH_SESSION['TRUSTED_ORIGINS'])
        trusted.add(f'{request.scheme}://{request.get_host()}')
        if origin not in trusted:
            # Raised, not returned, so the answer is 403 and not the 401
            # DRF would pick for a request that carries no credentials.
            raise PermissionDenied(self.message)
        return True
