<script>
    import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date'
  
    export let qualification;
  </script>

{#if qualification}
    <div class="qualification-description">
        <div class="timeset">
        <span style="color: {getTimeStringColor(qualification?.timeset)}; ">
            Qualified {formatDateRelative(dateFromUnix(qualification.timeset))}
        </span>
        </div>

        {#if qualification.mapperAllowed}
            <span style="color: green;"><i class="fa fa-check"></i> Mapper</span>
        {:else}
            <span style="color: gray;"><i class="fa fa-xmark"></i> Mapper</span>
        {/if}

        {#if qualification.criteriaMet == 1}
            <span style="color: green;"><i class="fa fa-check"></i> Criteria</span>
        {:else if qualification.criteriaMet == 2}
            <span style="color: red;"><i class="fa fa-xmark"></i> Criteria</span>
        {:else}
            <span style="color: gray;"><i class="fa fa-xmark"></i> Criteria</span>
        {/if}

        {#if qualification.RTVotes < 0}
            <span style="color: red;"><i class="fa fa-xmark"></i> RT</span>
        {:else if qualification.RTVotes == 1}
            <span style="color: green;"><i class="fa fa-check"></i> RT</span>
        {:else}
            <span style="color: gray;"><i class="fa fa-xmark"></i> RT</span>
        {/if}
    </div>
{/if}
  
<style>
    .qualification-description {
        display: flex;
        grid-gap: 0.8em;
        align-items: center;
    }
</style>