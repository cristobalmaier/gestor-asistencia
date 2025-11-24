/**
 * Constantes para los tipos ENUM de Supabase
 * Estos valores deben coincidir con los tipos USER-DEFINED en la base de datos
 */

export const TURNOS = {
    MAÑANA: 'mañana',
    TARDE: 'tarde',
    NOCHE: 'noche'
};

export const TIPO_EVENTO = {
    FERIADO: 'feriado',
    REUNION: 'reunion',
    OTRO: 'otro'
};

export const ESTADO_MATERIA = {
    CURSANDO: 'cursando',
    APROBADO: 'aprobado',
    DESAPROBADO: 'desaprobado',
    LIBRE: 'libre',
    PENDIENTE: 'pendiente'
};

export const EMPLOYMENT_STATUS = {
    TITULAR: 'titular',
    PROVISIONAL: 'provisional',
    SUPLENTE: 'suplente'
};

export const TIPO_NOTIFICACION = {
    ASISTENCIA: 'asistencia',
    JUSTIFICACION: 'justificacion',
    GENERAL: 'general',
    RECORDATORIO: 'recordatorio'
};

export const ESTADO_JUSTIFICACION = {
    PENDIENTE: 'pendiente',
    APROBADA: 'aprobada',
    RECHAZADA: 'rechazada'
};

export const USER_ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher'
};

/**
 * Validar si un valor es válido para un enum
 * @param {string} value - Valor a validar
 * @param {Object} enumObj - Objeto enum (ej: TURNOS)
 * @returns {boolean}
 */
export function isValidEnum(value, enumObj) {
    return Object.values(enumObj).includes(value);
}

/**
 * Obtener valores válidos de un enum
 * @param {Object} enumObj - Objeto enum
 * @returns {Array<string>}
 */
export function getEnumValues(enumObj) {
    return Object.values(enumObj);
}
