import pytest
from rest_framework import status

from apps.courses.models import Course

COURSES_URL = '/api/courses/'


@pytest.fixture
def course_payload():
    return {
        'medicine_name': 'Amoxicillin',
        'dose_amount': '1 capsule',
        'times_of_day': ['20:00', '08:00'],
        'start_date': '2026-11-20',
        'end_date': '2026-11-27',
        'notes': 'Take after food',
    }


@pytest.fixture
def course(db, user):
    return Course.objects.create(
        user=user,
        medicine_name='Amoxicillin',
        dose_amount='1 capsule',
        times_of_day=['08:00', '20:00'],
        start_date='2026-11-20',
        end_date='2026-11-27',
        notes='Take after food',
    )


class TestCourseCreate:
    def test_creates_course_with_end_date_and_sorts_times(self, auth_client, course_payload):
        response = auth_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['medicine_name'] == 'Amoxicillin'
        assert response.data['dose_amount'] == '1 capsule'
        assert response.data['times_of_day'] == ['08:00', '20:00']
        assert response.data['start_date'] == '2026-11-20'
        assert response.data['end_date'] == '2026-11-27'
        assert response['Cache-Control'] == 'no-store'

    def test_creates_ongoing_course_without_end_date(self, auth_client, course_payload):
        course_payload['end_date'] = None

        response = auth_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['end_date'] is None

    def test_deduplicates_times_of_day(self, auth_client, course_payload):
        course_payload['times_of_day'] = ['08:00', '20:00', '08:00']

        response = auth_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['times_of_day'] == ['08:00', '20:00']

    def test_rejects_empty_times_of_day(self, auth_client, course_payload):
        course_payload['times_of_day'] = []

        response = auth_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'times_of_day' in response.data

    @pytest.mark.parametrize('bad_time', ['8:00', '25:00', '12:60', 'morning', ''])
    def test_rejects_invalid_time_format(self, auth_client, course_payload, bad_time):
        course_payload['times_of_day'] = [bad_time]

        response = auth_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'times_of_day' in response.data

    def test_rejects_end_date_before_start_date(self, auth_client, course_payload):
        course_payload['end_date'] = '2026-11-19'

        response = auth_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'end_date' in response.data

    def test_rejects_blank_medicine_or_dose(self, auth_client, course_payload):
        course_payload['medicine_name'] = '   '
        course_payload['dose_amount'] = ''

        response = auth_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'medicine_name' in response.data
        assert 'dose_amount' in response.data

    def test_requires_authentication(self, api_client, course_payload, db):
        response = api_client.post(COURSES_URL, course_payload, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCourseAccessAndMutation:
    def test_lists_only_own_courses(self, auth_client, course, other_user):
        Course.objects.create(
            user=other_user,
            medicine_name='Metformin',
            dose_amount='500 mg',
            times_of_day=['09:00'],
            start_date='2026-11-20',
        )

        response = auth_client.get(COURSES_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response['Cache-Control'] == 'no-store'
        names = [item['medicine_name'] for item in response.data['results']]
        assert names == ['Amoxicillin']

    def test_updates_own_course(self, auth_client, course):
        response = auth_client.patch(
            f'{COURSES_URL}{course.id}/',
            {'dose_amount': '2 capsules', 'end_date': None},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['dose_amount'] == '2 capsules'
        assert response.data['end_date'] is None

    def test_partial_update_still_checks_end_date_against_existing_start_date(
        self, auth_client, course
    ):
        response = auth_client.patch(
            f'{COURSES_URL}{course.id}/',
            {'end_date': '2026-11-10'},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'end_date' in response.data

    def test_deletes_own_course(self, auth_client, course):
        response = auth_client.delete(f'{COURSES_URL}{course.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Course.objects.filter(pk=course.pk).exists()

    def test_cannot_access_another_users_course(self, api_client, course, other_user):
        api_client.force_authenticate(user=other_user)

        assert api_client.get(f'{COURSES_URL}{course.id}/').status_code == status.HTTP_404_NOT_FOUND
        assert (
            api_client.patch(f'{COURSES_URL}{course.id}/', {'dose_amount': '99'}).status_code
            == status.HTTP_404_NOT_FOUND
        )
        assert (
            api_client.delete(f'{COURSES_URL}{course.id}/').status_code
            == status.HTTP_404_NOT_FOUND
        )
