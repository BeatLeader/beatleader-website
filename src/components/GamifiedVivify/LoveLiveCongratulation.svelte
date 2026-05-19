<script>
	import DialogContent from '../Common/DialogContent.svelte';
	import {Confetti} from 'svelte-confetti';
	import {navigate} from 'svelte-routing';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let newIdols = [];
	export let confirm;
	export let cancel;

	function reportViewed() {
		fetch(`${BL_API_URL}event/lovelive/mark-idols-seen`, {
			method: 'POST',
			credentials: 'include',
		});
	}

	// Pick a random reward gif from idols that have one
	const ALL_MAPS_IDOL_ID = 67;
	$: allMapsIdol = newIdols.find(idol => idol.id === ALL_MAPS_IDOL_ID);
	$: idolsWithGif = newIdols.filter(idol => idol.rewardGif);
	$: randomGif = allMapsIdol?.rewardGif
		? allMapsIdol.rewardGif
		: idolsWithGif.length > 0
			? idolsWithGif[Math.floor(Math.random() * idolsWithGif.length)].rewardGif
			: null;
	$: reportViewed();
</script>

<div class="dialog-container">
	<DialogContent title="New Idols Unlocked!" okButton="Yay!" okButtonType="green" on:confirm={confirm} on:cancel={cancel}>
		<div slot="content">
			<div class="top-container">
				{#if allMapsIdol}
					<div class="confetti-container">
						<Confetti duration={20000} x={[-0.25, -1.5]} y={[-2, 2]} colorArray={['#ff6b9d', '#ffa8c9', '#ffcce0', '#ff85b3']} />
						<Confetti duration={20000} x={[0.25, 1.5]} y={[-2, 2]} colorArray={['#ff6b9d', '#ffa8c9', '#ffcce0', '#ff85b3']} />
					</div>
				{/if}

				<div class="header-section">
					<h2>💖 Congratulations! 💖</h2>
					{#if allMapsIdol}
						<p>You've unlocked all the idols in the event!</p>
					{:else}
						<p>You've unlocked {newIdols.length} new idol{newIdols.length > 1 ? 's' : ''}</p>
					{/if}
				</div>

				<div class="idols-grid">
					{#each newIdols as idol}
						<div class="idol-card" title={idol.description} class:all-maps-idol={allMapsIdol}>
							<img src={idol.bigPictureRegular || idol.smallPictureRegular} alt={idol.name} class="idol-image" />
							<span class="idol-name">{idol.name}</span>
						</div>
					{/each}
				</div>

				{#if randomGif}
					<img src={randomGif} alt="Celebration" class="reward-gif" class:all-maps-idol={allMapsIdol} />
				{/if}

				{#if allMapsIdol}
					<a href="/event/lovelive" on:click|preventDefault|stopPropagation={() => navigate('/event/lovelive')} class="footer-text"
						>Thank you for playing! We hope you had fun and enjoyed the event! 🫡</a>
				{:else}
					<a href="/event/lovelive" on:click|preventDefault|stopPropagation={() => navigate('/event/lovelive')} class="footer-text"
						>Head to the "Love Live! Birthday Pack" event page to add them to your board!</a>
				{/if}
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
		width: min(70vw, 600px);
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 1.5em;
		overflow-y: auto;
		position: relative;
		padding: 1em;
	}

	.confetti-container {
		position: absolute;
		display: flex;
		justify-content: center;
		padding-top: 12em;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
	}

	.header-section {
		text-align: center;
		z-index: 1;
	}

	.header-section h2 {
		font-size: 1.8rem;
		margin: 0;
		background: linear-gradient(90deg, #ff6b9d, #ffa8c9, #ff6b9d);
		background-size: 200% auto;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: gradient-shift 3s ease infinite;
	}

	.header-section p {
		color: #ffa8c9;
		margin: 0.5em 0 0 0;
		font-size: 1.1rem;
	}

	@keyframes gradient-shift {
		0%,
		100% {
			background-position: 0% center;
		}
		50% {
			background-position: 200% center;
		}
	}

	.idols-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
		z-index: 1;
		max-width: 100%;
	}

	.idol-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: rgba(255, 107, 157, 0.1);
		border: 2px solid rgba(255, 107, 157, 0.3);
		border-radius: 12px;
		transition: transform 0.2s ease;
	}

	.idol-card:hover {
		transform: scale(1.05);
	}

	.idol-image {
		width: 70px;
		height: 70px;
		object-fit: contain;
		border-radius: 8px;
		filter: drop-shadow(0 4px 8px rgba(255, 107, 157, 0.3));
	}

	.idol-card.all-maps-idol {
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 107, 157, 0.15));
		border-color: rgba(255, 215, 0, 0.5);
		padding: 1rem;
	}

	.reward-gif.all-maps-idol {
		max-width: 35em;
	}

	.idol-name {
		font-size: 0.85rem;
		color: #ffa8c9;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.reward-gif {
		max-width: 200px;
		max-height: 200px;
		border-radius: 12px;
		z-index: 1;
	}

	.footer-text {
		color: rgba(255, 168, 201, 0.8);
		font-size: 0.95rem;
		text-align: center;
		margin: 0;
		z-index: 1;
		text-decoration: underline;
		cursor: pointer;
	}
	.footer-text:hover {
		color: rgba(255, 168, 201, 1);
	}

	@media screen and (max-width: 767px) {
		.top-container {
			width: 85vw;
		}

		.header-section h2 {
			font-size: 1.4rem;
		}

		.idol-image {
			width: 50px;
			height: 50px;
		}

		.reward-gif.all-maps-idol {
			max-width: 18em;
		}

		.idol-name {
			font-size: 0.75rem;
			max-width: 60px;
		}

		.reward-gif {
			max-width: 150px;
			max-height: 150px;
		}
	}
</style>
