<script>
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';

	export let clan;

	$: image = clan?.icon ?? '';

	$: title = clan?.name + ' | Beat Saber clan';
	$: description =
		`
        ${clan?.tag}
  	    ${clan?.description}
        ${clan?.playersCount} player${clan?.playersCount > 1 ? "s" : "" }
	`
</script>

<svelte:head>
    <meta name="msapplication-TileColor" content={clan?.color}>
    <meta name="theme-color" content={clan?.color}>
</svelte:head>

<MetaTags
	{title}
	{description}
	openGraph={{
		title,
		description,
		images: [{url: image}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title,
		description,
		image,
		imageAlt: clan?.name + ' cover',
	}} />
