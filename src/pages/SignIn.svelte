<script>
    import Button from "../components/Common/Button.svelte";
    import createAccountStore from '../stores/beatleader/account'
    import {opt} from '../utils/js'

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
    $: performAction();
</script>

<div class="container">
{#if !loggedInPlayer}

    Login with the Steam or password you created in mod.<br>
    Signup is possible only from the mods!
    <input bind:value={login} placeholder="Login">
    <input type="password" bind:value={password} placeholder="Password">

    <Button iconFa="fas fa-plus-square" label="Login" on:click={() => account.logIn(login, password)}/>
    <form action="https://api.beatleader.xyz/signin" method="post">
        <input type="hidden" name="Provider" value="Steam" />
        <input type="hidden" name="ReturnUrl" value="https://beatleader.xyz/signin/addHome" />

        <Button iconFa="fas fa-plus-square" label="Login with Steam" type="submit"/>
    </form>
{:else if loggedInPlayer > 70000000000000000}
    Migrate your account created in mod to this Steam account.
    <input bind:value={login} placeholder="Login">
    <input type="password" bind:value={password} placeholder="Password">
    <Button iconFa="fas fa-plus-square" label="Login" on:click={() => copyToken()}/>
{:else}
    You can migrate this account to your Steam account.<br>
    Or just use this account.<br>
    You can change your avatar and name in your profile.

    <form action="https://api.beatleader.xyz/signinmigrate" method="post">
        <input type="hidden" name="Provider" value="Steam" />
        <input type="hidden" name="ReturnUrl" value="https://beatleader.xyz/signin/addHome" />

        <Button iconFa="fas fa-plus-square" label="Login with Steam" type="submit"/>
    </form>
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
</style>



