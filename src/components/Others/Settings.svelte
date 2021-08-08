<script>
  import produce from 'immer'
  import {configStore, DEFAULT_LOCALE, getSupportedLocales} from '../../stores/config'
  import createTwitchService from '../../services/twitch'
  import {ROUTER} from 'svelte-routing/src/contexts'
  import {getContext, onMount} from 'svelte'
  import Dialog from '../Common/Dialog.svelte'
  import Button from '../Common/Button.svelte'
  import {opt} from '../../utils/js'
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {DAY} from '../../utils/date'

  export let show = false;

  const DEFAULT_SCORE_COMPARISON_METHOD = 'in-place';

  let twitchToken = null;

  let twitchService = createTwitchService();

  const {activeRoute} = getContext(ROUTER);

  const scoreComparisonMethods = [
    {name: 'In place', value: 'in-place'},
    {name: 'In details', value: 'in-details'},
  ];

  let currentLocale = DEFAULT_LOCALE;
  let currentScoreComparisonMethod = DEFAULT_SCORE_COMPARISON_METHOD;

  function onConfigUpdated(config) {
    if (config && config.locale) currentLocale = config.locale;
    if (config && config.scoreComparison) currentScoreComparisonMethod = config.scoreComparison.method ? config.scoreComparison.method : DEFAULT_SCORE_COMPARISON_METHOD;
  }

  function onSave() {
    if (!configStore || !$configStore) return;

    $configStore = produce($configStore, draft => {
      draft.locale = currentLocale;
      draft.scoreComparison.method = currentScoreComparisonMethod
    })

    show = false;
  }

  function onCancel() {
    if (configStore && $configStore) {
      currentLocale = $configStore.locale;
      currentScoreComparisonMethod = $configStore.scoreComparison.method;
    }

    show = false;
  }

  let showTwitchLinkBtn = true;
  let twitchBtnLabel = 'Link to Twitch'
  let twitchBtnTitle = null;
  let twitchBtnDisabled = true;

  function refreshTwitchButton(twitchToken) {
    const tokenExpireInDays = twitchToken ? Math.floor(twitchToken.expires_in / DAY) : null;
    const tokenExpireSoon = tokenExpireInDays <= 7;

    eventBus.publish('settings-notification-badge', twitchToken && tokenExpireSoon  ? 'Twitch token is required for renewal' : null);

    showTwitchLinkBtn = !twitchToken || tokenExpireSoon;

    twitchBtnLabel = !twitchToken || !tokenExpireSoon ? 'Link to Twitch' : 'Renew Twitch token'
    twitchBtnTitle = twitchToken && tokenExpireInDays > 0 ? `Days left: ${tokenExpireInDays}` : null;
    twitchBtnDisabled = !tokenExpireSoon;
  }

  onMount(async () => {
    const twitchTokenRefreshedUnsubscriber = eventBus.on('twitch-token-refreshed', newTwitchToken => twitchToken = newTwitchToken)

    twitchToken = await twitchService.getCurrentToken();

    return () => {
      twitchTokenRefreshedUnsubscriber();
    }
  })

  $: onConfigUpdated(configStore && $configStore ? $configStore : null);
  $: refreshTwitchButton(twitchToken)
</script>

{#if show}
  <Dialog title="Settings" closeable={true} on:confirm={onCancel}>
    <svelte:fragment slot="content">
      {#if configStore && $configStore}
        <section class="options">
          <section class="option">
            <label title="All numbers and dates will be formatted according to the rules of the selected country">Localization</label>
            <select bind:value={currentLocale}>
              {#each getSupportedLocales() as locale (locale.id)}
                <option value={locale.id}>{locale.name}</option>
              {/each}
            </select>
          </section>

          <section class="option">
            <label title="Comparison of a current player's score against the main player will be displayed either immediately or after expanding the details">Score comparison</label>
            <select bind:value={currentScoreComparisonMethod}>
              {#each scoreComparisonMethods as option (option.value)}
                <option value={option.value}>{option.name}</option>
              {/each}
            </select>
          </section>

          {#if showTwitchLinkBtn}
            <section class="option twitch">
              <label title="If there is a Twitch VOD available then an icon will appear next to the score which will take you directly to the appropriate VOD location.">Twitch</label>
              <Button type="twitch" iconFa="fab fa-twitch"
                      label={twitchBtnLabel} title={twitchBtnTitle} disabled={twitchBtnDisabled}
                      on:click={() => window.location.href = twitchService.getAuthUrl(opt($activeRoute, 'uri', ''))}/>
            </section>
          {/if}
        </section>
      {:else}
        Loading...
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="footer">
      <Button iconFa="fas fa-save" label="Save" type="primary" on:click={onSave} disabled={!configStore}/>
      <Button label="Cancel" on:click={onCancel}/>
    </svelte:fragment>
  </Dialog>
{/if}

<style>
    .options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 1em;
        align-items: start;
        justify-items: start;
    }

    .option {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    label {
        display: block;
        font-size: 0.75em;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--faded) !important;
        margin-bottom: .25em;
    }

    .twitch :global(.button) {
        font-size: .875em;
        width: max-content;
    }

    @media screen and (max-width: 600px) {
        .options {
            grid-template-columns: 1fr;
        }
    }
</style>