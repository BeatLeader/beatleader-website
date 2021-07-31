<script>
  import {DEFAULT_LOCALE, getSupportedLocales} from '../../others/i18n'
  import produce from 'immer'
  import createConfigStore from '../../stores/config'
  import Dialog from '../Common/Dialog.svelte'
  import Button from '../Common/Button.svelte'

  export let show = false;

  const DEFAULT_SCORE_COMPARISON_METHOD = 'in-place';

  let configStore = null;
  (async () => configStore = await createConfigStore())();

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

  $: onConfigUpdated(configStore && $configStore ? $configStore : null);
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

    @media screen and (max-width: 600px) {
        .options {
            grid-template-columns: 1fr;
        }
    }
</style>