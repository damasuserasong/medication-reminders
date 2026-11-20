const me = {
  id: 1,
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: '',
  timezone: 'Europe/London',
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Route fetch calls by URL path; each entry is consumed in order. */
function mockFetch(routes: Record<string, Response[]>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const path = new URL(String(input)).pathname
    const next = routes[path]?.shift()
    if (!next) throw new Error(`Unexpected request to ${path}`)
    return next
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Load fresh modules (token memory included) with the "has signed in" hint set or not. */
async function load(signedInBefore: boolean) {
  vi.resetModules()
  localStorage.clear()
  if (signedInBefore) localStorage.setItem('auth.session', '1')
  const storage = await import('@/api/token-storage')
  const { queryClient } = await import('@/api/query-client')
  const { createAuthAdapter } = await import('../adapter')
  return { storage, queryClient, adapter: createAuthAdapter() }
}

function firstAuthState(adapter: { onAuthStateChanged: (cb: (u: unknown) => void) => unknown }) {
  return new Promise((resolve) => adapter.onAuthStateChanged(resolve))
}

describe('auth adapter session restore', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('restores the user and time zone from the refresh cookie after a reload', async () => {
    const fetchMock = mockFetch({
      '/api/auth/refresh/': [jsonResponse(200, { access: 'access-2' })],
      '/api/auth/me/': [jsonResponse(200, me)],
    })

    const { storage, adapter } = await load(true)
    const user = await firstAuthState(adapter)

    expect(user).toMatchObject({
      email: 'ada@example.com',
      displayName: 'Ada',
      timezone: 'Europe/London',
    })
    expect(storage.getAccessToken()).toBe('access-2')
    const refreshCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/refresh/'))
    expect(refreshCall?.[1]).toMatchObject({ method: 'POST', credentials: 'include' })
  })

  it('signs out and clears the hint when the session has ended', async () => {
    mockFetch({ '/api/auth/refresh/': [jsonResponse(401, { detail: 'ended' })] })

    const { storage, adapter } = await load(true)
    const user = await firstAuthState(adapter)

    expect(user).toBeNull()
    expect(storage.getAccessToken()).toBeNull()
    expect(storage.hasSessionHint()).toBe(false)
  })

  it('reports signed out without calling the API for a first-time visitor', async () => {
    const fetchMock = mockFetch({})

    const { adapter } = await load(false)
    const user = await firstAuthState(adapter)

    expect(user).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('auth adapter sign up', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function requestBody(fetchMock: ReturnType<typeof mockFetch>, path: string) {
    const call = fetchMock.mock.calls.find(([url]) => String(url).includes(path))
    return JSON.parse(String(call?.[1]?.body))
  }

  it('registers with email, password, and time zone (name optional)', async () => {
    const fetchMock = mockFetch({
      '/api/auth/register/': [jsonResponse(201, { access: 'access-1' })],
      '/api/auth/me/': [jsonResponse(200, { ...me, first_name: '' })],
    })

    const { adapter } = await load(false)
    const result = await adapter.signUpWithEmail(
      'ada@example.com',
      'Password123!',
      'Europe/London'
    )

    expect(result.success).toBe(true)
    expect(requestBody(fetchMock, '/register/')).toEqual({
      email: 'ada@example.com',
      password: 'Password123!',
      password_confirm: 'Password123!',
      timezone: 'Europe/London',
    })
  })

  it('sends the name when one is given', async () => {
    const fetchMock = mockFetch({
      '/api/auth/register/': [jsonResponse(201, { access: 'access-1' })],
      '/api/auth/me/': [jsonResponse(200, me)],
    })

    const { adapter } = await load(false)
    await adapter.signUpWithEmail('ada@example.com', 'Password123!', 'Europe/London', 'Ada')

    expect(requestBody(fetchMock, '/register/')).toMatchObject({
      first_name: 'Ada',
      timezone: 'Europe/London',
    })
  })

  it('signs the new person in and tells listeners who they are', async () => {
    mockFetch({
      '/api/auth/register/': [jsonResponse(201, { access: 'access-1' })],
      '/api/auth/me/': [jsonResponse(200, me)],
    })

    const { storage, adapter } = await load(false)
    const heard: unknown[] = []
    adapter.onAuthStateChanged((user) => heard.push(user))
    await adapter.signUpWithEmail('ada@example.com', 'Password123!', 'Europe/London', 'Ada')

    expect(storage.getAccessToken()).toBe('access-1')
    expect(heard.at(-1)).toMatchObject({
      email: 'ada@example.com',
      timezone: 'Europe/London',
    })
  })

  it('reports a duplicate address without signing anyone in', async () => {
    mockFetch({
      '/api/auth/register/': [
        jsonResponse(400, { email: ['That email is already registered.'] }),
      ],
    })

    const { storage, adapter } = await load(false)
    const result = await adapter.signUpWithEmail(
      'ada@example.com',
      'Password123!',
      'Europe/London'
    )

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('That email is already registered.')
    expect(storage.getAccessToken()).toBeNull()
  })
})

describe('auth adapter profile and sign out', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the access token in memory only, never the refresh token', async () => {
    mockFetch({
      '/api/auth/login/': [jsonResponse(200, { access: 'access-1' })],
      '/api/auth/me/': [jsonResponse(200, me)],
    })

    const { storage, adapter } = await load(false)
    const result = await adapter.signInWithEmail('ada@example.com', 'Password123!')

    expect(result.success).toBe(true)
    expect(storage.getAccessToken()).toBe('access-1')
    expect(Object.keys(localStorage)).toEqual(['auth.session'])
    expect(localStorage.getItem('auth.session')).toBe('1')
  })

  it('updates the user time zone and notifies listeners', async () => {
    mockFetch({
      '/api/auth/login/': [jsonResponse(200, { access: 'access-1' })],
      '/api/auth/me/': [
        jsonResponse(200, me),
        jsonResponse(200, { ...me, timezone: 'America/New_York' }),
      ],
    })

    const { adapter } = await load(false)
    await adapter.signInWithEmail('ada@example.com', 'Password123!')
    const result = await adapter.updateProfile({ timezone: 'America/New_York' })

    expect(result.success).toBe(true)
    expect(result.user?.timezone).toBe('America/New_York')
    expect(adapter.getCurrentUser()?.timezone).toBe('America/New_York')
  })

  it('shows the server message when sign-in fails', async () => {
    mockFetch({
      '/api/auth/login/': [
        jsonResponse(400, { non_field_errors: ['Invalid email or password.'] }),
      ],
    })

    const { adapter } = await load(false)
    const result = await adapter.signInWithEmail('ada@example.com', 'wrong')

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Invalid email or password.')
  })

  it('signs out by ending this device’s session and clearing cached query data', async () => {
    const fetchMock = mockFetch({
      '/api/auth/login/': [jsonResponse(200, { access: 'access-1' })],
      '/api/auth/me/': [jsonResponse(200, me)],
      '/api/auth/logout/': [jsonResponse(200, { detail: 'ok' })],
    })

    const { storage, queryClient, adapter } = await load(false)
    await adapter.signInWithEmail('ada@example.com', 'Password123!')
    queryClient.setQueryData(['courses'], [{ id: '1', medicine_name: 'Amoxicillin' }])

    await adapter.signOut()

    const logoutCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/logout/'))
    expect(logoutCall?.[1]).toMatchObject({ method: 'POST', credentials: 'include' })
    expect(storage.getAccessToken()).toBeNull()
    expect(storage.hasSessionHint()).toBe(false)
    expect(adapter.getCurrentUser()).toBeNull()
    expect(queryClient.getQueryData(['courses'])).toBeUndefined()
  })
})
