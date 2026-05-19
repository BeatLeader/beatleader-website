<script>
	import FaSvgIcon from '../Common/FaSvgIcon.svelte';

	export let songStatus;

	const characterImages = {
		'Wii Coconut Mall': 'mariocart_1.webp',
		'Lumière': 'expedition33_1.webp',
		'Great Asset': 'lethalcompany_1.webp',
		'Turret Orchestra': 'portal2_1.webp',
		'Passing Memories': 'genshin_1.webp',
		'115': 'callofduty_1.webp',
		'Comet Observatory': 'mariogalaxy_1.webp',
		'Give Me Something': 'arknights_1.webp',
		'Ballad of the Goddess': 'zelda_1.webp',
		'Fallen Kingdom': 'minecraft_1.webp',
		'Pompeii': 'skyrim_1.webp',
		'Dragonborn': 'skyrim_2.webp',
	};

	$: characterImage = songStatus.song?.name ? characterImages[songStatus.song.name] : null;

	let hovered = false;

	function formatBirthday(timestamp) {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC',
		});
	}
</script>

<a
	href={songStatus.song ? `/leaderboard/global/${songStatus.song.id}` : null}
	class="song-card {songStatus.blockScore && (!songStatus.hasPoodleDiff || songStatus.poodleScore) ? 'unlocked' : 'locked'}"
	style="--cover-url: url({songStatus.song?.coverImage || '/assets/song-default.webp'})"
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}>
	<div class="song-cover-bg"></div>
	{#if characterImage}
		<div class="character-reveal" class:visible={hovered}>
			<img src="/assets/gamifyvivify/{characterImage}" alt="Character" />
		</div>
	{/if}
	<div class="song-content">
		<div class="idol-info">
			<!-- <img 
                src={songStatus.score ? songStatus.idolDescription.smallPictureRegular : songStatus.idolDescription.smallPictureRegular} 
                alt={songStatus.idolDescription.name}
                class="idol-avatar {songStatus.score ? '' : 'locked-avatar'}"
            /> -->
			<span class="song-name">{songStatus.song.name}</span>
			<span class="song-author">{songStatus.song.author}</span>
		</div>
		{#if songStatus.song}
			<div class="song-mapper">{songStatus.song.mapper}</div>
		{/if}
		<div class="score-badges">
			<!-- <div class="idol-description">{songStatus.idolDescription.description}</div> -->
			{#if songStatus.blockScore}
				<div class="score-badge">
					<FaSvgIcon src="/assets/block-icon.svg" title="Cubes difficulty" />
					{(songStatus.blockScore.accuracy * 100).toFixed(2)}%
				</div>
			{:else}
				<div class="locked-badge"><FaSvgIcon src="/assets/block-icon.svg" title="Cubes difficulty" />Not played</div>
			{/if}
			{#if songStatus.hasPoodleDiff}
				{#if songStatus.poodleScore}
					<div class="score-badge">
						<FaSvgIcon src="/assets/poodle-icon.svg" title="Poodles difficulty" />
						{(songStatus.poodleScore.accuracy * 100).toFixed(2)}%
					</div>
				{:else}
					<div class="locked-badge"><FaSvgIcon src="/assets/poodle-icon.svg" title="Poodles difficulty" />Not played</div>
				{/if}
			{/if}
		</div>
	</div>
</a>

<style>
	.song-card {
		position: relative;
		width: 242px;
		height: 220px;
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		text-decoration: none;
		color: white;
	}

	.song-card:hover {
		transform: translateY(-5px) scale(1.02);
		box-shadow: 0 10px 30px rgba(255, 107, 157, 0.3);
		overflow: visible;
		z-index: 3;
	}

	.song-card.locked {
		filter: grayscale(0.5);
		opacity: 0.8;
	}

	.song-card.locked:hover {
		filter: grayscale(0.3);
		opacity: 0.9;
	}

	.song-cover-bg {
		position: absolute;
		inset: 0;
		background-image: var(--cover-url);
		background-size: cover;
		background-position: center;
		filter: blur(2px) brightness(0.4);
	}

	.character-reveal {
		position: absolute;
		right: -8em;
		top: -8em;
		width: 100%;
		z-index: 4;
		height: 100%;
		overflow: hidden;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.character-reveal.visible {
		opacity: 1;
	}

	.character-reveal img {
		position: absolute;
		bottom: -10%;
		left: 50%;
		transform: translateX(-50%) translateY(20%);
		height: 130%;
		width: auto;
		object-fit: contain;
		transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.character-reveal.visible img {
		transform: translateX(-50%) translateY(0%);
	}

	.song-content {
		position: relative;
		z-index: 3;
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		gap: 0.5rem;
	}

	.score-badges {
		column-count: 2;
		column-gap: 0.5rem;
	}

	.birthday-badge {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		background: rgba(255, 107, 157, 0.8);
		padding: 0.25rem 0.5rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		width: fit-content;
	}

	.birthday-icon {
		font-size: 0.9rem;
	}

	.idol-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-direction: column;
		justify-content: center;
		flex: 1;
		text-align: center;
	}

	.idol-avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 2px solid #ff6b9d;
		object-fit: cover;
	}

	.idol-avatar.locked-avatar {
		filter: grayscale(1) brightness(0.7);
		border-color: #666;
	}

	.song-name {
		font-weight: 600;
		font-size: 1.15rem;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
	}

	.song-mapper {
		font-size: 0.85rem;
		opacity: 0.9;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
	}

	.score-badge {
		background: linear-gradient(135deg, #4caf50, #45a049);
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		text-align: center;
		gap: 0.4em;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.locked-badge {
		background: rgba(0, 0, 0, 0.6);
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		font-size: 0.8rem;
		text-align: center;
		gap: 0.4em;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.idol-description {
		font-size: 0.75rem;
		opacity: 0.8;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
		display: none;
	}

	@media (max-width: 1024px) {
		.song-card {
			width: 16em;
			height: 12em;
		}

		.idol-avatar {
			width: 40px;
			height: 40px;
		}
	}

	@media (max-width: 480px) {
		.calendar-top,
		.calendar-bottom {
			justify-content: center;
		}

		.idol-name {
			width: 50%;
		}

		.song-card {
			width: 12em;
			height: unset;
			font-size: 0.85rem;
		}

		.idol-info {
			flex: 0;
		}

		.idol-avatar {
			width: 35px;
			height: 35px;
		}

		.idol-description {
			display: block;
			flex: 1;
		}

		.canvas-header {
			flex-direction: column;
			gap: 0.5rem;
		}

		.score-badges {
			display: flex;
			flex-direction: column;
			gap: 0.6em;
			column-count: 1;
			flex: 1;
			justify-content: end;
		}
	}
</style>
