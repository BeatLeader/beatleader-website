<script>
	import Spawnable from './Spawnable.svelte';

	export let target = null;
	let node = null;
	let update = false;

	window.addEventListener('resize', () => onResize());

	function refresh() {
		const targetRect = target.getBoundingClientRect();
		node.style.transform = 'translate(' + targetRect.left + 'px, ' + (window.scrollY + targetRect.top) + 'px)';
		if (!update || !refreshEveryTick) return;
		window.requestAnimationFrame(refresh);
	}

	function onResize() {
		if (node == null) return;
		refresh();
	}

	function onSpawn() {
		if (target == null) return;
		node ??= document.getElementById('overlay-wrapper');
		document.documentElement.appendChild(node);
		//root.children.insert(overlayWrapper);
		refresh();
	}

	function onDestroy() {
		update = false;
		//document.documentElement.removeChild(node);
	}
</script>

<div id="overlay-wrapper" style="position:absolute; top: 0; left: 0; z-index: 49">
	<Spawnable on:spawn={() => onSpawn()} on:destroy={() => onDestroy()}>
		<slot />
	</Spawnable>
</div>
