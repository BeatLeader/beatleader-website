<script>
    import {fade, fly, slide} from 'svelte/transition'
    import {opt} from '../../utils/js'
    import SongInfo from './SongInfo.svelte'
    import ScoreRank from './ScoreRank.svelte'
    import FormattedDate from '../Common/FormattedDate.svelte'
    import SongScoreDetails from './SongScoreDetails.svelte'
    import Icons from '../Song/Icons.svelte'
    import PlayerPerformance from "./PlayerPerformance.svelte";
    import Button from '../Common/Button.svelte'
  
    export let playerId = null;
    export let songScore = null;
    export let fixedBrowserTitle = null;
    export let idx = 0;
    export let service = null;
    export let modifiersStore = null;
    export let store = null;
  
    let showDetails = false;
  
    $: leaderboard = opt(songScore, 'leaderboard', null);
    $: score = opt(songScore, 'score', null);
    $: prevScore = opt(songScore, 'prevScore', null);
    $: beatSavior = opt(songScore, 'beatSavior', null)
    $: hash = opt(leaderboard, 'song.hash')
    $: twitchUrl = opt(songScore, 'twitchVideo.url', null)
    $: diffInfo = opt(leaderboard, 'diffInfo')
  </script>
  
  {#if songScore}
    <div class={`song-score row-${idx}`}
         in:fly={{x: 300, delay: idx * 30, duration:500}} out:fade={{duration:100}}
         class:with-details={showDetails}>

         <div class="icons up-to-tablet">
            <Icons {hash} {twitchUrl} {diffInfo} {playerId} scoreId={score.id} replayLink={score.replay}/>
          </div>
  
      <div class="main" class:beat-savior={service === 'beatsavior'} class:accsaber={service === 'accsaber'}>
        <span class="rank">
  
          <div class="timeset tablet-and-up">
            <FormattedDate date={score.timeSet}
                           prevPrefix="vs "
                           prevDate={prevScore ? prevScore.timeSet : null}
                           absolute={service === 'beatsavior'}/>
          </div>
        </span>
  
        <span class="timeset mobile-only">
          <FormattedDate date={score.timeSet}
                         prevPrefix="vs "
                         prevDate={prevScore ? prevScore.timeSet : null}
                         absolute={service === 'beatsavior'}/>
        </span>
  
        <span class="song">
          <SongInfo {leaderboard} {score} rank={score.rank} {hash} {twitchUrl}
                    notClickable={['beatsavior'].includes(service)}
                    replayLink={score.replay}
                    category={leaderboard?.categoryDisplayName ?? null} {service} {playerId}
                    jumpDistance={beatSavior ? beatSavior.songJumpDistance : 0}/>
        </span>
  
        <div class="score-options-section">
            <span class="beat-savior-reveal clickable" class:opened={showDetails}
                  on:click={() => showDetails = !showDetails} title="Show details">
              <i class="fas fa-chevron-down"></i>
            </span>
        </div>
  
        <PlayerPerformance {service} {songScore} {showDetails} {modifiersStore} unmodifiedScore={true}/>
      </div>

      <div class="lowerContainer">
        Fail reason: {score.error}
        <div>
            <Button title="Delete failed score upload" label="Delete" noMargin={true} type="danger"
                        on:click={store.deleteScore(score.id)}/>
            {#if score.replay.length}     
            <Button title="Retry posting score" label="Retry" noMargin={true} type="primary"
                        on:click={store.retryScore(score.id)}/>
            {/if}
        </div>
      </div>
      
  
      {#if showDetails}
        <div transition:slide>
          <SongScoreDetails {playerId} {songScore} {fixedBrowserTitle}
                            noSsLeaderboard={['beatsavior', 'accsaber'].includes(service)}
                            showAccSaberLeaderboard={'accsaber' === service}
                            noBeatSaviorHistory={service === 'beatsavior'}/>
        </div>
      {/if}
    </div>
  {/if}
  
  <style>
      .song-score {
          border-bottom: 1px solid var(--dimmed);
          padding: .5em 0;
      }
  
      .song-score .icons.up-to-tablet + .main {
          padding-top: 0;
      }
  
      .song-score .main {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: center;
          grid-column-gap: .4em;
      }
  
      .song-score.with-details .main {
          border-bottom: none;
      }
  
      .song-score .main > *:last-child {
          margin-right: 0;
      }
  
      .song-score .main :global(.badge) {
          margin: 0 !important;
          padding: .125em .25em !important;
          width: 100%;
      }
  
      .song-score .main :global(.badge small) {
          font-size: .7em;
          font-weight: normal;
          margin-top: -2px;
      }
  
      .song-score .main :global(.inc), .song-score :global(.dec) {
          color: inherit;
      }
  
      .rank {
          width: 5.5em;
          text-align: center;
      }
  
      .song {
          flex-grow: 1;
          min-width: 15.25em;
      }
  
      .timeset {
          width: 8.5em;
          text-align: center;
      }
  
      .main.beat-savior .timeset {
          width: auto;
      }
  
      .timeset :global(small) {
          line-height: 1;
      }
  
      .rank .timeset {
          width: auto;
          min-width: 7em;
          font-size: .8em;
      }
  
      .with-badge :global(.badge) {
          height: 100%;
      }
  
      small {
          display: block;
          text-align: center;
          white-space: nowrap;
          font-size: .75em;
      }
  
      .score-options-section {
          display: grid;
          justify-items: center;
          margin: .3em;
      }
  
      .beat-savior-reveal {
          align-self: end;
          cursor: pointer;
          transition: transform 500ms;
          transform-origin: .42em .8em;
      }
  
      .beat-savior-reveal.opened {
          transform: rotateZ(180deg);
      }
  
      .icons {
          width: 100%;
          font-size: .75em;
          text-align: right;
          margin-right: 0;
          margin-bottom: .5em;
      }
  
      .icons:empty {
          margin-bottom: 0 !important;
      }

      .lowerContainer {
        display: flex;
        justify-content: space-between;
        margin: 1em 0 0;
        align-items: center;
      }
  
      @media screen and (max-width: 767px) {
          .song-score {
              padding: .75em 0;
          }
  
          .song-score .main {
              flex-wrap: wrap;
          }
  
          .rank, .timeset {
              padding-bottom: .5em !important;
          }
  
          .song {
              display: flex;
              justify-content: flex-start;
              align-items: center;
              width: 100%;
              margin-right: 0;
              padding-bottom: .75em;
          }
  
          .icons {
              margin-bottom: .5em;
          }
      }
  </style>