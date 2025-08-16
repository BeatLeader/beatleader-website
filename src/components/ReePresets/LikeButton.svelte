<script>
	import {createEventDispatcher} from 'svelte';

	export let liked = false;
	export let likeCount = 0;

	const dispatch = createEventDispatcher();

	let particles = [];

	function toggleLike() {
		liked = !liked;
		if (liked) {
			likeCount = likeCount + 1;
		} else {
			likeCount = likeCount - 1;
		}
		dispatch('toggled');

		if (liked) {
			for (let i = 0; i < 20; i++) {
				particles.push(createParticle());
			}

			particles = particles;
		}
	}

	function createParticle() {
		const angle = Math.random() * Math.PI * 2; // Random angle
		const distance = Math.random() * 80 + 20; // Random distance
		return {
			id: Math.random(),
			style: `--angle: ${angle}; --distance: ${distance}px;`,
		};
	}
</script>

<button class="love-button {liked ? 'liked' : ''}" on:click|preventDefault|stopPropagation={toggleLike}>
	<i class="fas fa-heart icon" />
	<span class="like-count">{likeCount}</span>
	{#each particles as particle (particle.id)}
		<i class="fas fa-heart particle" style={particle.style} />
	{/each}
</button>

<style>
	.love-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		border-radius: 14px;
		border: 2px solid transparent;
		background-color: white;
		cursor: pointer;
		overflow: visible;
		transition: all 0.3s ease;
	}

	.icon {
		margin-bottom: -0.8em;
	}

	.like-count {
		font-weight: bold;
		margin-right: 0.2em;
		font-size: medium;
	}

	.love-button:hover {
		transform: scale(1.1);
	}

	.liked {
		border-color: orange;
		background-color: rgb(216, 203, 152);
	}

	.particle {
		position: absolute;
		bottom: 20px;
		left: 50%;
		font-size: 24px;
		color: rgba(255, 166, 0, 0.753);
		transform: translate(-50%, 100%) rotate(0);
		animation: floatUp 0.4s ease-in forwards;
	}

	@keyframes floatUp {
		to {
			transform: translate(calc(-50% + var(--distance) * cos(var(--angle))), calc(-50% + var(--distance) * sin(var(--angle))));
			opacity: 1;
		}
		75% {
			opacity: 0.75;
		}
		100% {
			opacity: 0;
		}
	}
</style>
