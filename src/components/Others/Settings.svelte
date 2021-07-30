<script>
  import {DEFAULT_LOCALE, getSupportedLocales} from '../../others/i18n'
  import createConfigStore from '../../stores/config'

  import Dialog from '../Common/Dialog.svelte'
  import Button from '../Common/Button.svelte'

  export let show = false;

  let configStore = null;
  (async () => configStore = await createConfigStore())();

  let currentLocale = DEFAULT_LOCALE;

  function onLocaleUpdated(locale) {
    if (!locale) return;

    currentLocale = locale
  }

  function onSave() {
    if (!configStore || !$configStore) return;

    $configStore.locale = currentLocale;

    show = false;
  }

  function onCancel() {
    if (configStore && $configStore) currentLocale = $configStore.locale;

    show = false;
  }

  $: onLocaleUpdated(configStore && $configStore ? $configStore.locale : null);
</script>

{#if show}
  <Dialog title="Settings" closeable={true} on:confirm={onCancel}>
    <svelte:fragment slot="content">
      {#if configStore && $configStore}
        <label>Localization</label>
        <div>
          <select bind:value={currentLocale}>
            {#each getSupportedLocales() as locale (locale.id)}
              <option value={locale.id}>{locale.name}</option>
            {/each}
          </select>
        </div>
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
    label {
        display: block;
        font-size: 0.75em;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--faded)!important;
    }
</style>