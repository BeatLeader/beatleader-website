<script>
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';
	import DiscordInvite from '../components/Clans/DiscordInvite.svelte';
	import Button from '../components/Common/Button.svelte';
	import {dateFromUnix, formatDateRelative} from '../utils/date';

	export let location;

	let description = 'Ongoing mapping contest with a prize pool and chance to get directly into ranked!';
	let image = '/assets/buildingblockslogo.png';

	// Smooth scroll function
	function scrollToElement(id) {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({behavior: 'smooth'});
		}
	}

	// Handle hash changes
	function handleHash(location) {
		const hash = location.hash.slice(1);
		if (hash) {
			setTimeout(() => scrollToElement(hash), 0);
		}
	}

	$: handleHash(location);
</script>

<section class="align-content">
	<article class="page-content">
		<ContentBox cls="bb-box bb-header-box">
			<img class="header-image" src="/assets/buildingblockslogo.svg" alt="Building Blocks 2024 Logo" />
			<div class="header-text">
				<p>An anonymous Beat Saber mapping contest with a $1000 prize pool</p>
				<p class="ranked-info">Top maps will be ranked on ScoreSaber and BeatLeader!</p>
			</div>
		</ContentBox>

		<ContentBox cls="bb-box" id="info">
			<h2>INFO</h2>
			<div class="darkened-background">
				<p>
					First things first. <strong>Anonymous really does mean ANONYMOUS</strong> you can not let people know which submission is yours,
					or another person's. When the judges find out that this happened it <strong>WILL</strong> lead to disqualification
				</p>
				<br />
				<p>
					<strong>2 groups with 3 winners each</strong> will be chosen/revealed based on points they receive from judges + a community vote
				</p>

				{#if Date.now() < dateFromUnix(1738699200)}
					<p>Submissions are open to all mappers, new and experienced</p>
					<br />
					<p>
						<strong>Song pool is <a href="#song-pool">revealed!</a></strong> Pick your song and start mapping! Map submissions are
						<a href="#submissions">open</a>
						until
						<strong>February 4th</strong>
					</p>
				{:else}
					<p>Submissions are closed!</p>
				{/if}
			</div>
		</ContentBox>
		<div class="video-and-invite" id="invite">
			<ContentBox cls="bb-box bb-video-box">
				<div style="display: flex; width: 100%; height: 100%; border-radius: 8px; overflow:hidden; justify-content: center;">
					<iframe
						width="100%"
						style="aspect-ratio: 16/9;"
						src="https://www.youtube-nocookie.com/embed/NSvvGDTfr3s?si=b4lLpGGYeIZ8kRb8"
						title="YouTube video player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen />
				</div>
			</ContentBox>
			<ContentBox cls="bb-box">
				<div class="invite-container darkened-background">
					<DiscordInvite inviteLink="https://discord.gg/WRWh9sPd6z" introText="Join Contest Discord Server" />
				</div>
			</ContentBox>
		</div>

		<ContentBox cls="darkened-background bb-box" id="process">
			<h2>PROCESS</h2>
			<div class="darkened-background">
				<p>
					Mappers will select ONE of the <strong>15</strong> approved songs to map however they choose so long as it follows the Mapping Guidelines
					outlined below
				</p>
				<p>From then you will choose between the <strong>modchart group</strong> and the <strong>normal group</strong></p>

				<br />
				<h3>What counts as a <strong>normal map</strong>?</h3>
				<p>
					A normal map is every map that doesn't <strong>require</strong> mods to play. Chroma lighting and environment for example when it's
					not a requirement is fine!
				</p>

				<br />
				<h3>What counts as a <strong>modchart</strong>?</h3>
				<p>Every map that <strong>NEEDS A MOD</strong> to be played will count as a modchart. For example Noodle mapping</p>

				<p>
					<strong>ALSO in this competition EVERYTHING IS ALLOWED</strong>, let this be v3 mapping WITH chains. Or staircase patterns/badcut
					patterns. Go break criteria in a fun way!
				</p>

				<br />
				<p>6 (subject to change) Judges will review/play all submitted maps and award up to 20 points per map:</p>
				<p>Up to 10 points for each category;</p>
				<ul>
					<li>Creativity</li>
					<li>Fun Factor</li>
				</ul>
				<br />
				<p>
					<strong
						>Keep in mind to optimize your maps. If your map requires an excessively strong computer, it can get a penalty of up to 5 points
						from your total. (This is not meant to discourage proper use of noodle, but to have another form of motivation to get as many
						people be able to play your map)</strong>
				</p>
				<p><strong>This counts for BOTH categories</strong></p>
				<p><strong>THIS ONLY HAPPENS IF THE MAJORITY OF JUDGES AGREES</strong></p>
				<br />

				<p>
					After all maps have been judged, the top 10 rated maps will be opened to a community vote, where all participants and bystanders
					will be able to rank them 1-10 (exact Judge scores will be kept secret until the community vote has been completed)
				</p>

				<p>
					The top community voted map will receive 20 points, 2nd will receive 17 points, 3rd will receive 14 points, 4th will receive 11
					points... (and so on, each place will receive 3 points less than the prior)
				</p>

				<p>Points will be all added up, then the top 3 maps of each group will be awarded a cash prize</p>
			</div>
		</ContentBox>

		<ContentBox cls="darkened-background bb-box" id="song-pool">
			<h2>SONG POOL</h2>
			<div class="darkened-background map-pool-container">
				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/h0JrFYBqgEU"
						title="Midnight Mission - Midnight Grand Orchestra"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/L5inD4XWz4U"
						title="EVERYBODY DO THE FLOP - LilDeuceDeuce"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/JbKQUd9eQrg"
						title="Letting Go - Yonetro"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/rf80EhRZzk4"
						title="Farewell To Reality - ReeK"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/gcfqTk60fkE"
						title="Bad Apple!! feat.nomico (Camellia's 'Bad Psy!!' Remix) - Alstroemeria Records"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/h5hMNF3kDm0"
						title="Tic! Tac! Toe! - TAK x Corbin"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/oA0CpI0vCK4"
						title="mumei - Nanashi Mumei"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/jIMfrJd78jw"
						title="For Me - Throttle"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/2_RWikU2hsM"
						title="Infinity - Sefa, D-Block & S-te-Fan"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/19y8YTbvri8"
						title="Mesmerizer - 32ki (feat. Hatsune Miku＆Kasane Teto)"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/5GMKOCqorRg"
						title="Scars - Within Destruction"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/5BmUrlQZDok"
						title="TRAFIK! - Käärijä & Joost"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/G1Fdtdmb47s"
						title="DELETE IT ALL - MUST DIE! ft. Ducky"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/XFIb61aVols"
						title="bleachers - templuv"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>

				<div class="map-entry">
					<iframe
						src="https://www.youtube.com/embed/2zawZImla2U"
						title="No Weapon Formed Shall Prosper - Eidola"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen></iframe>
				</div>
			</div>
		</ContentBox>

		<ContentBox cls="bb-box" id="submissions">
			<h2>SUBMISSIONS</h2>
			<div class="darkened-background submissions-container">
				{#if Date.now() < dateFromUnix(1738699200)}
					<div class="submission-container">
						<Button
							type="submit"
							url="https://forms.gle/7PkMdHhZR6c7EEnK9"
							onlyurl={true}
							label="SUBMIT YOUR MAP"
							iconFa="fas fa-paper-plane" />
					</div>
					<p>
						Submissions will close <strong>{formatDateRelative(dateFromUnix(1738699200))}</strong>!
					</p>
				{:else}
					<p>Submissions are closed!</p>
				{/if}
			</div>
		</ContentBox>

		<ContentBox cls="bb-box" id="prizes">
			<h2>Normal map group prizes</h2>
			<div class="darkened-background">
				<ul>
					<li><strong>🥇1st</strong> - $300 + Profile Badges + and their map gets RANKED on ScoreSaber AND BeatLeader</li>
					<li><strong>🥈2nd</strong> - $150 + Profile Badges + map gets loved on ScoreSaber</li>
					<li><strong>🥉3rd</strong> - $50 + Profile Badges</li>
				</ul>
			</div>

			<h2>Modchart group prizes</h2>
			<div class="darkened-background">
				<ul>
					<li><strong>🥇1st</strong> - $300 + Profile Badges + and their map gets RANKED on ONLY ScoreSaber</li>
					<li><strong>🥈2nd</strong> - $150 + Profile Badges + map gets loved on ScoreSaber</li>
					<li><strong>🥉3rd</strong> - $50 + Profile Badges</li>
				</ul>
			</div>
			<p>+ all podium maps will get a badge and featured playlist on BeatLeader</p>
		</ContentBox>
	</article>
</section>

<MetaTags
	title="Building Blocks 2024"
	{description}
	openGraph={{
		title: 'Building Blocks 2024',
		description,
		images: [{url: image}],
		siteName: 'Mapping Contest - ' + ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'Building Blocks 2024',
		description,
		image,
		imageAlt: 'Building Blocks 2024 Logo',
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	.video-and-invite {
		display: flex;
	}

	.invite-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}
	:global(.bb-header-box) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-direction: column;
	}

	:global(.bb-box) {
		border-radius: 12px !important;
		padding: 0.5em !important;
		scroll-margin-top: 2em;
	}

	:global(.bb-video-box) {
		width: 50% !important;
	}

	.header-image {
		width: 30em;
		margin-bottom: 2em;
	}

	.darkened-background {
		border-radius: 8px;
		padding: 1em;
	}

	.header img {
		max-width: 200px;
		height: auto;
	}

	.header-text {
		text-align: center;
	}

	.header h1 {
		margin: 0;
		font-size: 2.5rem;
	}

	.header p {
		margin: 0.5rem 0;
		font-size: 1.2rem;
	}

	.ranked-info {
		font-weight: bold;
		color: #ecf0f1;
	}

	.main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		background-color: white;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-weight: bold;
		text-align: center;
	}

	h3 {
		color: #34495e;
	}

	ul {
		padding-left: 1em;
		list-style-type: disc;
	}

	:global(#discordData #buttonText) {
		margin: auto !important;
	}

	.map-pool-container {
		display: flex;
		flex-wrap: wrap;
		gap: 1em;
		padding: 0;
		padding-top: 1em;
		padding-bottom: 1em;
		justify-content: center;
	}

	.map-entry {
		width: 30em;
		border-radius: 8px;
		overflow: hidden;
		height: 16em;
	}

	.map-entry iframe {
		width: 100%;
		height: 100%;
	}

	.submissions-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.submission-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}

	@media screen and (max-width: 600px) {
		.video-and-invite {
			flex-wrap: wrap;
		}

		:global(.bb-video-box) {
			width: 100% !important;
		}
	}
</style>
