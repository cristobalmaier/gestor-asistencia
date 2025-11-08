import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
