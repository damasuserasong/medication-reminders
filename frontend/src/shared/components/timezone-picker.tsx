import { useMemo, useState } from 'react'
import { Box, Field, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'
import {
  formatTimezoneDisplay,
  getTimezoneOptions,
  parseTimezoneOption,
} from '@/shared/utils/timezones'

interface TimezonePickerProps {
  value: string
  onChange: (timezone: string) => void
  detectedTimezone?: string | null
  label?: string
  required?: boolean
  id?: string
}

/**
 * Lets a person confirm the browser's detected place or pick another place by
 * city/region name. Never displays raw UTC offsets.
 */
export function TimezonePicker({
  value,
  onChange,
  detectedTimezone,
  label = 'Where you live (time zone)',
  required = true,
  id = 'timezone-picker',
}: TimezonePickerProps) {
  const [query, setQuery] = useState('')

  const allOptions = useMemo(() => {
    const base = getTimezoneOptions()
    if (value && !base.some((opt) => opt.value === value)) {
      return [parseTimezoneOption(value), ...base]
    }
    return base
  }, [value])

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return allOptions
    const matches = allOptions.filter((opt) => opt.searchText.includes(term))
    if (value && !matches.some((opt) => opt.value === value)) {
      const selected = allOptions.find((opt) => opt.value === value)
      if (selected) return [selected, ...matches]
    }
    return matches
  }, [allOptions, query, value])

  const isDetectedGuess = Boolean(detectedTimezone && value === detectedTimezone)

  return (
    <Field.Root required={required}>
      <Field.Label htmlFor={id}>{label}</Field.Label>
      <Stack gap="2" w="full">
        <Input
          size="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by city or region (e.g. London, Lagos, New York)"
          aria-label="Filter places by city or region"
        />
        <NativeSelect.Root>
          <NativeSelect.Field
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>
              Select your city or region
            </option>
            {filteredOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {isDetectedGuess ? (
          <Box>
            <Text textStyle="xs" color="fg.muted">
              We guessed {formatTimezoneDisplay(detectedTimezone)} from your device. Change it
              above if you live somewhere else.
            </Text>
          </Box>
        ) : (
          <Text textStyle="xs" color="fg.muted">
            Used so your reminders stay at your local hour even when the clocks change.
          </Text>
        )}
      </Stack>
    </Field.Root>
  )
}
