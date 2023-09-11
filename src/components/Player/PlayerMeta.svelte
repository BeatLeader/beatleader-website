<script>
	import {formatNumber} from '../../utils/format';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';

	export let playerStore;

	$: rank = $playerStore?.playerInfo.rank;
	$: pp = $playerStore?.playerInfo.pp;
	$: country = $playerStore?.playerInfo.countries[0].country;
	$: countryRank = $playerStore?.playerInfo.countries[0].rank;

	function fillWithSpaces(value, length) {
		while (value.length < length) {
			value += ' ';
		}
		return value;
	}

	let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
	$: countryName = country == 'not set' ? country : regionNames.of((country ?? 'AD').toUpperCase());
	$: description = `
  	${fillWithSpaces('#' + formatNumber(rank, 0), 7)}Beat Saber player 🌐
	${fillWithSpaces('#' + formatNumber(countryRank, 0), 7)}in ${countryName}
	${fillWithSpaces('' + formatNumber(pp, 0), 7)}pp (performance points) 
	${fillWithSpaces(Math.round($playerStore?.scoreStats?.averageRankedAccuracy ?? 0, 2) + '%', 7)}average accuracy
	`;
</script>

<MetaTags
	title={$playerStore?.name}
	{description}
	openGraph={{
		title: $playerStore?.name,
		description,
		images: [{url: $playerStore?.playerInfo.avatar}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: $playerStore?.name,
		description,
		image: $playerStore?.playerInfo.avatar,
		imageAlt: $playerStore?.name + ' profile picture',
	}} />
