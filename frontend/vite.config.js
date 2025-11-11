import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env': env,
    },
    server: {
      port: 3000,
      open: true,
    },
    // Configuración para que Vite exponga las variables de entorno al frontend
    // Las variables deben comenzar con VITE_ para ser expuestas
    envPrefix: 'VITE_',
  };
});
