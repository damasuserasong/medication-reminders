from rest_framework import serializers

from .models import Course, TIME_OF_DAY_RE


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for creating, listing, and updating medication courses."""

    medicine_name = serializers.CharField(max_length=200, allow_blank=False, trim_whitespace=True)
    dose_amount = serializers.CharField(max_length=100, allow_blank=False, trim_whitespace=True)
    times_of_day = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False,
    )
    start_date = serializers.DateField()
    end_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Course
        fields = [
            'id',
            'medicine_name',
            'dose_amount',
            'times_of_day',
            'start_date',
            'end_date',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_times_of_day(self, value):
        cleaned = []
        for item in value:
            time_str = item.strip()
            if not TIME_OF_DAY_RE.match(time_str):
                raise serializers.ValidationError(
                    'Each time of day must use 24-hour HH:MM format (for example, 08:00).'
                )
            cleaned.append(time_str)
        return sorted(set(cleaned))

    def validate(self, attrs):
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if end_date is not None and start_date is not None and end_date < start_date:
            raise serializers.ValidationError(
                {'end_date': 'Last day cannot be before the first day.'}
            )
        return attrs
