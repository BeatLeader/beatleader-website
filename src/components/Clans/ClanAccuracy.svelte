<script>
	import {diffColors} from '../../utils/beatleader/format';
	import Badge from '../Common/Badge.svelte';
	import Value from '../Common/Value.svelte';

	export let clanRanking;
	export let showPercentageInstead = false;

	const badgesDef = [
		{name: 'SS+', min: 95, max: null, color: diffColors.expertPlus},
		{name: 'SS', min: 90, max: 95, color: diffColors.expert},
		{name: 'S+', min: 85, max: 90, color: diffColors.hard},
		{name: 'S', min: 80, max: 85, color: diffColors.normal},
		{name: 'A', min: 70, max: 80, color: diffColors.easy},
		{name: '-', min: null, max: 70, color: 'var(--dimmed)'},
	];

	badgesDef.forEach(badge => {
		badge.desc = `${showPercentageInstead ? 'Percentage' : 'Accuracy'} ${badge.name} (${
			!badge.min ? `< ${badge.max}%` : !badge.max ? `> ${badge.min}%` : `${badge.min}% - ${badge.max}%`
		})`;
	});

	function getBadge(acc) {
		if (!acc) return null;
		return badgesDef.reduce(
			(cum, badge) => ((!badge.min || badge.min <= acc) && (!badge.max || badge.max > acc) ? badge : cum),
			badgesDef[badgesDef.length - 1]
		);
	}

	$: badge = getBadge(clanRanking?.clanAverageAcc);
    $: avgAcc = clanRanking?.clanAverageAcc;
</script>

<Badge onlyLabel={true} color="white" bgColor={badge ? badge.color : 'var(--dimmed)'} title={badge ? badge.desc + avgAcc : badge} label="">
	<span slot="label">
		<slot name="label-before" />
		<Value
			value={avgAcc}
			title={badge ? badge.desc + avgAcc : null}
			inline={false}
			suffix="%"
			suffixPrev="%"
			zero="-"
			withZeroSuffix={false} />
		<slot name="label-after" />
	</span>
</Badge>
