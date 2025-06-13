<script>
	import { pb } from '$lib/pocketbase.js';
	import { loggedIn } from '$lib/store.svelte';

	let mail = $state('');
	let password = $state('');

	let registration = $state(false);
	let passwordCopy = $state('');

	async function login() {
		const authData = await pb.collection('users').authWithPassword(mail, password);
		loggedIn.refresh();
	}

	async function createUser() {
		if (password !== passwordCopy) {
			alert('Passwords do not match!');
			return;
		}

		try {
			await pb.collection('users').create({
				email: mail,
				password: password,
				passwordConfirm: passwordCopy,
				verfied: true
			});
			await login();
		} catch (error) {
			alert(error.message);
		}
	}
</script>

<div class="card bg-base-100 card-lg w-96 shadow-sm">
	<div class="card-body">
		<h2 class="card-title">Login</h2>
		<fieldset class="fieldset">
			<legend class="fieldset-legend">E-Mail</legend>
			<input type="email" class="input" placeholder="Type here" bind:value={mail} />
		</fieldset>
		<fieldset class="fieldset">
			<legend class="fieldset-legend">Passwort</legend>
			<input type="password" class="input" placeholder="Type here" bind:value={password} />
		</fieldset>
		{#if registration}
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Repeat Passwort</legend>
				<input type="password" class="input" placeholder="Type here" bind:value={passwordCopy} />
			</fieldset>
		{/if}
		<div class="card-actions justify-end">
			{#if !registration}
				<button class="btn" onclick={() => (registration = true)}>Register</button>
				<button class="btn btn-primary" onclick={login}>Login</button>
			{:else}
				<button class="btn btn-primary" onclick={createUser}>Register</button>
			{/if}
		</div>
	</div>
</div>
