<script>
	import {fade} from 'svelte/transition';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {presetTypeFromMask} from '../../utils/beatleader/format';
	import createAccountStore from '../../stores/beatleader/account';
	import createPresetService from '../../services/beatleader/reepresets';
	import createPlayerService from '../../services/beatleader/player';
	import Button from '../Common/Button.svelte';
	import LikeButton from './LikeButton.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import PresetTag from './PresetTag.svelte';

	export let preset;

	document.body.classList.remove('slim');

	const account = createAccountStore();
	const presetService = createPresetService();
	const playerService = createPlayerService();

	let name = '';
	let tags = [];
	let description = '';
	let iconUrl = null;

	function updateFields(preset) {
		name = preset?.name ?? '';
		tags = preset?.tags ? presetTypeFromMask(preset?.tags).split(',') : [];
		iconUrl = preset?.coverLink ?? 'https://cdn.assets.beatleader.xyz/NTG.png';
		description = preset?.description ?? '';
	}

	function likeToggled() {
		presetService.react(preset, 1);
	}

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	let player;

	async function retrievePlayer(preset) {
		if (!preset) return;

		player = await playerService.fetchPlayerOrGetFromCache(preset.ownerId);
	}

	$: retrievePlayer(preset);

	$: updateFields(preset);
	$: downloadsCount = preset?.downloadsCount ?? 0;
</script>

{#if preset?.id}
	<section class="preset-info" transition:fade|global>
		<div class="presetData">
			<div class="imageInput">
				<img class="presetImage" src={iconUrl} alt="PresetIcon" />
				{#if player}
					<div class="player-info">
						<Avatar {player} />
						<PlayerNameWithFlag hideFlag={true} {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
					</div>

					<div class="upload-time">
						<div class="timeset">
							<span style="color: {getTimeStringColor(preset?.timeposted)}; ">
								{formatDateRelative(dateFromUnix(preset.timeposted))}
							</span>
						</div>
					</div>
				{/if}
				<div class="like-button-container">
					<LikeButton
						likeCount={preset?.reactionsCount ?? 0}
						liked={preset?.reactions?.find(r => r.authorId == $account?.id)}
						on:toggled={() => likeToggled()} />
				</div>
			</div>

			<section class="form">
				<section>
					<section>
						<span class="presetName">{name}</span>
						<span class="downloadsCount"> ({downloadsCount + ' downloads'})</span>
					</section>

					{#if tags.length}
						{#each tags as tag}
							<PresetTag {tag} />
						{/each}
					{/if}
				</section>
				<section class="info desktop">
					<div class="message-body sun-editor-editable">
						{@html description}
					</div>
				</section>

				<section class="buttons-container">
					<Button
						iconFa="fas fa-download"
						title={'Download preset as a zip'}
						label="For PC"
						url={BL_API_URL + `reepresets/${preset.id}/download/pc`}
						onlyurl={true}
						type="green" />
					<Button
						iconFa="fas fa-download"
						title={'Download preset as a qmod'}
						label="For Quest"
						url={BL_API_URL + `reepresets/${preset.id}/download/quest`}
						onlyurl={true}
						type="green" />
				</section>
			</section>

			<section class="info up-to-tablet">
				<div class="message-body sun-editor-editable">
					{@html description}
				</div>
			</section>
		</div>
	</section>
{/if}

<style>
	.preset-info {
		width: 100%;
		border-radius: 15%;
		display: flex;
		flex-direction: column;
	}

	.player-info {
		position: absolute;
		top: 1.2em;
		left: 0.6em;
		display: flex;
		gap: 0.3em;
		background-color: #000000b8;
		padding: 0.3em;
		border-radius: 10px;
	}

	.like-button-container {
		position: absolute;
		left: 0.6em;
		bottom: 1.6em;
	}

	.upload-time {
		position: absolute;
		top: 3.2em;
		left: 0.6em;
	}

	.buttons-container {
		display: flex;
		gap: 0.5em;
	}

	.presetData {
		display: flex;
		gap: 0.8rem;
	}

	.presetName {
		font-size: 1.2em;
		font-weight: bold;
	}

	.downloadsCount {
		font-size: 0.8em;
	}

	.presetData .form {
		flex-grow: 1;
		padding: 0.8rem;
	}

	.presetData .form > section:not(:last-child) {
		margin-bottom: 0.5rem;
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		align-items: center;
		margin-left: 1.5em;
		position: relative;
	}

	.presetImage {
		width: 16em;
		max-width: none;
	}

	.presetTag {
		color: var(--preset-color, 'red');
	}

	.preset-stats :global(> *) {
		margin-bottom: 0 !important;
	}

	.info {
		max-height: 17em;
		overflow: scroll;
		word-break: break-word;
	}

	.up-to-tablet {
		display: none;
	}

	.desktop {
		display: block;
	}

	@media screen and (max-width: 500px) {
		.presetData {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.preset-stats {
			display: flex;
			flex-direction: column;
		}

		.imageInput {
			margin: 0.7em;
		}

		.up-to-tablet {
			display: block;
		}

		.desktop {
			display: none;
		}
	}
	@media (hover: none) {
		.preset-info.rainbow {
			color: #00ffbc;
			-webkit-background-clip: text;
			background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
			-webkit-animation: rainbow 0.9s infinite linear;
			animation: rainbow 0.9s infinite linear;
		}
	}
</style>
