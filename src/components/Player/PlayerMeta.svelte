<script>
	import {formatNumber} from '../../utils/format';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';

	export let playerStore;

	$: rank = $playerStore?.playerInfo.rank;
	$: pp = $playerStore?.playerInfo.pp;
	$: country = $playerStore?.playerInfo.country.country;
	$: countryRank = $playerStore?.playerInfo.country.rank;

	let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
	$: countryName = country == 'not set' ? country : regionNames.of((country ?? 'AD').toUpperCase());
	$: description = `
  	Top ${'#' + formatNumber(rank, 0)} global🌐/${'#' + formatNumber(countryRank, 0)} ${countryName}
	${formatNumber(pp, 0)}pp 
	${Math.round($playerStore?.scoreStats?.averageRankedAccuracy ?? 0, 2)}% average accuracy
	`;
</script>

<MetaTags
	title={$playerStore?.name}
	{description}
	openGraph={{
		title: $playerStore?.name,
		description,
		images: [{url: $playerStore?.playerInfo.avatar}],
		siteName: 'Player Profile - ' + ssrConfig.name,
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
