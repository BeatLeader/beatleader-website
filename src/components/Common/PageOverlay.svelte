<script>
	import {onDestroy, onMount} from 'svelte';

	export let target = null;
	export let adjustSize = true;
	let node = null;

	window.addEventListener('resize', onResize);

	function getFixedParent(element) {
		let current = element;
		while (current && current !== document.body) {
			const style = window.getComputedStyle(current);
			if (style.position === 'fixed') {
				return current;
			}
			current = current.parentElement;
		}
		return null;
	}

	function refresh() {
		const targetRect = target.getBoundingClientRect();
		const fixedParent = getFixedParent(target);

		if (fixedParent) {
			// If target is inside a fixed container, use position relative to that container
			const fixedRect = fixedParent.getBoundingClientRect();
			node.style.transform = 'translate(' + targetRect.left + 'px, ' + (targetRect.top - fixedRect.top) + 'px)';
			node.style.position = 'fixed';
		} else {
			// If no fixed parent, use absolute position relative to viewport
			node.style.transform = 'translate(' + targetRect.left + 'px, ' + targetRect.top + 'px)';
			node.style.position = 'absolute';
		}

		if (!adjustSize) return;
		const child = node.firstChild;
		const childRect = child.getBoundingClientRect();
		const availableSpace = window.innerHeight - childRect.top;
		child.style.height = availableSpace > childRect.height ? 'auto' : availableSpace - 10 + 'px';
	}

	function onResize() {
		if (node == null) return;
		refresh();
	}

	onMount(() => {
		if (target == null) return;
		node ??= document.getElementById('overlay-wrapper');
		document.documentElement.appendChild(node);
		refresh();
	});

	onDestroy(() => {
		window.removeEventListener('resize', onResize);
	});
</script>

<div id="overlay-wrapper" style="top: 0; left: 0; z-index: 49">
	<slot />
</div>
