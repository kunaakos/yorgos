import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/index.ts'],
    platform: 'neutral',
    unbundle: true,
    dts: true,
    format: {
        esm: {
            target: ['es2022'],
            outDir: 'dist',
        },
    },
})
