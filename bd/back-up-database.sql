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
  CONSTRAINT alumno_pkey PRIMARY KEY (id),
  CONSTRAINT alumno_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.curso(id)
);
CREATE TABLE public.curso (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  curso text NOT NULL,
  turno USER-DEFINED,
  CONSTRAINT curso_pkey PRIMARY KEY (id)
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
CREATE TABLE public.usuarios_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rol character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_roles_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);