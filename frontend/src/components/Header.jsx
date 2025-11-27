export default function Header() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 lg:px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
        <div className="text-sm text-gray-600 font-medium">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </header>
  )
}
