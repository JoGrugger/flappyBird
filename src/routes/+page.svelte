<script>
	import { onMount } from 'svelte';

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
	let score = 0;
	let showStartScreen = true;
	let showGameOverScreen = false;
	let obstacles = [];
	let birdWidth = 40;
	let birdHeight = 40;
	let gap = 150;
	let gameSpeed = 3;

	function startGame() {
		showStartScreen = false;
		showGameOverScreen = false;
		isGameOver = false;
		score = 0;
		birdY = 300;
		birdVelocity = 0;
		gameSpeed = 15;

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

	function endGame() {
		clearInterval(gameInterval);
		clearInterval(obstacleInterval);
		clearInterval(speedInterval);
		isGameOver = true;
		showGameOverScreen = true;
	}

	function handleKeyPress(e) {
		if (e.key === ' ') {
			if (showStartScreen || showGameOverScreen) {
				startGame();
			} else if (!isGameOver) {
				birdVelocity = -jumpStrength;
			}
		}
	}

	function gameLoop() {
		birdVelocity += gravity;
		birdY += birdVelocity;

		if (birdY <= 0 || birdY + birdHeight >= 622) {
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
	});
</script>

<!-- 🎮 Game UI -->
<div
	class="game-container relative h-[695px] w-full overflow-hidden bg-[url('/fb-game-background.png')]"
>
	<div bind:this={gameArea} class="game-area relative h-full w-full">
		<div
			bind:this={bird}
			class="bird absolute left-[100px] h-[40px] w-[40px] bg-[url('/flappy-bird.png')] bg-contain bg-no-repeat"
			style="top: 300px"
		></div>

		<!-- 👇 Boden (CSS-Animation) -->
		<div class="ground absolute bottom-0 left-0 z-0 h-[100px] w-full"></div>
	</div>

	<!-- 🎬 Start-Screen -->
	{#if showStartScreen}
		<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
			<div class="text-center">
				<h1 class="mb-4 text-4xl font-bold text-white">Flappy Bird</h1>
				<p class="mb-2 text-white">Leertaste oder Klick zum Starten</p>
				<button on:click={startGame} class="rounded bg-white px-6 py-2 text-lg">Start</button>
			</div>
		</div>
	{/if}

	<!-- ☠️ Game Over Screen -->
	{#if showGameOverScreen}
		<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
			<div class="text-center">
				<h1 class="mb-2 text-4xl font-bold text-white">Game Over</h1>
				<p class="mb-4 text-lg text-white">Score: {score}</p>
				<button on:click={startGame} class="rounded bg-white px-6 py-2 text-lg">Retry</button>
			</div>
		</div>
	{/if}

	<!-- 🧮 Score -->
	{#if !showStartScreen && !showGameOverScreen}
		<div class="absolute top-2 left-4 z-50 text-xl font-bold text-white">Score: {score}</div>
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
		animation: groundScroll 2s linear;
	}

	@keyframes groundScroll {
		from {
			background-position-x: 0;
		}
		to {
			background-position-x: -100%;
		}
	}
</style>
