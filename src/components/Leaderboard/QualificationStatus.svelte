<script>
    import createPlayerService from '../../services/beatleader/player'
    import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
    import Avatar from '../Common/Avatar.svelte';
    import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date'
    import {navigate} from "svelte-routing";
  
    export let qualification;

    const playerService = createPlayerService();

    function navigateToPlayer(playerId) {
        if (!playerId) return;

        navigate(`/u/${playerId}/beatleader/date/1`)
    }

    let qualifier;
    let mapper;
    let criteriaChecker;
    async function retrievePlayers(qualification) {
        if (!qualification) return;

        qualifier = await playerService.fetchPlayerOrGetFromCache(qualification.rtMember);

        if (qualification.mapperId) {
            mapper = await playerService.fetchPlayerOrGetFromCache(qualification.mapperId);
        }
        if (qualification.criteriaChecker) {
            criteriaChecker = await playerService.fetchPlayerOrGetFromCache(qualification.criteriaChecker);
        }
    }

    $: retrievePlayers(qualification)
  </script>

{#if qualification}
    <div class="qualification-description">
        <b>Qualified by:</b> 
        <Avatar player={qualifier}/>
        <PlayerNameWithFlag player={qualifier}
                            type={'beatleader/date'}
                            on:click={qualifier ? () => navigateToPlayer(qualifier.playerId) : null}
        />
        <div class="timeset">
        <span style="color: {getTimeStringColor(qualification?.timeset)}; ">
            {formatDateRelative(dateFromUnix(qualification.timeset))}
        </span>
        </div>
    </div>
    <div class="qualification-description">
        {#if qualification.mapperAllowed}
            <b>Allowed by mapper:</b>
            <Avatar player={mapper}/>
            <PlayerNameWithFlag player={mapper}
                                type={'beatleader/date'}
                                on:click={mapper ? () => navigateToPlayer(mapper.playerId) : null}
            />
        {:else}
            <span style="color: red;"><i class="fa fa-xmark"></i> Mapper not allowed yet</span>
        {/if}
    </div>
    <div class="qualification-description">
        {#if qualification.criteriaMet == 1}
            <b>Criteria checked:</b>
            <Avatar player={criteriaChecker}/>
            <PlayerNameWithFlag player={criteriaChecker}
                                type={'beatleader/date'}
                                on:click={criteriaChecker ? () => navigateToPlayer(criteriaChecker.playerId) : null}
            />
        {:else if qualification.criteriaMet == 2}
        
            <span style="color: red;"><i class="fa fa-xmark"></i> Criteria check failed</span>
        {:else}
            <span style="color: gray;"><i class="fa fa-xmark"></i> Criteria not checked yet</span>
        {/if}
    </div>

    <div class="qualification-description">
        {#if qualification.RTVotes < 0}
            <span style="color: red;"><i class="fa fa-xmark"></i> Declined by RT</span>
        {:else if qualification.RTVotes == 1}
            <b><i class="fa fa-check"></i> Approved by RT</b>
        {:else}
            <span style="color: gray;"><i class="fa fa-xmark"></i> Not voted by RT yet</span>
        {/if}
    </div>
{/if}
  
<style>
    .qualification-description {
        display: flex;
        grid-gap: 0.4em;
        align-items: center;
    }
</style>