/**
 * Time zone helpers.
 *
 * The app always stores IANA time zone names (for example, "Europe/London")
 * and presents places by human-readable city and region names — never raw
 * numeric offsets like "+01:00".
 */

export interface TimezoneOption {
  value: string
  city: string
  region: string
  label: string
  searchText: string
}

const FALLBACK_TIMEZONES = [
  'Africa/Accra',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]

function humanizeSegment(segment: string): string {
  return segment.replace(/_/g, ' ')
}

export function parseTimezoneOption(iana: string): TimezoneOption {
  const parts = iana.split('/')
  const region = humanizeSegment(parts[0] ?? iana)
  const lastSegment = parts[parts.length - 1] ?? iana
  const middleSegment = parts[1] ?? ''
  const city =
    parts.length > 2
      ? `${humanizeSegment(lastSegment)} (${humanizeSegment(middleSegment)})`
      : humanizeSegment(lastSegment)
  const label = parts.length > 1 ? `${city}, ${region}` : city
  return {
    value: iana,
    city,
    region,
    label,
    searchText: `${city} ${region} ${iana}`.toLowerCase(),
  }
}

export function formatTimezoneDisplay(iana: string | null | undefined): string {
  if (!iana) return ''
  return parseTimezoneOption(iana).label
}

function rawSupportedTimezones(): string[] {
  const intlWithSupported = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[]
  }
  if (typeof intlWithSupported.supportedValuesOf === 'function') {
    try {
      const list = intlWithSupported.supportedValuesOf('timeZone')
      if (list.length > 0) return list
    } catch {
      // Fall back to curated list when unsupported.
    }
  }
  return FALLBACK_TIMEZONES
}

let cachedOptions: TimezoneOption[] | null = null

/**
 * Returns all selectable places sorted by city name, excluding `Etc/*`
 * raw-offset entries so numeric offsets never appear on screen.
 */
export function getTimezoneOptions(): TimezoneOption[] {
  if (cachedOptions) return cachedOptions
  const zones = rawSupportedTimezones().filter(
    (tz) => tz.includes('/') && !tz.startsWith('Etc/')
  )
  cachedOptions = zones
    .map(parseTimezoneOption)
    .sort((a, b) => a.city.localeCompare(b.city))
  return cachedOptions
}

/**
 * Ask the browser for its current IANA time zone name as a default guess.
 * Returns null if the browser reports an offset-style or unusable value.
 */
export function detectBrowserTimezone(): string | null {
  try {
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!guessed || !guessed.includes('/') || guessed.startsWith('Etc/')) {
      return null
    }
    return guessed
  } catch {
    return null
  }
}
