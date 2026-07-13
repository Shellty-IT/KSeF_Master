import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api': 'http://localhost:8080',
            '/health': 'http://localhost:8080',
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'cobertura'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/**/*.config.*'],
        },
    },
})
