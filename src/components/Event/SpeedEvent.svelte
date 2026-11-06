<script>
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';

	export let event;

	const PC_MOD_URL = 'https://github.com/BeatLeader/beatleader-mod/releases/latest';
	const QUEST_MOD_URL = 'https://github.com/BeatLeader/beatleader-qmod/releases/latest';

	$: endDate = event?.endDate ? dateFromUnix(event.endDate) : null;
	$: live = event && Date.now() / 1000 < event.endDate;
</script>

<ContentBox cls="speed-hero">
	<div class="speed-intro">
		<p>
			Compete on <b>Better Faster Song</b> and <b>Better Super Fast</b>, custom speed modifiers that halve NJS gain. Each modifier is its
			own category, with a leaderboard and pp from ratings made for that speed.
		</p>
		{#if endDate}
			<p class="speed-deadline" title={formatDate(endDate)}>
				{#if live}
					Ends {formatDateRelative(endDate)}, on {formatDate(endDate)}.
				{:else}
					Ended {formatDateRelative(endDate)}.
				{/if}
			</p>
		{/if}
		<div class="speed-buttons">
			<a href={PC_MOD_URL} target="_blank" rel="noreferrer">
				<Button iconFa="fas fa-download" label="PC mod" color="white" bgColor="#d4144a" />
			</a>
			<a href={QUEST_MOD_URL} target="_blank" rel="noreferrer">
				<Button iconFa="fas fa-download" label="Quest mod" color="white" bgColor="#d4144a" />
			</a>
			{#if event?.playlistId}
				<a href="/playlist/{event.playlistId}">
					<Button iconFa="fas fa-compact-disc" label="Get the maps" color="white" bgColor="#2a3a8c" />
				</a>
			{/if}
		</div>
	</div>
</ContentBox>

<style>
	:global(.content-box.speed-hero) {
		padding: 0 !important;
		overflow: hidden;
		background: #070a1f !important;
		box-shadow:
			0 0 0 1px rgba(90, 140, 255, 0.2),
			0 8px 24px rgba(0, 0, 0, 0.5) !important;
	}

	.speed-art {
		width: 100%;
		aspect-ratio: 1490 / 593;
		background:
			url(/assets/speed-event/header.webp) center / cover no-repeat,
			linear-gradient(90deg, #d4144a, #2a3a8c);
	}

	.speed-intro {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		padding: 1.25em 1.5em 1.5em;
		color: #e6ecff;
	}

	.speed-deadline {
		color: #9fc2ff;
		font-style: italic;
	}

	.speed-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;
	}
</style>
