<script>
  import {navigate} from 'svelte-routing'
  import {getContext} from 'svelte';
  import {BL_CDN} from '../../network/queues/beatleader/page-queue'
  import createAccountStore from '../../stores/beatleader/account'
  import {configStore} from '../../stores/config'
  import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts'
  import {convertArrayToObjectByKey, opt} from '../../utils/js'

  import Value from '../Common/Value.svelte'
  import Status from './Status.svelte'
  import Skeleton from '../Common/Skeleton.svelte'
  import Error from '../Common/Error.svelte'
  import Badge from '../Common/Badge.svelte'
  import Button from '../Common/Button.svelte'
  import Preview from "../Common/Preview.svelte";
  import {addToDate, DAY, formatDateRelative} from '../../utils/date'

  export let name;
  export let playerInfo;
  export let playerId;
  export let prevInfo;
  export let error = null;

  const account = createAccountStore();

  function getCountryRankingUrl(countryObj) {
    const rank = opt(countryObj, 'rankValue', opt(countryObj, 'rank', null));
    if (!rank) return null;

    const country = opt(countryObj, 'country', null);
    if (!country) return null;

    return `/ranking/${country.toLowerCase()}/${Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1}`;
  }

  function navigateToCountryRanking(countryObj) {
    const url = getCountryRankingUrl(countryObj);

    if (url && url.length) navigate(url)
  }

  function navigateToGlobalRanking(rank) {
    if (!rank) return;

    navigate(`/ranking/global/${Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1}`)
  }

  function getPlayerCountries(playerInfo, prevInfo) {
    if (!playerInfo?.countries) return [];

    const prevCountries = convertArrayToObjectByKey(prevInfo?.countries ?? [], 'country');
    return playerInfo.countries
      .map(c => ({...c, prevRank: prevCountries?.[c.country]?.rank ?? null}));
  }

  const {open} = getContext('simple-modal');
  const showProfile = (profileLink) => {
    open(Preview, {previewLink: profileLink});
  };

  let nameInput;
  let redactingName = false;
  function onRedactButtonClick() {
      if (redactingName && nameInput.value) {
          account.changeName(nameInput.value);
      }
      redactingName = !redactingName;
  }

  $: rank = playerInfo ? (playerInfo.rankValue ? playerInfo.rankValue : playerInfo.rank) : null;
  $: playerRole = playerInfo?.role ?? null;
  $: countries = getPlayerCountries(playerInfo, prevInfo)
  $: loggedInPlayer = $account.id;
  $: isMain = configStore && opt($configStore, 'users.main') === playerId;
  $: gainDate = Number.isFinite(prevInfo?.gainDaysAgo) ? formatDateRelative(addToDate(-prevInfo.gainDaysAgo * DAY)) : null
</script>

<div class="profile-header-info">
  {#if playerInfo}
    <div class="player-nickname">
      {#if name}
        {#if redactingName}
        <input type="text"value="{name}" placeholder="Your name" class="input-reset" bind:this={nameInput}>
        {:else}
          {#if playerInfo.externalProfileUrl}
            <a href={playerInfo.externalProfileUrl}
              on:click={(e) => {e.preventDefault(); showProfile(playerInfo.externalProfileCorsUrl)}}
              target="_blank"
              rel="noreferrer">
              {name}
            </a>
          {:else}
            {name}
          {/if}
        {/if}
        {#if isMain && loggedInPlayer == playerId}
          <Button type="text" cls="editNameButton" iconFa={redactingName ? "fas fa-check" : "fas fa-edit"}
                        on:click={() => onRedactButtonClick()} />
        {/if}
      {/if}

      <span class="status">
        <Status {playerInfo}/>
      </span>
    </div>

    <div class="player-ranking">
      <a style="flex: none" href={`/ranking/global/${Math.floor((rank-1) / PLAYERS_PER_PAGE) + 1}`}
         on:click|preventDefault={() => navigateToGlobalRanking(rank)}
         title="Go to global ranking"
         class="clickable">

        <i class="fas fa-globe-americas"></i>

        <Value value={opt(playerInfo, 'rank')}
               prevValue={opt(prevInfo, 'rank')}
               prevLabel={prevInfo?.rank && gainDate ? gainDate : null}
               prefix="#"
               digits={0}
               zero="#0"
               inline={true}
               reversePrevSign={true}
        />
      </a>

      {#each countries as country}
        <a style="flex: none" href={getCountryRankingUrl(country)}
           on:click|preventDefault={() => navigateToCountryRanking(country)}
           title="Go to country ranking"
           class="clickable">

          <img
              src={`${BL_CDN}/flags/${country && country.country && country.country.toLowerCase ? country.country.toLowerCase() : ''}.png`}
              class="countryIcon"
              alt={opt(country, 'country')}
          />

          <Value value={country.rank}
                 prevValue={country.prevRank}
                 prevLabel={country?.prevRank && gainDate ? gainDate : null}
                 prefix="#"
                 digits={0}
                 zero="#0"
                 inline={true}
                 reversePrevSign={true}
          />

          {#if country.subRank && country.subRank !== country.rankValue}
            <small>(#{ country.subRank })</small>
          {/if}
        </a>
      {/each}

      <span class="pp">
        <Value value={opt(playerInfo, 'pp')} suffix="pp"
               prevValue={opt(prevInfo, 'pp')} prevLabel={prevInfo?.pp && gainDate ? gainDate : null}
               inline={true} zero="0pp"
        />
      </span>
    </div>

    {#if playerRole}
      <div class="player-role up-to-tablet">
        <Badge label={playerRole} onlyLabel={true} fluid={true} bgColor="var(--dimmed)"/>
      </div>
    {/if}

    {#if error}
      <div>
        <Error {error}/>
      </div>
    {/if}
  {:else if error}
    <div>
      <Error {error}/>
    </div>
  {/if}
</div>

<style>
    .profile-header-info {
        display: contents;
    }

    .player-nickname {
        display: flex;
        flex-wrap: nowrap;
        color: var(--alternate);
        font-size: 2em;
        font-weight: bold;
        margin: -.2em 0em;
    }

    .status {
        font-size: smaller;
    }

    .player-ranking {
        display: flex;
        flex-wrap: nowrap;
        grid-gap: 0.7em;
        font-size: 1.25em;
        font-weight: 500;
    }

    .pp {
        color: var(--ppColour) !important;
    }

    .player-role {
        text-align: center;
    }

    .countryIcon {
      width: 1.2em;
    }

    .input-reset {
      width: 70%;
      font-size: 1em;
      height: 1.8em;
    }

    :global(.editNameButton) {
        padding-bottom: 1.2em !important;
        margin-bottom: -1em !important;
    }
</style>