<script>
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';

	export let event;

	$: description =
		event &&
		`Beat Saber competition.
  	${Date.now() / 1000 < event.endDate ? 'Will end ' + formatDateRelative(dateFromUnix(event.endDate)) : 'Ended ' + formatDateRelative(dateFromUnix(event.endDate))}
	`;
</script>

{#if event}
	<MetaTags
		title={event.name}
		{description}
		openGraph={{
			title: event.name,
			description,
			images: [{url: event.image}],
			siteName: 'Event - ' + ssrConfig.name,
		}}
		twitter={{
			handle: '@handle',
			site: '@beatleader_',
			cardType: 'summary',
			title: event.name,
			description,
			image: event.image,
			imageAlt: event.name + ' event icon',
		}} />
{/if}
