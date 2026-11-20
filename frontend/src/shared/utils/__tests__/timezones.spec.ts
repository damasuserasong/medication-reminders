import {
  formatTimezoneDisplay,
  getTimezoneOptions,
  parseTimezoneOption,
} from '../timezones'

describe('timezone helpers', () => {
  it('formats IANA names into readable city and region labels without numeric offsets', () => {
    expect(formatTimezoneDisplay('Europe/London')).toBe('London, Europe')
    expect(formatTimezoneDisplay('America/New_York')).toBe('New York, America')
    expect(formatTimezoneDisplay('America/Argentina/Buenos_Aires')).toBe(
      'Buenos Aires (Argentina), America'
    )
  })

  it('excludes Etc/ raw-offset zones from selectable options', () => {
    const options = getTimezoneOptions()
    expect(options.length).toBeGreaterThan(20)
    expect(options.some((opt) => opt.value.startsWith('Etc/'))).toBe(false)
    expect(options.some((opt) => /[+-]\d{2}:\d{2}/.test(opt.label))).toBe(false)
  })

  it('builds searchable metadata for city and region names', () => {
    const opt = parseTimezoneOption('Africa/Lagos')
    expect(opt.city).toBe('Lagos')
    expect(opt.region).toBe('Africa')
    expect(opt.searchText).toContain('lagos')
    expect(opt.searchText).toContain('africa')
  })
})
