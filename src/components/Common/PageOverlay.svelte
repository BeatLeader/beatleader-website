<script>
	import {onDestroy, onMount} from 'svelte';

	export let target = null;
	export let adjustSize = true;
	let node = null;

	window.addEventListener('resize', onResize);

	function refresh() {
		const targetRect = target.getBoundingClientRect();
		node.style.transform = 'translate(' + targetRect.left + 'px, ' + (window.scrollY + targetRect.top) + 'px)';
		if (!adjustSize) return;
		const child = node.firstChild;
		const childRect = child.getBoundingClientRect();
		const availableSpace = document.body.scrollHeight - (window.scrollY + childRect.top);
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

<div id="overlay-wrapper" style="position:absolute; top: 0; left: 0; z-index: 49">
	<slot />
</div>
