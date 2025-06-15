<script>
	export let gapTop;
	export let left;
	export let gap = 150;
	export let width = 60;
	const height = 600;
</script>

<!-- Oben -->
<div class="obstacle top" style="left: {left}px; height: {gapTop}px; width: {width}px;"></div>

<!-- Unten -->
<div
	class="obstacle bottom"
	style="left: {left}px; top: {gapTop + gap}px; height: {height -
		gapTop -
		gap}px; width: {width}px;"
></div>

<style>
	.obstacle {
		position: absolute;
		background-image: url('/flappybird-pipe.png');
		background-size: cover;
		z-index: 5;
	}

	.obstacle.top {
		top: 0;
		transform: rotate(180deg);
	}

	.obstacle.bottom {
		position: absolute;
	}
</style>
