<script>
	import {fade} from 'svelte/transition';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {dateFromUnix, formatDate} from '../utils/date';
	import Button from '../components/Common/Button.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import {getDiffNameColor, diffNameForDiff} from '../utils/beatleader/format';

	let treeData = null;
	let players = null;
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

			const playersResponse = await fetch(`${BL_API_URL}projecttree/players`, {credentials: 'include'});
			if (!playersResponse.ok) throw new Error('Failed to load Project Tree players');
			players = await playersResponse.json();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	loadTreeData();

	let modes = [
		{label: 'Calendar', value: 'calendar', iconFa: 'fas fa-calendar-alt'},
		{label: 'Leaderboard', value: 'leaderboard', iconFa: 'fas fa-trophy'},
		{label: 'FAQ', value: 'faq', iconFa: 'fas fa-question-circle'},
	];
	let currentMode = modes[0];

	function onTypeChange(e) {
		currentMode = e.detail;
	}

	let title = 'Project Tree 2024';
	let metaDescription = '12 days of jolly maps from various mappers!';
</script>

<div class="project-tree" transition:fade>
	{#if loading}
		<Spinner />
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<div class="project-tree-container">
			<ContentBox>
				<h1>Project Tree!</h1>
				<div class="switcher-container">
					<TabSwitcher class="event-type-switcher" values={modes} value={currentMode} on:change={onTypeChange} />
				</div>
				<div class="content-container">
					{#if currentMode.value == 'calendar'}
						<div class="calendar">
							{#each calendar as day, index}
								<a
									href={day.song
										? `/leaderboard/global/${day.song.id}${day.song.difficulties[0].value}${day.song.difficulties[0].mode}`
										: null}
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
					{:else if currentMode.value == 'leaderboard'}
						{#if players}
							<div class="leaderboard">
								<div class="leaderboard-title">
									<span>Compete every day on a map and get a point for being the best! Any diff counts, but only once a day.</span>
								</div>
								{#each players as player, index}
									<a class="player" href={`/u/${player.id}`}>
										<div class="player-data">
											<p class="player-rank">#{index + 1}</p>
											<img src={player.avatar} alt={player.name} />
											<p>{player.name}</p>
										</div>
										<div class="player-days">
											{#each player.days as day, index}
												<div class="day-container">
													<div class="day-score">
														<p title={`Champion on ${calendar[day.day - 1].song.name}`}>{18 + day.day}</p>
													</div>
													<div class="day-diffs">
														{#each day.diffs.reverse() as diff, index}
															<div
																title={`Top 1 on ${diffNameForDiff(diff)}`}
																class="day-diff"
																style="background-color: {getDiffNameColor(diffNameForDiff(diff))}">
															</div>
														{/each}
													</div>
												</div>
											{/each}
										</div>
									</a>
								{/each}
							</div>
						{/if}
					{:else if currentMode.value == 'faq'}
						<div class="faq">
							<h2>FAQ</h2>
							<p>
								<b>What is the Project Tree?</b> <br />
								The Project Tree is a 12-day event where we celebrate the holiday season with a series of maps from various mappers. Each day,
								we'll unveil a new map, and you'll have the chance to compete for points by being the best on that map.
							</p>
							<p>
								<b>How do I get points?</b> <br />
								You can get points by being the best on a map. Any diff counts, but only once a day.
							</p>
							<p>
								<b>What are the prizes?</b> <br />
								Players with the most points at the end of the event will receive a special badge and prize.
							</p>
							<p>
								<b>How do I get the ornament?</b> <br />
								You can get the ornament by passing a map at any difficulty and any day.
							</p>
							<p>
								<b>How do I move the tree?</b> <br />
								Click the tree, click the position icon in the menu that will show up (bottom right) and drag the tree by the white sphere above
								it. You may also scale the tree to make it as big or as small as you'd like (to some extent)
							</p>
							<p>
								<b>How do I decorate the tree?</b> <br />
								Click the tree, click the tree icon in the mid-right of the menu that will show up. Then click and hold the decorations that
								you have and they'll pop up in your hand, put your hand to the tree and let go and they'll be there! You can have multiple of
								the same decoration on your tree. To rotate it, grab the white sphere above it and get spinning! Once you're done with your lovely
								(or disgusting) tree, hit save on the right hand side and then cancel to get back to the menu. And voilà, your masterpiece is
								done!
							</p>
						</div>
					{/if}
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
						<a href="https://github.com/BeatLeader/beatleader-mod/releases/tag/v0.9.30" target="_blank" rel="noreferrer">
							<Button iconFa="fas fa-download" label="Download PC mod" color="blue" />
						</a>
						<a href="https://github.com/BeatLeader/beatleader-qmod/releases/tag/v0.8.30" target="_blank" rel="noreferrer">
							<Button iconFa="fas fa-download" label="Download Quest mod" color="blue" />
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
		</div>
	{/if}
</div>

<MetaTags
	{title}
	description={metaDescription}
	openGraph={{
		title,
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/project-tree.webp'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary_large_image',
		title,
		description: metaDescription,
		image: CURRENT_URL + '/assets/project-tree.webp',
		imageAlt: metaDescription,
	}} />

<style>
	h1 {
		margin-top: 0.5em;
		color: #4caf50 !important;
		font-size: 28px;
		text-align: center;
		font-weight: bold;
	}

	.switcher-container {
		display: flex;
		justify-content: center;
		margin-top: 0.5em;
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

	.leaderboard {
		width: 100%;
		margin-top: 20px;
	}

	.leaderboard-title {
		margin-bottom: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.player {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		margin: 10px 18px;
	}

	.player:hover {
		transform: translateY(-2px);
		background: rgba(255, 255, 255, 0.1);
	}

	.player-rank {
		margin: 0;
		font-size: 1.1em;
		color: #4caf50;
	}

	.player-data {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.player-data img {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}

	.player-data p {
		margin: 0;
		font-size: 1.1em;
	}

	.player-days {
		display: flex;
		gap: 10px;
	}

	.day-container {
		position: relative;
	}

	.day-score {
		position: absolute;
		left: 53%;
		top: 8%;
		color: white;
		font-weight: bold;
	}

	.day-diff {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		margin-left: -21px;
	}

	.day-diffs {
		display: flex;
	}

	.day-diffs > :first-child {
		margin-left: 21px;
	}

	.player-score {
		display: flex;
		gap: 20px;
	}

	.player-score p {
		margin: 0;
		font-size: 1.1em;
		color: #4caf50;
	}

	.faq {
		margin: 0 20px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		text-align: center;
	}

	.faq p {
		margin: 0;
	}

	.faq b {
		font-weight: bold;
	}

	.faq p:not(:last-child) {
		margin-bottom: 10px;
	}

	@media (max-width: 768px) {
		.player {
			align-items: baseline;
			flex-direction: column;
			gap: 0.6em;
		}

		.day-container {
			margin-left: -22px;
		}
	}
</style>
