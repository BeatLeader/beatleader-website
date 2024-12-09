<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {BL_ASSETS_CDN} from '../network/queues/beatleader/page-queue';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';

	const account = createAccountStore();

	document.body.classList.add('slim');
	document.body.scrollIntoView({behavior: 'smooth'});

	let articleEl = null;
	var supporters = [];

	function fetchSupporters(page) {
		fetch(`
${BL_API_URL}players?leaderboardContext=general&page=${page}&count=100&role=supporter%2Ctipper%2Csponsor`)
			.then(p => p.json())
			.then(d => {
				d.data.forEach(element => {
					if (!supporters.find(s => s.id == element.id)) {
						supporters.push(element);
					}
				});
				supporters = supporters;
				if (d.data.length == 100) {
					fetchSupporters(page + 1);
				}
			});
	}

	$: fetchSupporters(1);
</script>

<svelte:head>
	<title>About - {ssrConfig.name}</title>
</svelte:head>

<article bind:this={articleEl} transition:fade|global>
	<ContentBox>
		<h1 class="title is-3">People who keep BeatLeader running</h1>
		<h1 class="title is-4">Development Team</h1>
		<section class="content center">
			<div class="member">
				<img
					src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/9a/9a2159cfa8e0035593953b231f64fc4c06ba1349_full.jpg"
					alt="NSGolova" /><a href="https://github.com/NSGolova">NSGolova</a>
				<p class="memberTitle">bug factory</p>
				<p class="memberDescription">Server, web player, quest mod developer</p>
			</div>
			<div class="member">
				<img
					src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/38/38c54625673d34ec684e650e7203cfa193c02f35_full.jpg"
					alt="Karghoff" /><a href="https://github.com/karghoff-e">Karghoff</a>
				<p class="memberTitle">bug detective</p>
				<p class="memberDescription">Anti-cheat developer, helped with PC mod and Web player</p>
			</div>
			<div class="member">
				<img
					src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/05/05d491662979a9fcde141c228a7f50702ddfa761_full.jpg"
					alt="Reezonate" /><a href="https://github.com/reezonate">Reezonate</a>
				<p class="memberTitle">3D and UI guru</p>
				<p class="memberDescription">PC mod developer</p>
			</div>
			<div class="member">
				<img
					src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3a/3a733da6e52376759914f2cd792d40e3204227e6_full.jpg"
					alt="motzel" /><a href="https://github.com/motzel">motzel</a>
				<p class="memberTitle">true boomer</p>
				<p class="memberDescription">Creator of this website and greatest contributor.</p>
			</div>
			<div class="member">
				<img
					src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/46/4671391d03133aca8ec03860904a18136edb4ca4_full.jpg"
					alt="Hermanest" /><a href="https://github.com/Hermanest">Hermanest</a>
				<p class="memberTitle">true zoomer</p>
				<p class="memberDescription">PC replay player developer</p>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/6a1bb05822eb5654a5faaa607abdcc2e6ec4fe73_full.jpg" alt="DZRamen" /><a
					href="https://github.com/DziugasRam">DZRamen</a>
				<p class="memberTitle">EX MACHINA</p>
				<p class="memberDescription">Ranking AI developer and biggest supporter</p>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198072855418.gif" alt="LackWiz" /><a href="https://github.com/LackWiz">LackWiz</a>
				<p class="memberTitle">soft leader</p>
				<p class="memberDescription">Founding ranking and rating system dev. Loves cat notes</p>
			</div>
			<div class="member">
				<img src="https://avatars.cloudflare.steamstatic.com/8fe91a8e2f39d7425eacb57004df208cfe6390f3_full.jpg" alt="Christoffyw" /><a
					href="https://github.com/Christoffyw">Christoffyw</a>
				<p class="memberTitle">ranked is stinky</p>
				<p class="memberDescription">Made discord bot and helped with quest mod</p>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/16b1b27809072f20f83a04dd403cff335fbfe0b5_full.jpg" alt="MicroCBer" /><a
					href="https://github.com/MicroCBer">MicroCBer</a>
				<p class="memberTitle">non-native speaker</p>
				<p class="memberDescription">Made theme system on the website</p>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198133201952.png" alt="Tatenshi" /><a href="https://github.com/Tatenshi"
					>Tatenshi</a>
				<p class="memberTitle">distracted from the master's thesis</p>
				<p class="memberDescription">Quest mod and server contributor</p>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198073989976R47.png" alt="Loloppe" /><a
					href="https://www.beatleader.xyz/u/76561198073989976">Loloppe</a>
				<p class="memberTitle">not to be confused with notes</p>
				<p class="memberDescription">Map rating and review specialist</p>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198051924392R48.png" alt="Light Ai" /><a
					href="https://www.beatleader.xyz/u/76561198051924392">Light Ai</a>
				<p class="memberTitle">absolutely not a vocaloid addict</p>
				<p class="memberDescription">Quality specialist and rePlayed creator</p>
			</div>
		</section>

		<h1 class="title is-4">Ranking Admin Team</h1>

		<h1 class="title is-5">The RATs</h1>
		<section class="content center">
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198147746455R10.png" alt="CookedChili" /><a
					href="/u/76561198147746455">CookedChili</a> 
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/fede1355e88a5ffae6e9bfc20de4ec33a18ef5d1_full.jpg" alt="GalaxyMaster" /><a
					href="/u/76561198075923914">GalaxyMaster</a> 
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198051924392R17.png" alt="Light Ai" /><a
					href="/u/76561198051924392">Light Ai</a> 
			</div>
		</section>

		<h1 class="title is-4">Ranking Team</h1>

		<h1 class="title is-5">Core RT</h1>
		<section class="content center">
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/7c0675ccbcbe39583c9ee0871293959af09495c9_full.jpg" alt="Blackjack" /><a
					href="/u/blackjack">Blackjack</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198147746455R10.png" alt="CookedChili" /><a
					href="https://www.beatleader.xyz/u/76561198147746455">CookedChili</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/ccc9d6659a0c7fc6fed6a5c6afc2e837eb3fa674_full.jpg" alt="Cratornugget" /><a
					href="https://www.beatleader.xyz/u/76561198307061479">Cratornugget</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198831724075R27.png" alt="Edgii" /><a
					href="https://www.beatleader.xyz/u/76561198831724075">Edgii</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198965889412.gif" alt="Emy" /><a
					href="https://www.beatleader.xyz/u/76561198965889412">Emy</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198072855418R45.png" alt="LackWiz" /><a
					href="https://www.beatleader.xyz/u/76561198072855418">LackWiz</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198051924392R48.png" alt="Light Ai" /><a
					href="https://www.beatleader.xyz/u/76561198051924392">Light Ai</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198073989976R47.png" alt="Loloppe" /><a
					href="https://www.beatleader.xyz/u/76561198073989976">Loloppe</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198347652574R10.png" alt="Slayx" /><a
					href="https://www.beatleader.xyz/u/76561198347652574">Slayx</a>
			</div>
			
		</section>
		<h1 class="title is-5">Junior RT</h1>
		<section class="content center">
			
		</section>

		<h1 class="title is-4">Nomination Quality Team</h1>

		<h1 class="title is-5">Core NQT</h1>
		<section class="content center">
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198147746455R10.png" alt="CookedChili" /><a
					href="/u/76561198147746455">CookedChili</a> 
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/ccc9d6659a0c7fc6fed6a5c6afc2e837eb3fa674_full.jpg" alt="Cratornugget" /><a
					href="https://www.beatleader.xyz/u/76561198307061479">Cratornugget</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198831724075.png" alt="edgii" /><a
					href="https://www.beatleader.xyz/u/76561198831724075">edgii</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198965889412.gif" alt="Emy" /><a
					href="https://www.beatleader.xyz/u/76561198965889412">Emy</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/fede1355e88a5ffae6e9bfc20de4ec33a18ef5d1_full.jpg" alt="GalaxyMaster" /><a
					href="https://www.beatleader.xyz/u/76561198075923914">GalaxyMaster</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/66b82be1c041733bbb4fdbfd79be8e3c3a02b989_full.jpg" alt="Jojobanana" /><a
					href="https://www.beatleader.xyz/u/76561198294659898">Jojobanana</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198072855418R45.png" alt="LackWiz" /><a
					href="https://www.beatleader.xyz/u/76561198072855418">LackWiz</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198051924392R48.png" alt="Light Ai" /><a
					href="https://www.beatleader.xyz/u/76561198051924392">Light Ai</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198073989976R47.png" alt="Loloppe" /><a
					href="https://www.beatleader.xyz/u/76561198073989976">Loloppe</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198390456206R34.png" alt="ob1cb" /><a
					href="https://www.beatleader.xyz/u/76561198390456206">ob1cb</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/5374R44.png" alt="Poochy" /><a
					href="https://www.beatleader.xyz/u/5374">Poochy</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561199108348236R26.png" alt="UglyApe" /><a 
					href="/u/76561199108348236">UglyApe</a>
			</div>
		</section>

		{#if supporters.length}
			<div class="role-container">
				<h1 class="title is-4">Sponsors</h1>
				<img src={BL_ASSETS_CDN + '/patreon3.webp'} alt="Sponsors" />
			</div>

			<section class="content center">
				{#each supporters.filter(p => p.role.includes('sponsor')) as player, idx (player?.id)}
					<div class="member">
						<img src={player.avatar} alt={player.name} /><a href="https://www.beatleader.xyz/u/{player.id}">{player.name}</a>
					</div>
				{/each}
			</section>
			<div class="role-container">
				<h1 class="title is-4">Supporters</h1>
				<img src={BL_ASSETS_CDN + '/patreon2.webp'} alt="Supporters" />
			</div>
			<section class="content center">
				{#each supporters.filter(p => p.role.includes('supporter')) as player, idx (player?.id)}
					<div class="member">
						<img src={player.avatar} alt={player.name} /><a href="https://www.beatleader.xyz/u/{player.id}">{player.name}</a>
					</div>
				{/each}
			</section>
			<div class="role-container">
				<h1 class="title is-4">Tippers</h1>
				<img src={BL_ASSETS_CDN + '/patreon1.webp'} alt="Tippers" />
			</div>
			<section class="content center">
				{#each supporters.filter(p => p.role.includes('tipper')) as player, idx (player?.id)}
					<div class="member">
						<img src={player.avatar} alt={player.name} /><a href="https://www.beatleader.xyz/u/{player.id}">{player.name}</a>
					</div>
				{/each}
			</section>
		{/if}

		{#if $account.player}
			<h1 class="title is-2">You!</h1>
			<section class="content single">
				<div class="member">
					<img src={$account.player.playerInfo.avatar} alt={$account.player.name} /><a
						href={`https://www.beatleader.xyz/u/${$account.player.playerId}`}>{$account.player.name}</a>
					<p class="memberDescription">Thank you for using BeatLeader and believing in the open-source!</p>
				</div>
			</section>
		{/if}

		<h1 class="title is-3">About</h1>
		<span>
			<b>BeatLeader?</b><br />
			BeatLeader is an open-source leaderboard system for the Beat Saber. Our goal is to make an expandable, sustainable, and transparent system
			with zero bus factor and reliance on a specific person.

			<br /><br /><b>What is done?</b><br />
			Mods are posting replays to the server, the website is showing leaderboards and cool stats. Replay viewers can show plays on all platforms
			for every score. You can even draft the web battle royale of replays. Maps are ranked every week after map voting and criteria check.

			<br /><br /><b>What is not done?</b><br />
			Not a lot, actually. The core part of the BeatLeader is done, even the server is more or less sustainable. But we have a lot of plans for
			future features.

			<br /><br /><b>How this is different from the ScoreSaber</b><br />
			The main difference is that all our projects are open-source. And this is part of the reason why they exist. That's it. :coffage: We are
			doing our best to make it cooler, with more features, integrations, customization, etc... But the main goal was to make it transparent
			and expandable by anyone.

			<br /><br /><b>You mean like anyone?</b><br />
			<br /><b>Yes. </b><br />
			You can find links to GitHub in the footer. Check our Discord server for instructions on how to start making changes. Pull requests are
			welcome! But you don't need to be a developer to help. We need a lot of help with design, ranking maps, drawings, events, etc... Feedback,
			crash reports and your wildest ideas are great too!
		</span>

		<h1 class="title is-3">Credits</h1>

		<section class="content">
			<h2 class="title is-6">This project was only possible thanks to the following great APIs:</h2>
			<ul>
				<li><a href="https://beatsaver.com" target="_blank" rel="noreferrer">Beat Saver API</a></li>
				<li><a href="https://beat-savior.herokuapp.com" target="_blank" rel="noreferrer">Beat Savior API</a></li>
				<li><a href="https://accsaber.com" target="_blank" rel="noreferrer">AccSaber API</a></li>
				<li><a href="https://bsaber.com/" target="_blank" rel="noreferrer">BeastSaber website</a></li>
				<li><a href="https://cube.community" target="_blank" rel="noreferrer">CubeCommunity YouTube Channel</a></li>
			</ul>

			<h2 class="title is-6">The project also uses the following open source libraries:</h2>
			<ul>
				<li><a href="https://github.com/sveltejs/svelte" target="_blank" rel="noreferrer">svelte</a></li>
				<li><a href="https://github.com/jakearchibald/idb" target="_blank" rel="noreferrer">idb</a></li>
				<li><a href="https://github.com/EmilTholin/svelte-routing" target="_blank" rel="noreferrer">svelte-routing</a></li>
				<li><a href="https://github.com/chartjs" target="_blank" rel="noreferrer">chart.js</a></li>
				<li><a href="https://github.com/sindresorhus/p-queue" target="_blank" rel="noreferrer">p-queue</a></li>
				<li><a href="https://github.com/GoogleChromeLabs/comlink" target="_blank" rel="noreferrer">comlink</a></li>
				<li><a href="https://github.com/immerjs/immer" target="_blank" rel="noreferrer">immer</a></li>
				<li><a href="https://github.com/pubkey/broadcast-channel" target="_blank" rel="noreferrer">broadcast-channel</a></li>
				<li><a href="https://github.com/primus/eventemitter3" target="_blank" rel="noreferrer">eventemitter3</a></li>
				<li><a href="https://github.com/moment/luxon" target="_blank" rel="noreferrer">luxon</a></li>
				<li><a href="https://github.com/substack/json-stable-stringify" target="_blank" rel="noreferrer">json-stable-stringify</a></li>
				<li><a href="https://github.com/tailwindlabs/heroicons" target="_blank" rel="noreferrer">heroicons</a></li>
				<li><a href="https://github.com/FortAwesome/Font-Awesome" target="_blank" rel="noreferrer">font-awesome</a></li>
			</ul>

			<p>
				Special thanks to
				<a href="/u/76561198023909718" on:click|preventDefault={() => navigate('/u/76561198023909718')}>DanielDuel</a>
				for making the default song icon.
			</p>
		</section>

		<h1 class="title is-5">Retired Staff</h1>

		<section class="content center">
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198143307741.png" alt="shrado" /><a
					href="https://www.beatleader.xyz/u/76561198143307741">shrado</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/9f79be6c488ebc966eabc82bbdca1287499d551a_full.jpg" alt="FentonVR" /><a
					href="https://www.beatleader.xyz/u/76561198105616734">FentonVR</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/c27d8365b40b11235ac6d248c89ab63b612e5372_full.jpg" alt="iPixelGalaxy" /><a
					href="https://www.beatleader.xyz/u/76561198967815164">iPixelGalaxy</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198044544317.png" alt="TG90" /><a
					href="https://www.beatleader.xyz/u/76561198044544317">TG90</a>
			</div>
			<div class="member">
				<img src="https://cdn.assets.beatleader.xyz/76561198960449289.png" alt="Aquaflee" /><a
					href="https://www.beatleader.xyz/u/76561198960449289">Aquaflee</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/2b9951e8e6a9bdcaa6799f6b1a0bc2ba1e95387d_full.jpg" alt="Zana" /><a
					href="https://www.beatleader.xyz/u/76561198272028078">Zana</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/1ae4cec7a3ffd6f9952d5495d9c79f7cdc154e12_full.jpg" alt="Kansas" /><a
					href="https://www.beatleader.xyz/u/76561198042527254">Kansas</a>
			</div>
			<div class="member">
				<img src="https://avatars.akamai.steamstatic.com/82239b5edc08f1d40117502a99129c1bee74de92_full.jpg" alt="BigSlick" /><a
					href="https://www.beatleader.xyz/u/76561198014681219">BigSlick</a>
			</div>
		</section>

		<p class="back"><a href="/" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
	</ContentBox>
</article>

<style>
	p.back {
		margin-top: 1rem;
	}

	.title {
		text-align: center;
	}

	img {
		width: 4em;
		height: 4em;
		border-radius: 2em;
		padding: 0.3em;
	}

	.member {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 13em;
		padding: 1em;
	}

	.memberTitle {
		margin-left: 5px;
		text-align: center;
	}

	.memberDescription {
		font-size: smaller;
		text-align: center;
		inline-size: 11em;
		overflow-wrap: break-word;
	}

	.center {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
	}

	.single {
		display: grid;
		justify-content: center;
		flex-direction: column;
		margin-bottom: 6em;
	}

	.role-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.role-container img {
		margin-bottom: 2em;
	}
</style>
