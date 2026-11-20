import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Field,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { Plus, Trash2 } from 'lucide-react'
import type { Course, CourseInput } from '@/api/hooks/use-courses'
import { StatusAlert } from '@/shared/components/status-alert'

interface CourseFormProps {
  initial?: Course | null
  submitting?: boolean
  errorMessage?: string | null
  onSubmit: (payload: CourseInput) => Promise<void>
  onCancel?: () => void
}

function todayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function CourseForm({
  initial,
  submitting = false,
  errorMessage,
  onSubmit,
  onCancel,
}: CourseFormProps) {
  const [medicineName, setMedicineName] = useState(initial?.medicine_name ?? '')
  const [doseAmount, setDoseAmount] = useState(initial?.dose_amount ?? '')
  const [timesOfDay, setTimesOfDay] = useState<string[]>(
    initial?.times_of_day?.length ? initial.times_of_day : ['08:00']
  )
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayLocalDate())
  const [ongoing, setOngoing] = useState(initial ? initial.end_date === null : false)
  const [endDate, setEndDate] = useState(initial?.end_date ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleTimeChange = (index: number, value: string) => {
    setTimesOfDay((prev) => prev.map((item, idx) => (idx === index ? value : item)))
  }

  const handleAddTime = () => {
    setTimesOfDay((prev) => [...prev, '20:00'])
  }

  const handleRemoveTime = (index: number) => {
    setTimesOfDay((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const validTimes = timesOfDay.map((t) => t.trim()).filter(Boolean)
    if (validTimes.length === 0) {
      setLocalError('Add at least one time of day.')
      return
    }
    if (!ongoing && endDate && endDate < startDate) {
      setLocalError('Last day cannot be before the first day.')
      return
    }

    await onSubmit({
      medicine_name: medicineName.trim(),
      dose_amount: doseAmount.trim(),
      times_of_day: validTimes,
      start_date: startDate,
      end_date: ongoing || !endDate ? null : endDate,
      notes: notes.trim(),
    })
  }

  const displayError = localError || errorMessage

  return (
    <Card.Root>
      <Card.Body>
        <form onSubmit={handleSubmit}>
          <Stack gap="4">
            <Text textStyle="lg" fontWeight="semibold">
              {initial ? 'Edit medicine course' : 'Add a medicine course'}
            </Text>

            {displayError && (
              <StatusAlert status="error" title="Check your course details" message={displayError} />
            )}

            <Stack direction={{ base: 'column', sm: 'row' }} gap="4">
              <Field.Root required>
                <Field.Label>Medicine name</Field.Label>
                <Input
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Amoxicillin"
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Amount per dose</Field.Label>
                <Input
                  value={doseAmount}
                  onChange={(e) => setDoseAmount(e.target.value)}
                  placeholder="e.g. 1 tablet, 5 ml"
                />
              </Field.Root>
            </Stack>

            <Field.Root required>
              <Field.Label>Times of day (your local clock)</Field.Label>
              <Stack gap="2" w="full">
                {timesOfDay.map((time, index) => (
                  <HStack key={index} gap="2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      required
                      maxW="44"
                      aria-label={`Dose time ${index + 1}`}
                    />
                    {timesOfDay.length > 1 && (
                      <IconButton
                        type="button"
                        aria-label={`Remove time ${time || index + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTime(index)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    )}
                  </HStack>
                ))}
                <Box>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTime}>
                    <Plus size={14} />
                    Add another time
                  </Button>
                </Box>
              </Stack>
            </Field.Root>

            <Stack direction={{ base: 'column', sm: 'row' }} gap="4" align="start">
              <Field.Root required>
                <Field.Label>First day</Field.Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field.Root>

              <Stack gap="2" w="full">
                <Field.Root>
                  <Field.Label>Last day</Field.Label>
                  <Input
                    type="date"
                    value={ongoing ? '' : endDate}
                    min={startDate}
                    disabled={ongoing}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Field.Root>
                <Checkbox.Root
                  checked={ongoing}
                  onCheckedChange={(details) => {
                    const isOngoing = Boolean(details.checked)
                    setOngoing(isOngoing)
                    if (isOngoing) setEndDate('')
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>Ongoing (no last day)</Checkbox.Label>
                </Checkbox.Root>
              </Stack>
            </Stack>

            <Field.Root>
              <Field.Label>
                Notes{' '}
                <Text as="span" color="fg.muted" fontWeight="normal">
                  (optional)
                </Text>
              </Field.Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Take with food"
              />
            </Field.Root>

            <HStack justify="flex-end" gap="3" pt="2">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" loading={submitting}>
                {initial ? 'Save changes' : 'Save course'}
              </Button>
            </HStack>
          </Stack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}
