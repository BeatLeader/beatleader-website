<script>
  import {diffColors, describeModifiersAndMultipliers} from '../../utils/beatleader/format'
  import Badge from './Badge.svelte'
  import Value from './Value.svelte'

  export let score;
  export let prevScore = null;
  export let showPercentageInstead = false;
  export let showMods = true;
  export let modifiersStore = null;

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

  $: badge = getBadge(score?.acc);
  $: mods = score?.mods

  $: value = score?.acc ?? 0
  $: prevValue = value - (score?.scoreImprovement?.accuracy ?? 0)
</script>

<Badge onlyLabel={true} color="white" bgColor={badge ? badge.color : 'var(--dimmed)'} title={badge ? badge.desc : badge} label="">
    <span slot="label">
      <slot name="label-before"></slot>
      <Value {value} {prevValue}
             title={badge ? badge.desc : null} inline={false} suffix="%" suffixPrev="%" zero="-" withZeroSuffix={false}
      />
      <slot name="label-after"></slot>
    </span>
    <small class="mods" slot="additional" title={showMods && mods ? describeModifiersAndMultipliers(mods, modifiersStore) : null}>{#if showMods && mods && mods.length}{`${mods.join(' ')}`}{/if}</small>
</Badge>

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