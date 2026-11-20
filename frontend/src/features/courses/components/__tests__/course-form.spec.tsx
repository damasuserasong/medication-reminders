import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/__tests__/test-utils'
import { CourseForm } from '../course-form'

describe('CourseForm', () => {
  it('submits a course with medicine, amount, multiple times, and date range', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(<CourseForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/amoxicillin/i), 'Amoxicillin')
    await user.type(screen.getByPlaceholderText(/1 tablet/i), '1 capsule')
    await user.click(screen.getByRole('button', { name: /add another time/i }))

    const startInput = screen.getByLabelText(/first day/i)
    await user.clear(startInput)
    await user.type(startInput, '2026-11-20')

    const endInput = screen.getByLabelText(/^last day$/i)
    await user.type(endInput, '2026-11-27')

    await user.click(screen.getByRole('button', { name: /save course/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      medicine_name: 'Amoxicillin',
      dose_amount: '1 capsule',
      times_of_day: ['08:00', '20:00'],
      start_date: '2026-11-20',
      end_date: '2026-11-27',
      notes: '',
    })
  })

  it('supports ongoing courses with no last day', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(<CourseForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/amoxicillin/i), 'Metformin')
    await user.type(screen.getByPlaceholderText(/1 tablet/i), '500 mg')
    await user.click(screen.getByText(/ongoing \(no last day\)/i))
    await user.click(screen.getByRole('button', { name: /save course/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        medicine_name: 'Metformin',
        dose_amount: '500 mg',
        end_date: null,
      })
    )
  })
})
