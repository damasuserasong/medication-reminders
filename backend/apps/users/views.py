from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema

from . import sessions
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    TokenSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


def _session_response(user, response_status=status.HTTP_200_OK, token=None):
    """An access token in the body, the refresh token in an httpOnly cookie."""
    token = token or sessions.start_session(user)
    response = Response({'access': str(token.access_token)}, status=response_status)
    sessions.set_session_cookie(response, token)
    return response


class AuthViewSet(ViewSet):
    """Authentication endpoints for the application."""

    @extend_schema(
        request=LoginSerializer,
        responses={200: TokenSerializer},
        description='Authenticate with email and password. Returns an access token and sets the refresh-token cookie.',
        tags=['auth'],
    )
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return _session_response(serializer.validated_data['user'])

    @extend_schema(
        request=RegisterSerializer,
        responses={201: TokenSerializer},
        description='Create a new user account and sign it in. Returns an access token and sets the refresh-token cookie.',
        tags=['auth'],
    )
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return _session_response(user, status.HTTP_201_CREATED)

    @extend_schema(
        request=None,
        responses={200: UserSerializer},
        description='Get or update the current authenticated user profile.',
        tags=['auth'],
    )
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)

        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(
        request=ChangePasswordSerializer,
        responses={200: TokenSerializer},
        description='Change the current user password. Ends all sessions and starts a new one on this device.',
        tags=['auth'],
    )
    @action(
        detail=False,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        url_path='change-password',
    )
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        # A new password ends every session, on every device. This device
        # is signed straight back in so the person is not thrown out.
        sessions.end_all_sessions(request.user)
        return _session_response(request.user)

    @extend_schema(
        request=ForgotPasswordSerializer,
        responses={200: None},
        description='Request a password reset email.',
        tags=['auth'],
    )
    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        url_path='forgot-password',
    )
    def forgot_password(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # TODO: Implement email sending logic
        # Always return success to prevent email enumeration
        return Response({'detail': 'If an account exists, a reset email has been sent.'})

    @extend_schema(
        request=ResetPasswordSerializer,
        responses={200: None},
        description='Reset password using a token from the reset email.',
        tags=['auth'],
    )
    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        url_path='reset-password',
    )
    def reset_password(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # TODO: Implement token verification and password reset
        return Response({'detail': 'Password has been reset successfully.'})

    @extend_schema(
        request=None,
        responses={200: None},
        description='Sign out this device: revokes its refresh token and clears the cookie. Other sessions are untouched.',
        tags=['auth'],
    )
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def logout(self, request):
        raw_token = sessions.read_session_cookie(request)
        if raw_token:
            sessions.end_session(raw_token)
        response = Response({'detail': 'Successfully logged out.'})
        sessions.clear_session_cookie(response)
        return response

    @extend_schema(
        request=None,
        responses={200: TokenSerializer},
        description='Renew the session from the refresh-token cookie. Returns a new access token and replaces the cookie.',
        tags=['auth'],
    )
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def refresh(self, request):
        raw_token = sessions.read_session_cookie(request)
        try:
            if not raw_token:
                raise TokenError('No session.')
            renewed = sessions.renew_session(raw_token)
        except TokenError:
            response = Response(
                {'detail': 'Your session has ended. Please sign in again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            sessions.clear_session_cookie(response)
            return response
        return _session_response(None, token=renewed)
