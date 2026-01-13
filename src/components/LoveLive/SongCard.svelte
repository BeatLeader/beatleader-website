<script>
    export let songStatus;

    function formatBirthday(timestamp) {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		});
	}
</script>

<a 
    href={songStatus.song ? `/leaderboard/global/${songStatus.song.id}` : null}
    class="song-card {songStatus.score ? 'unlocked' : 'locked'}"
    style="--cover-url: url({songStatus.song?.coverImage || '/assets/song-default.webp'})"
>
    <div class="song-cover-bg"></div>
    <div class="song-content">
        <div class="birthday-badge">
            <span class="birthday-icon">🎂</span>
            <span>{formatBirthday(songStatus.idolDescription.birthday)}</span>
        </div>
        <div class="idol-info" title={songStatus.idolDescription.description}>
            <img 
                src={songStatus.score ? songStatus.idolDescription.smallPictureRegular : songStatus.idolDescription.smallPictureRegular} 
                alt={songStatus.idolDescription.name}
                class="idol-avatar {songStatus.score ? '' : 'locked-avatar'}"
            />
            <span class="idol-name">{songStatus.idolDescription.name}</span>
        </div>
        {#if songStatus.song}
            <div class="song-name">{songStatus.song.name}</div>
        {/if}
        <div class="idol-description">{songStatus.idolDescription.description}</div>
        {#if songStatus.score}
            <div class="score-badge">
                ✓ {(songStatus.score.accuracy * 100).toFixed(2)}%
            </div>
        {:else}
            <div class="locked-badge">🔒 Pass to unlock</div>
        {/if}
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
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		text-decoration: none;
		color: white;
	}

	.song-card:hover {
		transform: translateY(-5px) scale(1.02);
		box-shadow: 0 10px 30px rgba(255, 107, 157, 0.3);
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

	.song-content {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		gap: 0.5rem;
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
		flex: 1;
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

	.idol-name {
		font-weight: 600;
		font-size: 0.95rem;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
	}

	.song-name {
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
	}

	.locked-badge {
		background: rgba(0, 0, 0, 0.6);
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		font-size: 0.8rem;
		text-align: center;
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
		.calendar-top, .calendar-bottom {
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
	}
</style>