export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string | null
  timezone: string
  photoURL: string | null
  emailVerified: boolean
  providerId: string
}

export interface AuthError {
  code: string
  message: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: AuthError
}

export type SocialProvider = 'google' | 'github' | 'facebook' | 'apple'

/** The user as `/api/auth/me/` returns it. */
export interface ApiUser {
  id: number | string
  email: string
  first_name?: string
  last_name?: string
  timezone: string
}

/** Fields editable on `/api/auth/me/`. */
export interface ProfileUpdate {
  first_name?: string
  last_name?: string
  timezone?: string
}

/** What login, register and refresh return. The refresh token is an httpOnly cookie. */
export interface AccessToken {
  access: string
}

export interface AuthAdapter {
  signInWithEmail(email: string, password: string): Promise<AuthResult>
  signUpWithEmail(
    email: string,
    password: string,
    timezone: string,
    displayName?: string
  ): Promise<AuthResult>
  updateProfile(patch: ProfileUpdate): Promise<AuthResult>
  signInWithSocial(provider: SocialProvider): Promise<AuthResult>
  sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: AuthError }>
  confirmPasswordReset(code: string, newPassword: string): Promise<{ success: boolean; error?: AuthError }>
  signOut(): Promise<void>
  getCurrentUser(): AuthUser | null
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void
}
