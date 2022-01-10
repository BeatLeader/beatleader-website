<script>
    import eventBus from '../utils/broadcast-channel-pubsub'
    import {onMount} from 'svelte'
    import {navigate} from 'svelte-routing'
    import createPlaylistStore from '../stores/playlists'
    import Playlist from '../components/Playlists/Playlist.svelte'
    import Pager from '../components/Common/Pager.svelte'
    import Button from '../components/Common/Button.svelte'
    import ssrConfig from '../ssr-config'

    const playlists = createPlaylistStore();
    let page = 0;
    let itemsPerPage = 5;
    let itemsPerPageValues = [5, 10, 15];

    function onPageChanged(event) {
        page = event.detail.page;
    }

    let fileinput;
    const uploadPlaylist = (e) => {
        let image = e.target.files[0];
        let reader = new FileReader();
        reader.readAsText(image);
        reader.onload = e => {
          const playlist = JSON.parse(e.target.result);
          if (playlist) {
            playlists.create(null, playlist);
          } 
        };
    }

    function updatePage() {
      if (totalItems <= itemsPerPage) {
        page = 0;
      }
    }

    $: totalItems = $playlists.length;
    $: updatePage($playlists.length);
</script>

<svelte:head>
  <title>{`Playlists / ${ssrConfig.name}`}</title>
</svelte:head>

<div class="box has-shadow">
    <div class="playlistButtonsContainer">
      <Button iconFa="fas fa-plus-square" label="New" on:click={() => playlists.create()}/>
      <Button iconFa="fas fa-upload" label="Upload" on:click={() => fileinput.click()}/>
      <input style="display:none" type="file" accept=".bplist, .json" on:change={(e)=>uploadPlaylist(e)} bind:this={fileinput} >
    </div>
    {#if $playlists && $playlists.length}
    <div class="song-scores grid-transition-helper">
      {#each $playlists.slice(totalItems > itemsPerPage ? page * itemsPerPage : 0, (page + 1) * itemsPerPage < totalItems ? (page + 1) * itemsPerPage : totalItems) as playlist, idx}
        <Playlist {playlist} idx={page * itemsPerPage + idx} store={playlists} />
      {/each}
    </div>
    {:else}
      <p>No playlists, create or upload one.</p>
    {/if}
  
    {#if $playlists && $playlists.length > itemsPerPage}
    <Pager bind:currentPage={page} bind:itemsPerPage={itemsPerPage} {totalItems} {itemsPerPageValues} on:page-changed={onPageChanged}/>
    {/if}
</div>