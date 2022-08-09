import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export default (value, duration = 500) => tweened(value, { duration, easing: cubicOut });