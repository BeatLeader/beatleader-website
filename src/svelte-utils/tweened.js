import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export default (value, duration = 500) => {
  const tweenedValue = tweened(value, {
    duration,
    easing: cubicOut
  });

  return tweenedValue;
}