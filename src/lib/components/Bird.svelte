<script>
	export let birdY = 300;
</script>

<div class="bird" style="top: {birdY}px;"></div>

<style>
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
		z-index: 10;
	}
</style>
