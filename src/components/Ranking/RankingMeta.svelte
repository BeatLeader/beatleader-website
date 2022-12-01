<script>
	import {formatNumber} from '../../utils/format';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';
	import {CURRENT_URL} from '../../network/queues/beatleader/api-queue';
	import {isString} from '../../utils/js';

	export let rankingStore;
	export let countries;

	let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});

	$: countriesArray = isString(countries) ? countries.split(',') : countries;
	$: countryName = countriesArray.length ? countriesArray.map(a => regionNames.of((a ?? 'AD').toUpperCase())).join(',') : null;

	function fillWithSpaces(value, length) {
		while (value.length < length) {
			value += ' ';
		}
		return value;
	}

	$: title = countryName ? 'Player ranking in ' + countryName : 'Global player ranking';
	let description = '';

	function generateDescription(playerList) {
		if (!playerList) return;

		const sublist = playerList.slice(0, 10);

		var maxLength = -1;
		sublist.forEach(player => (maxLength = player?.name.length > maxLength ? player?.name.length : maxLength));
		var result = '';
		sublist.forEach(player => {
			const rank = player?.playerInfo.rank;
			const pp = player?.playerInfo.pp;

			result += `${fillWithSpaces('#' + formatNumber(rank, 0), 8)}${fillWithSpaces(player?.name, maxLength + 2)}${formatNumber(pp, 0)}pp\n`;
		});

		description = result;
	}

	$: generateDescription($rankingStore.data);
</script>

<MetaTags
	{title}
	{description}
	openGraph={{
		title,
		description,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		site_name: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title,
		description,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: 'Ranking logo',
	}} />
