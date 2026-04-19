<script>
	import ContentBox from '../../Common/ContentBox.svelte';
	import ToolTip from '../../Common/ToolTip.svelte';
	import Button from '../../Common/Button.svelte';
	import {getContext} from 'svelte';
	import PrestigeDialog from './PrestigeDialog.svelte';
	import prestigeDescriptionsStore from '../../../stores/beatleader/prestige-descriptions';

	export let playerInfo;
	export let canPrestige = false;

	const {open, close} = getContext('simple-modal');

	let currentPrestigeDescription = null;
	let requiredExperience = 0;

	let experienceTooltip = null;
	function getCurrentPrestigeDescription(playerInfo) {
		if (!$prestigeDescriptionsStore) {
			currentPrestigeDescription = null;
			return;
		}
		currentPrestigeDescription = $prestigeDescriptionsStore.find(prestige => prestige.level === playerInfo?.prestige);

		let baseExp = 500;
		let incExp = 50;

		requiredExperience = baseExp + incExp * playerInfo?.level;

		if (playerInfo?.prestige != 0) {
			requiredExperience = Math.round(requiredExperience * Math.pow(1.2, playerInfo?.prestige));
		}

		if (playerInfo?.level < 100) {
			experienceTooltip = playerInfo?.experience + ' | ' + requiredExperience + ' to level ' + (playerInfo?.level + 1);
		} else {
			experienceTooltip = 'Ready to prestige!';
		}
	}

	function prestige() {
		open(PrestigeDialog, {
			playerInfo,
			confirm: (prestiged) => {
				if (prestiged) {
					playerInfo.prestige++;
					playerInfo.experience = 0;
					playerInfo.level = 0;
				}
				close();
			},
			cancel: () => {
				close();
			},
		});
	}

	$: $prestigeDescriptionsStore && playerInfo && getCurrentPrestigeDescription(playerInfo);
</script>

{#if $prestigeDescriptionsStore && (playerInfo?.level || playerInfo?.experience || playerInfo?.prestige)}
	<ContentBox>
		<div class="experience-container">
			<div class="experience-icon-and-level">
				<img class="experience-icon" src={currentPrestigeDescription?.bigIcon} alt="Level" />
				<div class="experience-prestige">
					<span>Prestige:</span>
					<b>{playerInfo?.prestige}</b>
				</div>
			</div>
			<div class="experience-bar-container">
				<ToolTip content={experienceTooltip}>
					<div class="experience-bar" class:max-level={playerInfo?.level >= 100}>
						<div
							class="experience-bar-fill"
							style="width: {playerInfo?.level < 100 ? (playerInfo?.experience / requiredExperience) * 100 : 100}%; background-color: {currentPrestigeDescription?.color ?? 'var(--ppColour)'};">
						</div>
					</div>
				</ToolTip>
			</div>
			{#if playerInfo?.level < 100}
				<div class="experience-level">
					<b>{playerInfo?.level + 1}</b>
				</div>
			{:else if canPrestige}
				<div class="prestige-button">
					<Button type="purple" label="Prestige" iconSvg="/assets/prestige.svg" bgColor="#b179d4" activeBgColor="#daa4fc" on:click={() => prestige()} />
				</div>
			{/if}
		</div>
	</ContentBox>
{/if}

<style>
	.experience-container {
		display: flex;
		justify-content: center;
		gap: 1em;
	}

	.experience-icon-and-level {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.experience-bar-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		border-radius: 5px;
	}

	@keyframes bar-pulse {
		0%, 100% {
			box-shadow: 0 0 2px 1px var(--ppColour);
		}
		50% {
			box-shadow: 0 0 4px 2px var(--ppColour);
		}
	}

	.experience-bar.max-level {
		animation: bar-pulse 2s ease-in-out infinite;
	}

	@keyframes stripes-slide {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: 0% 0;
		}
	}

	:global(.experience-bar-container [tooltip]) {
		width: 100%;
	}

	:global(.experience-bar-container [tooltip]::before) {
		min-width: unset !important;
	}

	.experience-bar {
		width: 100%;
		height: 10px;
		background-color: #7272724f;
		border-radius: 5px;
	}

	.experience-bar::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 6px,
			rgba(255, 255, 255, 0.12) 6px,
			rgba(255, 255, 255, 0.12) 12px
		);
		background-size: 200% 100%;
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
		border-radius: 5px;
		animation: stripes-slide 14s linear infinite;
		animation-play-state: paused;
	}

	.experience-bar:hover::after {
		opacity: 1;
		animation-play-state: running;
	}

	.experience-bar-fill {
		height: 100%;
		opacity: 0.8;
		border-radius: 5px;
		position: relative;
		z-index: 2;
	}

	.experience-bar:hover .experience-bar-fill {
		opacity: 1;
	}

	.experience-level {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.experience-prestige {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.experience-icon {
		width: 3em;
		height: 3em;
	}

	.prestige-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
	}

	:global(.prestige-button button) {
		margin-bottom: 0 !important;
	}

	:global(.prestige-button button .fa-svg-icon) {
		width: 1.5em;
		height: 2em;
		margin-right: 0.5em;
	}
</style>
