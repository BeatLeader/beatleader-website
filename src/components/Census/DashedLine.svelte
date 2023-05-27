<script>
	export let dashLength = 5;
	export let gapLength = 5;
	export let angle = 0;
	export let borderWidth = '0.09em';
	export let lineLength = '200px';
	export let color = 'blue';
</script>

<div
	class="dashed-line"
	style="
        width: {lineLength};
        transform: rotate({angle}deg);
        border-width: {borderWidth}; 
        border-style: dashed; 
        border-image: repeating-linear-gradient(to right, {color}, {color} {dashLength}px, transparent {dashLength}px, transparent {dashLength +
		gapLength}px) 1 repeat;" />
