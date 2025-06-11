<script>
	import { onMount } from 'svelte';

	let bird;
	let gameArea;
	let ground;

	let birdLeft = 20;
	let birdBottom = 50;
	let gravity = 0.4;
	let jumpHeight = 8;
	let isGameOver = false;
	let gameTimer;
	let score = 0;
	let showStartScreen = true;
	let showGameOverScreen = false;
	let obstacles = [];

	const gap = 20;

	function startGameLoop() {
		gameTimer = setInterval(() => {
			if (!isGameOver) {
				birdBottom -= gravity;
				if (birdBottom <= 0) {
					gameOver();
					return;
				}
				bird.style.bottom = `${birdBottom}vh`;
				bird.style.left = `${birdLeft}vw`;
			}
		}, 20);
	}

	function jump() {
		if (isGameOver) return;
		if (birdBottom < 90) birdBottom += jumpHeight;
		bird.style.bottom = `${birdBottom}vh`;
	}

	function handleKeyUp(e) {
		if (e.key === ' ') jump();
	}

	function generateObstacle() {
		if (isGameOver) return;

		let obstacleLeft = 100;
		const minGapBottom = 20;
		const randomOffset = Math.random() * 30;
		let bottomObstacleHeight = minGapBottom + randomOffset;

		const bottomObstacle = document.createElement('div');
		const topObstacle = document.createElement('div');

		bottomObstacle.className =
			'absolute w-[10vw] bg-[url("/flappybird-pipe.png")] bg-contain bg-no-repeat bottom-0 z-10';
		bottomObstacle.style.height = `${bottomObstacleHeight}vh`;
		bottomObstacle.style.left = `${obstacleLeft}vw`;

		topObstacle.className =
			'absolute w-[10vw] rotate-180 bg-[url("/flappybird-pipe.png")] bg-contain bg-no-repeat z-10';
		topObstacle.style.height = `${100 - bottomObstacleHeight - gap}vh`;
		topObstacle.style.bottom = `${bottomObstacleHeight + gap}vh`;
		topObstacle.style.left = `${obstacleLeft}vw`;

		gameArea.appendChild(bottomObstacle);
		gameArea.appendChild(topObstacle);
		obstacles.push(bottomObstacle, topObstacle);

		let moveTimer = setInterval(() => {
			if (isGameOver) {
				clearInterval(moveTimer);
				return;
			}

			obstacleLeft -= 1;
			bottomObstacle.style.left = `${obstacleLeft}vw`;
			topObstacle.style.left = `${obstacleLeft}vw`;

			if (obstacleLeft < -10) {
				clearInterval(moveTimer);
				bottomObstacle.remove();
				topObstacle.remove();
				score++;
			}

			if (
				obstacleLeft < birdLeft + 10 &&
				obstacleLeft + 10 > birdLeft &&
				(birdBottom < bottomObstacleHeight || birdBottom > bottomObstacleHeight + gap)
			) {
				gameOver();
				clearInterval(moveTimer);
			}
		}, 20);

		if (!isGameOver) setTimeout(generateObstacle, 3000);
	}

	function gameOver() {
		clearInterval(gameTimer);
		isGameOver = true;
		showGameOverScreen = true;
		document.removeEventListener('keyup', handleKeyUp);
	}

	function startGame() {
		isGameOver = false;
		showStartScreen = false;
		showGameOverScreen = false;
		birdBottom = 50;
		score = 0;
		obstacles.forEach((el) => el.remove());
		obstacles = [];
		startGameLoop();
		generateObstacle();
		document.addEventListener('keyup', handleKeyUp);
	}

	onMount(() => {
		bird = document.querySelector('.bird');
		gameArea = document.querySelector('.game-area');
		ground = document.querySelector('.ground');
	});
</script>

<div class="relative h-screen w-screen overflow-hidden bg-[#1d3b3b]">
	<div
		class="sky absolute top-0 left-0 h-[80vh] w-full bg-cover bg-no-repeat"
		style="background-image: url('/fb-game-background.png')"
	></div>

	<div bind:this={gameArea} class="game-area relative h-full w-full">
		<div
			bind:this={bird}
			class="bird absolute bottom-[50vh] left-[20vw] z-20 h-[6vh] w-[6vw] bg-[url('/flappy-bird.png')] bg-contain bg-no-repeat"
		></div>
		<div
			bind:this={ground}
			class="ground absolute bottom-0 z-0 h-[20vh] w-full bg-[url('/bottom-background.png')] bg-repeat-x"
		></div>
	</div>

	{#if showStartScreen}
		<div class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60">
			<h1 class="mb-4 text-4xl font-bold text-white">Flappy Bird</h1>
			<button class="rounded bg-white px-4 py-2 text-lg" on:click={startGame}>Start</button>
		</div>
	{/if}

	{#if showGameOverScreen}
		<div class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60">
			<h1 class="mb-2 text-4xl font-bold text-white">Game Over</h1>
			<p class="mb-4 text-lg text-white">Final Score: {score}</p>
			<button class="rounded bg-white px-4 py-2 text-lg" on:click={startGame}>Retry</button>
		</div>
	{/if}

	{#if !showStartScreen && !showGameOverScreen}
		<div class="absolute top-2 left-2 z-30 text-lg text-white">Score: {score}</div>
	{/if}
</div>

<style>
	body {
		margin: 0;
		overflow: hidden;
	}
</style>
