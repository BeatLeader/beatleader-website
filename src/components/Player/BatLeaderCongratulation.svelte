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
		if (achievement?.levelId == 15) {
			achievementDescription = 'passing all the maps in the event';
		} else if (achievement?.levelId == 16) {
			achievementDescription = 'passing all maps in the event on Expert+ difficulty';
		} else if (achievement?.levelId == 17) {
			achievementDescription = 'passing all maps in the event on Expert+ difficulty with at least 80% accuracy';
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
						<Confetti colorArray={['url(/assets/batleader/pumpkin.png)', 'url(/assets/batleader/pumpkin2.png)']} size="30" duration={3000} x={[-0.05, -2]} y={[-2, 2]} />
						<Confetti colorArray={['url(/assets/batleader/pumpkin.png)', 'url(/assets/batleader/pumpkin2.png)']} size="30" duration={3000} x={[0.05, 2]} y={[-2, 2]} />
					</div>
				</div>

				<span style="z-index: 1;">You received the "BatLeader" achievement for {achievementDescription}. Congratulations!<br /></span>
				<span style="z-index: 1; max-width: 43em; text-align: center;"
					>You were a true dedicated bat and we hope you also had fun and enjoyed some maps. Have a great November and let's meet again in the next event!</span>

			<img src="/assets/batleader/Darkrealm7Ghost.png" alt="Darkrealm7 Ghost illustration" class="illustration1 illustration" />
			<img src="/assets/batleader/NitroGhost.png" alt="Nitro Ghost illustration" class="illustration2 illustration" />
			<img src="/assets/batleader/TaylorGamingGhost.png" alt="TaylorGaming Ghost illustration" class="illustration3 illustration" />
			<img src="/assets/batleader/PoochyGhost.png" alt="Poochy Ghost illustration" class="illustration4 illustration" />
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

	@keyframes hover-float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-15px);
		}
	}

	.illustration {
		width: 14em;
		height: 14em;
		animation: hover-float 3s ease-in-out infinite;
		opacity: 0.8;
	}

	.illustration1 {
		display: block;
		position: absolute;
		top: 4%;
		right: 3%;
		z-index: 0;
		animation-delay: 0s;
	}
	.illustration2 {
		display: block;
		position: absolute;
		bottom: 3%;
		left: 2%;
		z-index: 0;
		margin-bottom: -1.2em;
		animation-delay: 0.43s;
	}
	.illustration3 {
		display: block;
		position: absolute;
		top: 2%;
		left: 2%;
		z-index: 0;
		animation-delay: 0.8s;
	}
	.illustration4 {
		display: block;
		position: absolute;
		bottom: 5%;
		right: 3%;
		z-index: 0;
		margin-bottom: -1.2em;
		animation-delay: 2.25s;
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

		.illustration {
			width: 9em;
			height: 9em;
		}

		.illustration1 {
			top: 5%;
			right: 2%;
		}

		.illustration2 {
			bottom: 7px;
			left: 2%;
		}

		.illustration3 {
			top: 5%;
			left: 2%;
		}

		.illustration4 {
			bottom: 7px;
			right: 2%;
		}

		:global(.dialog-container:has(.illustration1, .illustration2, .illustration3, .illustration4)) {
			overflow: hidden;
		}
	}
</style>
