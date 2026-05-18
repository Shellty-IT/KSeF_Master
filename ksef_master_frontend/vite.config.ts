import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    plugins: [react()],
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
