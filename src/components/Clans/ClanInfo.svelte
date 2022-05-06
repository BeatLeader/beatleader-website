<script>
  import {createEventDispatcher} from 'svelte'
  import {fade} from 'svelte/transition'
  import Button from "../../components/Common/Button.svelte";
  import Error from '../Common/Error.svelte'
  import Spinner from '../Common/Spinner.svelte'

  export let clan;
  export let isSaving = false;
  export let editMode = false;
  export let error = null;

  document.body.classList.remove('slim');

  const dispatch = createEventDispatcher();

  let boxEl = null;

  const changeImage = (e) => {
    let image = e.target.files[0];

    const dataArrayReader = new FileReader();
    dataArrayReader.onload = e => iconData = e.target.result;
    dataArrayReader.readAsArrayBuffer(image);

    const dataUrlReader = new FileReader();
    dataUrlReader.onload = e => iconUrl = e.target.result;
    dataUrlReader.readAsDataURL(image);
  }

  $: name = clan?.name ?? '';
  $: tag = clan?.tag ?? '';
  $: color = clan?.color ?? '#ff0000';
  $: iconUrl = clan?.icon ?? 'https://cdn.beatleader.xyz/assets/NTG.png';
  $: iconData = clan?.icon ?? null;
  $: iconInput = null;
  $: playersCount = clan?.playersCount ?? 0;
</script>

<section class="clan-info" transition:fade>
  <div class="clanData">
    <div class="imageInput" on:click={() => {if (editMode) iconInput.click()}}>
      <img class="clanImage" src="{iconUrl}" alt="ClanIcon"/>

      {#if editMode}
        <input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif"
               on:change={(e)=>changeImage(e)} bind:this={iconInput}/>
        <span class="imageChange">Change</span>
      {/if}
    </div>

    <section class="form">
      <section class="title is-5">
        {#if editMode}
          <input type="text" placeholder="Clan name" bind:value={name} disabled={isSaving}/>
        {:else}
          <span class="clanName">{name}</span>
        {/if}
      </section>

      <section class="title is-6" style="--clan-color: {color}">
        {#if editMode}
          <input type="text" placeholder="Clan tag" bind:value={tag} disabled={isSaving}/>
          <input type="color" bind:value={color} disabled={isSaving}/>
        {:else}
          <span class="clanTag">[{tag}]</span>
        {/if}
      </section>

      {#if !editMode}
        <section class="title is-5">
          {playersCount} players
        </section>
      {/if}

      {#if editMode}
        <section>
          {#if !isSaving}
            <Button label="Save a clan" type="primary" on:click={() => dispatch('save', {...clan, name, tag, color, iconData, icon: iconUrl})}/>
            <Button label="Cancel" on:click={() => dispatch('cancel')}/>
          {:else}
            <Spinner/>
            Saving...
          {/if}
        </section>

        {#if error}
          <Error {error}/>
        {/if}
      {/if}
    </section>
  </div>
</section>

<style>
    .clan-info {
        width: 100%;
    }

    .clanData {
        display: flex;
        gap: 1rem;
    }

    .clanData .form {
        flex-grow: 1;
        padding: 1rem;
    }

    .clanData .form > section:not(:last-child) {
        margin-bottom: 1rem;
    }

    input[type="text"] {
        width: 70%;
        font-size: inherit;
        padding: 0;
        color: var(--textColor);
        background-color: transparent;
        border: none;
        border-bottom: solid 1px var(--dimmed);
        outline: none;
    }

    input[type="color"] {
        margin-left: .5rem;
    }

    input::placeholder {
        color: var(--faded) !important;
    }

    .imageInput {
        cursor: pointer;
        display: flex;
        align-items: flex-start;
        position: relative;
    }

    .clanImage {
        width: 10em;
    }

    .clanTag {
        color: var(--clan-color, 'red');
    }

    .imageChange {
        transition: opacity .2s ease-in-out;
        background-color: rgba(32, 33, 36, 0.6);
        bottom: 0;
        height: 33%;
        left: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        display: flex;
        justify-content: center;
    }

    .imageInput:hover .imageChange {
        opacity: 1;
    }
</style>