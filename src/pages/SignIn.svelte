<script>
    import Button from "../components/Common/Button.svelte";
    import createAccountStore from '../stores/beatleader/account'
    import {opt} from '../utils/js'
    import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue'

    export let action;

    const account = createAccountStore();

    let login;
    let password;

    function performAction() {
        if (action == "addHome") {
            account.refresh(true);
        }
    }

    $: loggedInPlayer = opt($account, 'id');
    $: error = opt($account, 'error');
    $: performAction();
</script>

<div class="container">
{#if !loggedInPlayer}

    Login with the Steam or account you created in mod.<br>
    <b>Signup is possible only from the mods!</b>
    <input bind:value={login} placeholder="Login">
    <input type="password" bind:value={password} placeholder="Password">

    <Button iconFa="fas fa-plus-square" label="Login" on:click={() => account.logIn(login, password)}/>
    <form action={BL_API_URL + "signin"} method="post">
        <input type="hidden" name="Provider" value="Steam" />
        <input type="hidden" name="ReturnUrl" value={CURRENT_URL + "/signin/addHome"} />

        <Button iconFa="fas fa-plus-square" label="Login with Steam" type="submit"/>
    </form>
{:else if loggedInPlayer > 70000000000000000}
    If you using the Steam game or already migrated - you are all set!<br>
    Check <a class="inlineLink" href={"/u/" + loggedInPlayer}>your fancy profile </a>
    <br>
    <br>
    <br>
    If you using Oculus (Quest or PC) - you can migrate<br>account created in mod to this <b class="inlineLink">Steam account.</b><br><br>
    Your current scores will migrate and<br>the new ones will be posted to the Steam acc.<br>
    This is not required and no way back!
    <input bind:value={login} placeholder="Login">
    <input type="password" bind:value={password} placeholder="Password">
    <Button iconFa="fas fa-plus-square" label="Migrate" on:click={() => account.migrate(login, password)}/>
{:else}
    You can migrate this account to your Steam account.<br><br>
    Your current scores will migrate and<br>the new ones will be posted to the Steam acc.<br>
    Or just use this account.<br>
    You can change your avatar and name in <a class="inlineLink" href={"/u/" + loggedInPlayer}>your profile.</a>

    <form action={BL_API_URL + "signinmigrate"} method="post">
        <input type="hidden" name="Provider" value="Steam" />
        <input type="hidden" name="ReturnUrl" value= {CURRENT_URL + "/signin/addHome" } />

        <Button iconFa="fas fa-plus-square" label="Migrate to Steam" type="submit"/>
    </form>
{/if}

{#if error}
<p class="error">{error}</p>
{/if}
</div>

<style>
    .container {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        grid-gap: 2em;
    }
    .error {
        color: red;
    }

    .inlineLink {
        display: contents;
    }
</style>



