from zoneinfo import available_timezones

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from .managers import CustomUserManager


def validate_timezone(value):
    """Ensure the value is a non-empty IANA time zone name (e.g. Europe/London)."""
    if not isinstance(value, str) or not value.strip() or value not in available_timezones():
        raise ValidationError('Choose a valid time zone (for example, Europe/London).')


class CustomUser(AbstractUser):
    """Custom user model with email as the primary identifier."""

    username = None
    email = models.EmailField('email address', unique=True)
    first_name = models.CharField('first name', max_length=150)
    last_name = models.CharField('last name', max_length=150, blank=True)
    timezone = models.CharField(
        'time zone',
        max_length=64,
        validators=[validate_timezone],
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    objects = CustomUserManager()

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email
