import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en las variables de entorno');
}

// Configuración global para Supabase
const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY
    }
  }
};

// Cliente con service role key para operaciones del backend (bypass RLS)
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  options
);

// Cliente anónimo para operaciones que respetan RLS
export const supabaseAnon = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Función helper para ejecutar consultas SQL directas (PostgreSQL)
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Array>} Resultados de la consulta
 */
export async function query(sql, params = []) {
  try {
    // Reemplazar placeholders ? por $1, $2, etc. (PostgreSQL usa $1, $2...)
    let pgSql = sql;
    const paramMap = {};
    
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      // Reemplazar el primer ? encontrado
      pgSql = pgSql.replace('?', placeholder);
      paramMap[placeholder] = param;
    });

    // Ejecutar usando RPC o query directa
    const { data, error } = await supabase.rpc('exec_sql', {
      query: pgSql,
      params: paramMap
    });

    if (error) {
      // Si no existe la función RPC, intentar con query directa usando PostgREST
      // Nota: Supabase no permite queries SQL directas fácilmente
      // Necesitamos usar el cliente de PostgREST o crear funciones SQL en Supabase
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

/**
 * Función helper para usar el cliente de Supabase directamente
 * Esta es la forma recomendada de interactuar con Supabase
 */
export async function queryTable(table, options = {}) {
  const {
    select = '*',
    filters = {},
    orderBy = null,
    limit = null,
    offset = null
  } = options;

  let query = supabase.from(table).select(select);

  // Aplicar filtros
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value.operator) {
        // Soporte para operadores: { operator: 'gte', value: '2024-01-01' }
        query = query[value.operator](key, value.value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Ordenar
  if (orderBy) {
    const [column, direction = 'asc'] = orderBy.split(':');
    query = query.order(column, { ascending: direction.toLowerCase() === 'asc' });
  }

  // Límite y offset
  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit || 1000) - 1);

  const { data, error } = await query;

  if (error) {
    console.error(`Error en queryTable ${table}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Insertar un registro
 */
export async function insert(table, data) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();

  if (error) {
    console.error(`Error insertando en ${table}:`, error);
    throw error;
  }

  return result?.[0] || result;
}

/**
 * Actualizar registros
 */
export async function update(table, filters, data) {
  let query = supabase.from(table).update(data);

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data: result, error } = await query.select();

  if (error) {
    console.error(`Error actualizando ${table}:`, error);
    throw error;
  }

  return result;
}

/**
 * Eliminar registros
 */
export async function remove(table, filters) {
  let query = supabase.from(table).delete();

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data: result, error } = await query.select();

  if (error) {
    console.error(`Error eliminando de ${table}:`, error);
    throw error;
  }

  return result;
}
