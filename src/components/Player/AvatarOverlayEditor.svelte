<script>
	import Button from '../Common/Button.svelte';

	export let editModel;

	let fileinput;
	const changeAvatar = e => {
		editModel.avatarInput = e.target.files[0];
		editModel.avatar = URL.createObjectURL(e.target.files[0]);
	};

	function onModalStateChange(modalEnabled) {
		if (modalEnabled) {
			window.scrollTo(0, 0);
			document.body.classList.add('avatar-edit');
		} else {
			window.scrollTo(0, 0);
			document.body.classList.remove('avatar-edit');
		}
	}

	$: modalEnabled = !!editModel?.avatarOverlayEdit;
	$: onModalStateChange(modalEnabled);
</script>

{#if modalEnabled}
	<div class="avatar-modal">
		<i class="close fas fa-times" title="Click to close avatar editor" on:click={() => (editModel.avatarOverlayEdit = false)} />

		<div class="avatar-buttons">
			<Button type="primary" iconFa="far fa-user-circle" label="Change avatar" on:click={() => fileinput.click()}>
				<input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={changeAvatar} bind:this={fileinput} />
			</Button>

			<div class="range">
				<input type="range" min="0" max="359" step="1" bind:value={editModel.avatarHue} class="hue" />
				<span title="Hue" on:click={() => (editModel.avatarHue = 0)}>Hue</span>
			</div>

			<div class="range">
				<input type="range" min="0" max="3" step="0.01" bind:value={editModel.avatarSaturation} class="saturation" />
				<span title="Saturation" on:click={() => (editModel.avatarSaturation = 1)}>Sat</span>
			</div>
		</div>
		<div class="avatar-main">TODO: effect selection</div>
	</div>
{/if}

<style>
	.avatar-modal {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.9);
		-webkit-mask-image: radial-gradient(
			circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 155px,
			transparent 120px,
			black 0
		);
		padding-top: 44px;
	}

	:global(.mirror) .avatar-modal {
		-webkit-mask-image: radial-gradient(
			circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 175px,
			transparent 120px,
			black 0
		);
		padding-top: 64px;
	}

	.avatar-buttons {
		position: absolute;
		top: calc(155px - 120px + 230px + 1rem);
		left: calc((100vw - min(65em, 100vw - 2rem)) / 2 - 0.75rem);
		width: 220px;
		padding-top: 0.5rem;

		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.avatar-buttons > .range {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875em;
	}

	.avatar-buttons > .range input {
		flex: 1;
	}

	:global(.mirror) .avatar-buttons {
		top: calc(175px - 120px + 230px + 1rem);
	}

	.avatar-main {
		padding-left: calc((100vw - min(65em, 100vw - 2rem)) / 2 - 0.75rem + 240px);
	}

	input[type='range'] {
		accent-color: var(--beatleader-primary);
	}

	.close {
		position: absolute;
		top: 1em;
		left: 1em;
		font-size: 1.5em;
		cursor: pointer;
	}

	@media screen and (min-width: 1750px) {
		.avatar-modal {
			-webkit-mask-image: radial-gradient(
				circle 120px at calc((100vw - min(65em, 100vw)) / 2 + 120px - 2rem - 12.5em) 155px,
				transparent 120px,
				black 0
			);
		}

		:global(.mirror) .avatar-modal {
			-webkit-mask-image: radial-gradient(
				circle 120px at calc((100vw - min(65em, 100vw)) / 2 + 120px - 2rem - 12.5em) 175px,
				transparent 120px,
				black 0
			);
		}

		.avatar-buttons {
			left: calc((100vw - min(65em, 100vw)) / 2 - 1rem - 12.5em);
		}

		.avatar-main {
			padding-left: calc((100vw - min(65em, 100vw)) / 2 + 240px - 1rem - 12.5em);
		}
	}

	@media screen and (max-width: 899px) {
		.avatar-modal {
			-webkit-mask-image: radial-gradient(
				circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 167px,
				transparent 120px,
				black 0
			);
		}

		.avatar-buttons {
			top: calc(167px - 120px + 230px + 1rem);
			left: calc((100vw - min(65em, 100vw - 2rem)) / 2 - 0.75rem);
		}
	}

	@media screen and (max-width: 767px) {
		.avatar-modal {
			-webkit-mask-image: radial-gradient(circle 120px at calc(100vw / 2 - 0.5rem) 103px, transparent 120px, black 0);
			padding-top: 240px !important;
		}

		:global(.mirror) .avatar-modal {
			-webkit-mask-image: radial-gradient(circle 120px at calc(100vw / 2 - 0.5rem) 113px, transparent 120px, black 0);
		}

		.avatar-buttons {
			position: relative;
			left: calc(100vw / 2 - 120px);
			top: 0 !important;
		}

		.avatar-main {
			position: relative;
			padding-left: 0;
		}
	}
</style>
