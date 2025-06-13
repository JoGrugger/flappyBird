<script>
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import Login from '$lib/components/Login.svelte';

	let bird;
	let gameArea;

	let gravity = 0.5;
	let jumpStrength = 8;
	let birdY = 300;
	let birdVelocity = 0;
	let gameInterval;
	let obstacleInterval;
	let speedInterval;
	let isGameOver = false;
	let isPaused = false;
	let score = 0;
	let highscore = 0;
	let leaderboard = [];
	let showStartScreen = true;
	let showGameOverScreen = false;
	let showPauseMenu = false;
	let showLeaderboard = false;
	let obstacles = [];
	let birdWidth = 40;
	let birdHeight = 40;
	let gap = 150;
	let gameSpeed = 3;

	function startGame() {
		showStartScreen = false;
		showGameOverScreen = false;
		showPauseMenu = false;
		showLeaderboard = false;
		isGameOver = false;
		isPaused = false;
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
		clearInterval(speedInterval);

		gameInterval = setInterval(gameLoop, 20);
		obstacleInterval = setInterval(generateObstacle, 1000);
		speedInterval = setInterval(() => {
			gameSpeed += 0.2;
		}, 5000);
	}

	function pauseGame() {
		if (isPaused) {
			showPauseMenu = false;
			isPaused = false;
			gameInterval = setInterval(gameLoop, 20);
		} else {
			isPaused = true;
			showPauseMenu = true;
			clearInterval(gameInterval);
		}
	}

	function endGame() {
		clearInterval(gameInterval);
		clearInterval(obstacleInterval);
		clearInterval(speedInterval);
		isGameOver = true;
		showGameOverScreen = true;

		if (score > highscore) {
			highscore = score;
			localStorage.setItem('flappy_highscore', highscore.toString());
		}

		updateLeaderboard(score);
	}

	function updateLeaderboard(newScore) {
		leaderboard.push(newScore);
		leaderboard.sort((a, b) => b - a);
		leaderboard = leaderboard.slice(0, 5);
		localStorage.setItem('flappy_leaderboard', JSON.stringify(leaderboard));
	}

	function handleKeyPress(e) {
		if (e.key === ' ') {
			if (showStartScreen || showGameOverScreen) {
				startGame();
			} else if (!isGameOver && !isPaused) {
				birdVelocity = -jumpStrength;
			}
		} else if (e.key === 'p') {
			if (!isGameOver && !showStartScreen) {
				pauseGame();
			}
		}
	}

	function gameLoop() {
		if (isPaused) return;

		birdVelocity += gravity;
		birdY += birdVelocity;

		if (birdY <= 0 || birdY + birdHeight >= 600) {
			endGame();
			return;
		}

		bird.style.top = birdY + 'px';

		obstacles.forEach((ob) => {
			ob.left -= gameSpeed;
			ob.elTop.style.left = ob.left + 'px';
			ob.elBottom.style.left = ob.left + 'px';

			if (
				ob.left < 100 + birdWidth &&
				ob.left + ob.width > 100 &&
				(birdY < ob.gapTop || birdY + birdHeight > ob.gapTop + gap)
			) {
				endGame();
			}

			if (!ob.passed && ob.left + ob.width < 100) {
				score++;
				ob.passed = true;
			}
		});
	}

	function generateObstacle() {
		const obstacleHeight = Math.random() * 200 + 100;
		const gapTop = obstacleHeight;

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

	onMount(() => {
		bird = document.querySelector('.bird');
		gameArea = document.querySelector('.game-area');
		document.addEventListener('keydown', handleKeyPress);

		const savedHighscore = localStorage.getItem('flappy_highscore');
		if (savedHighscore) highscore = parseInt(savedHighscore);

		const savedLeaderboard = localStorage.getItem('flappy_leaderboard');
		if (savedLeaderboard) leaderboard = JSON.parse(savedLeaderboard);
	});
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
		<div class="menu absolute inset-0 z-50 flex items-center justify-center bg-black/60">
			<div class="space-y-4 text-center">
				<h1 class="text-4xl font-bold text-white">Flappy Bird</h1>
				<button onclick={startGame} class="w-48 rounded bg-white px-6 py-2 text-lg"
					>Spiel starten</button
				>
				<button
					onclick={() => (showLeaderboard = !showLeaderboard)}
					class="w-48 rounded bg-white px-6 py-2 text-lg"
				>
					{showLeaderboard ? 'Zurück' : 'Leaderboard'}
				</button>
				{#if showLeaderboard}
					<div
						class="animate-fadeIn mt-4 rounded-lg bg-black/70 px-6 py-4 text-white shadow-lg backdrop-blur"
					>
						<h2 class="mb-3 text-lg font-semibold text-yellow-300 underline">🏆 Top 5</h2>
						<ol class="space-y-1 text-left text-sm">
							{#each leaderboard as s, i}
								<li class="flex items-center gap-2">
									<span class="inline-block w-6 text-center font-bold">{i + 1}.</span>
									<span class="flex-1 border-b border-white/20 pb-1">{s} Punkte</span>
								</li>
							{/each}
						</ol>
					</div>
				{:else}
					<details class="mt-2 text-sm text-white">
						<summary class="cursor-pointer underline">Anleitung</summary>
						<p class="mt-2">Drücke Leertaste zum Fliegen, P zum Pausieren.</p>
					</details>
				{/if}
			</div>
		</div>
	{/if}

	{#if showGameOverScreen}
		<div class="menu absolute inset-0 z-50 flex items-center justify-center bg-black/60">
			<div class="animate-fadeIn space-y-2 text-center">
				<h1 class="text-4xl font-bold text-white">Game Over</h1>
				<p class="text-lg text-white">Score: {score}</p>
				<p class="text-yellow-300">Highscore: {highscore}</p>
				<button onclick={startGame} class="rounded bg-white px-6 py-2 text-lg">Retry</button>
				<button
					onclick={() => {
						showGameOverScreen = false;
						showStartScreen = true;
					}}
					class="ml-2 rounded bg-white px-6 py-2 text-lg">Menü</button
				>
			</div>
		</div>
	{/if}

	{#if showPauseMenu}
		<div class="menu absolute inset-0 z-50 flex items-center justify-center bg-black/60">
			<div class="animate-fadeIn space-y-4 text-center">
				<h2 class="text-3xl font-bold text-white">Pause</h2>
				<button onclick={pauseGame} class="rounded bg-white px-6 py-2 text-lg">Fortsetzen</button>
				<button
					onclick={() => {
						showPauseMenu = false;
						showStartScreen = true;
						clearInterval(gameInterval);
					}}
					class="rounded bg-white px-6 py-2 text-lg">Zurück zum Menü</button
				>
			</div>
		</div>
	{/if}

	{#if !showStartScreen && !showGameOverScreen && !showPauseMenu}
		<div class="absolute top-2 left-4 z-50 text-xl font-bold text-white">Score: {score}</div>
		<button
			onclick={pauseGame}
			class="absolute top-2 right-4 z-50 rounded bg-black/40 px-3 py-1 text-white">⏸</button
		>
	{/if}
</div>

<style>
	body {
		margin: 0;
		padding: 0;
		overflow: hidden;
		background: url('/fb-game-background.png');
		font-family: sans-serif;
	}

	.ground {
		background: url('/bottom-background.png');
		background-repeat: repeat-x;
		animation: groundScroll 2s linear infinite;
	}

	@keyframes groundScroll {
		from {
			background-position-x: 0;
		}
		to {
			background-position-x: -100%;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.6s ease-out;
	}
</style>
