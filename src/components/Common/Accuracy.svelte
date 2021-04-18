<script>
  import Badge from './Badge.svelte'
  import Value from './Value.svelte'
  import {diffColors} from '../../scoresaber/format'

  export let score;
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
    badge.desc = `${badge.name} (${!badge.min ? '< ' + badge.max + '%' : (!badge.max ? '> ' + badge.min + '%' : badge.min + '% - ' + badge.max + '%')})`;
  });

  function getBadge(acc) {
    return badgesDef.reduce((cum, badge) => ((!badge.min || badge.min <= acc) && (!badge.max || badge.max > acc)) ? badge : cum, badgesDef[badgesDef.length - 1]);
  }

  $: badge = getBadge(showPercentageInstead ? score?.percentage : score?.acc);

  $: {
    console.log(badge);
  }
</script>

{#if (showPercentageInstead && score?.percentage) || score?.acc}
  <Badge onlyLabel={true} color="white" bgColor={badge.color} title={badge.desc} label="">
      <span slot="label">
        <Value value={showPercentageInstead ? score.percentage : score.acc}
               prevValue={showPercentageInstead ? score.prevPercentage : score.prevAcc}
               withZeroSuffix={true} title={badge.desc} inline={true} suffix="%" suffixPrev="%"
        />
      </span>
  </Badge>
  <small>{score.mods && score.mods.length ? ` (${score.mods})` : ''}&nbsp;</small>
{/if}

<style>
    small {
        display: block;
        text-align: center;
    }
</style>