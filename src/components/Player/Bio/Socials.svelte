<script>
	import Button from '../../Common/Button.svelte';
	import steamSvg from '../../../resources/steam.svg';

	export let playerId = null;
	export let playerInfo = null;

	$: steamLink = playerInfo.externalProfileUrl;
	$: twitchSocial = playerInfo.socials?.find(s => s?.service === 'Twitch');
	$: twitterSocial = playerInfo.socials?.find(s => s?.service === 'Twitter');
	$: discordSocial = playerInfo.socials?.find(s => s?.service === 'Discord');
	$: beatsaverSocial = playerInfo.socials?.find(s => s?.service === 'BeatSaver');
	$: youtubeSocial = playerInfo.socials?.find(s => s?.service === 'YouTube');
</script>

<div class="socials-container">
	{#if steamLink}
		<Button
			url={steamLink}
			cls="socials-btn"
			onlyurl={true}
			animated={true}
			animationOpacity={0.8}
			type="gray"
			icon={steamSvg}
			title="Steam profile" />
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
			title="Discord profile" />
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
			title="Twitch profile" />
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
			title="Twitter profile" />
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
			title="Youtube profile" />
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
			title="BeatSaver profile" />
	{/if}
</div>

<style>
	.socials-container {
		display: flex;
		justify-content: center;
		gap: 0.6em;
		background-color: black;
		padding: 0.6em;
		border-radius: 0.5em;
		width: fit-content;
	}

	:global(.socials-btn) {
		height: 2em !important;
		margin: 0 !important;
	}
</style>
