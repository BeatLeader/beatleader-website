<script>
  import queue from '../../network/queues/queues'
  import {tweened} from 'svelte/motion'
  import {cubicOut} from 'svelte/easing';
  import Donut from './Donut.svelte'
  import {fade} from 'svelte/transition'
  import {opt} from '../../utils/js'

  const TWEEN_DEFAULT_OPTIONS = {duration: 200, easing: cubicOut};

  const ssApiQueueStats = queue.SCORESABER_API;

  let progressTween = tweened(0, TWEEN_DEFAULT_OPTIONS);

  $: progressTween.set(
    Math.round($ssApiQueueStats.progress.progress * 100),
    {...TWEEN_DEFAULT_OPTIONS, duration: $ssApiQueueStats.progress.progress === 0 ? 0 : TWEEN_DEFAULT_OPTIONS.duration},
  );

  $: waiting = opt($ssApiQueueStats, 'rateLimit.waiting')
</script>

{#if ($ssApiQueueStats.progress.count > 2 && $progressTween < 100) || waiting }
  <aside transition:fade={{duration: TWEEN_DEFAULT_OPTIONS.duration * 2}}>
    <Donut color={waiting > 0 ? "#bf2a42" : "#8f48db"}
           background="var(--background)"
           value={waiting > 0 ? waiting/1000 : $progressTween}
           valueProps={{digits:0, suffix: waiting > 0 ? '' : '%'}}
           percentage={waiting && $ssApiQueueStats.progress.count <= 2 ? 1 : $progressTween/100}
           digits={0}
           animDuration={0}
    />
  </aside>
{/if}

<style>
    aside {
        position: absolute;
        right: 0;
        top: .25rem;
        font-size: .65em;
    }
</style>