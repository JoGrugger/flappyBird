import { pb } from '$lib/pocketbase.js';

import { writable } from 'svelte/store';

export const user = writable(pb.authStore.model);
export const leaderboard = writable([]);
export const highscore = writable(0);

export let loggedIn = $state({
	value: pb.authStore.isValid,
	refresh: () => {
		loggedIn.value = pb.authStore.isValid;
	}
});
