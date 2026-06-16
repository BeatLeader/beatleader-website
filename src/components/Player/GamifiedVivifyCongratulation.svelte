<script>
	import AchievementDetails from '../Common/Achievements/AchievementDetails.svelte';
	import DialogContent from '../Common/DialogContent.svelte';
	import {Confetti} from 'svelte-confetti';
	import ToolTip from '../Common/ToolTip.svelte';

	export let confirm;
	export let cancel;
	export let badge;

	let animationPlayer = null;

	$: animationPlayer && animationPlayer.play();
</script>

<div class="dialog-container">
	<DialogContent title="Gamified Vivify badge" okButton="Done" okButtonType="green" on:confirm={confirm} on:cancel={cancel}>
		<div slot="content" class="content-container">
			<div class="top-container">
				
				<span class="badge-title" style="z-index: 1;"
					>You received the "Gamified Vivify" badge "{badge.title}" Congratulations!<br /></span>
				
				<div class="details-and-confetti">
					<a class="badge-link" href={badge.link}>
						<ToolTip content={badge.title}>
							<img class="badge-image clickable" src={badge.src} alt={badge.title} />
						</ToolTip>
					</a>
					<div class="confetti-container">
						<Confetti duration={3000} x={[-0.25, -1]} y={[-1, 1]} />
						<Confetti duration={3000} x={[0.25, 1]} y={[-1, 1]} />
					</div>
				</div>
				{#if badge.title.toLowerCase().includes('champion')}
				<span class="footer-text" style="z-index: 1;"
					>You won the first place in your category, impressive! NSGolova already messaged you on the Discord about the prize. You can choose the game license from the list of all available games.</span><br />
					{:else}
					<span class="footer-text" style="z-index: 1;"
					>You won a game license! NSGolova will message you on the Discord or any other platform he can find you on, after the players higher than you have chosen their licenses.</span>
					{/if}

				<img src="/assets/gamifiedvivifycongrats_2.gif" class="illustration1" />
				<img src="/assets/gamifiedvivifycongrats_1.webp" class="illustration2" />
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
		height: 27em;
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
			height: 22em;
			bottom: 7px;
			margin-left: -14em;
			position: relative;
		}

		.illustration1 {
			position: relative;
			margin-bottom: -26em;
        margin-right: -14em;
		}

		:global(.dialog-container:has(.illustration2)) {
			overflow: hidden;
		}
	}
</style>
