<script>
  import {navigate} from 'svelte-routing'
  import {createEventDispatcher, getContext} from 'svelte';
  import {BL_CDN} from '../../network/queues/beatleader/page-queue'
  import createAccountStore from '../../stores/beatleader/account'
  import {configStore} from '../../stores/config'
  import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts'

  import Value from '../Common/Value.svelte'
  import Status from './Status.svelte'
  import Error from '../Common/Error.svelte'
  import Badge from '../Common/Badge.svelte'
  import Button from '../Common/Button.svelte'
  import Preview from "../Common/Preview.svelte";
  import CountryPicker from "../Common/CountryPicker.svelte"
  import ClanBadges from './ClanBadges.svelte'
import BanForm from './BanForm.svelte';

  export let name;
  export let playerInfo;
  export let playerId;
  export let statsHistory;
  export let error = null;

  const dispatch = createEventDispatcher();

  const account = createAccountStore();

  function getCountryRankingUrl(countryObj) {
    const rank = countryObj?.rankValue ?? countryObj?.rank ?? null;
    if (!rank) return null;

    const country = countryObj?.country ?? null;
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

  function getPlayerCountries(playerInfo, statsHistory) {
    if (!playerInfo?.countries) return [];

    return playerInfo.countries
      .map(c => ({...c, prevRank: statsHistory?.countryRank?.length > 1 ? statsHistory.countryRank[statsHistory.countryRank.length - 2] : null}));
  }

  const {open} = getContext('simple-modal');
  const showProfile = (profileLink) => {
    open(Preview, {previewLink: profileLink});
  };

  let nameInput;
  let messageInput;
  let redactingName = false;
  async function onRedactButtonClick() {
      if (!redactingName) {
        nameInput = name;
        messageInput = playerInfo.patreonFeatures?.message;
      }

      if (redactingName && nameInput !== name) {
        try {
          dispatch('player-data-edit-error', null);

          if (loggedInPlayer === playerId) {
            await account.changeName(nameInput);
          } else {
            await account.changeName(nameInput, playerId);
          }

          dispatch('player-data-updated', {name: nameInput});
        }
        catch(err) {
          dispatch('player-data-edit-error', err);
        }
      }

      if (redactingName && selectedCountry && selectedCountry != countries[0]) {
        if (loggedInPlayer === playerId) {
          await account.changeCountry(selectedCountry);
        } else {
          await account.changeCountry(selectedCountry, playerId);
        }

        dispatch('player-data-updated', {country: selectedCountry});
      }

      if (redactingName && messageInput !== playerInfo.patreonFeatures?.message) {
        try {
          dispatch('player-data-edit-error', null);

          if (loggedInPlayer === playerId) {
            await account.changePatreonMessage(messageInput);
          } else {
            await account.changePatreonMessage(messageInput, playerId);
          }

          dispatch('player-data-updated', {message: messageInput});
        }
        catch(err) {
          dispatch('player-data-edit-error', err);
        }
      }

      redactingName = !redactingName;
  }

  function showRainbow(player) {
    var result = false;
    player.clans?.forEach(element => {
      if (element.tag == "GAY") {
        result = true;
      }
    });

    return result;
  }

  let selectedCountry = null;
  function handleCountrySelect(event) {
    selectedCountry = event.detail.value.toUpperCase();
  }

  let showBanForm = false;

  $: rank = playerInfo ? (playerInfo.rankValue ? playerInfo.rankValue : playerInfo.rank) : null;
  $: countries = getPlayerCountries(playerInfo, statsHistory)
  $: loggedInPlayer = $account.id;
  $: isMain = configStore && $configStore?.users?.main === playerId;
  $: isAdmin = $account.player && $account.player.role && $account.player.role.includes("admin")
  $: canRedact = (isMain && loggedInPlayer === playerId) || isAdmin
</script>

{#if showBanForm}
	<BanForm playerId={playerId} accountStore={account} on:finished={() => (showBanForm = false)} />
{/if}
<div class="profile-header-info">
  {#if playerInfo}
    <div class="player-nickname {showRainbow(playerInfo) ? "rainbow" : ""}">
      {#if name}
        {#if redactingName}
          <input type="text" bind:value={nameInput} placeholder="Your name" class="input-reset">
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

        <span class="clan-badges"><ClanBadges player={playerInfo} /></span>

        {#if canRedact}
          <Button type="text" cls="editNameButton" iconFa={redactingName ? "fas fa-check" : "fas fa-edit"}
                        on:click={() => onRedactButtonClick()} />
        {/if}
      {/if}

      <span class="status">
        <Status {playerInfo}/>
      </span>
    </div>

    {#if playerInfo.sponsor}
      {#if redactingName}
      <div class="sponsor-message">
        <span>This message will be shown in-game for your scores.<br>
          You can use <a class="inlineLink" href="http://digitalnativestudios.com/textmeshpro/docs/rich-text">Unity tags</a> here.</span>
        <input type="text" bind:value={messageInput} placeholder="Promotion message" class="sponsor-input">
      </div>
      {/if}
    {/if}

    <div class="player-ranking">
      <a style="flex: none" href={`/ranking/global/${Math.floor((rank-1) / PLAYERS_PER_PAGE) + 1}`}
         on:click|preventDefault={() => navigateToGlobalRanking(rank)}
         title="Go to global ranking"
         class="clickable">

        <i class="fas fa-globe-americas"></i>

        <Value value={playerInfo?.rank}
               prevValue={statsHistory?.rank?.length > 1 ? statsHistory.rank[statsHistory.rank.length - 2] : null}
               prevLabel="Yesterday"
               prefix="#"
               digits={0}
               zero="#0"
               inline={true}
               reversePrevSign={true}
        />
      </a>

      {#if canRedact && redactingName}
        <div class='pickerContainer'>
          <CountryPicker selected={countries[0].country.toLowerCase()} on:select={handleCountrySelect}/>
        </div>
      {:else}
        {#each countries as country}
          <a style="flex: none" href={getCountryRankingUrl(country)}
            on:click|preventDefault={() => navigateToCountryRanking(country)}
            title="Go to country ranking"
            class="clickable">

            <img
                src={`${BL_CDN}/flags/${country && country.country && country.country.toLowerCase ? country.country.toLowerCase() : ''}.png`}
                class="countryIcon"
                alt={country?.country}
            />

            <Value value={country.rank}
                  prevValue={country.prevRank}
                  prevLabel="Yesterday"
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
      {/if}

      <span class="pp">
        <Value value={playerInfo?.pp} suffix="pp"
               prevValue={statsHistory?.pp?.length > 1 ? statsHistory.pp[statsHistory.pp.length - 2] : null}
               prevLabel="Yesterday"
               inline={true} zero="0pp"
        />
      </span>

      {#if isAdmin && loggedInPlayer != playerId}
        {#if playerInfo?.banned}
          <Button cls="banButton" title="Unban player" label="Unban player" type="danger"
                          on:click={async () => await account.unbanPlayer(playerId)}/>
        {:else}
          <Button cls="banButton" title="Ban player" label="Ban player" type="danger"
                          on:click={async () => showBanForm = !showBanForm}/>
        {/if}
      {/if}
    </div>

    {#if selectedCountry && redactingName}
    Make sure you selected right country. You can change it only every 30 days.
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
        align-items: baseline;
    }

    .player-nickname.rainbow {
      color: #00ffbc;
      -webkit-background-clip: text;
      background-image: -webkit-linear-gradient(180deg,#f35626,#feab3a);
      -webkit-animation: rainbow .90s infinite linear;
      animation: rainbow .90s infinite linear;
    }

    .clan-badges {
        margin-left: .5rem;
        position: relative;
        top: -.125em;
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

    .sponsor-message {
        padding-top: 1em;
        padding-bottom: 1em;
        display: grid;
    }

    .sponsor-input {
        font-size: inherit;
        padding: 0;
        color: var(--textColor);
        background-color: transparent;
        border: none;
        border-bottom: solid 1px var(--dimmed);
        outline: none;
    }

    .countryIcon {
      width: 1.2em;
    }

    .input-reset {
        width: 70%;
        font-size: inherit;
        padding: 0;
        color: var(--textColor);
        background-color: transparent;
        border: none;
        border-bottom: solid 1px var(--dimmed);
        outline: none;
    }

    .input-reset::placeholder {
        color: var(--faded)!important;
    }

    .inlineLink {
        display: contents;
    }

    :global(.editNameButton) {
        padding-bottom: 1.2em !important;
        margin-bottom: -1em !important;
        font-size: .75em!important;
    }

    :global(.banButton) {
      padding: 0 !important;
      font-size: 0.8em !important;
    }
</style>