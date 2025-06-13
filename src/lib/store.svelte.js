import { pb } from '$lib/pocketbase.js';

export let loggedIn = $state({
	value: pb.authStore.isValid,
	refresh: () => {
		loggedIn.value = pb.authStore.isValid;
	}
});
