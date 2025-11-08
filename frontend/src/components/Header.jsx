export default function Header() {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm flex items-center px-8 sticky top-0 z-20">
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
        <div className="text-sm text-[var(--text-secondary)]">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </header>
  )
}
