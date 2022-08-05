<script>
    import createBeatSaverService from '../../services/beatmaps'
    import {modeForModeName, diffForDiffName} from "../../utils/beatleader/format"
    import {navigate} from 'svelte-routing'
    import Button from "../Common/Button.svelte";
    import Difficulty from '../Song/Difficulty.svelte'

    const DEFAULT_IMG = '/assets/song-default.png';

    export let song;
    export let listId;
    export let store;
    export let canModify;

    let beatSaverService = createBeatSaverService();

    let songInfo;
    let showDiffIcons;
    let leaderboardUrl;
    let coverUrl;

    function decapitalizeFirstLetter(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    async function updateSongKey(hash) {
        const songInfoValue = await beatSaverService.byHash(hash);
        if (songInfoValue && songInfoValue.key) {
            songInfo = songInfoValue;
            
            showDiffIcons = songInfo.versions[0].diffs.some(el => el.characteristic != 'Standard');

            let firstDiff = songInfo.versions[0].diffs[0];
            coverUrl = songInfo.versions[0].coverURL;
            leaderboardUrl = `/leaderboard/global/${songInfoValue.key + diffForDiffName(firstDiff.difficulty) + modeForModeName(firstDiff.characteristic)}/1`;
        }
    }

    function toggleDifficulty(diff) {
        const index = difficulties ? difficulties.findIndex(el => decapitalizeFirstLetter(diff.difficulty) == el.name && diff.characteristic == el.characteristic) : -1;
        if (index == -1) {
            if (difficulties) {
                difficulties.push({
                    name: decapitalizeFirstLetter(diff.difficulty), 
                    characteristic: diff.characteristic
                })
            } else {
                difficulties = [{
                    name: decapitalizeFirstLetter(diff.difficulty), 
                    characteristic: diff.characteristic
                }]
                song.difficulties = difficulties;
            }
        } else {
            difficulties.splice(index, 1);
        }

        difficulties = difficulties;
        store.set($store);
    }

    $: hash = song.hash;
    $: difficulties = song.difficulties;
    $: updateSongKey(hash);
</script>

<div class="container">
    <img class="cover" src={coverUrl} alt=""/>
    {#if songInfo}
    <div style="display: grid; padding-left: 1em">
        <a href={leaderboardUrl} class="name" on:click|preventDefault={() => navigate(leaderboardUrl)} >{songInfo.name}</a>
        <div class="author">{songInfo.uploader.name} </div>
        <div style="display: inline;">
            {#each songInfo.versions[0].diffs as diff, songId}
            <Difficulty 
                diff={{type: diff.characteristic, diff: diff.difficulty, stars: diff.stars}} 
                pointer={true} 
                useShortName={true} 
                reverseColors={true} 
                {showDiffIcons} 
                enabled={difficulties ? difficulties.some(el => el.name == decapitalizeFirstLetter(diff.difficulty) && el.characteristic == diff.characteristic) : true} on:click={() => toggleDifficulty(diff)} />
            {/each}
        </div>
    </div>
    {/if}
    {#if canModify}
        <Button cls="delistSong" iconFa="fas fa-list-ul" title="Remove from the {$store[listId]?.playlistTitle}" noMargin={true} type="danger"
            on:click={store.remove(hash, listId)}/>
    {/if}
</div>

<style>
.container {
    display: flex;
    margin: 1.5em;
    border-radius: 1em;
    padding: 0.8em;
    background-color: rgba(87, 87, 87, 0.582);
}

.cover {
    width: 6em;
    height: 6em;
    border-radius: 0.5em;
}

:global(.delistSong) {
    position: absolute !important;
    right: 0.8em;
    border-radius: 0.5em !important;
}
</style>