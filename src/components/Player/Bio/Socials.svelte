<script>
	import Button from '../../Common/Button.svelte';
	import steamSvg from '../../../resources/steam.svg';
	import {configStore} from '../../../stores/config';
	import {fly} from 'svelte/transition';
	import Popover from '../../Common/Popover.svelte';

	export let playerId = null;
	export let playerInfo = null;
	export let name;
	export let playerData = null;

	let devInfoButton;

	$: steamLink = playerInfo.externalProfileUrl;
	$: twitchSocial = playerInfo.socials?.find(s => s?.service === 'Twitch');
	$: twitterSocial = playerInfo.socials?.find(s => s?.service === 'Twitter');
	$: blueskySocial = playerInfo.socials?.find(s => s?.service === 'BlueSky');
	$: discordSocial = playerInfo.socials?.find(s => s?.service === 'Discord');
	$: beatsaverSocial = playerInfo.socials?.find(s => s?.service === 'BeatSaver');
	$: youtubeSocial = playerInfo.socials?.find(s => s?.service === 'YouTube');
	$: githubSocial = playerInfo.socials?.find(s => s?.service === 'GitHub');
	$: devInfo = {
		playerId: playerData.playerId,
		oculusPcId: playerData.linkedIds?.oculusPCId ?? '',
		questId: playerData.linkedIds?.questId ?? '',
		steamId: playerData.linkedIds?.steamId ?? '',
		alias: playerData.alias,
		roles: playerData.role,
	};
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

{#if blueskySocial}
	<Button
		url={blueskySocial.link}
		cls="socials-btn"
		onlyurl={true}
		animated={true}
		animationOpacity={0.8}
		type="twitter"
		iconFa="fab fa-bluesky"
		title="{blueskySocial.user} drama starter" />
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
		icon="<img src='/assets/beatsaver-icon.png' />"
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

{#if devInfo && $configStore.profileParts?.devInfo === true}
	<Button
		cls="socials-btn"
		animated={true}
		animationOpacity={0.8}
		type="github"
		iconFa="fab fa-hashtag"
		title="Dev info"
		bind:buttonElement={devInfoButton} />
{/if}

{#if devInfoButton}
	<Popover triggerEvents={['click']} placement="bottom" referenceElement={devInfoButton} closeOnClickAway={false} spaceAway={4}>
		<div class="dev-info" transition:fly={{y: 50, duration: 300}}>
			Primary ID: <strong>{devInfo.playerId}</strong> <br />
			Alias: <strong>{devInfo.alias ? devInfo.alias : 'N/A'}</strong> <br />
			<hr style="margin: 0.5em 0; height: 0px" />
			Linked IDs<br />
			Steam ID: <strong>{devInfo.steamId !== '' ? devInfo.steamId : 'N/A'}</strong> <br />
			OculusPC ID: <strong>{devInfo.oculusPcId !== '' ? devInfo.oculusPcId : 'N/A'}</strong> <br />
			Quest ID: <strong>{devInfo.questId !== '' ? devInfo.questId : 'N/A'}</strong> <br />
			<hr style="margin: 0.5em 0; height: 0px" />
			Roles:<strong>{devInfo.roles.length > 0 ? devInfo.roles.replace(/^,/, '').replace(/,/g, ', ') : 'None'}</strong>
		</div>
	</Popover>
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

	.dev-info {
		width: 20em;
		height: fit-content;
		background: #393939;
		border-radius: 0.75em;
		padding: 0.75em;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
	}
</style>
