from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Course
from .serializers import CourseSerializer


@extend_schema_view(
    list=extend_schema(tags=['courses'], description='List all medicine courses for the signed-in user.'),
    create=extend_schema(tags=['courses'], description='Record a new medicine course.'),
    retrieve=extend_schema(tags=['courses'], description='Retrieve a single medicine course.'),
    partial_update=extend_schema(tags=['courses'], description='Update fields on a medicine course.'),
    update=extend_schema(tags=['courses'], description='Replace a medicine course.'),
    destroy=extend_schema(tags=['courses'], description='Delete a medicine course.'),
)
class CourseViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for the authenticated user's medication courses."""

    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Course.objects.none()
        return Course.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
