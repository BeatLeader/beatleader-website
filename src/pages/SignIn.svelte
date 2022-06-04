<script>
    import Button from "../components/Common/Button.svelte";
    import createAccountStore from '../stores/beatleader/account'
    import {opt} from '../utils/js'
    import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue'
    import { navigate } from "svelte-routing";

    export let action;

    const account = createAccountStore();

    let login;
    let password;
    let newPassword;

    function performAction() {
        if (action == "addHome") {
            account.refresh(true);
        }
    }

    $: loggedInPlayer = opt($account, 'id');
    $: error = opt($account, 'error');
    $: message = opt($account, 'message');
    $: patreoned = opt($account, 'patreoned');
    $: performAction();
</script>

<div class="container">
{#if !action || action == "addHome"}
    {#if !loggedInPlayer}
    <div class="title">Login</div>
    <div class="tips">Login with the Steam or account you created in mod.</div>
        <b>Signup is possible only from the mods!</b>
        <div class="input-container">
            <div class="cat">
                Account
            </div>
            <input bind:value={login} placeholder="Account">
        </div>
        <div class="input-container">
            <div class="cat">
                Password
            </div>
            <input type="password" bind:value={password} placeholder="Password">
        </div>

        <Button iconFa="fas fa-plus-square" label="Login" on:click={() => account.logIn(login, password)}/>
        <form action={BL_API_URL + "signin"} method="post">
            <input type="hidden" name="Provider" value="Steam" />
            <input type="hidden" name="ReturnUrl" value={CURRENT_URL + "/signin/addHome"} />

            <Button label="Login with Steam" type="submit"/>
        </form>
    {:else if loggedInPlayer > 70000000000000000}
        {#if !$account.migrated}
            If you using the <b>Steam game</b> - you are all set!<br>
            Check <a class="inlineLink" href={"/u/" + loggedInPlayer}>your fancy profile </a>
            <br>
            <br>
            <br>
            If you using Oculus (Quest or PC) - you can migrate<br>account created in mod to this <b class="inlineLink">Steam account.</b><br><br>
            Your current scores will migrate and<br>the new ones will be posted to the Steam acc.<br>
            This is not required and no way back!
            <div class="input-container">
                Login
                <input bind:value={login} placeholder="Login">
            </div>
            <div class="input-container">
                Password
                <input type="password" bind:value={password} placeholder="Password">
            </div>        
            <Button iconFa="fas fa-plus-square" label="Migrate" on:click={() => account.migrate(login, password)}/>
        {:else}
            {navigate("/u/" + loggedInPlayer)}
        {/if}
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
{:else if action == "changePassword"}
    {#if !$account.migrated}
        <div class="input-container">
            Login
            <input bind:value={login} placeholder="Login">
        </div>
        <div class="input-container">
            Current password
            <input type="password" bind:value={password} placeholder="Password">
        </div>
        <div class="input-container">
            New password
            <input type="password" bind:value={newPassword} placeholder="New password">
        </div>
        
        <Button iconFa="fas fa-plus-square" label="Change password" on:click={() => account.changePassword(login, password, newPassword)}/>
    {:else}
        <div class="input-container">
            Login
            <input bind:value={login} placeholder="Login">
        </div>
        <div class="input-container">
            New password
            <input type="password" bind:value={newPassword} placeholder="Password">
        </div>
        
        <Button iconFa="fas fa-plus-square" label="Change password" on:click={() => account.changePasswordMigrated(login, newPassword)}/>
    {/if}
{:else if action == "linkPatreon"}

<div>
Link your account to receive patreon features for your tier.<br><br>

If you not yet a patreon, you can become one right now at <a class="inlineLink" href="https://www.patreon.com/beatleader">patreon.com/beatleader</a>
</div>

<form action={BL_API_URL + "signin"} method="post">
    <input type="hidden" name="Provider" value="Patreon" />
    <input type="hidden" name="ReturnUrl" value={CURRENT_URL + "/signin/patreon"} />

    <Button iconFa="fas fa-plus-square" label="Link to patreon" type="submit"/>
</form>
{:else if action == "patreon"}
    {#if patreoned}
    Yay!<br>
    Thank you for supporting BeatLeader!
    {:else}
    Something went wrong while linking your account.<br>
    If you used this account before, try unlink it first.
    {/if}
{/if}

{#if error}
<p class="error">{error}</p>
{/if}
{#if message}
<p class="messagep">{message}</p>
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
    .messagep {
        color: green;
    }

    .input-container {
        display: grid;
    }

    .inlineLink {
        display: contents;
    }
</style>



