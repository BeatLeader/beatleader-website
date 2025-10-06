<script>
	import {fade} from 'svelte/transition';
	import {BL_API_URL, CURRENT_URL} from '../../network/queues/beatleader/api-queue';
	import ContentBox from '../Common/ContentBox.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import Button from '../Common/Button.svelte';
	import TabSwitcher from '../Common/TabSwitcher.svelte';
	import {getDiffNameColor, diffNameForDiff} from '../../utils/beatleader/format';
	import PlayerMention from '../Scores/PlayerMention.svelte';
	import EventMeta from './EventMeta.svelte';
	import Playlist from '../Playlists/Playlist.svelte';
	import createPlaylistStore from '../../stores/playlists';

	export let currentEvent;
	export let page = 1;
	export let location;
	export let eventId;

	function changeParams(newPage, eventId, newLocation) {
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;
	}

	let treeData = null;
	let players = null;
	let error = null;
	let loading = true;
	let calendar = [];
	let playlists = createPlaylistStore();

	function generateCalendarDays(treeData, currentEvent) {
		calendar = [];
		const START_DATE = treeData.previousDays?.length
			? treeData.previousDays.sort((a, b) => a.startTime - b.startTime)[0].startTime
			: treeData.today.startTime;
		const DAYS = (currentEvent.endDate - START_DATE) / (60 * 60 * 24);
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

	function populateCalendar(treeData) {
		// Add today's song
		if (treeData.today) {
			const dayIndex = calendar.findIndex(day => day.timestamp === treeData.today.startTime);
			if (dayIndex >= 0) {
				calendar[dayIndex].song = treeData.today.song;
				calendar[dayIndex].score = treeData.today.score;
				calendar[dayIndex].today = true;
				calendar[dayIndex].points = treeData.today.points;
			}
		}

		// Add previous days
		treeData.previousDays?.forEach(day => {
			const dayIndex = calendar.findIndex(d => d.timestamp === day.startTime);
			if (dayIndex >= 0) {
				calendar[dayIndex].song = day.song;
				calendar[dayIndex].score = day.score;
				calendar[dayIndex].points = day.points;
			}
		});
	}

	async function loadEventStatus(currentEvent) {
		try {
			const response = await fetch(`${BL_API_URL}event/motd/${currentEvent.id}/status`, {credentials: 'include'});
			if (!response.ok) throw new Error('Failed to load Event data');
			treeData = await response.json();
			generateCalendarDays(treeData, currentEvent);
			populateCalendar(treeData);

			calendar = calendar;

			const playersResponse = await fetch(`${BL_API_URL}event/motd/${currentEvent.id}/players`, {credentials: 'include'});
			if (!playersResponse.ok) throw new Error('Failed to load Event players');
			players = await playersResponse.json();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	let modes = [
		{label: 'Calendar', value: 'calendar', iconFa: 'fas fa-calendar-alt'},
		{label: 'Leaderboard', value: 'leaderboard', iconFa: 'fas fa-trophy'},
		{label: 'Playlist', value: 'playlist', iconFa: 'fas fa-list-ul'},
		{label: 'FAQ', value: 'faq', iconFa: 'fas fa-question-circle'},
	];
	let currentMode = modes[0];

	function onTypeChange(e) {
		currentMode = e.detail;
	}

	let playlist = null;
	function loadPlaylist(playlistId) {
		playlists.getShared(playlistId, (result, resultId) => {
			playlist = result;
		});
	}

	$: changeParams(page, eventId, location);
	$: currentEvent && loadEventStatus(currentEvent);

	$: currentEvent && loadPlaylist(currentEvent.playlistId);
</script>

<div class="project-tree" transition:fade style="--event-color: {currentEvent.mainColor}">
	{#if loading}
		<Spinner />
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<div class="project-tree-container">
			<ContentBox>
				{#if currentEvent.id == 77}
					<ContentBox>
						<span>
							<div class="ado-header">
								<PlayerMention playerId="76561198825767745" /> presents:
							</div>
							<h1>ADOvent Calendar 2025</h1>
							<br />
							<div class="ado-header">
								Every day, from October 1st to October 24th, one brand new map is released. Compete every day for points and get a chance to
								win a prize and badges!
							</div>
						</span>
					</ContentBox>
				{:else}
					<h1>{currentEvent.name}</h1>
				{/if}

				<div class="switcher-container">
					<TabSwitcher class="event-type-switcher" values={modes} value={currentMode} on:change={onTypeChange} />
				</div>
				<div class="content-container">
					{#if currentMode.value == 'calendar'}
						<div class="calendar">
							{#each calendar as day, index}
							{@const difficulties = day.song?.difficulties.filter(diff => diff.mode == 1)}
								<a
									href={day.song
										? `/leaderboard/global/${day.song.id}${difficulties[difficulties.length - 1].value}${difficulties[difficulties.length - 1].mode}`
										: null}
									class="calendar-day {day.today ? 'today' : ''} {day.song ? 'has-song' : 'empty'}">
									<div class="calendar-day-container">
										<div class="date">{day.date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
										{#if day.song?.videoPreviewUrl}
											<Button
												url={day.song.videoPreviewUrl}
												cls="preview-song-btn"
												onlyurl={true}
												animated={true}
												animationOpacity={0.8}
												type="danger"
												iconFa="fab fa-youtube"
												title="Preview map video" />
										{/if}
									</div>
									{#if day.song}
										<div class="song-card">
											<img src={day.song.coverImage} alt={day.song.name} />
											<div class="song-info">
												<h3>{day.song.name}</h3>
												<p class="mapper">by {day.song.mapper}</p>
												{#if day.score}
													<div class="score-container">
														{#if day.points}
															<p class="score-points {day.today ? 'yellow' : ''}">
																#{day.points.rank}
															</p>
														{/if}
														<p class="score">{(day.score.accuracy * 100).toFixed(2)}%</p>
														{#if day.points}
															<p class="score-points {day.today ? 'yellow' : ''}">
																{day.points.points} point{day.points.points == 1 ? '' : 's'}
															</p>
														{/if}
													</div>
												{/if}
											</div>
										</div>
										<!-- <div class="ornament-preview">
											{#if day.score}
												<img
													title="Decorate your tree in the mods!"
													src={`https://cdn.assets.beatleader.com/project_tree_ornament_${day.bundleId}_preview_unblured.png`}
													alt={day.song.name} />
											{:else}
												<img
													title="Pass this map to get ornament!"
													src={`https://cdn.assets.beatleader.com/project_tree_ornament_${day.bundleId}_preview.png`}
													alt={day.song.name} />
											{/if}
										</div> -->
									{:else}
										<div class="placeholder">
											<span>{index == calendar.length - 1 ? '🎂' : '⭐'}</span>
										</div>
									{/if}
								</a>
							{/each}
						</div>
					{:else if currentMode.value == 'leaderboard'}
						{#if players}
							<div class="leaderboard">
								<div class="leaderboard-title">
									<span>Compete every day on a map and get points for being in the top 10! Only top diff counts!</span>
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
														<p title={`#${day.points.rank} on ${calendar[day.day - 1].song.name}`}>
															{calendar[day.day - 1].date.getDate().toString().padStart(2, '0')}
														</p>
													</div>
													<div class="day-diffs">
														{#each day.diffs.reverse() as diff, index}
															<div
																class="day-diff"
																style="background-color: {day.points.rank === 1
																	? '#ffb900'
																	: day.points.rank === 2
																		? '#848484'
																		: day.points.rank === 3
																			? '#764b00'
																			: 'purple'}">
															</div>
														{/each}
													</div>
												</div>
											{/each}
											<div class="player-score">
												<p>{player.score.toFixed(0)} points</p>
											</div>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					{:else if currentMode.value == 'playlist'}
						<div class="playlist">
							<Playlist
								sharedPlaylistId={currentEvent.playlistId}
								store={playlists}
								expanded={true}
								idx={0}
								playlistExport={playlist} />
						</div>
					{:else if currentMode.value == 'faq'}
						<div class="faq">
							<h2>FAQ</h2>
							<p>
								<b>What is the event?</b> <br />
								The event is a 24-day event where we celebrate the birthday of singer Ado. Every day, one brand new map is released. Compete
								every day for points and get a chance to win a prize and badges!
							</p>
							<p>
								<b>What is considered a day?</b> <br />
								Maps are released at 15:00 UTC every day. The last day ends at 15:00 UTC on October 25th. October 25th 15:00 UTC is {formatDate(
									new Date('2025-10-25T15:00:00Z')
								)} for you.
							</p>
							<p>
								<b>When does the event start?</b> <br />
								The event starts on October 1st and ends on October 24th.
							</p>
							<p>
								<b>What are the bonus maps?</b> <br />
								During the event, there will be also bonus maps released alongside the main maps that you can enjoy playing, but you don't get
								points for them.
							</p>
							<p>
								<b>How do I get points?</b> <br />
								You can get points by being in the top 10 on the top diff on the day end (ie when the next map is released).
							</p>
							<p>
								<b>How many points do I get?</b> <br />
								#1 on a map: 10 points<br />
								#2 on a map: 5 points<br />
								#3 on a map: 3 points<br />
								#4-10 on a map: 1 point
							</p>
							<p>
								<b>What are the prizes?</b> <br />

								At the end of the event, all players in the top 10 will receive a random assortment of Ado trading cards. The top 3 will
								receive a blu-ray of Ado's Best Album. The Grand Prize winner will receive a mystery gift in addition to the other prizes.
								All the prizes are provided by <PlayerMention playerId="76561198825767745" />.
							</p>
							<p>
								<b>How do I get the badge?</b> <br />
								At the end of the event, top 3 players of the event will receive badges on their profile.
							</p>
							<p>
								<b>How do I get the achievement?</b> <br />
								The achievement will be available at the end of the event. Achievement will have four tiers:<br />
								<b>tier 1</b> - play all event maps until the end of October ({formatDate(new Date('2025-10-31T23:59:59Z'))})<br />
								<b>tier 2</b> - play 10 event maps on their corresponding day (10/01 - 10/25)<br />
								<b>tier 3</b> - play every event map on its corresponding day (10/01 - 10/25)<br />
								<b>tier 4</b> - receive any number of Ado points (end the day in the top 10)<br />
							</p>
						</div>
					{/if}
				</div>

				<!-- <div class="description">
					<p>
						{currentEvent.description}
					</p>
					<div class="buttons-container">
						<a href="https://github.com/BeatLeader/beatleader-mod/releases/tag/v0.9.30" target="_blank" rel="noreferrer">
							<Button iconFa="fas fa-download" label="Download PC mod" color="blue" />
						</a>
						<a href="https://github.com/BeatLeader/beatleader-qmod/releases/tag/v0.8.30" target="_blank" rel="noreferrer">
							<Button iconFa="fas fa-download" label="Download Quest mod" color="blue" />
						</a>
					</div>
					<p>Player with the most points at the end of the event will receive a badge and prize!</p>
				</div> -->

				{#if currentEvent.id == 77}
					<div class="description">
						<p>
							Ado is a Japanese singer known for her powerful vocals, enigmatic persona, and distinctive blend of Jpop, rock, and Vocaloid
							influences. To celebrate her birthday on October 24th, one map is released each day starting October 1st, like an advent
							calendar leading up to Christmas.<br />
						</p>
						<div style="margin-top: 1em;">
							<div class="ado-header"><PlayerMention playerId="76561199103668170" /> also made a special sabers for this event:<br /></div>
							<div class="buttons-container">
								<Button url="http://cdn.assets.beatleader.com/Adovent2025AdoRoseSaber.saber" iconFa="fas fa-download" label="PC Sabers" color="blue" onlyurl={true} />
								<Button url="http://cdn.assets.beatleader.com/Adovent2025AdoRoseSaber.whacker" iconFa="fas fa-download" label="Quest Sabers" color="red" onlyurl={true} />
							</div>
							<br />
							<span
								>Thanks to <a href="https://x.com/rize2296" target="_blank" rel="noreferrer">@rize2296</a>,
								<a href="https://x.com/_NiKOV_" target="_blank" rel="noreferrer">@_NiKOV_</a>, and <PlayerMention playerId="34284377" /> for
								the cover art!</span>
						</div>

						<span>
							<br /><br />
							<b>Good luck and have fun! Let your swings be as strong as Ado's vocals!</b>
						</span>
					</div>
				{/if}

				<div class="description" style="margin-top: 1em;">
					<p>For the best event support - update to the latest mod versions if you haven't yet:</p>
					<div class="buttons-container">
						<a href="https://github.com/BeatLeader/beatleader-mod/releases/tag/v0.9.34" target="_blank" rel="noreferrer">
							<Button iconFa="fas fa-download" label="Download PC mod" color="blue" />
						</a>
						<a disabled href="#" title="Quest mod is coming soon!" target="_blank" rel="noreferrer">
							<Button iconFa="fas fa-download" label="Download Quest mod" color="blue" disabled />
						</a>
					</div>
				</div>

				<!-- {#if treeData.bonusOrnaments?.length}
					<div class="bonus-ornaments">
						<h2>Your Bonus Ornaments</h2>
						<div class="ornaments-grid">
							{#each treeData.bonusOrnaments as ornament, index}
								<div class="ornament">
									<img
										class="ornament-icon"
										src={`https://cdn.assets.beatleader.com/project_tree_ornament_${ornament.bundleId}_preview_unblured.png`}
										alt={`${index + 1} ornament`} />
									<p>{ornament.description}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if} -->
			</ContentBox>
		</div>
	{/if}
</div>

{#if currentEvent}
	<EventMeta event={currentEvent} />
{/if}

<style>
	h1 {
		margin-top: 0.5em;
		color: var(--event-color) !important;
		font-size: 28px;
		text-align: center;
		font-weight: bold;
	}

	.bonus-text {
		font-size: 18px;
		color: var(--event-color);
		font-weight: bold;
	}

	.switcher-container {
		display: flex;
		justify-content: center;
		margin-top: 0.5em;
	}

	:global(.switcher-container .switch-types) {
		gap: 0.4em;
	}

	.ado-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;
	}

	.calendar {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
		padding: 20px;
	}

	.calendar-day-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	:global(.calendar-day-container .preview-song-btn) {
		height: 1.5em;
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
		color: var(--event-color);
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

	.score-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.score {
		margin: 5px 0 0 0;
		font-weight: bold;
	}

	.score-points {
		margin: 5px 0 0 0;
		font-weight: bold;
		color: green;
	}

	.score-points.yellow {
		color: yellow;
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

	.playlist {
		margin: 20px;
		background: rgba(154, 154, 154, 0.134);
		border-radius: 8px;
		padding: 15px;
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
		color: var(--event-color);
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
		color: var(--event-color);
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
		min-width: 6em;
		justify-content: right;
	}

	.player-score p {
		margin: 0;
		font-size: 1.1em;
		color: #4caf50;
	}

	.faq {
		margin: 1em 20px;
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
