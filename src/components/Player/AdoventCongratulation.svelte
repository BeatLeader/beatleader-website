<script>
	import AchievementDetails from '../Common/Achievements/AchievementDetails.svelte';
	import DialogContent from '../Common/DialogContent.svelte';
	import {Confetti} from 'svelte-confetti';
	const lottieImport = () => import('@lottiefiles/svelte-lottie-player').then(m => m.LottiePlayer);

	export let achievement;
	export let confirm;
	export let cancel;

	let animationPlayer = null;

	let achievementDescription;

	function fetchAchievementDescription(achievement) {
		if (achievement?.levelId == 11) {
			achievementDescription = 'passing all the maps in the event';
		} else if (achievement?.levelId == 12) {
			achievementDescription = 'passing at least 10 maps on their corresponding day of the event';
		} else if (achievement?.levelId == 13) {
			achievementDescription = 'passing all the maps on their corresponding day of the event';
		} else if (achievement?.levelId == 14) {
			achievementDescription = 'receiving any number of Ado points (end the day in the top 10)';
		}
	}

	$: fetchAchievementDescription(achievement);
	$: animationPlayer && animationPlayer.play();
</script>

<div class="dialog-container">
	<DialogContent title="Adovent achievement" okButton="Done" okButtonType="green" on:confirm={confirm} on:cancel={cancel}>
		<div slot="content">
			<div class="top-container">
				<div class="details-and-confetti">
					<AchievementDetails {achievement} showDetails={false} />
					<div class="confetti-container">
						<Confetti duration={3000} x={[-0.25, -1]} y={[-1, 1]} />
						<Confetti duration={3000} x={[0.25, 1]} y={[-1, 1]} />
					</div>
				</div>

				<span style="z-index: 1;">You received the "Adovent" achievement for {achievementDescription}. Congratulations!<br /></span>
				<span style="z-index: 1;"
					>We hope you had fun playing Beat Saber every day and competing in this new format. Let's do more events like this in the future!</span>

				<img src="/assets/adoventanimation.gif" class="illustration1" />
				<img src="/assets/adoventnitronik.gif" class="illustration2" />
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
		width: 20em;
		height: 20em;
		top: 3%;
		right: 2%;
		z-index: 0;
	}
	.illustration2 {
		display: block;
		position: absolute;
		width: 15em;
		height: 15em;
		bottom: 3%;
		left: 2%;
		z-index: 0;
		margin-bottom: -1.2em;
	}

	:global(.top-container .atropos-highlight) {
		top: -150% !important;
		height: 400% !important;
		background-image: radial-gradient(circle at 50%, rgb(119 167 230 / 23%), transparent 50%) !important;
	}

	@media screen and (max-width: 767px) {
		.top-container {
			width: unset;
		}

		.illustration2 {
			width: 12em;
			height: 12em;
			bottom: 7px;
		}

		.illustration1 {
			width: 10em;
			height: 10em;
			top: 5%;
			right: 2%;
		}

		:global(.dialog-container:has(.illustration2)) {
			overflow: hidden;
		}
	}
</style>
