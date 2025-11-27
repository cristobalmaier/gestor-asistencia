import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'



export default function Calendario() {
  const { user } = useAuth()
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [cursos, setCursos] = useState([])
  const [cursoId, setCursoId] = useState('')
  const [eventos, setEventos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [resumen, setResumen] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deletingEventId, setDeletingEventId] = useState(null)

  useEffect(() => { api.get('/cursos').then(({ data }) => setCursos(data)) }, [])

  const cargar = async () => {
    const params = {}
    if (fecha) params.fecha = fecha
    if (cursoId) params.cursoId = cursoId
    const { data } = await api.get('/calendario', { params })
    setEventos(data)

    if (fecha && cursoId) {
      // Resumen del día por curso
      const { data: rows } = await api.get('/asistencias', { params: { cursoId, desde: fecha, hasta: fecha } })
      const tot = rows.reduce((acc, r) => {
        acc.total++;
        acc.presentes += r.estado === 'Presente' ? 1 : 0
        acc.ausentes += r.estado === 'Ausente' ? 1 : 0
        acc.tardes += r.estado === 'Tarde' ? 1 : 0
        acc.justificados += r.estado === 'Justificado' ? 1 : 0
        return acc
      }, { total: 0, presentes: 0, ausentes: 0, tardes: 0, justificados: 0 })
      setResumen(tot)
    } else {
      setResumen(null)
    }
  }

  useEffect(() => { cargar() }, [fecha, cursoId])

  const crearEvento = async () => {
    if (!fecha || !titulo) return alert('Fecha y nombre del evento requeridos')
    try {
      await api.post('/calendario', { fecha, titulo, descripcion: descripcion || null, cursoId: cursoId || null })
      setTitulo('')
      setDescripcion('')
      await cargar()
    } catch (e) { alert('No se pudo crear el evento (requiere preceptor o admin)') }
  }

  const actualizarEvento = async () => {
    if (!editingEvent || !editingEvent.titulo) return
    try {
      await api.put(`/calendario/${editingEvent.id_evento}`, {
        titulo: editingEvent.titulo,
        descripcion: editingEvent.descripcion || null,
        cursoId: editingEvent.id_curso || null,
        fecha: editingEvent.fecha
      })
      setIsEditModalOpen(false)
      await cargar()
    } catch (e) {
      console.error('Error al actualizar el evento:', e)
      alert('No se pudo actualizar el evento')
    }
  }

  const eliminarEvento = async (eventoId) => {
    setDeletingEventId(eventoId);
    setIsDeleteModalOpen(true);
  }

  const confirmarEliminacion = async () => {
    if (!deletingEventId) return;

    try {
      await api.delete(`/calendario/${deletingEventId}`);
      await cargar();
      setIsDeleteModalOpen(false);
    } catch (e) {
      console.error('Error al eliminar el evento:', e);
      alert('No se pudo eliminar el evento');
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        <p className="text-gray-600 mt-1">Eventos y actividades del curso</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Curso</label>
            <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={cursoId} onChange={e => setCursoId(e.target.value)}>
              <option value="">Todos los cursos</option>
              {cursos.map(c => (<option key={c.id_curso} value={c.id_curso}>{c.nombre} {c.anio}°{c.division}</option>))}
            </select>
          </div>
        </div>
      </div>

      {['preceptor', 'admin'].includes(user.rol) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Crear nuevo evento</h3>
          <div className="grid md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Nombre del evento *</label>
              <input className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" placeholder="Ej: Acto escolar" value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Descripción (opcional)</label>
              <input className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" placeholder="Ej: A las 9hs en el patio" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>
            <div>
              <button onClick={crearEvento} className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">Agregar evento</button>
            </div>
          </div>
        </div>
      )}

      {resumen && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Resumen del día</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{resumen.presentes}</div>
              <div className="text-xs text-green-600 font-medium mt-1">Presentes</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{resumen.ausentes}</div>
              <div className="text-xs text-red-600 font-medium mt-1">Ausentes</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{resumen.tardes}</div>
              <div className="text-xs text-yellow-600 font-medium mt-1">Tarde</div>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="text-2xl font-bold text-primary-700">{resumen.justificados}</div>
              <div className="text-xs text-primary-600 font-medium mt-1">Justificados</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-600 text-xs font-medium uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-4">Fecha</th>
              <th className="text-left px-6 py-4">Curso</th>
              <th className="text-left px-6 py-4">Nombre del evento</th>
              <th className="text-left px-6 py-4">Descripción</th>
              {['preceptor', 'admin'].includes(user.rol) && (
                <th className="text-right px-6 py-4">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {eventos.map(ev => (
              <tr key={ev.id_evento} className="transition-colors duration-100 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const [year, month, day] = ev.fecha.split('-').map(Number)
                      return new Date(year, month - 1, day).toLocaleDateString('es-ES')
                    })()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">{ev.curso_nombre || 'Todos'}</span>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium">{ev.titulo}</td>
                <td className="px-6 py-4 text-gray-600">{ev.descripcion || '-'}</td>
                {['preceptor', 'admin'].includes(user.rol) && (
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingEvent(ev);
                        setIsEditModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => eliminarEvento(ev.id_evento)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {eventos.length === 0 && (
              <tr><td className="px-6 py-12 text-center text-gray-600" colSpan={4}>No hay eventos para mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edición */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Editar Evento
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editingEvent?.fecha || ''}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            fecha: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curso (opcional)
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editingEvent?.id_curso || ''}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            id_curso: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Todos los cursos</option>
                        {cursos.map(c => (
                          <option key={c.id_curso} value={c.id_curso}>{c.nombre} {c.anio}°{c.division}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del evento *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editingEvent?.titulo || ''}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            titulo: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción (opcional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editingEvent?.descripcion || ''}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            descripcion: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={actualizarEvento}
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal de confirmación de eliminación */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Confirmar eliminación
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={confirmarEliminacion}
                    >
                      Eliminar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
