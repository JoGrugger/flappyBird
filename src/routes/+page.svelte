<script>
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import Login from '$lib/components/Login.svelte';
	import ScreenOverlay from '$lib/components/ScreenOverlay.svelte';
	import { user, leaderboard as leaderboardStore, loggedIn } from '$lib/store.svelte';
	import { get } from 'svelte/store';
	import Bird from '$lib/components/Bird.svelte';

	let gameArea;

	// Game state
	let gravity = 0.5;
	let jumpStrength = 8;
	let birdY = 300;
	let birdVelocity = 0;
	let animationId;
	let obstacleInterval;
	let isGameOver = false;
	let score = 0;
	let highscore = 0;
	let showStartScreen = true;
	let showGameOverScreen = false;
	let showLeaderboard = false;
	let canRestart = true;

	let obstacles = [];
	const birdWidth = 40;
	const birdHeight = 40;
	const gap = 150;
	const gameSpeedInitial = 3;
	let gameSpeed = gameSpeedInitial;

	function resetGame() {
		isGameOver = false;
		score = 0;
		birdY = 300;
		birdVelocity = 0;
		gameSpeed = gameSpeedInitial;
		obstacles.forEach((ob) => {
			ob.elTop.remove();
			ob.elBottom.remove();
		});
		obstacles = [];
		if (animationId) cancelAnimationFrame(animationId);
		if (obstacleInterval) clearInterval(obstacleInterval);
	}

	function startGame() {
		showStartScreen = false;
		showGameOverScreen = false;
		showLeaderboard = false;
		resetGame();
		generateObstacle();
		animationId = requestAnimationFrame(gameLoop);
		obstacleInterval = setInterval(generateObstacle, 1000);
	}

	async function endGame() {
		if (isGameOver) return;
		isGameOver = true;
		cancelAnimationFrame(animationId);
		clearInterval(obstacleInterval);
		showGameOverScreen = true;
		canRestart = false;
		setTimeout(() => (canRestart = true), 400);
		try {
			const res = await fetch('/save-score', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ score })
			});
			const result = await res.json();
			highscore = result.newHighscore;
			await loadLeaderboard();
		} catch (err) {
			console.error('Fehler beim Speichern oder Laden:', err);
		}
	}

	async function loadUserHighscore() {
		const currentUser = get(user);
		if (!currentUser) return;
		try {
			const entry = await pb
				.collection('scores')
				.getFirstListItem(`user="${currentUser.id}" && highscore=true`);
			highscore = entry?.score ?? 0;
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
		if (showStartScreen && !showLeaderboard && showGameOverScreen && canRestart) {
			startGame();
		} else if (!isGameOver) {
			birdVelocity = -jumpStrength;
		}
	}

	function generateObstacle() {
		const gameHeight = 600;
		const pipeWidth = 60;
		const minPipeHeight = 100;
		const maxGapTop = gameHeight - gap - minPipeHeight;
		const gapTop = Math.floor(Math.random() * (maxGapTop - minPipeHeight) + minPipeHeight);
		const obstacleTopHeight = gapTop;
		const obstacleBottomHeight = gameHeight - gapTop - gap;

		const createPipe = (height, top, rotate = false) => {
			const el = document.createElement('div');
			Object.assign(el.style, {
				position: 'absolute',
				width: pipeWidth + 'px',
				height: height + 'px',
				left: '0',
				top: top + 'px',
				backgroundImage: 'url("/flappybird-pipe.png")',
				backgroundSize: 'cover',
				backgroundRepeat: 'no-repeat',
				zIndex: '5',
				willChange: 'transform',
				transform: rotate ? 'rotate(180deg) translateX(0)' : 'translateX(0)'
			});
			gameArea.appendChild(el);
			return el;
		};

		const obstacleTop = createPipe(obstacleTopHeight, 0, true);
		const obstacleBottom = createPipe(obstacleBottomHeight, gapTop + gap);

		obstacles.push({
			elTop: obstacleTop,
			elBottom: obstacleBottom,
			left: window.innerWidth,
			width: pipeWidth,
			gapTop: obstacleTopHeight,
			passed: false
		});
	}

	function gameLoop() {
		birdVelocity += gravity;
		birdY += birdVelocity;

		if (birdY <= 0 || birdY + birdHeight >= 600) {
			endGame();
			return;
		}

		for (let ob of obstacles) {
			ob.left -= gameSpeed;
			ob.elTop.style.transform = `translateX(${Math.floor(ob.left)}px) rotate(180deg)`;
			ob.elBottom.style.transform = `translateX(${Math.floor(ob.left)}px)`;

			const birdLeft = 100;
			const birdRight = birdLeft + birdWidth;
			const obRight = ob.left + ob.width;

			const collision =
				ob.left < birdRight &&
				obRight > birdLeft &&
				(birdY < ob.gapTop || birdY + birdHeight > ob.gapTop + gap);

			if (collision) {
				endGame();
				return;
			}

			if (!ob.passed && obRight < 175) {
				score++;
				ob.passed = true;
			}
		}

		animationId = requestAnimationFrame(gameLoop);
	}

	function logout() {
		pb.authStore.clear();
		loggedIn.refresh();
	}

	function handleLeaderboardClick() {
		showLeaderboard = !showLeaderboard;
		if (showLeaderboard) loadLeaderboard();
	}

	onMount(async () => {
		gameArea = document.querySelector('.game-area');
		document.addEventListener('keydown', handleKeyPress);
		document.addEventListener('click', handleClickOrTouch);
		document.addEventListener('touchstart', handleClickOrTouch);

		if (pb.authStore.isValid) {
			await loadLeaderboard();
			await loadUserHighscore();
		}
	});
</script>

<div
	class="game-container relative h-[695px] w-full overflow-hidden bg-[url('/fb-game-background.png')]"
>
	<div bind:this={gameArea} class="game-area relative h-full w-full">
		<Bird {birdY} />
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
