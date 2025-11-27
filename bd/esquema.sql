-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alumno (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_curso uuid NOT NULL DEFAULT gen_random_uuid(),
  dni bigint UNIQUE,
  nombre text,
  apellido text,
  domicilio text,
  telefono_padre text,
  email text,
  nacimiento date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT alumno_pkey PRIMARY KEY (id),
  CONSTRAINT alumno_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.curso(id)
);
CREATE TABLE public.asistencias (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_alumno uuid NOT NULL,
  id_materia uuid,
  fecha date NOT NULL,
  presente boolean DEFAULT false,
  justificada boolean DEFAULT false,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  tarde boolean DEFAULT false,
  CONSTRAINT asistencias_pkey PRIMARY KEY (id),
  CONSTRAINT asistencias_id_alumno_fkey FOREIGN KEY (id_alumno) REFERENCES public.alumno(id),
  CONSTRAINT asistencias_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materias(id),
  CONSTRAINT asistencias_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.configuracion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clave text NOT NULL UNIQUE,
  valor text,
  descripcion text,
  tipo text DEFAULT 'texto'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuracion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.curso (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  curso text NOT NULL,
  turno USER-DEFINED,
  CONSTRAINT curso_pkey PRIMARY KEY (id)
);
CREATE TABLE public.eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  fecha_inicio timestamp with time zone NOT NULL,
  fecha_fin timestamp with time zone,
  tipo_evento USER-DEFINED,
  id_curso uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT eventos_pkey PRIMARY KEY (id),
  CONSTRAINT eventos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT fk_curso FOREIGN KEY (id_curso) REFERENCES public.curso(id)
);
CREATE TABLE public.historial-registro (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_usuario uuid,
  accion jsonb NOT NULL,
  fecha_hora timestamp with time zone NOT NULL DEFAULT now(),
  tabla_afectada text NOT NULL,
  id_registro_afectado text NOT NULL,
  detalles text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT historial-registro_pkey PRIMARY KEY (id),
  CONSTRAINT historial-registro_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES auth.users(id)
);
CREATE TABLE public.historial_alumno (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_alumno uuid DEFAULT gen_random_uuid(),
  id_materia uuid DEFAULT gen_random_uuid(),
  profesor text,
  año_de_cursada date,
  nota_primer_cuatri real,
  nota_segundo_cuatri real,
  estado_materia USER-DEFINED,
  CONSTRAINT historial_alumno_pkey PRIMARY KEY (id),
  CONSTRAINT historial_alumno_id_alumno_fkey FOREIGN KEY (id_alumno) REFERENCES public.alumno(id),
  CONSTRAINT historial_alumno_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materias(id)
);
CREATE TABLE public.justificaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_alumno uuid NOT NULL,
  id_asistencia uuid,
  fecha date NOT NULL,
  motivo text NOT NULL,
  archivo_url text,
  estado text DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text])),
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT justificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT justificaciones_id_alumno_fkey FOREIGN KEY (id_alumno) REFERENCES public.alumno(id),
  CONSTRAINT justificaciones_id_asistencia_fkey FOREIGN KEY (id_asistencia) REFERENCES public.asistencias(id),
  CONSTRAINT justificaciones_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT justificaciones_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.login_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'teacher'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modulo text,
  log text,
  Code text,
  fecha timestamp without time zone NOT NULL,
  CONSTRAINT logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  curso_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  profesor text,
  CONSTRAINT materias_pkey PRIMARY KEY (id),
  CONSTRAINT materias_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.curso(id)
);
CREATE TABLE public.notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  leida boolean DEFAULT false,
  tipo text CHECK (tipo = ANY (ARRAY['asistencia'::text, 'justificacion'::text, 'general'::text, 'recordatorio'::text])),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  leida_en timestamp with time zone,
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
);
CREATE TABLE public.padre_alumno (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_padre uuid NOT NULL,
  id_alumno uuid NOT NULL,
  relacion text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT padre_alumno_pkey PRIMARY KEY (id),
  CONSTRAINT fk_padre FOREIGN KEY (id_padre) REFERENCES public.padres(id),
  CONSTRAINT fk_alumno FOREIGN KEY (id_alumno) REFERENCES public.alumno(id)
);
CREATE TABLE public.padres (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  dni text UNIQUE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  telefono text,
  email text UNIQUE,
  direccion text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT padres_pkey PRIMARY KEY (id),
  CONSTRAINT padres_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  id_curso bigint,
  teacher_id uuid,
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT fk_subject_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);
CREATE TABLE public.teacher_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid,
  CONSTRAINT teacher_subjects_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT teacher_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT teacher_subjects_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id)
);
CREATE TABLE public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dni text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  phone text,
  employment_status text NOT NULL CHECK (employment_status = ANY (ARRAY['titular'::text, 'provisional'::text, 'suplente'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT teachers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'teacher'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  nombre text,
  apellido text,
  rol text,
  contraseña text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.usuarios_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  rol character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_roles_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);