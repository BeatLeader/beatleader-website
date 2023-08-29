<script>
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import createTwitchService from '../services/twitch';
	import ssrConfig from '../ssr-config';
	import {SsrHttpUnauthenticatedError} from '../network/errors';
	import Error from '../components/Common/Error.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';

	document.body.classList.add('slim');

	let twitchService = createTwitchService();

	let message = null;
	let error = null;

	onMount(async () => {
		try {
			const token = twitchService.getTwitchTokenFromUrl();

			message = 'Token validation, please wait...';

			await twitchService.processToken(token.accessToken);

			message = 'Token has been validated correctly. Redirecting...';

			navigate(token.url && token.url.length ? token.url : '/');
		} catch (err) {
			if (err instanceof SsrHttpUnauthenticatedError) {
				try {
					const jsonResponse = await err.response.json();

					if (jsonResponse && jsonResponse.message) err = jsonResponse.message;
				} catch (foo) {
					// swallow error
				}
			}

			error = err;
		}
	});
</script>

<svelte:head>
	<title>Twitch integration | {ssrConfig.name}</title>
</svelte:head>

<article transition:fade|global>
	<ContentBox>
		<h1 class="title is-3">Twitch integration</h1>

		{#if !error}
			<Spinner /> {message}
		{:else}
			<p>Something went wrong. Twitch returned error.</p>

			<Error {error} />
		{/if}

		<p><a href="" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
	</ContentBox>
</article>

<style>
	article {
		text-align: center;
	}
</style>
