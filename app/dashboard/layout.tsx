import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-background">
        <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
