import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import ErrorPage from '@/app/error'

test('the error page is the site’s own, with a retry and a way home', () => {
  const retry = vi.fn()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const err = Object.assign(new Error('boom'), { digest: 'abc123' })
  render(<ErrorPage error={err} retry={retry} />)
  expect(screen.getByRole('heading', { name: 'Something broke on my side.' })).toBeInTheDocument()
  expect(screen.queryByText('boom')).toBeNull()
  expect(screen.getByText('Reference: abc123')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(retry).toHaveBeenCalledOnce()
})
