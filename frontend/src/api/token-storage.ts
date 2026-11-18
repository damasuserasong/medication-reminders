/**
 * Session storage
 *
 * The refresh token lives in an httpOnly cookie that scripts cannot read, so
 * it is not handled here. The short-lived access token is held in memory
 * only: a reload drops it, and the page gets a new one from the cookie.
 *
 * `localStorage` keeps one non-secret hint, "this browser has signed in", so
 * a first-time visitor is shown the sign-in page without a pointless call to
 * the API. It grants nothing; the cookie is what proves a session.
 */

const SESSION_HINT_KEY = 'auth.session'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string) {
  accessToken = token
  localStorage.setItem(SESSION_HINT_KEY, '1')
}

export function hasSessionHint(): boolean {
  return localStorage.getItem(SESSION_HINT_KEY) === '1'
}

export function clearTokens() {
  accessToken = null
  localStorage.removeItem(SESSION_HINT_KEY)
}
