import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

<<<<<<< HEAD
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
=======
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
>>>>>>> 85a3886e9ac1e62fd0c635a261412016d991e7b4
