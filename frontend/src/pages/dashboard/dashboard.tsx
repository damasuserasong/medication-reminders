import { useState } from 'react'
import { Button, HStack, Separator, Stack, Text } from '@chakra-ui/react'
import { Plus } from 'lucide-react'
import {
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourse,
  type Course,
  type CourseInput,
} from '@/api/hooks/use-courses'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { displayName } from '@/features/auth/utils/display-name'
import { CourseCard } from '@/features/courses/components/course-card'
import { CourseForm } from '@/features/courses/components/course-form'
import { Path } from '@/router/paths'
import { LoadingSpinner } from '@/shared/components/loading-spinner'
import { PageHeader } from '@/shared/components/page-header'
import { StatusAlert } from '@/shared/components/status-alert'
import { RouterLink } from '@/shared/components/ui/router-link'
import { formatTimezoneDisplay } from '@/shared/utils/timezones'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: courses = [], isLoading, error } = useCourses()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async (payload: CourseInput) => {
    setFormError(null)
    try {
      await createCourse.mutateAsync(payload)
      setAdding(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save course.')
    }
  }

  const handleUpdate = async (payload: CourseInput) => {
    if (!editing) return
    setFormError(null)
    try {
      await updateCourse.mutateAsync({ id: editing.id, payload })
      setEditing(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not update course.')
    }
  }

  const handleDelete = async (id: string) => {
    await deleteCourse.mutateAsync(id)
  }

  const place = formatTimezoneDisplay(user?.timezone)
  const greeting = user?.displayName
    ? `Welcome back, ${displayName(user, 'there')}. Signed in as ${user.email}.`
    : `Signed in as ${user?.email ?? 'your account'}.`

  return (
    <Stack gap="6">
      <HStack justify="space-between" align="end" wrap="wrap" gap="4">
        <PageHeader title="Medicine courses" description={greeting} />
        {!adding && !editing && (
          <Button
            onClick={() => {
              setFormError(null)
              setAdding(true)
            }}
          >
            <Plus size={16} />
            Add course
          </Button>
        )}
      </HStack>

      <Text textStyle="sm" color="fg.muted">
        {place ? `Times are shown on your local clock (${place}). ` : ''}
        <RouterLink to={Path.Account} color="fg" fontWeight="medium">
          Change time zone
        </RouterLink>
      </Text>

      <Separator />

      {adding && (
        <CourseForm
          submitting={createCourse.isPending}
          errorMessage={formError}
          onSubmit={handleCreate}
          onCancel={() => {
            setAdding(false)
            setFormError(null)
          }}
        />
      )}

      {editing && (
        <CourseForm
          key={editing.id}
          initial={editing}
          submitting={updateCourse.isPending}
          errorMessage={formError}
          onSubmit={handleUpdate}
          onCancel={() => {
            setEditing(null)
            setFormError(null)
          }}
        />
      )}

      {error && (
        <StatusAlert
          status="error"
          title="Could not load courses"
          message={error instanceof Error ? error.message : 'Please try again.'}
        />
      )}

      {isLoading ? (
        <LoadingSpinner size="md" minH="30vh" />
      ) : courses.length === 0 && !adding ? (
        <Stack
          gap="3"
          align="start"
          p="6"
          borderWidth="1px"
          borderRadius="lg"
          borderStyle="dashed"
        >
          <Text fontWeight="medium">No medicine courses yet</Text>
          <Text textStyle="sm" color="fg.muted">
            Record what you take, the amount, the times of day, and when the course starts and ends.
          </Text>
          <Button
            size="sm"
            onClick={() => {
              setFormError(null)
              setAdding(true)
            }}
          >
            <Plus size={14} />
            Add your first course
          </Button>
        </Stack>
      ) : (
        <Stack gap="4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              deleting={deleteCourse.isPending && deleteCourse.variables === course.id}
              onEdit={(item) => {
                setAdding(false)
                setFormError(null)
                setEditing(item)
              }}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
