const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const canvas = document.createElement("canvas");
canvas.setAttribute("width", SCREEN_WIDTH);
canvas.setAttribute("height", SCREEN_HEIGHT);
document.body.appendChild(canvas);

const MINIMAP_CELL_SIZE = 64;
const MINIMAP_PLAYER_SIZE = 10;

const PLAYER_SPEED = 0.5;
const ROTATE_SPEED = 0.1;

const FOV = Math.PI / 3;
const CELL_SIZE = SCREEN_WIDTH / 30;
const COL_WIDTH = 1;

let FPS = 60;
let cycleDelay = Math.floor(1000 / FPS);
let cycleCount = 0;
let oldCycleTime = 0;
let fpsRate = "Calculating...";

const context = canvas.getContext("2d");

const map = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
	[1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
	[1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 0, 0, 1, 0, 0, 1],
	[1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const player = {
	pos_x: 2.5,
	pos_y: 2.5,
	move_x: 0,
	move_y: 0,
	rotate: 0,
	angle: Math.PI / 3,
	fov: Math.PI / 5,
};

function clearScreen() {
	context.fillStyle = "aqua";
	context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

	context.fillStyle = "brown";
	context.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
}

function updatePlayer() {
	const new_pos_x = player.pos_x + player.move_y * Math.cos(player.angle);
	const new_pos_y = player.pos_y - player.move_y * Math.sin(player.angle);
	if (map[Math.floor(new_pos_y)][Math.floor(new_pos_x)] === 0 &&
		new_pos_x >= 0 && new_pos_y >= 0 &&
		new_pos_x < map.length && new_pos_y < map.length) {
		player.pos_x = new_pos_x;
		player.pos_y = new_pos_y;
		player.angle += player.rotate;
	}
}

function renderMinimap() {
	// Renders minimap
	if (player.angle >= 2 * Math.PI) player.angle = 0;
	else if (player.angle <= 0) player.angle = 2 * Math.PI;
	map.forEach((row, y) => {
		row.forEach((cell, x) => {
			if (cell === 1) {
				context.fillStyle = "grey";
			} else {
				context.fillStyle = "white";
			}
			context.fillRect(x * CELL_SIZE, y * CELL_SIZE, 
				CELL_SIZE, CELL_SIZE);

			context.beginPath();
			context.strokeStyle = "black";
			context.lineWidth = 3;
			context.moveTo(x * CELL_SIZE, y * CELL_SIZE);
			context.lineTo((x + 1) * CELL_SIZE, y * CELL_SIZE);
			context.lineTo((x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE);
			context.lineTo((x) * CELL_SIZE, (y + 1) * CELL_SIZE);
			context.stroke();
		});
	});
	
	for (let col = 0; col < SCREEN_WIDTH; col += COL_WIDTH) {
		const ray_angle = player.angle + player.fov * 
			(2 * col / SCREEN_WIDTH - 1);
		let map_x = Math.floor(player.pos_x), map_y = Math.floor(player.pos_y);

		// delta_x refers to how far along the ray we have to move
		// to increment cell horizontally
		const delta_x = Math.abs(1 / Math.cos(ray_angle));
		const delta_y = Math.abs(1 / Math.sin(ray_angle));

		// side_dist_x refers to how far along the ray we have to move
		// till the first vertical wall
		let step_x, step_y;
		let side_dist_x, side_dist_y;

		if (Math.cos(ray_angle) > 0) {
			step_x = -1;
			side_dist_x = (player.pos_x - Math.floor(player.pos_x)) * 
				delta_x;
		} else {
			step_x = 1;
			side_dist_x = (Math.floor(player.pos_x) + 1 - player.pos_x) * 
				delta_x;
		}

		if (Math.sin(ray_angle) > 0) {
			step_y = 1;
			side_dist_y = (Math.floor(player.pos_y) + 1 - player.pos_y) * 
				delta_y;
		} else {
			step_y = -1;
			side_dist_y = (player.pos_y - Math.floor(player.pos_y)) * 
				delta_y;
		}

		let side_reached;
		while (map[map_y][map_x] === 0 &&
			map_x >= 0 && map_y >= 0 && 
			map_x < map.length && map_y < map.length) {
			if (side_dist_x < side_dist_y) {
				map_x += step_x;
				side_dist_x += delta_x;
				side_reached = 'y';
			} else {
				map_y += step_y;
				side_dist_y += delta_y;
				side_reached = 'x';
			}
		}

		let ray_len;
		if (side_reached === 'y') {
			ray_len = side_dist_x - delta_x;
		} else {
			ray_len = side_dist_y - delta_y;
		}

		const ray_y = player.pos_y + Math.sin(ray_angle) * ray_len;
		const ray_x = player.pos_x - Math.cos(ray_angle) * ray_len;

		context.beginPath();
		context.strokeStyle = "blue";
		context.moveTo(player.pos_x * CELL_SIZE, player.pos_y * CELL_SIZE);
		context.lineTo(ray_x * CELL_SIZE, ray_y * CELL_SIZE);
		context.stroke();
	}  
	// Renders player
	const PLAYER_SIZE = 10;
	context.fillStyle = "purple";
	context.fillRect(
		player.pos_x * CELL_SIZE - PLAYER_SIZE / 2,
		player.pos_y * CELL_SIZE - PLAYER_SIZE / 2,
		PLAYER_SIZE,
		PLAYER_SIZE
	);
}

function renderRays() {
	// Renders ray
	for (let col = 0; col < SCREEN_WIDTH; col += COL_WIDTH) {
		const ray_angle = player.angle + player.fov * 
			(2 * col / SCREEN_WIDTH - 1);
		let map_x = Math.floor(player.pos_x), map_y = Math.floor(player.pos_y);

		// delta_x refers to how far along the ray we have to move
		// to increment cell horizontally
		const delta_x = Math.abs(1 / Math.cos(ray_angle));
		const delta_y = Math.abs(1 / Math.sin(ray_angle));

		// side_dist_x refers to how far along the ray we have to move
		// till the first vertical wall
		let step_x, step_y;
		let side_dist_x, side_dist_y;

		if (Math.cos(ray_angle) > 0) {
			step_x = -1;
			side_dist_x = (player.pos_x - Math.floor(player.pos_x)) * 
				delta_x;
		} else {
			step_x = 1;
			side_dist_x = (Math.floor(player.pos_x) + 1 - player.pos_x) * 
				delta_x;
		}

		if (Math.sin(ray_angle) > 0) {
			step_y = 1;
			side_dist_y = (Math.floor(player.pos_y) + 1 - player.pos_y) * 
				delta_y;
		} else {
			step_y = -1;
			side_dist_y = (player.pos_y - Math.floor(player.pos_y)) * 
				delta_y;
		}

		let side_reached;
		while (map[map_y][map_x] === 0 &&
			map_x >= 0 && map_y >= 0 && 
			map_x < map.length && map_y < map.length) {
			if (side_dist_x < side_dist_y) {
				map_x += step_x;
				side_dist_x += delta_x;
				side_reached = 'y';
			} else {
				map_y += step_y;
				side_dist_y += delta_y;
				side_reached = 'x';
			}
		}

		let ray_len;
		if (side_reached === 'y') {
			ray_len = side_dist_x - delta_x;
		} else {
			ray_len = side_dist_y - delta_y;
		}

		const ray_y = player.pos_y + Math.sin(ray_angle) * ray_len;
		const ray_x = player.pos_x - Math.cos(ray_angle) * ray_len;

		context.beginPath();
		context.strokeStyle = "blue";
		context.moveTo(player.pos_x * CELL_SIZE, player.pos_y * CELL_SIZE);
		context.lineTo(ray_x * CELL_SIZE, ray_y * CELL_SIZE);
		context.stroke();

		const perp_dist = ray_len * Math.cos(ray_angle - player.angle);
		const col_height = SCREEN_HEIGHT / (perp_dist + 1);
		context.fillStyle = "purple";
		context.fillRect(col, (SCREEN_HEIGHT - col_height) / 2, COL_WIDTH, col_height);
	}  
}


function getFPS() {
	cycleCount++;
	if (cycleCount >= 60) cycleCount = 0;
	let startTime = Date.now();
	let cycleTime = startTime - oldCycleTime;
	oldCycleTime = startTime;
	if (cycleCount % 60 == 0) fpsRate = Math.floor(1000 / cycleTime);

	context.fillStyle = "green";
	context.font = "20px Courier";
	context.fillText(
		"FPS: " + fpsRate + " Angle: " + radianToDegree(player.angle),
		SCREEN_WIDTH / 2,
		SCREEN_HEIGHT / 4
	);
}

function radianToDegree(angle) {
	return Math.floor((angle * 360) / (Math.PI * 2)) + "°";
}

function gameLoop() {
	clearScreen();
	updatePlayer();
	renderRays();
	renderMinimap();
	getFPS();
}

setInterval(gameLoop, 0);
document.addEventListener("keydown", (e) => {
	switch (e.key) {
		case "w":
			player.move_y = -0.01;
			break;
		case "s":
			player.move_y = 0.01;
			break;
		case "ArrowLeft":
			player.rotate = -0.005;
			break;
		case "ArrowRight":
			player.rotate = 0.005;
			break;
	}
});

document.addEventListener("keyup", (e) => {
	switch (e.key) {
		case "w":
			player.move_y = 0;
			break;
		case "s":
			player.move_y = 0;
			break;
		case "a":
			player.move_x = 0;
			break;
		case "d":
			player.move_x = 0;
			break;
		case "ArrowLeft":
			player.rotate = 0;
			break;
		case "ArrowRight":
			player.rotate = 0;
			break;
	}
})

