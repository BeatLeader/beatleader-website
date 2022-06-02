<script>
    import Difficulty from '../Song/Difficulty.svelte'
    import eventBus from '../../utils/broadcast-channel-pubsub'

    let tasks = [
        {
            title: "Jump animations (Replays/A-Frame)",
            description: "Replay web player lacks note jump animation and rabbit notes. You will be working with 3D graphics and reverse engineering.",
            image: "/assets/jumpNotes.png",
            diff: "Expert",
            type: "Standard"
        },
        {
            title: "New camera settings layout (Replays/JS)",
            description: "Design and implement better looking camera settings.",
            image: "/assets/settings.png",
            diff: "Hard",
            type: "Standard"
        },
        {
            title: "Playlist synchronization (Server/C#)",
            description: "Playlists can be created locally and downloaded to install. Your task will be to make an API for syncronizations of replay between devices.",
            image: "/assets/playlistServer.png",
            diff: "Hard",
            type: "Standard"
        },
        {
            title: "Sparks are keep playing after collisions (Replays/A-Frame)",
            description: "Simple bug. Something is went wrong.",
            image: "/assets/sparks.png",
            diff: "Easy",
            type: "Standard"
        },
        {
            title: "Score caching blocks new friend requests (Website/JS)",
            description: "Friend is considered added only when the full score history is cached. This prevents user from adding several friends in a row and looks like nothing is happening. You need to separate adding friends and scores logic. You will be changing an existing logic.",
            image: "/assets/friends.png",
            diff: "ExpertPlus",
            type: "Standard"
        }
    ]

</script>

<h2 class="big-text">BeatLeader wants you!  <i class="fas fa-hand-point-down"></i></h2>
<span class="top-text">We are searching for help. Some available tasks are:</span>

{#each tasks as task, idx}
<div class="task task{idx}" style="background-image: linear-gradient(rgb(38 38 38 / 57%), rgb(16 16 16 / 70%), rgb(0 0 0 / 69%)), url({task.image})">
    <h3 class="top-text">{task.title}</h3>
    <div class="text">
        <span>{task.description}</span>
    </div>
    
    <div class="diffContainer">
        <span class="diff"><Difficulty diff={task} reverseColors={true}/></span>
    </div>
</div>
{/each}
 
<div class="top-text">
    Interested? Check out <a href="https://discord.gg/2RG5YVqtG6">Discord</a> for more info. Not? You can hide this in <a href="/dashboard" on:click={(e) => {eventBus.publish('show-settings', {}); e.preventDefault()}}>settings</a>. 
    <br>(Note: everyone is working for free now. But we are open to monetisation ideas.)
</div>

<style>
    .diff :global(.reversed) {
        display: inline-block;
        padding: 0 0.25em 0.25em 0.25em;
        margin-bottom: 0.3em;
        margin-left: .3em;
        margin-right: .5em;
        border-radius: .25em;
    }

    .diffContainer {
        padding: 0.3em
    }

    .task {
        background-color: rgb(63 63 63);
        border-radius: 8px;
        margin: 1em;

        background-repeat: no-repeat;
        pointer-events: none;

        background-size: auto 100%;
        background-position-x: right;
    }

    .taskImage {
        position: relative;
    }

    .text {
        padding: 0.5em;
    }

    .top-text {
        padding: 0.2em 0 0 0.4em;
    }

    .big-text {
        padding: 0.2em;
    }

    .fa-hand-point-down {
        color: red;
    }
</style>