<script>
  import {createEventDispatcher} from 'svelte'
  import {fade} from 'svelte/transition'
  import createAccountStore from '../../stores/beatleader/account'
  import Button from "../../components/Common/Button.svelte";
  import Error from '../Common/Error.svelte'
  import Spinner from '../Common/Spinner.svelte'
  import {SsrHttpResponseError} from '../../network/errors'
  import {playersTitle, rankLabel, accLabel, ppLabel, rankValue, accValue, ppValue} from '../../utils/clans'
  import createClanService from '../../services/beatleader/clan'
  import Confirmation from '../Common/Confirmation.svelte'
  import Badge from '../Common/Badge.svelte'

  export let clan;
  export let enableCreateMode = false;
  export let noButtons = false;
  export let noBio = false;

  document.body.classList.remove('slim');

  const dispatch = createEventDispatcher();
  const account = createAccountStore();
  const clanService = createClanService();

  let editMode = enableCreateMode;

  let boxEl = null;

  let confirmedOperation = null;
  let pendingText = null;
  let error = null;

  let name = '';
  let tag = '';
  let color = '';
  let description = '';
  let bio = '';
  let iconUrl = null;
  let iconData = null;

  const changeImage = (e) => {
    let image = e.target.files[0];

    const dataArrayReader = new FileReader();
    dataArrayReader.onload = e => iconData = e.target.result;
    dataArrayReader.readAsArrayBuffer(image);

    const dataUrlReader = new FileReader();
    dataUrlReader.onload = e => iconUrl = e.target.result;
    dataUrlReader.readAsDataURL(image);
  }

  async function executeOperation(operation) {
    if (!operation) throw 'Internal error';

    try {
      error = null;

      return await operation();
    } catch (err) {
      console.error(err);

      if (err instanceof SsrHttpResponseError) {
        const htmlError = await err.getResponse().text();
        error = htmlError?.length ? htmlError : err;
      } else {
        error = err;
      }
    } finally {
      pendingText = null;
    }
  }

  async function onSave() {
    if (!name.length || name.length > 25) {
      error = "Clan name is required and should be no more than 25 characters long";
      return;
    }

    if (tag.length < 2 || tag.length > 5) {
      error = "Clan tag is required and should be 2 to 5 characters long";
      return;
    }

    if (!color.length) {
      error = "Clan color is required";
      return;
    }

    if (!iconData) {
      error = "Icon is required";
      return;
    }

    error = null;
    pendingText = 'Saving a clan...';

    await executeOperation(async () => {
      let updatedClan = null;

      const clanData = {...clan, name, tag, description, bio, color, icon: iconData ?? iconUrl}
      if (clan?.id)
        updatedClan = await clanService.update(clanData);
      else
        updatedClan = await clanService.create(clanData);

      editMode = false;

      dispatch('added', {...updatedClan});
    });
  }

  async function onAccept() {
    if (!clan?.id) return;

    error = null;
    pendingText = 'Accepting an invitation...';

    await executeOperation(async () => clanService.accept(clan));

    dispatch('accepted', {...clan});
  }

  async function onReject() {
    if (!clan?.id) return;

    error = null;
    pendingText = 'Rejecting an invitation...';

    await executeOperation(async () => clanService.reject(clan, false));

    dispatch('rejected', {...clan});
  }

  async function onBan() {
    if (!clan?.id) return;

    error = null;
    pendingText = 'Banning a clan...';

    await executeOperation(async () => clanService.reject(clan, true));

    dispatch('banned', {...clan});
  }

  async function onRemove() {
    if (!clan?.id) return;

    error = null;
    pendingText = 'Removing a clan...';

    await executeOperation(async () => clanService.remove(clan));

    dispatch('removed', {...clan});
  }

  async function onLeave() {
    if (!clan?.id) return;

    error = null;
    pendingText = 'Leaving a clan...';

    await executeOperation(async () => clanService.leave(clan));

    dispatch('left', {...clan});
  }

  async function onUnban() {
    if (!clan?.id) return;

    error = null;
    pendingText = 'Unbanning a clan...';

    await executeOperation(async () => clanService.unban(clan));

    dispatch('unbanned', {...clan});
  }

  async function onConfirm() {
    if (!confirmedOperation) return;

    error = null;
    await confirmedOperation();

    confirmedOperation = null;
  }

  function onCancelPendingOperation() {
    confirmedOperation = null;
    error = null;
  }

  function updateFields(clan) {
    name = clan?.name ?? '';
    tag = clan?.tag ?? '';
    color = clan?.color ?? '#ff0000';
    iconUrl = clan?.icon ?? 'https://cdn.beatleader.xyz/assets/NTG.png';
    iconData = clan?.icon ?? null;
    description = clan?.description ?? '';
    bio = clan?.bio ?? '';
  }

  function hoverStats() {
    if (tag) {
      clanAverageRank = rankValue(tag, clanAverageRank);
      clanAverageAccuracy = accValue(tag, clanAverageAccuracy);
      clanPp = ppValue(tag, clanPp);
    }
  }

  $: updateFields(clan)
  $: iconInput = null;
  $: playersCount = clan?.playersCount ?? 0;

  $: hasInvitation = clan?.id && $account?.clanRequest?.length && !!$account.clanRequest.find(r => r.id === clan.id);
  $: isFounder = clan?.id && clan?.leaderID === $account?.player?.id;
  $: canLeave = clan?.id && clan?.leaderID !== $account?.player?.id && !!$account.player?.clans?.find(c => c.id === clan.id)
  $: isBanned = clan?.id && $account?.bannedClans?.length && !! $account.bannedClans.find(b => b.id === clan.id);

  $: clanAverageAccuracy = clan?.averageAccuracy ? clan.averageAccuracy * 100 : null;
  $: clanAverageRank = clan?.averageRank ?? null;
  $: clanPp = clan?.pp ?? null;
</script>

{#if enableCreateMode || clan?.id}
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
          <input type="text" placeholder="Clan name" bind:value={name} disabled={!!pendingText}/>
        {:else}
          <span class="clanName {tag == "GAY" ? "rainbow" : ""}">{name}</span>
        {/if}
      </section>

      <section class="title is-6" style="--clan-color: {color}">
        {#if editMode}
          <input type="text" placeholder="Clan tag; 2-4 characters, cannot be changed later" bind:value={tag}
                 disabled={!!pendingText || clan?.id}
                 minlength="2" maxlength="4"
                 style={!!pendingText || clan?.id ? 'cursor: not-allowed; color: var(--faded)' : 'cursor: text'}
          />
          <input type="color" bind:value={color} disabled={!!pendingText}/>
        {:else}
          <span class="clanTag">{tag}</span>
        {/if}
      </section>

      {#if !editMode}
        <section class="title is-5">
          <section class="title is-7">
            {playersCount} {playersCount == 1 ? playersTitle(tag) : playersTitle(tag) + "s"}
          </section>
        </section>

        {#if clan}
          <section class="clan-stats" on:pointerover={() => hoverStats()}>
            <Badge label={rankLabel(tag)} value={clanAverageRank} prefix="#" digits={0} fluid={true} bgColor="var(--decrease)"/>
            <Badge label={accLabel(tag)} value={clanAverageAccuracy} suffix="%" fluid={true} bgColor="var(--selected)"/>
            <Badge label={ppLabel(tag)} value={clanPp} suffix="pp" fluid={true} bgColor="var(--ppColour)"/>
          </section>
        {/if}

        <section class="info">
          <small>{description}</small>
        </section>

        {#if !noBio}
        <section class="bio">
          <small>{bio}</small>
        </section>
        {/if}
      {:else}
      <section class="info">
        <input type="text" placeholder="Clan short description (optional)" bind:value={description} disabled={!!pendingText}/>
        
      </section>
      {#if !noBio}
      <section class="bio">
        <input type="text" placeholder="Clan bio (optional)" bind:value={bio} disabled={!!pendingText}/>
      </section>
      {/if}
      {/if}

      {#if editMode}
        <section>
          {#if !pendingText}
            <Button label="Save a clan" type="primary" on:click={onSave}/>
            <Button label="Cancel" on:click={() => {editMode=false; confirmedOperation = null; dispatch('cancel')}}/>
          {:else}
            <Spinner/>
            {pendingText}
          {/if}
        </section>
      {/if}

      {#if hasInvitation && !noButtons}
        <section>
          <Confirmation {pendingText} {confirmedOperation}>
            <Button label="Accept invitation" iconFa="fas fa-check" type="primary" on:click={onAccept}/>
            <Button label="Reject invitation" iconFa="fas fa-trash-alt" type="lessdanger"
                    on:click={() => {confirmedOperation = onReject}}/>
            <Button label="Ban clan invitations" iconFa="fas fa-ban" type="danger" on:click={() => {confirmedOperation = onBan}}/>
          </Confirmation>
        </section>
      {/if}

      {#if isFounder && !noButtons && !editMode}
        <section>
          <Confirmation {pendingText} {confirmedOperation}>
            <Button label="Edit clan" iconFa="fas fa-edit" type="primary" on:click={() => editMode = true}/>
            <Button label="Remove clan" iconFa="fas fa-trash-alt" type="danger"
                    on:click={() => confirmedOperation = onRemove}/>
          </Confirmation>
        </section>
      {/if}

      {#if canLeave && !noButtons}
        <section>
          <Confirmation {pendingText} {confirmedOperation}>
            <Button label="Leave a clan" iconFa="fab fa-accessible-icon" type="lessdanger"
                    on:click={() => confirmedOperation = onLeave}/>
          </Confirmation>
        </section>
      {/if}

      {#if isBanned && !noButtons}
        <section>
          <Confirmation {pendingText} {confirmedOperation}>
            <Button label="Unban clan invitations" iconFa="fas fa-user-friends" type="lessdanger" on:click={() => confirmedOperation = onUnban}/>
          </Confirmation>
        </section>
      {/if}

      {#if error}
        <Error {error}/>
      {/if}
    </section>
  </div>
</section>
{/if}

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
        max-width: 80%;
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

    .clanName.rainbow {
      color: #00ffbc;
      -webkit-background-clip: text;
      background-image: -webkit-linear-gradient(180deg,#f35626,#feab3a);
      -webkit-animation: rainbow .90s infinite linear;
      animation: rainbow .90s infinite linear;
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

    .clan-stats :global(>*) {
        margin-bottom: 0!important;
    }

    .info {
      overflow: hidden;
      word-break: break-all;
    }

    .bio {
      overflow: hidden;
      word-break: break-all;
    }

    @media screen and (max-width: 500px) {
        .clanData {
            flex-direction: column;
            align-items: center;
            gap: 0;
        }

        .clan-stats {
            display: flex;
            flex-direction: column;
        }
    }
</style>