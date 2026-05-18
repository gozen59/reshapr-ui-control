import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { reshaprDevProxy } from './vite-plugin-reshapr-dev-proxy';

export default defineConfig({
	plugins: [reshaprDevProxy(), tailwindcss(), sveltekit()]
});
