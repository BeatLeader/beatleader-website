<script>
	import AchievementDetails from '../Common/Achievements/AchievementDetails.svelte';
	import DialogContent from '../Common/DialogContent.svelte';
	import {Confetti} from 'svelte-confetti';
	import ToolTip from '../Common/ToolTip.svelte';

	export let achievement;
	export let confirm;
	export let cancel;
	export let badge;

	let animationPlayer = null;

	let achievementDescription;

	function fetchAchievementDescription(achievement) {
		if (achievement?.levelId == 18) {
			achievementDescription = 'passing a map and creating a canvas';
		} else if (achievement?.levelId == 19) {
			achievementDescription = 'passing all maps and collecting all stickers';
		}
	}

	$: fetchAchievementDescription(achievement);
	$: animationPlayer && animationPlayer.play();
</script>

<div class="dialog-container">
	<DialogContent title="Love Live! achievement" okButton="Done" okButtonType="green" on:confirm={confirm} on:cancel={cancel}>
		<div slot="content" class="content-container">
			<div class="top-container">
				<div class="details-and-confetti">
					<AchievementDetails {achievement} showDetails={false} />
					<div class="confetti-container">
						<Confetti duration={3000} x={[-0.25, -1]} y={[-1, 1]} />
						<Confetti duration={3000} x={[0.25, 1]} y={[-1, 1]} />
					</div>
				</div>
				{#if badge}
					<span class="badge-title" style="z-index: 1;">You received the "LoveLiver" achievement for {achievementDescription}.<br /> Also you received a badge "{badge.title}". Congratulations!<br /></span>
					<a class="badge-link" href={badge.link}>
						<ToolTip content={badge.title}>
							<img class="badge-image clickable" src={badge.src} alt={badge.title} />
						</ToolTip>
					</a>
				{:else}
					<span class="badge-title" style="z-index: 1;">You received the "LoveLiver" achievement for {achievementDescription}. Congratulations!<br /></span>
				{/if}
				<span class="footer-text" style="z-index: 1;"
					>We hope you had fun playing Beat Saber and creating your own idol board. Thank you for participating in the event!</span>
					<span class="footer-text">Your canvas will remain available in the "My Achievements" section. View it by clicking on the achievement. You have time untill the end of the month to update and then it will freeze forever!</span>

				<img src="/assets/lovelivecongrats_2.gif" class="illustration1" />
				<img src="/assets/lovelivecongrats_1.gif" class="illustration2" />
			</div>
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}

	.top-container {
		width: 70vw;
		height: 60vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2em;
		overflow: hidden;
	}

	.details-and-confetti {
		position: relative;
		display: flex;
		z-index: 1;
	}
	.confetti-container {
		position: absolute;
		display: flex;
		justify-content: space-between;
		align-items: center;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		pointer-events: none;
	}

	.illustration1 {
		display: block;
		position: absolute;
		width: 15em;
		top: 3%;
		right: 2%;
		z-index: 0;
		border-radius: 12px;
	}
	.illustration2 {
		display: block;
		position: absolute;
		width: 15em;
		height: 15em;
		bottom: 3%;
		left: 0%;
		z-index: 0;
		margin-bottom: -1.2em;
	}

	.badge-image {
		height: 88px;
	}

	.badge-link {
		display: contents;
		touch-action: none;
	}

	.clickable {
		cursor: pointer;
	}

	.footer-text {
		max-width: 45em;
	}

	.badge-title {
		max-width: 45em;
	}

	:global(.top-container .atropos-highlight) {
		top: -150% !important;
		height: 400% !important;
		background-image: radial-gradient(circle at 50%, rgb(119 167 230 / 23%), transparent 50%) !important;
	}

	@media screen and (max-width: 767px) {
		.content-container {
			height: 28em;
    		overflow: auto;
		}
		.top-container {
			width: unset;
			height: unset;
		}

		:global(.details-and-confetti .achievement-container) {
			padding: 0.5em;
		}

		.illustration2 {
			width: 12em;
			height: 12em;
			bottom: 7px;
			position: relative;
		}

		.illustration1 {
			display: none;
		}

		:global(.dialog-container:has(.illustration2)) {
			overflow: hidden;
		}
	}
</style>
