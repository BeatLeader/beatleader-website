<script>
	import {fade} from 'svelte/transition';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {dateFromUnix, formatDate} from '../utils/date';
	import Button from '../components/Common/Button.svelte';

	let treeData = null;
	let error = null;
	let loading = true;
	let calendar = [];

	const START_DATE = 1734566400; // December 19th
	const DAYS = 12;

	function generateCalendarDays() {
		calendar = [];
		for (let i = 0; i < DAYS; i++) {
			const timestamp = START_DATE + i * (60 * 60 * 24);
			calendar.push({
				date: dateFromUnix(timestamp),
				timestamp,
				song: null,
				score: null,
			});
		}
	}

	function populateCalendar() {
		if (!treeData) return;

		// Add today's song
		if (treeData.today) {
			const dayIndex = calendar.findIndex(day => day.timestamp === treeData.today.startTime);
			if (dayIndex >= 0) {
				calendar[dayIndex].song = treeData.today.song;
				calendar[dayIndex].score = treeData.today.score;
				calendar[dayIndex].today = true;
				calendar[dayIndex].bundleId = treeData.today.bundleId;
			}
		}

		// Add previous days
		treeData.previousDays?.forEach(day => {
			const dayIndex = calendar.findIndex(d => d.timestamp === day.startTime);
			if (dayIndex >= 0) {
				calendar[dayIndex].song = day.song;
				calendar[dayIndex].score = day.score;
				calendar[dayIndex].bundleId = day.bundleId;
			}
		});
	}

	async function loadTreeData() {
		try {
			const response = await fetch(`${BL_API_URL}projecttree/status`, {credentials: 'include'});
			if (!response.ok) throw new Error('Failed to load Project Tree data');
			treeData = await response.json();
			generateCalendarDays();
			populateCalendar();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	loadTreeData();
</script>

<div class="project-tree" transition:fade>
	{#if loading}
		<Spinner />
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<ContentBox>
			<h1>Project Tree!</h1>
			<div class="calendar">
				{#each calendar as day, index}
					<a
						href={day.song ? `/leaderboard/global/${day.song.id}` : null}
						class="calendar-day {day.today ? 'today' : ''} {day.song ? 'has-song' : 'empty'}">
						<div class="date">{day.date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
						{#if day.song}
							<div class="song-card">
								<img src={day.song.coverImage} alt={day.song.name} />
								<div class="song-info">
									<h3>{day.song.name}</h3>
									<p class="mapper">by {day.song.mapper}</p>
									{#if day.score}
										<p class="score">{(day.score.accuracy * 100).toFixed(2)}%</p>
									{/if}
								</div>
							</div>
							<div class="ornament-preview">
								{#if day.score}
									<img
										title="Decorate your tree in the mods!"
										src={`https://cdn.assets.beatleader.xyz/project_tree_ornament_${day.bundleId}_preview_unblured.png`}
										alt={day.song.name} />
								{:else}
									<img
										title="Pass this map to get ornament!"
										src={`https://cdn.assets.beatleader.xyz/project_tree_ornament_${day.bundleId}_preview.png`}
										alt={day.song.name} />
								{/if}
							</div>
						{:else}
							<div class="placeholder">
								<span>{index == 6 ? '⭐' : '🎄'}</span>
							</div>
						{/if}
					</a>
				{/each}
			</div>

			<div class="description">
				<p>
					12 days of jolly maps from various mappers! <img
						src="https://cdn.discordapp.com/emojis/1181077135201402940.webp?size=80&animated=true"
						alt="Christmas emoji"
						style="display: inline; vertical-align: middle; height: 1em;" /> <br />
					Tune in every day from today to the end of the year for a new Christmas-themed map. <br />
					Receive a unique Christmas tree ornament for a pass and decorate the tree in the mod!
				</p>
				<div class="buttons-container">
					<a href="https://github.com/BeatLeader/beatleader-mod/releases/tag/v0.9.29" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC mod" color="blue" />
					</a>
					<a class="disabled" href="https://github.com/BeatLeader/beatleader-qmod/releases/tag/v0.8.6" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" title="Coming soon(1-2 days)!" label="Download Quest mod" color="blue" disabled={true} />
					</a>
				</div>
				<p>Player with the most top 1s on the day end will receive a badge and prize!</p>
			</div>

			{#if treeData.bonusOrnaments?.length}
				<div class="bonus-ornaments">
					<h2>Your Bonus Ornaments</h2>
					<div class="ornaments-grid">
						{#each treeData.bonusOrnaments as ornament, index}
							<div class="ornament">
								<img
									class="ornament-icon"
									src={`https://cdn.assets.beatleader.xyz/project_tree_ornament_${ornament.bundleId}_preview_unblured.png`}
									alt={`${index + 1} ornament`} />
								<p>{ornament.description}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</ContentBox>
	{/if}
</div>

<style>
	h1 {
		margin-top: 0.5em;
		color: #4caf50 !important;
		font-size: 28px;
		text-align: center;
		font-weight: bold;
	}

	.calendar {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
		padding: 20px;
	}

	.calendar-day {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		transition: all 0.3s ease;
		position: relative;
	}

	.calendar-day.today {
		background: rgba(255, 255, 255, 0.1);
	}

	.calendar-day.has-song:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.date {
		font-size: 1.2em;
		margin-bottom: 10px;
		color: #4caf50;
		font-weight: bold;
	}

	.song-card {
		display: flex;
		gap: 15px;
	}

	.song-card img {
		width: 80px;
		height: 80px;
		border-radius: 4px;
		object-fit: cover;
	}

	.song-info {
		flex: 1;
	}

	.song-info h3 {
		margin: 0 0 5px 0;
		font-size: 1.1em;
	}

	.mapper {
		margin: 0;
		opacity: 0.8;
		font-size: 0.9em;
	}

	.score {
		margin: 5px 0 0 0;
		color: #4caf50;
		font-weight: bold;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 80px;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 4px;
		font-size: 2em;
	}

	.description {
		margin: 0 20px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		text-align: center;
	}

	.bonus-ornaments {
		margin-top: 30px;
		padding: 0 20px;
	}

	.ornaments-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 15px;
	}

	.ornament {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		text-align: center;
	}

	.ornament-icon {
		font-size: 1.5em;
		margin-bottom: 10px;
		display: block;
	}

	.ornament-preview {
		position: absolute;
		right: -10px;
		bottom: 0px;
		width: 6em;
		height: 6em;
		z-index: 1;
	}

	.buttons-container {
		display: flex;
		gap: 10px;
		justify-content: center;
		margin-top: 10px;
		flex-wrap: wrap;
	}

	h2 {
		margin: 0 0 20px 0;
		color: #4caf50;
	}

	.error {
		color: #ff4444;
		text-align: center;
		padding: 20px;
	}
</style>
