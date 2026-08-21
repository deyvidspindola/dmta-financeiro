import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        // Escuta em todas as interfaces (Docker); browser e HMR usam localhost.
        // Porta host mapeada em docker-compose.yml: 5175 (evita conflito com
        // outros projetos Laravel rodando na mesma máquina).
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5175',
        cors: {
            origin: ['http://localhost:8090', 'http://127.0.0.1:8090'],
        },
        hmr: {
            host: 'localhost',
            clientPort: 5175,
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
