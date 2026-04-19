<script>
	import Button from '../../Common/Button.svelte';
	import DialogContent from '../../Common/DialogContent.svelte';
	import {Confetti} from 'svelte-confetti';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import prestigeDescriptionsStore from '../../../stores/beatleader/prestige-descriptions';

	const lottieImport = () => import('@lottiefiles/svelte-lottie-player').then(m => m.LottiePlayer);

	export let playerInfo;
	export let confirm;
	export let cancel;

	let animationPlayer = null;

	let prestiged = false;
	let showConfetti = false;

	function prestige() {
		fetch(`${BL_API_URL}experience/prestige`, {credentials: 'include'})
			.then(response => {
				if (response.status === 200) {
					animationPlayer && animationPlayer.play();

					setTimeout(() => {
						showConfetti = true;
						prestiged = true;
					}, 2000);
				}
			});
	}
</script>

<div class="dialog-container">
	<DialogContent
		title="Prestige"
		type="confirm"
		okButton={prestiged ? 'Done' : null}
		cancelButton={prestiged ? null : 'Cancel'}
		okButtonType="green"
		on:confirm={() => confirm(prestiged)}
		on:cancel={cancel}>
		<div slot="content">
			<div class="top-container">
				{#if !prestiged}
					<span style="z-index: 1;">You have reached the maximum level and are ready to prestige!<br /></span>
				{:else}
					<span style="z-index: 1;">Congrats!<br /></span>
					{#if showConfetti}
						<div class="details-and-confetti">
							<div class="confetti-container">
								<Confetti duration={3000} x={[-0.25, -1]} y={[-1, 1]} />
								<Confetti duration={3000} x={[0.25, 1]} y={[-1, 1]} />
							</div>
						</div>
					{/if}
				{/if}
				{#await lottieImport()}
					<div></div>
				{:then LottiePlayer}
					<div class="illustration2">
						<svelte:component
							this={LottiePlayer}
							width="7em"
							height="7em"
							controls={false}
							loop={false}
							bind:this={animationPlayer}
							src={$prestigeDescriptionsStore.find(prestige => prestige.level === playerInfo?.prestige)?.prestigeAnimationLink} />
					</div>
				{/await}
				<div class="prestige-description">
					<span style="z-index: 1;"><b>Current Prestige: {prestiged ? playerInfo?.prestige + 1 : playerInfo?.prestige}</b></span><br />
					{#if !prestiged}
						<div class="prestige-button">
							<Button
								type="primary"
								label="Level Up!"
								iconSvg="/assets/prestige.svg"
								bgColor="#b179d4"
								activeBgColor="#daa4fc"
								on:click={() => prestige()} />
						</div>
						<span style="z-index: 1;"
							>You will spend all your current levels, and ascend to prestige level {playerInfo?.prestige + 1}.</span>
						<span style="z-index: 1;">Are you sure you want to prestige?</span>
					{:else}
						<span style="z-index: 1;">You have successfully prestiged!<br /></span>
					{/if}
				</div>
			</div>
		</div></DialogContent>
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
		height: 63vh;
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
		width: 20em;
		height: 20em;
		z-index: 0;
	}

	.prestige-description {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1em;
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
