export default function StatusPill({ value }) {
  const map = {
    'Presente': 'bg-green-50 text-green-700 border-green-200',
    'Ausente': 'bg-red-50 text-red-700 border-red-200',
    'Tarde': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Justificado': 'bg-primary-50 text-primary-700 border-primary-200',
  }
  const cls = map[value] || 'bg-gray-100 text-gray-700 border-gray-200'
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border ${cls}`}>{value || '—'}</span>
}
