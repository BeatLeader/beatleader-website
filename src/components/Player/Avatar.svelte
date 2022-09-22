<script>
	import Spinner from '../Common/Spinner.svelte';

	export let playerInfo;
	export let isLoading = false;
	export let centered = false;
	export let hash = '';
	export let editModel = null;

	$: avatar = editModel?.avatar
		? editModel.avatar
		: playerInfo?.avatar
		? playerInfo.avatar + (playerInfo.avatar.includes('beatleader') ? `?${hash}` : '')
		: null;
</script>

<span class="avatar-container" class:loading={isLoading} class:centered>
	{#if avatar}
		<img src={avatar} class="avatar" alt="" />
	{:else}
		<span class="no-image">?</span>
	{/if}

	<span class="spinner">
		<Spinner width="100%" height="100%" />
	</span>
</span>

<style>
	.avatar-container {
		display: flex;
	}

	img {
		position: absolute;
		border-radius: 50%;
		width: 150px;
		transition: transform 300ms;
		z-index: 2;
		aspect-ratio: 1/1;
	}

	.loading img,
	.loading .no-image {
		transform: scale(0.7);
	}

	.spinner {
		display: none;
		position: absolute;
		width: 150px;
		color: var(--faded);
		z-index: 10;
	}

	.loading .spinner {
		display: inline-block;
	}

	.no-image {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 150px;
		height: 150px;
		border-radius: 50%;
		color: var(--foreground);
		background-color: var(--dimmed);
		font-weight: 500;
		font-size: 75px;
		line-height: 1;
		z-index: 0;
		transition: transform 300ms;
	}

	.avatar-container.centered {
		justify-content: center;
	}
	.avatar-container.centered img {
		left: auto;
	}
	.avatar-container.centered .spinner {
		left: auto;
	}

	@media (max-width: 768px) {
		.avatar-container {
			justify-content: center;
		}
		img {
			left: auto;
		}
		.spinner {
			left: auto;
		}
	}
</style>
