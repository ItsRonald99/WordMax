import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

const mockSignOut = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { signOut: mockSignOut },
  })),
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh })
  ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
  mockSignOut.mockResolvedValue({})
})

describe('Sidebar', () => {
  describe('rendering', () => {
    it('renders the WordMax brand', () => {
      render(<Sidebar />)
      expect(screen.getAllByText('WordMax').length).toBeGreaterThan(0)
    })

    it('renders all three nav items', () => {
      render(<Sidebar />)
      expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('link', { name: /add word/i }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('link', { name: /practice/i }).length).toBeGreaterThan(0)
    })

    it('nav links point to the correct hrefs', () => {
      render(<Sidebar />)
      // Desktop sidebar links are first in DOM order
      const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i })
      const addWordLinks = screen.getAllByRole('link', { name: /add word/i })
      const practiceLinks = screen.getAllByRole('link', { name: /practice/i })

      expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard')
      expect(addWordLinks[0]).toHaveAttribute('href', '/add')
      expect(practiceLinks[0]).toHaveAttribute('href', '/practice')
    })

    it('renders the sign out button', () => {
      render(<Sidebar />)
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })
  })

  describe('active state', () => {
    it('highlights the Dashboard link when on /dashboard', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
      render(<Sidebar />)
      const links = screen.getAllByRole('link', { name: /dashboard/i })
      // Desktop sidebar link (first) should have the active class
      expect(links[0]).toHaveClass('bg-violet-600')
    })

    it('highlights the Add Word link when on /add', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/add')
      render(<Sidebar />)
      const links = screen.getAllByRole('link', { name: /add word/i })
      expect(links[0]).toHaveClass('bg-violet-600')
    })

    it('highlights the Practice link when on /practice', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/practice')
      render(<Sidebar />)
      const links = screen.getAllByRole('link', { name: /practice/i })
      expect(links[0]).toHaveClass('bg-violet-600')
    })

    it('does not apply active class to inactive nav items', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
      render(<Sidebar />)
      const addLinks = screen.getAllByRole('link', { name: /add word/i })
      const practiceLinks = screen.getAllByRole('link', { name: /practice/i })
      expect(addLinks[0]).not.toHaveClass('bg-violet-600')
      expect(practiceLinks[0]).not.toHaveClass('bg-violet-600')
    })
  })

  describe('sign out', () => {
    it('calls supabase.auth.signOut when the button is clicked', async () => {
      const user = userEvent.setup()
      render(<Sidebar />)
      await user.click(screen.getByRole('button', { name: /sign out/i }))
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('redirects to /login after sign out', async () => {
      const user = userEvent.setup()
      render(<Sidebar />)
      await user.click(screen.getByRole('button', { name: /sign out/i }))
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('calls router.refresh after sign out', async () => {
      const user = userEvent.setup()
      render(<Sidebar />)
      await user.click(screen.getByRole('button', { name: /sign out/i }))
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1)
      })
    })
  })
})
