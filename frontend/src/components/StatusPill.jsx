export default function StatusPill({ value }) {
  const map = {
    'Presente': 'badge-success',
    'Ausente': 'badge-error',
    'Tarde': 'badge-warning',
    'Justificado': 'badge-primary',
  }
  const cls = map[value] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{value || '—'}</span>
}
