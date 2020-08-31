import Home from './router/Home.svelte';
import About from './router/About.svelte';
import { writable } from 'svelte/store';

const router = {
     '/': Home,
     '/home': Home,
     '/about': About,
}

export default router;
export const curRoute = writable('/');