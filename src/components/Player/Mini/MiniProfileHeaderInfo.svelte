<script>
	import Status from '../Status.svelte';
	import Button from '../../Common/Button.svelte';
	import ClanBadges from '../ClanBadges.svelte';
	import RolesBadge from '../RolesBadge.svelte';
	import MiniHeadsetAndPlatform from './MiniHeadsetAndPlatform.svelte';

	export let name;
	export let playerInfo;
	export let playerId;
	export let playerData;
	export let roles = null;
	export let profileAppearance;

	function showRainbow(player) {
		var result = false;
		player.clans?.forEach(element => {
			if (element.tag == 'GAY') {
				result = true;
			}
		});

		return result;
	}
</script>

<div class="profile-header-info">
	{#if playerInfo}
		<div class="player-nickname {showRainbow(playerInfo) ? 'rainbow' : ''}">
			{#if name}
				<div style="display: flex;">
					<span class="nickname">{name}</span>
				</div>
			{/if}
		</div>

		{#if playerInfo.inactive || playerInfo.banned}
			<span class="status">
				<Status {playerInfo} />
			</span>
		{/if}

		<div class="player-ranking">
			{#if playerInfo?.clans?.length}
				<div class="clan-badges">
					<ClanBadges player={playerInfo} highlightMain={true} />
				</div>
			{/if}
		</div>

		<RolesBadge {profileAppearance} {roles} />

		<div class="summary"><MiniHeadsetAndPlatform {playerData} /></div>
	{/if}
</div>

<style>
	.profile-header-info {
		display: contents;
	}

	.player-nickname {
		display: flex;
		flex-direction: column;
		font-size: 3em;
		font-weight: bold;
		align-items: baseline;
		text-shadow: 1px 1px 5px #00000069;
		margin-bottom: -0.3em;
		margin-top: 0.1em;
	}

	.player-ranking {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.7em;
		font-size: 1.25em;
		font-weight: 500;
		align-items: center;
	}

	.player-ranking:empty {
		display: none;
	}

	:global(.clan-badges .clan-badges) {
		margin-left: -0.3em;
	}

	.alias-input {
		background-color: transparent;
		color: white;
		font-size: larger;
		border-right: none;
		margin-left: -0.2em;
	}

	.alias-prefix {
		font-size: larger;
		font-weight: bold;
	}

	.summary {
		margin-left: 0.2em;
	}

	.player-nickname.rainbow {
		color: #00ffbc;
		-webkit-background-clip: text;
		background-clip: text;
		background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
		-webkit-animation: rainbow 0.9s infinite linear;
		animation: rainbow 0.9s infinite linear;
	}

	.status {
		font-size: smaller;
	}

	.nickname {
		overflow-wrap: anywhere;
	}

	.edit-button {
		position: absolute;
		right: 0.2em;
		bottom: 1.6em;
		font-size: 2em;
	}

	:global(.edit-enabled) .player-ranking {
		margin: 1rem 0;
	}

	:global(.invite-to-clan) {
		width: 2em;
		height: 2em;
		font-size: 12px !important;
		border-radius: 1em !important;
		margin-bottom: -1em !important;
	}

	.sponsor-message {
		padding-top: 1em;
		padding-bottom: 1em;
		display: grid;
	}

	.sponsor-input {
		font-size: inherit;
		padding: 0;
		color: var(--textColor);
		background-color: transparent;
		border: none;
		border-bottom: solid 1px var(--dimmed);
		outline: none;
	}

	.input-reset {
		font-size: inherit;
		padding: 0;
		color: var(--textColor);
		background-color: transparent;
		border: none;
		border-bottom: solid 1px var(--dimmed);
		outline: none;
		max-width: 80vw;
	}

	.input-reset::placeholder {
		color: var(--faded) !important;
	}

	.inlineLink {
		display: contents;
	}

	.pickerContainer {
		font-size: 1rem;
	}

	:global(.editNameButton) {
		margin-bottom: -1em !important;
		font-size: 0.75em !important;
	}
	:global(.banButton) {
		padding: 0 !important;
		font-size: 0.8em !important;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		display: none;
	}

	.player-nickname:hover .score-options-section {
		display: block;
	}

	.warning {
		color: yellow;
	}

	.ids-shortcuts {
		display: flex;
		gap: 0.5em;
	}

	.id-shortcut {
		text-decoration: underline;
		cursor: pointer;
		color: lightblue;
	}

	@media screen and (max-width: 767px) {
		.input-reset {
			flex: 1;
		}

		.player-ranking {
			justify-content: center;
		}

		.player-nickname {
			flex-wrap: wrap !important;
			justify-content: center;
			margin-right: inherit;
		}

		.nickname {
			text-align: center;
		}

		.edit-button {
			bottom: 3.3em;
		}
	}
</style>
