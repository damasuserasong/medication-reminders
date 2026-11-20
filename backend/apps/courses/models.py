import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from utils.models import BaseModel

TIME_OF_DAY_RE = re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')


def validate_times_of_day(value):
    """Ensure times_of_day is a non-empty list of 24-hour HH:MM local wall-clock times."""
    if not isinstance(value, list) or len(value) == 0:
        raise ValidationError('Add at least one time of day (for example, 08:00).')
    for item in value:
        if not isinstance(item, str) or not TIME_OF_DAY_RE.match(item):
            raise ValidationError(
                'Each time of day must use 24-hour HH:MM format (for example, 08:00).'
            )


class Course(BaseModel):
    """A medicine taken on a set daily pattern over a date range (or ongoing).

    Times of day are stored as local wall-clock HH:MM strings rather than UTC
    timestamps so a dose at "08:00" stays at 08:00 on the person's own clock
    across daylight-saving changes.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses',
    )
    medicine_name = models.CharField(max_length=200)
    dose_amount = models.CharField(max_length=100)
    times_of_day = models.JSONField(validators=[validate_times_of_day])
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        super().clean()
        if self.end_date is not None and self.start_date is not None:
            if self.end_date < self.start_date:
                raise ValidationError(
                    {'end_date': 'Last day cannot be before the first day.'}
                )

    def __str__(self):
        return f'{self.medicine_name} ({self.dose_amount})'
