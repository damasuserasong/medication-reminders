from django.contrib import admin

from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('medicine_name', 'dose_amount', 'user', 'start_date', 'end_date')
    list_filter = ('start_date', 'end_date')
    search_fields = ('medicine_name', 'user__email')
