<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';

	document.body.classList.add('slim');
	document.body.scrollIntoView({behavior: 'smooth'});
</script>

<svelte:head>
	<title>404 | You missed - {ssrConfig.name}</title>
</svelte:head>

<article transition:fade|global>
	<ContentBox>
		<h1 class="title is-3">404 | You Missed</h1>

		<p><a href="" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>

		<img src="/assets/miss.gif" width="306" height="342" alt="A saber misses a block" />
	</ContentBox>
</article>

<style>
	article {
		text-align: center;
	}

	p {
		text-align: center;
	}

	img {
		margin-top: 1em;
		max-width: 100%;
		border-radius: 10%;
	}
</style>
