import {opt} from './js'

export function scrollToTargetAdjusted(target, offset = 0) {
  if (!target) return;

  const elementPosition = opt(target.getBoundingClientRect(), 'top');
  if (!elementPosition) return;

  const offsetPosition = elementPosition - offset + window.pageYOffset

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}