<script>
	export let playerData;
	export let editModel = null;

	let playerId = playerData?.playerId;
</script>

{#if playerId}
	{#if editModel && !editModel.avatarOverlayEdit}
		<div class="imageInput" on:click={() => (editModel.avatarOverlayEdit = true)}>
			<span class="imageChange">
				<h3 class="changeLabel">Change</h3>
			</span>
		</div>
	{/if}
{/if}

<style>
	.imageInput {
		cursor: pointer;
		display: flex;
		position: absolute;
		width: 100px;
		height: 100px;
		top: calc(50% - 48px);
		left: calc(50% - 48px);
		align-items: center;
		z-index: 6;
	}

	.imageChange {
		transition: opacity 0.2s ease-in-out;
		background-color: rgba(32, 33, 36, 0.6);
		height: 33%;
		left: 0;
		opacity: 1;
		position: absolute;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.changeLabel {
		position: absolute;
	}
</style>
