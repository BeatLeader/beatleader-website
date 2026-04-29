<script>
	import {onDestroy, onMount} from 'svelte';
	import {fly, fade} from 'svelte/transition';
	import ContentBox from '../../Common/ContentBox.svelte';
	import createPlayerStreamStore from '../../../stores/beatleader/player-stream';
	import {formatNumber} from '../../../utils/format';
	import {getDiffNameColor} from '../../../utils/beatleader/format';

	export let playerId;
	export let richPresence;

	const stream = createPlayerStreamStore();

	let floatingEvents = [];
	let eventIdCounter = 0;

	const eventIcons = {
		0: '❌',
		1: '💥',
		2: '💣',
		3: '🧱',
		4: '⏸️',
		5: '💀',
	};

	const eventLabels = {
		0: 'Miss',
		1: 'Bad Cut',
		2: 'Bomb Hit',
		3: 'Wall Hit',
		4: 'Pause',
		5: 'Fail',
	};

	$: isPlaying = richPresence?.activityStatus === 2;
	$: isOnline = richPresence?.activityStatus === 1;

	$: if (playerId && isPlaying) {
		stream.connect(playerId);
	} else {
		stream.disconnect();
	}

	$: map = $stream.map;
	$: song = map?.Song;
	$: diff = map?.Difficulty;
	$: ctx = $stream.context;
	$: status = $stream.status;
	$: duration = song?.Duration ?? diff?.Duration ?? 0;
	$: progress = duration > 0 && ctx?.Time ? Math.min(ctx.Time / duration, 1) : 0;
	$: accuracy = ctx?.Accuracy != null ? ctx.Accuracy * 100 : null;
	$: pp = ctx?.Pp ?? 0;
	$: stars = diff?.Stars ?? 0;
	$: diffName = diff?.DifficultyName ?? '';
	$: diffColor = getDiffNameColor(diffName) ?? '#888';

	$: if ($stream.event) {
		spawnFloatingEvent($stream.event);
	}

	function spawnFloatingEvent(ev) {
		const id = eventIdCounter++;
		const icon = eventIcons[ev.Event] ?? '⚡';
		const label = eventLabels[ev.Event] ?? '';
		const x = 20 + Math.random() * 60;

		floatingEvents = [...floatingEvents, {id, icon, label, x}];

		setTimeout(() => {
			floatingEvents = floatingEvents.filter(e => e.id !== id);
		}, 2000);
	}

	function formatTime(seconds) {
		if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	onDestroy(() => {
		stream.disconnect();
	});
</script>

{#if isPlaying || isOnline}
	<ContentBox>
		<div class="rp-container" in:fly|global={{y: 20, duration: 300}} out:fade|global={{duration: 150}}>
			{#if isOnline && !map}
				<div class="rp-online">
					<div class="rp-online-dot"></div>
					<span>Online</span>
				</div>
			{/if}

			{#if map && song}
				<div class="rp-playing">
					<div class="rp-cover-wrapper">
						<img
							class="rp-cover"
							src={song.CoverImage ?? song.FullCoverImage}
							alt={song.Name}
						/>
						<div class="rp-status-badge" class:playing={status === 'playing' || status === 'startedMap'}>
							<span class="rp-status-dot"></span>
							LIVE
						</div>

						<div class="rp-floating-events">
							{#each floatingEvents as ev (ev.id)}
								<div
									class="floating-event"
									style="left: {ev.x}%"
									in:fly={{y: 0, duration: 100}}
								>
									<span class="fe-icon">{ev.icon}</span>
									<span class="fe-label">{ev.label}</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="rp-info">
						<div class="rp-song-name" title={song.Name}>
							{song.Name}
							{#if song.SubName}
								<span class="rp-sub-name">{song.SubName}</span>
							{/if}
						</div>
						<div class="rp-mapper">
							Mapped by <span class="rp-mapper-name">{song.Mapper}</span>
						</div>

						<div class="rp-diff-line">
							<span class="rp-diff-badge" style="background-color: {diffColor}">
								{diffName === 'ExpertPlus' ? 'Expert+' : diffName}
							</span>
							{#if stars > 0}
								<span class="rp-stars">★ {formatNumber(stars, 2)}</span>
							{/if}
						</div>

						<div class="rp-stats">
							{#if accuracy != null}
								<div class="rp-stat">
									<span class="rp-stat-label">Accuracy</span>
									<span class="rp-stat-value">{formatNumber(accuracy, 2)}%</span>
								</div>
							{/if}
							{#if pp > 0}
								<div class="rp-stat">
									<span class="rp-stat-label">PP</span>
									<span class="rp-stat-value rp-pp">{formatNumber(pp, 2)}pp</span>
								</div>
							{/if}
						</div>

						<div class="rp-timeline">
							<span class="rp-time">{formatTime(ctx?.Time)}</span>
							<div class="rp-progress-bar">
								<div
								class="rp-progress-fill"
								style="width: {progress * 100}%; background-color: {diffColor}"
							></div>
							</div>
							<span class="rp-time">{formatTime(duration)}</span>
						</div>
					</div>
				</div>
			{:else if isPlaying}
				<div class="rp-online">
					<div class="rp-online-dot playing"></div>
					<span>Playing...</span>
				</div>
			{/if}
		</div>
	</ContentBox>
{/if}

<style>
	.rp-container {
		position: relative;
		overflow: hidden;
	}

	.rp-online {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.3em 0;
		font-size: 0.95em;
		color: #ccc;
	}

	.rp-online-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #43b581;
		box-shadow: 0 0 6px #43b581;
		animation: pulse-dot 2s ease-in-out infinite;
	}

	.rp-online-dot.playing {
		background: #faa61a;
		box-shadow: 0 0 6px #faa61a;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.rp-playing {
		display: flex;
		gap: 1em;
		align-items: flex-start;
	}

	.rp-cover-wrapper {
		position: relative;
		flex-shrink: 0;
		width: 100px;
		height: 100px;
		border-radius: 8px;
		overflow: hidden;
	}

	.rp-cover {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}

	.rp-status-badge {
		position: absolute;
		top: 4px;
		left: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		font-size: 0.6em;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.rp-status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #e74c3c;
		animation: pulse-dot 1.5s ease-in-out infinite;
	}

	.rp-floating-events {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.floating-event {
		position: absolute;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: float-up 2s ease-out forwards;
		font-size: 0.8em;
		filter: drop-shadow(0 0 4px rgba(0,0,0,0.6));
	}

	.fe-icon {
		font-size: 1.4em;
	}

	.fe-label {
		font-size: 0.65em;
		color: #fff;
		white-space: nowrap;
		text-shadow: 0 1px 3px rgba(0,0,0,0.8);
	}

	@keyframes float-up {
		0% {
			transform: translateY(0) scale(0.6);
			opacity: 1;
		}
		60% {
			opacity: 1;
		}
		100% {
			transform: translateY(-120px) scale(1.1);
			opacity: 0;
		}
	}

	.rp-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}

	.rp-song-name {
		font-size: 1.05em;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.rp-sub-name {
		font-weight: 400;
		color: #aaa;
		margin-left: 0.3em;
		font-size: 0.9em;
	}

	.rp-mapper {
		font-size: 0.8em;
		color: #999;
	}

	.rp-mapper-name {
		color: #bbb;
		font-weight: 500;
	}

	.rp-diff-line {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.1em;
	}

	.rp-diff-badge {
		font-size: 0.7em;
		font-weight: 600;
		padding: 1px 8px;
		border-radius: 4px;
		color: #fff;
	}

	.rp-stars {
		font-size: 0.8em;
		color: #f5c542;
	}

	.rp-stats {
		display: flex;
		gap: 1.2em;
		margin-top: 0.15em;
	}

	.rp-stat {
		display: flex;
		flex-direction: column;
	}

	.rp-stat-label {
		font-size: 0.6em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #888;
	}

	.rp-stat-value {
		font-size: 0.95em;
		font-weight: 600;
	}

	.rp-pp {
		color: var(--ppColour, #6772e5);
	}

	.rp-timeline {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.2em;
	}

	.rp-time {
		font-size: 0.7em;
		color: #888;
		font-variant-numeric: tabular-nums;
		min-width: 2.5em;
	}

	.rp-time:last-child {
		text-align: right;
	}

	.rp-progress-bar {
		flex: 1;
		height: 4px;
		background: #3a3a3a;
		border-radius: 2px;
		overflow: hidden;
	}

	.rp-progress-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 1s linear;
	}

	@media screen and (max-width: 500px) {
		.rp-playing {
			flex-direction: column;
			align-items: center;
		}

		.rp-cover-wrapper {
			width: 80px;
			height: 80px;
		}

		.rp-info {
			align-items: center;
			text-align: center;
		}

		.rp-stats {
			justify-content: center;
		}

		.rp-timeline {
			width: 100%;
		}
	}
</style>
