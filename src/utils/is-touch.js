export const isTouchDevice = () => !window?.matchMedia('(pointer: fine)')?.matches;
