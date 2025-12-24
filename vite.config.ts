import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { readFileSync } from 'fs'


const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

const external = [
    'react',
    'react-dom',
    /^react\/.*/,
    /^react-dom\/.*/,
    ...Object.keys(pkg.peerDependencies || {}),
    /^@radix-ui\/.*/,
    /^radix-ui\/.*/,
    /^lucide-react\/.*/,
    /^react-syntax-highlighter\/.*/,
    /^zustand\/.*/,
    /^flexsearch\/.*/,
]

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.app.json',
        }),
    ],
    resolve: {
        alias: {
            "@httpchain-utils": path.resolve(__dirname, "./src"),
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        lib: {
            entry: { index: path.resolve(__dirname, "src/index.ts") },
            formats: ['es', 'cjs'],
            fileName: (format, name) => `${name}.${format === 'es' ? 'mjs' : 'cjs'}`,

        },
        rollupOptions: {
            external: external
        },
        minify: true,
    }
})
