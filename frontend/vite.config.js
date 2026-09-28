import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// strictPort: the backend CORS config only allows http://localhost:5173.
// If 5173 is busy, Vite would silently pick 5174 and every API call would
// fail CORS with a confusing error, so fail loudly instead.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
