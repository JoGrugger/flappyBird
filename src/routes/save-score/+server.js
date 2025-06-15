import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import Pocketbase from 'pocketbase';

export async function POST({ request, locals }) {
	const { score } = await request.json();

	try {
		locals.pb = new Pocketbase('http://127.0.1:8090');
		locals.pb.authStore.loadFromCookie(request.headers.get('cookie'));
		await locals.pb.collection('users').authRefresh();

		locals.user = locals.pb.authStore.model;
		locals.token = locals.pb.authStore.token;
	} catch (error) {
		return new Response('Du scheinst nicht angemeldet zu sein. ' + error, { status: 401 });
	}

	const user = locals.user;

	try {
		let oldHighscore = null;
		try {
			oldHighscore = await locals.pb
				.collection('scores')
				.getFirstListItem(`user="${user.id}" && highscore=true`);
		} catch (err) {
			if (err.status !== 404) {
				console.error('Fehler beim Abrufen des alten Highscores:', err);
				return json({ error: 'Fehler beim Abrufen des Highscores' }, { status: 500 });
			}
		}

		const newEntry = await locals.pb.collection('scores').create({
			user: user.id,
			score,
			highscore: false
		});

		if (!oldHighscore || score > oldHighscore.score) {
			if (oldHighscore) {
				await locals.pb.collection('scores').update(oldHighscore.id, { highscore: false });
			}
			await locals.pb.collection('scores').update(newEntry.id, { highscore: true });
		}

		return json({ success: true, newHighscore: Math.max(score, oldHighscore?.score || 0) });
	} catch (err) {
		console.error(err);
		return json({ error: 'Serverfehler' }, { status: 500 });
	}
}
