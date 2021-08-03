<script>
  import {createEventDispatcher} from 'svelte';

  import Button from '../Common/Button.svelte'

  const dispatch = createEventDispatcher();

  export let values;
  export let value = values && values.length ? values : null;
  export let loadingValue = null;

  async function onChange(newValue) {
    dispatch('change', newValue)
  }
</script>

{#if values && (values.length > 1 || (values.length === 1 && values[0] !== value)) }
  <div class="switch-types">
    {#if values && values.length}
      {#each values as currentValue }
        <Button
          icon={currentValue.icon}
          iconFa={currentValue.iconFa}
          loading={loadingValue === currentValue}
          label={currentValue.label}
          type={currentValue === value ? 'primary' : 'default'}
          color={currentValue.color ? 'white' : null}
          bgColor={currentValue.color ? currentValue.color : null}
          notSelected={currentValue !== value}
          on:click={() => onChange(currentValue)}
        />
      {/each}
    {/if}
  </div>
{/if}

<style>
    .switch-types {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        font-size: .75rem;
        text-align: center;
    }

    :global(.switch-types button) {
        font-weight: 500;
        margin-right: .125rem !important;
    }
</style>