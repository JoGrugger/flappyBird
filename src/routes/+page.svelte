<script>
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import Login from '$lib/components/Login.svelte';
	import ScreenOverlay from '$lib/components/ScreenOverlay.svelte';
	import { user, leaderboard as leaderboardStore, loggedIn } from '$lib/store.svelte';
	import { get } from 'svelte/store';

	let bird, gameArea;

	let gravity = 0.5;
	let jumpStrength = 8;
	let birdY = 300;
	let birdVelocity = 0;
	let gameInterval, obstacleInterval;

	let isGameOver = false;
	let score = 0;
	let highscore = 0;
	let leaderboard = [];
	let showStartScreen = true;
	let showGameOverScreen = false;
	let showLeaderboard = false;
	let obstacles = [];
	let birdWidth = 40;
	let birdHeight = 40;
	let gap = 150;
	let gameSpeed = 3;
	let canRestart = true;

	function startGame() {
		showStartScreen = showGameOverScreen = showLeaderboard = false;
		isGameOver = false;
		score = 0;
		birdY = 300;
		birdVelocity = 0;
		gameSpeed = 3;

		obstacles.forEach((ob) => {
			ob.elTop.remove();
			ob.elBottom.remove();
		});
		obstacles = [];

		clearInterval(gameInterval);
		clearInterval(obstacleInterval);

		generateObstacle();
		gameInterval = setInterval(gameLoop, 20);
		obstacleInterval = setInterval(generateObstacle, 1000);
	}

	async function endGame() {
		clearInterval(gameInterval);
		clearInterval(obstacleInterval);
		isGameOver = true;
		showGameOverScreen = true;
		canRestart = false;
		setTimeout(() => (canRestart = true), 400);
		await saveAndUpdateScore(score);
		await loadLeaderboard();
	}

	async function saveAndUpdateScore(score) {
		const currentUser = get(user);
		if (!currentUser) return;

		try {
			let existingHighscore = null;
			try {
				existingHighscore = await pb
					.collection('scores')
					.getFirstListItem(`user="${currentUser.id}" && highscore=true`, { sort: '-score' });
			} catch (e) {
				if (e.status !== 404) throw e;
			}

			const newScoreEntry = await pb.collection('scores').create({
				user: currentUser.id,
				score,
				highscore: false
			});

			if (!existingHighscore) {
				await pb.collection('scores').update(newScoreEntry.id, { highscore: true });
				highscore = score;
			} else if (score > existingHighscore.score) {
				await pb.collection('scores').update(existingHighscore.id, { highscore: false });
				await pb.collection('scores').update(newScoreEntry.id, { highscore: true });
				highscore = score;
			} else {
				highscore = existingHighscore.score;
			}
		} catch (err) {
			console.error('Fehler beim Speichern des Scores:', err);
		}
	}

	async function loadUserHighscore() {
		const currentUser = get(user);
		if (!currentUser) return;
		try {
			const highscoreEntry = await pb
				.collection('scores')
				.getFirstListItem(`user="${currentUser.id}" && highscore=true`);
			highscore = highscoreEntry?.score ?? 0;
		} catch (err) {
			console.error('Highscore laden fehlgeschlagen:', err);
		}
	}

	async function loadLeaderboard() {
		try {
			const result = await pb.collection('scores').getFullList({
				sort: '-score',
				expand: 'user'
			});
			const top5 = result.slice(0, 5).map((entry) => ({
				score: entry.score,
				user: entry.expand?.user?.name ?? 'Unbekannt'
			}));
			leaderboardStore.set(top5);
		} catch (err) {
			console.error('Leaderboard laden fehlgeschlagen:', err);
		}
	}

	function handleKeyPress(e) {
		if (e.key === ' ') {
			if ((showStartScreen || showGameOverScreen) && canRestart) startGame();
			else if (!isGameOver) birdVelocity = -jumpStrength;
		}
	}

	function handleClickOrTouch() {
		if ((showStartScreen || showGameOverScreen) && canRestart) startGame();
		else if (!isGameOver) birdVelocity = -jumpStrength;
	}

	function gameLoop() {
		birdVelocity += gravity;
		birdY += birdVelocity;
		if (birdY <= 0 || birdY + birdHeight >= 600) return endGame();
		bird.style.top = birdY + 'px';

		obstacles.forEach((ob) => {
			ob.left -= gameSpeed;
			ob.elTop.style.left = ob.left + 'px';
			ob.elBottom.style.left = ob.left + 'px';
			if (
				ob.left < 100 + birdWidth &&
				ob.left + ob.width > 100 &&
				(birdY < ob.gapTop || birdY + birdHeight > ob.gapTop + gap)
			)
				endGame();
			if (!ob.passed && ob.left + ob.width < 50) {
				score++;
				ob.passed = true;
			}
		});
	}

	function generateObstacle() {
		const gapTop = Math.random() * 200 + 100;
		const obstacleTop = document.createElement('div');
		const obstacleBottom = document.createElement('div');

		Object.assign(obstacleTop.style, {
			position: 'absolute',
			width: '60px',
			height: gapTop + 'px',
			left: '100%',
			top: '0',
			backgroundImage: 'url("/flappybird-pipe.png")',
			backgroundSize: 'cover',
			transform: 'rotate(180deg)',
			zIndex: '5'
		});
		Object.assign(obstacleBottom.style, {
			position: 'absolute',
			width: '60px',
			height: 600 - gapTop - gap + 'px',
			left: '100%',
			top: gapTop + gap + 'px',
			backgroundImage: 'url("/flappybird-pipe.png")',
			backgroundSize: 'cover',
			zIndex: '5'
		});

		gameArea.appendChild(obstacleTop);
		gameArea.appendChild(obstacleBottom);

		obstacles.push({
			elTop: obstacleTop,
			elBottom: obstacleBottom,
			left: window.innerWidth,
			width: 60,
			gapTop,
			passed: false
		});
	}

	function logout() {
		pb.authStore.clear();
		loggedIn.refresh();
	}

	onMount(async () => {
		bird = document.querySelector('.bird');
		gameArea = document.querySelector('.game-area');
		document.addEventListener('keydown', handleKeyPress);
		document.addEventListener('click', handleClickOrTouch);
		document.addEventListener('touchstart', handleClickOrTouch);

		if (pb.authStore.isValid) {
			await loadLeaderboard();
			await loadUserHighscore();
		}
	});

	const handleLeaderboardClick = () => {
		showLeaderboard = !showLeaderboard;
		if (showLeaderboard) loadLeaderboard();
	};
</script>

<div
	class="game-container relative h-[695px] w-full overflow-hidden bg-[url('/fb-game-background.png')]"
>
	<div bind:this={gameArea} class="game-area relative h-full w-full">
		<div
			bind:this={bird}
			class="bird absolute left-[100px] h-[40px] w-[40px] bg-[url('/flappy-bird.png')] bg-contain bg-no-repeat"
			style="top: 300px"
		></div>
		<div class="ground absolute bottom-0 left-0 z-10 h-[120px] w-full"></div>
	</div>

	{#if showStartScreen}
		<ScreenOverlay
			title="Flappy Bird"
			buttons={[
				{ label: 'Spiel starten', onClick: startGame },
				{
					label: showLeaderboard ? 'Zurück' : 'Leaderboard',
					onClick: handleLeaderboardClick
				},
				{ label: 'Logout', onClick: logout }
			]}
		>
			{#if showLeaderboard}
				<div class="rounded-lg bg-black/60 p-4 text-white">
					<h2 class="mb-3 text-xl text-yellow-300 underline">Top 5</h2>
					<ol class="space-y-1 text-left text-sm">
						{#each $leaderboardStore as entry, i}
							<li>
								<span class="inline-block w-6 text-center font-bold">{i + 1}.</span>
								<span>{entry.user}</span>
								<span class="float-right">{entry.score} Punkte</span>
							</li>
						{/each}
					</ol>
				</div>
			{/if}
		</ScreenOverlay>
	{/if}

	{#if showGameOverScreen}
		<ScreenOverlay
			title="Game Over"
			buttons={[
				{ label: 'Retry', onClick: startGame },
				{
					label: 'Menü',
					onClick: () => {
						showGameOverScreen = false;
						showStartScreen = true;
					}
				}
			]}
		>
			<p class="text-lg text-white">Score: {score}</p>
			<p class="text-yellow-300">Highscore: {highscore}</p>
		</ScreenOverlay>
	{/if}

	{#if !showStartScreen && !showGameOverScreen}
		<div class="absolute top-2 left-4 z-50 text-xl font-bold text-white">Score: {score}</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

	.bird {
		position: absolute;
		left: 100px;
		width: 40px;
		height: 40px;
		background-image: url('/flappy-bird.png');
		background-size: contain;
		background-repeat: no-repeat;
		will-change: top;
		filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7));
	}

	.ground {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 120px;
		width: 100%;
		background: url('/bottom-background.png') repeat-x;
		animation: groundScroll 6s linear infinite;
		box-shadow: inset 0 5px 10px rgba(0, 0, 0, 0.3);
	}

	@keyframes groundScroll {
		from {
			background-position-x: 0;
		}
		to {
			background-position-x: -100%;
		}
	}

	.text-white {
		font-family: 'Press Start 2P';
		color: white;
		text-shadow: 1px 1px 3px black;
	}

	.text-yellow-300 {
		color: #f9d71c;
		text-shadow: 1px 1px 2px #000;
	}
</style>
