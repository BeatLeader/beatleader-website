<script>
	import {formatNumber} from '../../utils/format';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';

	export let playerStore;

	$: rank = $playerStore?.playerInfo.rank;
	$: pp = $playerStore?.playerInfo.pp;
	$: country = $playerStore?.playerInfo.countries[0].country;
	$: countryRank = $playerStore?.playerInfo.countries[0].rank;

	function getFlagEmoji(countryCode) {
		const codePoints = countryCode
			.toUpperCase()
			.split('')
			.map(char => 127397 + char.charCodeAt());
		return String.fromCodePoint(...codePoints);
	}

	function fillWithSpaces(value, length) {
		while (value.length < length) {
			value += ' ';
		}
		return value;
	}

	let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
	$: countryName = country == 'not set' ? country : regionNames.of((country ?? 'AD').toUpperCase());
	$: metaDescription = `
  	${fillWithSpaces('#' + formatNumber(rank, 0), 7)}Beat Saber player 🌐
	${fillWithSpaces('#' + formatNumber(countryRank, 0), 7)}in ${countryName} ${getFlagEmoji(country ?? 'AD')}
	${fillWithSpaces('' + formatNumber(pp, 0), 7)}pp (performance points) 
	${fillWithSpaces(Math.round($playerStore?.scoreStats?.averageRankedAccuracy ?? 0, 2) + '%', 7)}average accuracy
	`;

	$: twitterDescription = `
      Top #${formatNumber(rank, 0)} Beat Saber player
    from ${countryName}
    with ${formatNumber(pp, 0)} performance points 
    and ${Math.round($playerStore?.scoreStats?.averageRankedAccuracy ?? 0, 2)}% average accuracy
    `;
</script>

<MetaTags
	title={$playerStore?.name}
	description={metaDescription}
	openGraph={{
		title: $playerStore?.name,
		description: metaDescription,
		image: {url: $playerStore?.playerInfo.avatar},
		site_name: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: $playerStore?.name,
		description: twitterDescription,
		image: $playerStore?.playerInfo.avatar,
		imageAlt: $playerStore?.name + ' profile picture',
	}} />
