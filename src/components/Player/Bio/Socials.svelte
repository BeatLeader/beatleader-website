<script>
	import Button from '../../Common/Button.svelte';
	import steamSvg from '../../../resources/steam.svg';

	export let playerId = null;
	export let playerInfo = null;
	export let name;

	$: steamLink = playerInfo.externalProfileUrl;
	$: twitchSocial = playerInfo.socials?.find(s => s?.service === 'Twitch');
	$: twitterSocial = playerInfo.socials?.find(s => s?.service === 'Twitter');
	$: discordSocial = playerInfo.socials?.find(s => s?.service === 'Discord');
	$: beatsaverSocial = playerInfo.socials?.find(s => s?.service === 'BeatSaver');
	$: youtubeSocial = playerInfo.socials?.find(s => s?.service === 'YouTube');
	$: githubSocial = playerInfo.socials?.find(s => s?.service === 'GitHub');
</script>

{#if steamLink}
	<Button
		url={steamLink}
		cls="socials-btn steam"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="gray"
		icon={steamSvg}
		title="{name} gamer" />
{/if}

{#if discordSocial}
	<Button
		url={discordSocial.link}
		cls="socials-btn"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="blurple"
		iconFa="fab fa-discord"
		title="{discordSocial.user} friend" />
{/if}

{#if twitchSocial}
	<Button
		url={twitchSocial.link}
		cls="socials-btn"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="twitch"
		iconFa="fab fa-twitch"
		title="{twitchSocial.user} streamer" />
{/if}

{#if twitterSocial}
	<Button
		url={twitterSocial.link}
		cls="socials-btn"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="twitter"
		iconFa="fab fa-twitter"
		title="{twitterSocial.user} drama starter" />
{/if}

{#if youtubeSocial}
	<Button
		url={youtubeSocial.link}
		cls="socials-btn"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="danger"
		iconFa="fab fa-youtube"
		title="{youtubeSocial.user} influencer" />
{/if}

{#if beatsaverSocial}
	<Button
		url={beatsaverSocial.link}
		cls="socials-btn"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="purple"
		icon="<img src='https://beatsaver.com/static/favicon/apple-touch-icon.png' />"
		title="{beatsaverSocial.user} mapper" />
{/if}

{#if githubSocial}
	<Button
		url={githubSocial.link}
		cls="socials-btn"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="github"
		iconFa="fab fa-github"
		title="{githubSocial.user} bugmaker" />
{/if}

<style>
	:global(.socials-btn) {
		height: 2em !important;
		width: 2em !important;
	}

	:global(.socials-btn .fab.fa-github) {
		font-size: 1.3em;
	}

	:global(.socials-btn.steam .icon) {
		display: block !important;
	}
</style>
