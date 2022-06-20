<script>
    import Button from "../components/Common/Button.svelte";
    import createAccountStore from '../stores/beatleader/account'
    import {formatDateRelative, dateFromUnix} from '../utils/date'
    import {opt} from '../utils/js'
    import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue'
    import { navigate } from "svelte-routing";
import Dialog from "../components/Common/Dialog.svelte";
import Spinner from "../components/Common/Spinner.svelte";

    export let action;

    const account = createAccountStore();

    let login;
    let password;
    let newPassword;
    let newLogin = opt($account, 'login');
    let suspendingDialogShown = false;

    function performAction() {
        if (action == "addHome") {
            account.refresh(true);
        }
    }

    $: loggedInPlayer = opt($account, 'id');
    $: error = opt($account, 'error');
    $: message = opt($account, 'message');
    $: patreoned = opt($account, 'patreoned');
    $: loading = opt($account, 'loading');
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
{:else if action == "mylogin"}
    Your current login is: <b>{$account.login}</b><br>
    It's a value you should use in Quest mod setting.<br>
    Your profile name is a different thing!<br>

    <div class="input-container">
        You may change it once a week.<br>Make sure you don't use special characters not available in-game keyboard.
        <input bind:value={newLogin} placeholder="New login">
    </div>

    <Button iconFa="fas fa-plus-square" label="Change login" on:click={() => account.changeLogin(newLogin)}/>
{:else if action == "autoban"}
    {#if $account.ban}
    Your account was suspended {formatDateRelative(dateFromUnix($account.ban.timeset))}<br>
    You can activate it back if more than a week passed.

    <Button iconFa="fas fa-plus-square" label="Try activate my account" on:click={() => account.unbanPlayer()}/>
    {:else}
    You can suspend your BeatLeader account. It will disappear in the leaderboards and ranking.<br>
    And your replays will not be accepted anymore.<br><br>

    <b>You can activate it back only after the week of suspension.<br>
        All account data will be deleted after 6 month of suspension!</b><br>
    
    Account suspension may take up to 3 minutes.

    <Button iconFa="fas fa-plus-square" label="Yes, suspend my account" on:click={() => suspendingDialogShown = !suspendingDialogShown}/>
    {/if}
    
{/if}

{#if suspendingDialogShown}
    <Dialog type="confirm" title="Are you sure?" okButton="Yeah!" cancelButton="Hell no!"
            on:confirm={() => { account.banPlayer(); suspendingDialogShown = false} }
            on:cancel={() => suspendingDialogShown = false}
    >
      <div slot="content">
        <div>Your BeatLeader account will be suspended!</div>
      </div>
    </Dialog>
  {/if}
    
  {#if loading}
  <Spinner />
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



