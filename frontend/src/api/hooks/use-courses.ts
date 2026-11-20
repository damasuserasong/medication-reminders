import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AUTH_EXPIRED_EVENT, refreshAccessToken } from '@/api/client'
import { clearTokens, getAccessToken } from '@/api/token-storage'
import { parseApiError } from '@/shared/utils/api-error'
import { API_URL } from '@/shared/utils/api-url'

export interface Course {
  id: string
  medicine_name: string
  dose_amount: string
  times_of_day: string[]
  start_date: string
  end_date: string | null
  notes: string
  created_at: string
  updated_at: string
}

export interface CourseInput {
  medicine_name: string
  dose_amount: string
  times_of_day: string[]
  start_date: string
  end_date: string | null
  notes?: string
}

interface PaginatedCourses {
  count: number
  next: string | null
  previous: string | null
  results: Course[]
}

export const COURSES_QUERY_KEY = ['courses'] as const

async function authedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        ...(options.headers || {}),
      },
    })

  let response = await send()
  if (response.status === 401) {
    const renewed = await refreshAccessToken()
    if (renewed) {
      response = await send()
    } else {
      clearTokens()
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const parsed = parseApiError({ status: response.status, error: data })
    const fieldMessages = Object.entries(parsed.fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
      .join('. ')
    throw new Error(fieldMessages ? `${parsed.message} ${fieldMessages}` : parsed.message)
  }

  return data as T
}

export function useCourses() {
  return useQuery({
    queryKey: COURSES_QUERY_KEY,
    queryFn: async () => {
      const data = await authedFetch<PaginatedCourses | Course[]>('/api/courses/')
      return Array.isArray(data) ? data : data.results
    },
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CourseInput) =>
      authedFetch<Course>('/api/courses/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY })
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CourseInput> }) =>
      authedFetch<Course>(`/api/courses/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY })
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      authedFetch<void>(`/api/courses/${id}/`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY })
    },
  })
}
