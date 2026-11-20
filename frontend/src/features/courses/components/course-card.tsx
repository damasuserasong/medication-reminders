import { useState } from 'react'
import { Badge, Button, Card, HStack, Stack, Text } from '@chakra-ui/react'
import { Calendar, Clock, Pencil, Trash2 } from 'lucide-react'
import type { Course } from '@/api/hooks/use-courses'

interface CourseCardProps {
  course: Course
  deleting?: boolean
  onEdit: (course: Course) => void
  onDelete: (id: string) => void
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function CourseCard({ course, deleting = false, onEdit, onDelete }: CourseCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const dateRange = course.end_date
    ? `${formatDate(course.start_date)} – ${formatDate(course.end_date)}`
    : `From ${formatDate(course.start_date)} · Ongoing`

  return (
    <Card.Root>
      <Card.Body>
        <Stack gap="3">
          <HStack justify="space-between" align="start" wrap="wrap" gap="2">
            <Stack gap="0.5">
              <Text textStyle="lg" fontWeight="semibold">
                {course.medicine_name}
              </Text>
              <Text textStyle="sm" color="fg.muted">
                {course.dose_amount}
              </Text>
            </Stack>

            <HStack gap="2">
              {confirmingDelete ? (
                <>
                  <Button
                    size="xs"
                    colorPalette="red"
                    loading={deleting}
                    onClick={() => onDelete(course.id)}
                  >
                    Confirm delete
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="xs" variant="outline" onClick={() => onEdit(course)}>
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </>
              )}
            </HStack>
          </HStack>

          <HStack gap="2" wrap="wrap">
            <Clock size={14} />
            {course.times_of_day.map((time) => (
              <Badge key={time} variant="subtle" size="md">
                {time}
              </Badge>
            ))}
          </HStack>

          <HStack gap="2" color="fg.muted" textStyle="sm">
            <Calendar size={14} />
            <Text>{dateRange}</Text>
          </HStack>

          {course.notes && (
            <Text textStyle="sm" color="fg.muted">
              {course.notes}
            </Text>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
