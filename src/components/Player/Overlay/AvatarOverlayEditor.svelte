<script>
	import Button from '../../Common/Button.svelte';
	import ContentBox from '../../Common/ContentBox.svelte';
	import {getAllOverlays} from './overlay';

	export let editModel;
	export let roles;

	const readFile = async fileInput =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);

			reader.readAsArrayBuffer(fileInput);
		});

	let fileinput;
	const changeAvatar = async e => {
		editModel.avatar = URL.createObjectURL(e.target.files[0]);
		editModel.data.avatar = await readFile(e.target.files[0])?.catch(_ => _);
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

	$: allOverlays = getAllOverlays(roles);
</script>

{#if modalEnabled}
	<div class="avatar-modal">
		<i class="close fas fa-times" title="Click to close avatar editor" on:click={() => (editModel.avatarOverlayEdit = false)} />

		<div class="avatar-buttons">
			<Button type="primary" iconFa="far fa-user-circle" label="Change avatar" on:click={() => fileinput.click()}>
				<input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={changeAvatar} bind:this={fileinput} />
			</Button>

			<div class="range">
				<input type="range" min="0" max="359" step="1" bind:value={editModel.data.hue} class="hue" />
				<span title="Hue" on:click={() => (editModel.data.hue = 0)}>Hue</span>
			</div>

			<div class="range">
				<input type="range" min="0" max="3" step="0.01" bind:value={editModel.data.saturation} class="saturation" />
				<span title="Saturation" on:click={() => (editModel.data.saturation = 1)}>Sat</span>
			</div>
		</div>
		<div class="avatar-main">
			<div class="wrapper">
				{#each allOverlays as overlay}
					<ContentBox>
						<header>{overlay.title}</header>

						<div class="choices">
							{#each overlay.items as item}
								<div
									class="choice"
									class:locked={item.locked}
									class:with-patreon={!!item.patreonLink}
									title={item.locked ? item.tooltip : null}
									on:click={() => {
										if (!item.locked) {
											editModel.data.effectName = item.name;
											editModel.data.hue = 0;
											editModel.data.saturation = 1;
										}
									}}>
									<img src={item.preview} />
									{#if item.locked}
										<i class="fas fa-lock" />
										{#if item.patreonLink}
											<a href="https://patreon.com/BeatLeader" target="_blank">Patreon</a>
										{/if}
									{/if}
								</div>
							{/each}
						</div>
					</ContentBox>
				{/each}
			</div>
			<footer>
				<Button
					type="text"
					label="Clear selection"
					on:click={() => {
						editModel.data.effectName = null;
						editModel.data.hue = 0;
						editModel.data.saturation = 1;
					}} />
			</footer>
		</div>
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
		background: rgba(0, 0, 0, 0.8);
		-webkit-mask-image: radial-gradient(
			circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 155px,
			transparent 0,
			transparent 120px,
			black 121px
		);
		mask-image: radial-gradient(
			circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 155px,
			transparent 0,
			transparent 120px,
			black 121px
		);
		padding-top: 44px;
		overflow: hidden auto;
	}

	:global(.mirror) .avatar-modal {
		-webkit-mask-image: radial-gradient(
			circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 175px,
			transparent 0,
			transparent 120px,
			black 121px
		);
		mask-image: radial-gradient(
			circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 175px,
			transparent 0,
			transparent 120px,
			black 121px
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

	.avatar-buttons > .range span {
		min-width: 2rem;
	}

	:global(.mirror) .avatar-buttons {
		top: calc(175px - 120px + 230px + 1rem);
	}

	.avatar-main {
		padding-left: calc((100vw - min(65em, 100vw - 2rem)) / 2 - 0.75rem + 240px);
	}

	.avatar-main .wrapper {
		display: flex;
		justify-content: flex-start;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.avatar-main :global(.content-box) {
		margin: 0;
	}

	.avatar-main header,
	.avatar-main footer {
		font-size: 1em;
		text-transform: uppercase;
	}

	.avatar-main footer {
		display: flex;
		justify-content: center;
	}

	.avatar-main .wrapper :global(> *) {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: calc(128px + 2rem);
		min-width: 144px;
	}

	.avatar-main .choices {
		display: contents;
	}

	.avatar-main .choice {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		place-items: center;
		cursor: pointer;
	}

	.avatar-main .choice.locked {
		cursor: not-allowed;
	}

	.avatar-main .choice > * {
		grid-row: 1/1;
		grid-column: 1/1;
	}

	.avatar-main .choice a {
		color: var(--textColor) !important;
		font-size: 0.875em;
		margin-top: 1.75em;
		text-decoration: underline;
	}

	.avatar-main .choice i {
		font-size: 1.5em;
		color: var(--faded);
	}

	.avatar-main .choice.with-patreon i {
		margin-bottom: 1em;
	}

	.avatar-main .choice img {
		aspect-ratio: 1/1;
		width: 128px;
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
				transparent 0,
				transparent 120px,
				black 121px
			);
			mask-image: radial-gradient(
				circle 120px at calc((100vw - min(65em, 100vw)) / 2 + 120px - 2rem - 12.5em) 155px,
				transparent 0,
				transparent 120px,
				black 121px
			);
		}

		:global(.mirror) .avatar-modal {
			-webkit-mask-image: radial-gradient(
				circle 120px at calc((100vw - min(65em, 100vw)) / 2 + 120px - 2rem - 12.5em) 175px,
				transparent 0,
				transparent 120px,
				black 121px
			);
			mask-image: radial-gradient(
				circle 120px at calc((100vw - min(65em, 100vw)) / 2 + 120px - 2rem - 12.5em) 175px,
				transparent 0,
				transparent 120px,
				black 121px
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
			mask-image: radial-gradient(
				circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 167px,
				transparent 0,
				transparent 120px,
				black 121px
			);
			-webkit-mask-image: radial-gradient(
				circle 120px at calc((100vw - 2rem - min(65em, 100vw - 2rem)) / 2 + 120px - 0.75rem) 167px,
				transparent 0,
				transparent 120px,
				black 121px
			);
		}

		.avatar-buttons {
			top: calc(167px - 120px + 230px + 1rem);
			left: calc((100vw - min(65em, 100vw - 2rem)) / 2 - 0.75rem);
		}
	}

	@media screen and (max-width: 767px) {
		.avatar-modal {
			mask-image: radial-gradient(circle 120px at calc(100vw / 2 - 0.5rem) 103px, transparent 0, transparent 120px, black 121px);
			-webkit-mask-image: radial-gradient(circle 120px at calc(100vw / 2 - 0.5rem) 103px, transparent 0, transparent 120px, black 121px);
			padding-top: 240px !important;
		}

		:global(.mirror) .avatar-modal {
			mask-image: radial-gradient(circle 120px at calc(100vw / 2 - 0.5rem) 113px, transparent 0, transparent 120px, black 121px);
			-webkit-mask-image: radial-gradient(circle 120px at calc(100vw / 2 - 0.5rem) 113px, transparent 0, transparent 120px, black 121px);
		}

		.avatar-buttons {
			position: relative;
			left: calc(100vw / 2 - 120px);
			top: 0 !important;
		}

		.avatar-main {
			position: relative;
			padding-left: 0;
			margin-top: 1rem;
		}
	}
</style>
