-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 08-11-2025 a las 01:26:06
-- Versión del servidor: 10.4.24-MariaDB
-- Versión de PHP: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de datos: `gestor_asistencias`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alumnos_cursos`
--

CREATE TABLE `alumnos_cursos` (
  `id_alumno` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `alumnos_cursos`
--

INSERT INTO `alumnos_cursos` (`id_alumno`, `id_curso`) VALUES
(4, 1),
(4, 2),
(7, 1),
(7, 2),
(8, 1),
(8, 4),
(10, 3),
(10, 4),
(11, 3),
(11, 5),
(12, 3),
(12, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencias`
--

CREATE TABLE `asistencias` (
  `id_asistencia` int(11) NOT NULL,
  `id_alumno` int(11) NOT NULL,
  `id_materia` int(11) NOT NULL,
  `id_profesor` int(11) DEFAULT NULL,
  `id_preceptor` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `estado` enum('Presente','Ausente','Tarde','Justificado') DEFAULT 'Ausente',
  `hora_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `asistencias`
--

INSERT INTO `asistencias` (`id_asistencia`, `id_alumno`, `id_materia`, `id_profesor`, `id_preceptor`, `fecha`, `estado`, `hora_registro`) VALUES
(1, 4, 1, 3, 2, '2025-11-06', 'Presente', '2025-11-07 23:14:30'),
(2, 7, 2, 6, 5, '2025-11-06', 'Ausente', '2025-11-07 23:14:30'),
(3, 4, 1, 3, 2, '2025-11-07', 'Tarde', '2025-11-07 23:14:30'),
(4, 8, 3, 9, 5, '2025-11-06', 'Presente', '2025-11-07 23:14:30'),
(5, 7, 1, 3, 2, '2025-11-08', 'Presente', '2025-11-07 23:14:30'),
(6, 4, 2, 6, 5, '2025-11-08', 'Ausente', '2025-11-07 23:14:30'),
(7, 8, 2, 6, 2, '2025-11-09', 'Justificado', '2025-11-07 23:14:30'),
(8, 10, 5, 6, 5, '2025-11-09', 'Presente', '2025-11-07 23:14:30'),
(9, 11, 6, 9, 2, '2025-11-09', 'Ausente', '2025-11-07 23:14:30'),
(10, 12, 7, 3, 5, '2025-11-10', 'Tarde', '2025-11-07 23:14:30'),
(11, 4, 1, 3, 2, '2025-11-10', 'Presente', '2025-11-07 23:14:30'),
(12, 7, 3, 9, 5, '2025-11-10', 'Ausente', '2025-11-07 23:14:30'),
(13, 11, 8, 6, 2, '2025-11-11', 'Presente', '2025-11-07 23:14:30'),
(14, 12, 9, 9, 5, '2025-11-11', 'Presente', '2025-11-07 23:14:30'),
(15, 10, 10, 3, 2, '2025-11-11', 'Ausente', '2025-11-07 23:14:30'),
(16, 12, 8, NULL, 2, '2025-11-07', 'Presente', '2025-11-07 23:31:05'),
(17, 11, 7, NULL, 2, '2025-11-03', 'Justificado', '2025-11-07 23:31:30'),
(18, 7, 3, NULL, 2, '2025-11-07', 'Presente', '2025-11-07 23:32:40'),
(19, 4, 3, NULL, 2, '2025-11-07', 'Ausente', '2025-11-07 23:32:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calendario`
--

CREATE TABLE `calendario` (
  `id_evento` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `descripcion` text DEFAULT NULL,
  `id_curso` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `calendario`
--

INSERT INTO `calendario` (`id_evento`, `fecha`, `descripcion`, `id_curso`) VALUES
(1, '2025-12-15', 'Entrega de Proyectos Finales', 1),
(2, '2025-11-20', 'Reunión de Padres y Tutores (General)', NULL),
(3, '2025-12-01', 'Examen de Matemáticas', 1),
(4, '2025-12-05', 'Entrega de Trabajos de Biología', 2),
(5, '2025-11-25', 'Charla de Orientación Vocacional', 3),
(6, '2025-12-08', 'Cierre de Notas 1er Cuatrimestre', NULL),
(7, '2025-12-10', 'Exposición de Proyectos de Arte', 5),
(8, '2025-11-18', 'Inicio de Clases de Apoyo', 6),
(9, '2025-11-22', 'Feria de Ciencias', 7),
(10, '2025-12-03', 'Simulacro de Examen Global', 8),
(11, '2025-12-12', 'Acto de Fin de Año - Último día', NULL),
(12, '2025-12-19', 'Recuperatorios Finales', 1),
(13, '2025-11-07', 'boeee', 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id_curso` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `anio` int(11) NOT NULL,
  `division` varchar(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `cursos`
--

INSERT INTO `cursos` (`id_curso`, `nombre`, `anio`, `division`) VALUES
(1, 'Bachiller en Informática', 5, 'A'),
(2, 'Ciencias Naturales', 4, 'B'),
(3, 'Economía y Gestión', 5, 'B'),
(4, 'Comunicación', 4, 'A'),
(5, 'Arte y Diseño', 3, 'C'),
(6, 'Bachiller en Informática', 4, 'A'),
(7, 'Ciencias Naturales', 3, 'C'),
(8, 'Economía y Gestión', 4, 'B'),
(9, 'Comunicación', 5, 'C'),
(10, 'Arte y Diseño', 4, 'D'),
(11, 'Bachiller en Informática', 3, 'B'),
(12, 'Ciencias Naturales', 5, 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial`
--

CREATE TABLE `historial` (
  `id_historial` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `accion` text NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `historial`
--

INSERT INTO `historial` (`id_historial`, `id_usuario`, `accion`, `fecha_hora`) VALUES
(1, 1, 'Acceso de administrador. Configuración inicial.', '2025-11-07 23:14:30'),
(2, 5, 'Registro de asistencia masiva para 5to A.', '2025-11-07 23:14:30'),
(3, 2, 'Modificación de datos de alumno ID 4.', '2025-11-07 23:14:30'),
(4, 3, 'Carga de notas parciales de Programación.', '2025-11-07 23:14:30'),
(5, 6, 'Eliminación de la materia obsoleta \"Tecnología\".', '2025-11-07 23:14:30'),
(6, 9, 'Carga de planificaciones del tercer trimestre.', '2025-11-07 23:14:30'),
(7, 1, 'Restablecimiento de contraseña de usuario ID 7.', '2025-11-07 23:14:30'),
(8, 5, 'Marcado de asistencias de la división B.', '2025-11-07 23:14:30'),
(9, 2, 'Generación de reporte de ausencias graves.', '2025-11-07 23:14:30'),
(10, 6, 'Carga de un nuevo evento en el calendario (viaje).', '2025-11-07 23:14:30'),
(11, 9, 'Actualización de datos personales (email).', '2025-11-07 23:14:30'),
(12, 3, 'Modificación del estado de una asistencia a Justificado.', '2025-11-07 23:14:30'),
(13, 2, '{\"tipo\":\"CARGA_LISTA\",\"cursoId\":\"6\",\"materiaId\":\"8\",\"fecha\":\"2025-11-07\",\"cantidad\":1}', '2025-11-07 23:31:05'),
(14, 2, '{\"tipo\":\"CARGA_LISTA\",\"cursoId\":\"5\",\"materiaId\":\"7\",\"fecha\":\"2025-11-03\",\"cantidad\":1}', '2025-11-07 23:31:30'),
(15, 2, '{\"tipo\":\"CARGA_LISTA\",\"cursoId\":\"2\",\"materiaId\":\"3\",\"fecha\":\"2025-11-07\",\"cantidad\":2}', '2025-11-07 23:32:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `id_materia` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `id_profesor` int(11) DEFAULT NULL,
  `id_curso` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `materias`
--

INSERT INTO `materias` (`id_materia`, `nombre`, `id_profesor`, `id_curso`) VALUES
(1, 'Programación Avanzada', 3, 1),
(2, 'Matemáticas', 6, 1),
(3, 'Biología', 9, 2),
(4, 'Historia', 3, 2),
(5, 'Contabilidad', 6, 3),
(6, 'Inglés', 9, 4),
(7, 'Literatura', 3, 5),
(8, 'Física', 6, 6),
(9, 'Química', 9, 7),
(10, 'Geografía', 3, 8),
(11, 'Educación Física', 6, 9),
(12, 'Dibujo Técnico', 9, 10);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `rol` enum('admin','preceptor','profesor','directivo','alumno','padre') NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `apellido`, `dni`, `email`, `contraseña`, `rol`, `fecha_registro`) VALUES
(1, 'Root', 'Admin', '1234567', 'root@admin.com', '123', 'admin', '2025-11-07 23:14:30'),
(2, 'Axel', 'Derfler', '47167139', 'axel@preceptor.com', '123', 'preceptor', '2025-11-07 23:14:30'),
(3, 'Juan', 'Perez', '10111222', 'juan.perez@profesor.com', 'profesor123', 'profesor', '2025-11-07 23:14:30'),
(4, 'Maria', 'Gomez', '40333444', 'maria.gomez@alumno.com', 'alumno123', 'alumno', '2025-11-07 23:14:30'),
(5, 'Sofia', 'Rodriguez', '20555666', 'sofia.rodriguez@preceptor.com', 'preceptor123', 'preceptor', '2025-11-07 23:14:30'),
(6, 'Carlos', 'Lopez', '15987654', 'carlos.lopez@profesor.com', 'profesor123', 'profesor', '2025-11-07 23:14:30'),
(7, 'Pedro', 'Alvarez', '41234567', 'pedro.alvarez@alumno.com', 'alumno123', 'alumno', '2025-11-07 23:14:30'),
(8, 'Laura', 'Martínez', '35001002', 'laura.martinez@alumno.com', 'alumno123', 'alumno', '2025-11-07 23:14:30'),
(9, 'Martin', 'Fernandez', '28998765', 'martin.f@profesor.com', 'profesor123', 'profesor', '2025-11-07 23:14:30'),
(10, 'Elena', 'Sánchez', '42112233', 'elena.sanchez@alumno.com', 'alumno123', 'alumno', '2025-11-07 23:14:30'),
(11, 'Facundo', 'García', '39445566', 'facundo.garcia@alumno.com', 'alumno123', 'alumno', '2025-11-07 23:14:30'),
(12, 'Paula', 'Torres', '33667788', 'paula.torres@alumno.com', 'alumno123', 'alumno', '2025-11-07 23:14:30');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alumnos_cursos`
--
ALTER TABLE `alumnos_cursos`
  ADD PRIMARY KEY (`id_alumno`,`id_curso`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `asistencias`
--
ALTER TABLE `asistencias`
  ADD PRIMARY KEY (`id_asistencia`),
  ADD KEY `id_alumno` (`id_alumno`),
  ADD KEY `id_materia` (`id_materia`),
  ADD KEY `id_profesor` (`id_profesor`),
  ADD KEY `id_preceptor` (`id_preceptor`);

--
-- Indices de la tabla `calendario`
--
ALTER TABLE `calendario`
  ADD PRIMARY KEY (`id_evento`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id_curso`);

--
-- Indices de la tabla `historial`
--
ALTER TABLE `historial`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id_materia`),
  ADD KEY `id_profesor` (`id_profesor`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `dni` (`dni`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asistencias`
--
ALTER TABLE `asistencias`
  MODIFY `id_asistencia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `calendario`
--
ALTER TABLE `calendario`
  MODIFY `id_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id_curso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `historial`
--
ALTER TABLE `historial`
  MODIFY `id_historial` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id_materia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alumnos_cursos`
--
ALTER TABLE `alumnos_cursos`
  ADD CONSTRAINT `alumnos_cursos_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `alumnos_cursos_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE;

--
-- Filtros para la tabla `asistencias`
--
ALTER TABLE `asistencias`
  ADD CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`) ON DELETE CASCADE,
  ADD CONSTRAINT `asistencias_ibfk_3` FOREIGN KEY (`id_profesor`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `asistencias_ibfk_4` FOREIGN KEY (`id_preceptor`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `calendario`
--
ALTER TABLE `calendario`
  ADD CONSTRAINT `calendario_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE SET NULL;

--
-- Filtros para la tabla `historial`
--
ALTER TABLE `historial`
  ADD CONSTRAINT `historial_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `materias`
--
ALTER TABLE `materias`
  ADD CONSTRAINT `materias_ibfk_1` FOREIGN KEY (`id_profesor`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `materias_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE;
COMMIT;
