<script>
	export let data;
	export let roles;
</script>

{#if data?.avatarOverlay}
	<span
		style={`
			--hue: ${data?.avatarHue}deg;
			--saturation: ${data.avatarSaturation ?? 1}
			`}>
		<img class="avatar-overlay" src={data.avatarOverlay} />
	</span>
{/if}

<style>
	.avatar-overlay {
		position: absolute;
		top: -24px;
		left: -24px;
		width: 230px;
		z-index: 3;
		mix-blend-mode: screen;
		filter: hue-rotate(var(--hue, 0deg)) saturate(var(--saturation, 1));
		pointer-events: none;
	}

	@media screen and (max-width: 767px) {
		.avatar-overlay {
			left: calc(50% - 115px);
		}
	}
</style>
