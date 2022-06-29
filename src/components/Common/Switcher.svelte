<script>
  import {createEventDispatcher} from 'svelte';

  import Button from '../Common/Button.svelte'

  const dispatch = createEventDispatcher();

  export let values;
  export let multi = false;
  export let value = values && values.length ? values[0] : null;
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
          loading={multi ? (Array.isArray(loadingValue) && loadingValue.includes(currentValue)) : loadingValue === currentValue}
          label={currentValue.label}
          title={currentValue.title}
          type={(multi && Array.isArray(value) & value.includes(currentValue)) || (!multi && currentValue === value) ? 'primary' : 'default'}
          color={currentValue.color ? 'white' : null}
          bgColor={currentValue.color ? currentValue.color : null}
          notSelected={!((multi && Array.isArray(value) & value.includes(currentValue)) || (!multi && currentValue === value))}
          url={currentValue.url}
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

    .switch-types :global(.button) {
        font-weight: 500;
        margin-right: .125rem !important;
        margin-bottom: .125rem !important;
    }
</style>