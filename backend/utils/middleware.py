from django.utils.cache import patch_vary_headers


class NoStoreAuthenticatedResponsesMiddleware:
    """Prevent browsers and shared caches from storing private API responses.

    After a person signs out on a borrowed device, the back button and browser
    cache must not resurface their account or medication data.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        user = getattr(request, 'user', None)
        is_authenticated = bool(user and user.is_authenticated)
        if is_authenticated or request.path.startswith('/api/auth/'):
            response['Cache-Control'] = 'no-store'
            response['Pragma'] = 'no-cache'
            patch_vary_headers(response, ('Authorization', 'Cookie'))
        return response
