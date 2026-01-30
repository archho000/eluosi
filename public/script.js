const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');

context.scale(20, 20);

// Tetromino definitions
const pieces = 'ILJOTSZ';
const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Game State
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

const arena = createMatrix(12, 20);

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameOver = false;
let isPaused = true;
let animationId = null;

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    const piecesStr = 'TJLOSZI';
    player.matrix = createPiece(piecesStr[piecesStr.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        isGameOver = true;
        isPaused = true;
        startBtn.disabled = false;
        startBtn.textContent = '游戏结束 - 重新开始';
        cancelAnimationFrame(animationId);
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function updateScore() {
    scoreElement.innerText = player.score;
}

function update(time = 0) {
    if (isPaused) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (isPaused) return;

    if (event.keyCode === 37) { // Left
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        playerMove(1);
    } else if (event.keyCode === 40) { // Down
        playerDrop();
    } else if (event.keyCode === 32) { // Space (Rotate)
        playerRotate(1);
        event.preventDefault(); // Prevent scrolling
    }
});

startBtn.addEventListener('click', () => {
    if (isGameOver) {
        // Reset game
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        isGameOver = false;
        playerReset();
    }
    
    if (player.matrix === null) {
        playerReset();
    }

    if (isPaused) {
        isPaused = false;
        startBtn.textContent = '暂停游戏';
        startBtn.blur(); // Remove focus so spacebar doesn't trigger button
        update();
    } else {
        isPaused = true;
        startBtn.textContent = '继续游戏';
        cancelAnimationFrame(animationId);
    }
});

// Mobile Controls
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnDown = document.getElementById('btn-down');
const btnRotate = document.getElementById('btn-rotate');

function addTouchListener(element, action) {
    if (!element) return;
    
    // Prevent default context menu on long press
    element.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    element.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default touch behavior
        if (isPaused) return;
        action();
    }, { passive: false });
    
    // Also support mouse click for testing on desktop with mobile view
    element.addEventListener('mousedown', (e) => {
        if (isPaused) return;
        action();
    });
}

addTouchListener(btnLeft, () => playerMove(-1));
addTouchListener(btnRight, () => playerMove(1));
addTouchListener(btnDown, () => playerDrop());
addTouchListener(btnRotate, () => playerRotate(1));
