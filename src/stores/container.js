import {writable} from 'svelte/store'

export default (sizes = {phone: 0, tablet: 768, desktop: 1024, xxl: 1749}) => {
  const defaultValue = {name: null, width: null, nodeWidth: null}
  const {subscribe, unsubscribe, set} = writable(defaultValue);

  let ro = null;
  let node = null;

  const unobserve = () => {
    if (!node) return;

    ro.unobserve(node)

    node = null;
  }

  const observe = nodeToObserve => {
    if (!nodeToObserve) return null;

    if (node) unobserve();

    node = nodeToObserve;

    let lastWidth = null;

    ro = new ResizeObserver(() => {
      const nodeWidth = node.getBoundingClientRect().width;
      if (lastWidth === nodeWidth) return;

      lastWidth = nodeWidth;

      set(
        Object.entries(sizes)
          .sort((a, b) => a[1] - b[1])
          .reduce((cum, item) => item[1] <= nodeWidth ? {name: item[0], width: item[1], nodeWidth} : cum, defaultValue),
      )
    });

    ro.observe(node)

    return node;
  }

  return {
    subscribe,
    unsubscribe,
    observe,
    unobserve,
  }
};
