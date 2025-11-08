import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 max-w-[1400px] mx-auto w-full space-y-8 animate-in">
          {children}
        </main>
      </div>
    </div>
  )
}
