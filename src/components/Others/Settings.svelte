<script>
  import produce from 'immer'
  import {configStore, DEFAULT_LOCALE, getSupportedLocales} from '../../stores/config'
  import createTwitchService from '../../services/twitch'
  import {ROUTER} from 'svelte-routing/src/contexts'
  import {getContext, onMount} from 'svelte'
  import {opt} from '../../utils/js'
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {DAY} from '../../utils/date'
  import {exportJsonData, importDataHandler} from '../../utils/export-import'
  import Dialog from '../Common/Dialog.svelte'
  import Button from '../Common/Button.svelte'
  import File from '../Common/File.svelte'
  import Select from "./Select.svelte"

  export let show = false;

  const DEFAULT_BILLBOARD_STATE = 'show';
  const DEFAULT_SCORE_COMPARISON_METHOD = 'in-place';
  const DEFAULT_SECONDARY_PP_METRICS = 'attribution';
  const DEFAULT_AVATAR_ICONS = 'show';
  const DEFAULT_BEATSAVIOR_COMPARISON = 'show';

  let twitchToken = null;

  let twitchService = createTwitchService();

  const {activeRoute} = getContext(ROUTER);

  const billboardStateOptions = [
    {name: 'Show', value: DEFAULT_BILLBOARD_STATE},
    {name: 'Show, but in last tab', value: 'lastTab'},
    {name: 'Hide', value: 'hide'},
  ];

  const scoreComparisonMethods = [
    {name: 'In place', value: DEFAULT_SCORE_COMPARISON_METHOD},
    {name: 'In details', value: 'in-details'},
  ];

  const beatSaviorComparisonOptions = [
    {name: 'Show', value: DEFAULT_BEATSAVIOR_COMPARISON},
    {name: 'Hide', value: 'hide'},
  ];

  const secondaryPpMetrics = [
    {name: 'Weighted PP', value: 'weighted'},
    {name: 'Actual contribution to the total PP', value: DEFAULT_SECONDARY_PP_METRICS},
  ];

  const avatarIcons = [
    {name: 'Always show', value: DEFAULT_AVATAR_ICONS},
    {name: 'Show when needed', value: 'only-when-needed' },
    {name: 'Always hide', value: 'hide'},
  ];

  let currentBillboardState = DEFAULT_BILLBOARD_STATE;
  let currentLocale = DEFAULT_LOCALE;
  let currentScoreComparisonMethod = DEFAULT_SCORE_COMPARISON_METHOD;
  let currentBeatSaviorComparison = DEFAULT_BEATSAVIOR_COMPARISON;
  let currentSecondaryPpMetrics = DEFAULT_SECONDARY_PP_METRICS;
  let currentAvatarIcons = DEFAULT_AVATAR_ICONS;

  function onConfigUpdated(config) {
    if (config?.locale) currentLocale = config.locale;
    if (config?.preferences?.billboardState) currentBillboardState = config?.preferences?.billboardState ?? DEFAULT_BILLBOARD_STATE;
    if (config?.scoreComparison) currentScoreComparisonMethod = config?.scoreComparison?.method ?? DEFAULT_SCORE_COMPARISON_METHOD;
    if (config?.preferences?.secondaryPp) currentSecondaryPpMetrics = config?.preferences?.secondaryPp ?? DEFAULT_SECONDARY_PP_METRICS;
    if (config?.preferences?.iconsOnAvatars) currentAvatarIcons = config?.preferences?.iconsOnAvatars ?? DEFAULT_AVATAR_ICONS;
    if (config?.preferences?.beatSaviorComparison) currentBeatSaviorComparison = config?.preferences?.beatSaviorComparison ?? DEFAULT_BEATSAVIOR_COMPARISON;
  }

  function onSave() {
    if (!configStore || !$configStore) return;

    $configStore = produce($configStore, draft => {
      draft.locale = currentLocale;
      draft.preferences.billboardState = currentBillboardState;
      draft.scoreComparison.method = currentScoreComparisonMethod;
      draft.preferences.secondaryPp = currentSecondaryPpMetrics;
      draft.preferences.iconsOnAvatars = currentAvatarIcons;
      draft.preferences.beatSaviorComparison = currentBeatSaviorComparison;
    })

    show = false;
  }

  function onCancel() {
    if (configStore && $configStore) {
      currentLocale = $configStore.locale;
      currentBillboardState = $configStore.preferences.billboardState;
      currentScoreComparisonMethod = $configStore.scoreComparison.method;
      currentSecondaryPpMetrics = $configStore.preferences.secondaryPp;
      currentAvatarIcons = $configStore.preferences.iconsOnAvatars;
      currentBeatSaviorComparison = $configStore.preferences.beatSaviorComparison;
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

    eventBus.publish('settings-notification-badge', twitchToken && tokenExpireSoon ? 'Twitch token is required for renewal' : null);

    showTwitchLinkBtn = !twitchToken || tokenExpireSoon;

    twitchBtnLabel = !twitchToken || !tokenExpireSoon ? 'Link to Twitch' : 'Renew Twitch token'
    twitchBtnTitle = twitchToken && tokenExpireInDays > 0 ? `Days left: ${tokenExpireInDays}` : null;
    twitchBtnDisabled = !tokenExpireSoon;
  }


  let isExporting = false;
  let isImporting = false;
  let importBtn = null;

  async function onExport() {
    try {
      isExporting = true;

      await exportJsonData();
    } finally {
      isExporting = false;
    }
  }

  async function onImport(e) {
    try {
      isImporting = true;
      if (importBtn) importBtn.$set({disabled: true});

      importDataHandler(
        e,
        msg => {
          isImporting = false;

          alert(msg)

          importBtn.$set({disabled: false});
        },
        async json => {
          isImporting = false;
          if (importBtn) importBtn.$set({disabled: false});

          eventBus.publish('data-imported', {});
        },
      );
    } catch {
      isImporting = false;
    }
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
            <label title="Show billboard on dashboard">Billboard</label>
            <Select bind:value={currentBillboardState}>
              {#each billboardStateOptions as option (option.value)}
                <option value={option.value}>{option.name}</option>
              {/each}
            </Select>
          </section>

          <section class="option">
            <label title="Comparison of a current player's score against the main player will be displayed either immediately or after expanding the details">Score comparison</label>
            <Select bind:value={currentScoreComparisonMethod}>
              {#each scoreComparisonMethods as option (option.value)}
                <option value={option.value}>{option.name}</option>
              {/each}
            </Select>
          </section>

          <section class="option">
            <label title="Show BeatSavior scores comparison">BeatSavior score comparison</label>
            <Select bind:value={currentBeatSaviorComparison}>
              {#each beatSaviorComparisonOptions as option (option.value)}
                <option value={option.value}>{option.name}</option>
              {/each}
            </Select>
          </section>

          <section class="option">
            <label title="Second PP metric displayed next to the score, either weighted PP or actual contribution of the score to the total PP (cached players only)">Secondary PP metrics</label>
            <Select bind:value={currentSecondaryPpMetrics}>
              {#each secondaryPpMetrics as option (option.value)}
                <option value={option.value}>{option.name}</option>
              {/each}
            </Select>
          </section>

          <section class="option">
            <label
              title="Determines when to show icons on player avatars">Icons on avatars</label>
            <Select bind:value={currentAvatarIcons}>
              {#each avatarIcons as option (option.value)}
                <option value={option.value}>{option.name}</option>
              {/each}
            </Select>
          </section>

          <section class="option twitch">
            <label title="If there is a Twitch VOD available then an icon will appear next to the score which will take you directly to the appropriate VOD location.">Twitch</label>
            <Button type="twitch" iconFa="fab fa-twitch"
                    label={twitchBtnLabel} title={twitchBtnTitle}
                    on:click={() => window.location.href = twitchService.getAuthUrl(opt($activeRoute, 'uri', ''))}/>
          </section>
        </section>
      {:else}
        Loading...
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="footer-left">
      <File iconFa="fas fa-file-export" title="Import SSR data from file" loading={isImporting} disabled={isImporting}
            accept="application/json" bind:this={importBtn} on:change={onImport}/>
      <Button iconFa="fas fa-file-import" title="Export SSR data to file" on:click={onExport} loading={isExporting} disabled={isExporting}/>
    </svelte:fragment>

    <svelte:fragment slot="footer-right">
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