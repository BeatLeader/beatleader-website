<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import ContentBox from '../components/Common/ContentBox.svelte';

	document.body.classList.add('slim');

	let articleEl = null;

	document.body.scrollIntoView({behavior: 'smooth'});
</script>

<svelte:head>
	<title>Privacy policy - {ssrConfig.name}</title>
</svelte:head>

<article bind:this={articleEl} transition:fade|global>
	<ContentBox>
		<h1 class="title is-3">Privacy policy</h1>

		By using BeatLeader, you agree to the following privacy policy.<br /> This policy may change at any time, so please check it regularly.<br />
		<a href="https://github.com/BeatLeader/beatleader-website/commits/master/src/pages/Privacy.svelte">Click here</a> to see the changes in
		the history of the terms of service.<br /><br />

		<br /><b>BeatLeader general data policy</b><br />
		BeatLeader is a service that collects data about Beat Saber players and their plays.<br /> The main purpose of this service is to
		provide a leaderboard for Beat Saber players.<br /> The service is free to use.<br /> The service is not affiliated with Beat Games,
		Oculus, or Steam.

		<br /><b>All the data collected by BeatLeader is public.</b><br />
		With an exception for sensitive data like your auth info, IP address, or private data by design (for example, friends).

		<br /><br /><b>How is your data protected?</b><br />
		Your data is stored in a secure database with limited access.<br />
		Public access to your data through the API may be limited due to any security concerns.<br />
		Also, there is no perfect way of protecting your data, so it may be leaked.<br />
		Please keep this always in mind: change your password regularly and use 2FA(link your profile to Steam).<br />

		<br /><b>How is your data used?</b><br />
		Your data is used to provide you with a leaderboard and other features of BeatLeader.<br />
		Being publicly available, it can also be used for any purpose by anyone.<br />
		The main reason for it to be public is a mod nature of BeatLeader service and decentralized development.<br />
		This way, we hope it will be used for the benefit of the whole community without any gatekeeping.<br />

		<br />What data do BeatLeader mods collect?<br />

		<br /><b>1. Platform-specific ID</b><br />
		In order to identify you as a Beat Saber player, we collect your personal ID from the platform on which you own the game. For example: Steam
		ID, Oculus ID. This ID is then used as ID in BeatLeader system.
		<br /><b>2. Profile picture</b><br />
		Your Oculus or Steam profile picture will be used as BeatLeader profile picture.
		<br /><b>3. Profile name</b><br />
		Your Oculus or Steam profile name will be used as BeatLeader profile name.
		<br /><b>4. IP address</b><br />
		Some requests will use your IP address to set a country for your profile or to protect sensitive endpoints (for example, "log in").

		<br /><b>5. Replays</b><br />
		The main purpose of this service is to collect your Beat Saber plays, so yes, we collect them.<br /> Replays may contain personally
		identifiable information. Example being your movements, height or even your body shape. Your data, including associated personally
		identifiable information, will be broadly publicly available to anyone with an internet connection via the BeatLeader website. It will
		also be accessible to academic researchers, who may use it to conduct research topics such as VR security, privacy, and usability.
		<br /><br />

		On top of being publicly available using the BeatLeader API, your data will be available to anyone who has a direct link to your replay.<br />
		Also, BeatLeader API is used by other services, so your data may be available to them as well.<br /> And BeatLeader database dump is
		publicly available in BeatLeader discord for any purposes with stripped sensitive data as: login, password, IPs and social account
		tokens (data which is not otherwise available via API).

		<br /><br /><b>Steam specific</b><br />
		Your Steam country will be used if it's public. This data is used on the website. (Country is changeable)
		<br /><br /><b>Patreon specific</b><br />
		The server will use your Patreon profile ID to ensure your pledge to grant the "Patron" role.
		<br /><br /><b>Third-party social applications</b><br />
		BeatLeader uses third-party social applications to provide additional features. These applications may collect additional data about you.
		BeatLeader will collect your social account ID and access token to use them with third-party social applications. You may delete this info
		by unlinking your social account from BeatLeader.

		<br /><br /><b>Can I delete all my data from BeatLeader?</b><br />
		Yes! <a href="/signin/autoban">Click here</a>

		<br /><br />What data does this website collect?<br />
		<b>No data is collected.</b>

		<br /><br />Does this website use cookies?<br />
		<b>Yes! This website uses a single authentication cookie to store your login session.</b>
		No cookies were used for tracking or any other purposes.

		<br /><br />Does this website use third-party services?<br />
		<b
			>Yes! This website uses other awesome Beat Saber projects like BeatSaver, AccSaber, BeatSavior, and ArcViewer. No data is sent there,
			but they may collect it on opening the dedicated service website</b>

		<br /><br />What data does the web replay player website collect?<br />
		<b>No data is collected.</b>

		<br /><br />What data do web BeatLeader discord bots collect?<br />
		<b>Your Discord user ID and data from the BeatLeader API</b>

		<p class="back"><a href="/" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
	</ContentBox>
</article>

<style>
	p {
		margin-bottom: 0.5rem;
	}

	p.back {
		margin-top: 1rem;
	}

	strong {
		color: var(--alternate) !important;
	}
</style>
