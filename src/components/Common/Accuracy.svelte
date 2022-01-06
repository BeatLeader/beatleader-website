<script>
  import {configStore} from '../../stores/config'
  import {diffColors} from '../../utils/scoresaber/format'
  import {opt} from '../../utils/js'
  import {formatDate} from '../../utils/date'
  import Badge from './Badge.svelte'
  import Value from './Value.svelte'

  export let score;
  export let prevScore = null;
  export let showPercentageInstead = false;
  export let noSecondMetric = false;
  export let secondMetricInsteadOfDiff = false;
  export let showMods = true;

  const badgesDef = [
    {name: 'SS+', min: 95, max: null, color: diffColors.expertPlus},
    {name: 'SS', min: 90, max: 95, color: diffColors.expert},
    {name: 'S+', min: 85, max: 90, color: diffColors.hard},
    {name: 'S', min: 80, max: 85, color: diffColors.normal},
    {name: 'A', min: 70, max: 80, color: diffColors.easy},
    {name: '-', min: null, max: 70, color: 'var(--dimmed)'},
  ];

  badgesDef.forEach(badge => {
    badge.desc = `${showPercentageInstead ? 'Percentage' : 'Accuracy'} ${badge.name} (${!badge.min ? `< ${badge.max}%` : (!badge.max ? `> ${badge.min}%` : `${badge.min}% - ${badge.max}%`)})`;
  });

  function getBadge(acc) {
    if (!acc) return null;

    return badgesDef.reduce((cum, badge) => ((!badge.min || badge.min <= acc) && (!badge.max || badge.max > acc)) ? badge : cum, badgesDef[badgesDef.length - 1]);
  }

  $: badge = getBadge(showPercentageInstead ? opt(score, 'percentage') : opt(score, 'acc'));
  $: mods = opt(score, 'mods')
</script>

<Badge onlyLabel={true} color="white" bgColor={badge ? badge.color : 'var(--dimmed)'} title={badge ? badge.desc : badge} label="">
    <span slot="label">
      <slot name="label-before"></slot>
      <Value value={showPercentageInstead ? score.percentage : score.acc}
             prevValue={showPercentageInstead ? opt(prevScore, 'percentage') : opt(prevScore, 'acc')}
             title={badge ? badge.desc : null} inline={false} suffix="%" suffixPrev="%" zero="-" withZeroSuffix={false}
             prevTitle={"${value} on " + (configStore, $configStore, formatDate(opt(prevScore, 'timeSet'), 'short', 'short'))}
      />
      <slot name="label-after"></slot>
      {#if !noSecondMetric && secondMetricInsteadOfDiff && ((showPercentageInstead && score.acc) || (!showPercentageInstead && score.percentage)) && score.acc !== score.percentage}
        <small>
          <Value value={showPercentageInstead ? score.acc : score.percentage}
                 withZeroSuffix={true} inline={false} suffix="%" suffixPrev="%"
                 title={showPercentageInstead ? 'Accuracy' : 'Percentage'}
          />
        </small>
      {/if}
    </span>
    
    <small class="mods" slot="additional" title={showMods && mods ? 'Mods: ' + mods.join(', ') : null}>{#if showMods && mods && mods.length}{`${mods.join(' ')}`}{/if}</small>
</Badge>

{#if !noSecondMetric && !secondMetricInsteadOfDiff && score.mods && score.mods.length  && score.acc !== score.percentage}
<small>
    <Value value={!showPercentageInstead ? score.percentage : score.acc}
           withZeroSuffix={true} inline={false} suffix="%" suffixPrev="%"
           title={showPercentageInstead ? 'Accuracy' : 'Percentage'}
    />
</small>
{/if}

<style>
    small {
        display: block;
        text-align: center;
        white-space: nowrap;
    }

    .mods {
        max-width: 1.5em;
        max-height: 2em;
        line-height: 1;
        white-space: normal!important;
        overflow: hidden;
    }

    .mods:empty {display: none!important;}
</style>