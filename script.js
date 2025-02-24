const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const nextBlocksDiv = document.getElementById('next-blocks');

const gridSize = 40;
const cols = canvas.width / gridSize;
const rows = canvas.height / gridSize;
let score = 0;

const blockColors = [
    '#FF073A', // Яркий красный
    '#00FF7F', // Яркий зелёный
    '#1E90FF', // Яркий синий
    '#FFD700', // Яркий жёлтый
    '#FF4500', // Яркий оранжевый
    '#9400D3'  // Яркий фиолетовый
];

const blockShapes = [
    [[1, 1], [1, 1]],                  // Квадрат 2x2
    [[1, 1, 1]],                      // Линия 3x1
    [[1], [1], [1]],                  // Линия 1x3
    [[1, 1], [0, 1]],                 // L-образная 2x2
    [[1, 0], [1, 1]],                 // Обратная L 2x2
    [[1, 1, 1], [0, 1, 0]],           // T-образная 3x2
    [[1, 1, 1], [1, 1, 1], [1, 1, 1]] // Квадрат 3x3
];

let grid = Array(rows).fill().map(() => Array(cols).fill(0));
let nextBlocks = generateNextBlocks();
let selectedBlock = null;
let offsetX, offsetY;
let animations = [];
let mouseX = 0, mouseY = 0;

function generateNextBlocks() {
    return Array(3).fill().map(() => {
        const shapeIndex = Math.floor(Math.random() * blockShapes.length);
        return {
            shape: blockShapes[shapeIndex],
            color: blockColors[shapeIndex % blockColors.length]
        };
    });
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[row][col]) {
                ctx.fillStyle = grid[row][col];
                ctx.fillRect(col * gridSize, row * gridSize, gridSize - 1, gridSize - 1);
            }
        }
    }
    animations = animations.filter(anim => anim.alpha > 0);
    animations.forEach(anim => {
        ctx.fillStyle = `rgba(${anim.color.slice(1, -1).split(',').map(Number)}, ${anim.alpha})`;
        ctx.fillRect(anim.x * gridSize, anim.y * gridSize, gridSize - 1, gridSize - 1);
        anim.alpha -= 0.05;
    });
    if (animations.length === 0) {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!grid[row][col]) {
                    ctx.clearRect(col * gridSize, row * gridSize, gridSize, gridSize);
                }
            }
        }
    }
}

function drawSelectedBlock() {
    if (selectedBlock) {
        ctx.fillStyle = selectedBlock.color;
        const gridX = Math.floor((mouseX - offsetX) / gridSize);
        const gridY = Math.floor((mouseY - offsetY) / gridSize);
        for (let row = 0; row < selectedBlock.shape.length; row++) {
            for (let col = 0; col < selectedBlock.shape[row].length; col++) {
                if (selectedBlock.shape[row][col]) {
                    ctx.fillRect(
                        (gridX + col) * gridSize,
                        (gridY + row) * gridSize,
                        gridSize - 1,
                        gridSize - 1
                    );
                }
            }
        }
    }
}

function drawNextBlocks() {
    nextBlocksDiv.innerHTML = 'Следующие блоки:<br>';
    nextBlocks.forEach((block, index) => {
        const blockCanvas = document.createElement('canvas');
        blockCanvas.width = block.shape[0].length * gridSize;
        blockCanvas.height = block.shape.length * gridSize;
        blockCanvas.style.margin = '5px';
        blockCanvas.dataset.index = index;
        const blockCtx = blockCanvas.getContext('2d');
        blockCtx.fillStyle = block.color;
        for (let row = 0; row < block.shape.length; row++) {
            for (let col = 0; col < block.shape[row].length; col++) {
                if (block.shape[row][col]) {
                    blockCtx.fillRect(col * gridSize, row * gridSize, gridSize - 1, gridSize - 1);
                }
            }
        }
        nextBlocksDiv.appendChild(blockCanvas);
    });
}

function canPlaceBlock(block, gridX, gridY) {
    for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
            if (block.shape[row][col]) {
                let newY = gridY + row;
                let newX = gridX + col;
                if (newY >= rows || newX >= cols || newX < 0 || grid[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeBlock(block, gridX, gridY) {
    for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
            if (block.shape[row][col]) {
                grid[gridY + row][gridX + col] = block.color;
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    let clearedCells = [];

    for (let row = rows - 1; row >= 0; row--) {
        if (grid[row].every(cell => cell !== 0)) {
            for (let col = 0; col < cols; col++) {
                clearedCells.push({ x: col, y: row, color: grid[row][col] });
            }
            grid.splice(row, 1);
            grid.unshift(Array(cols).fill(0));
            linesCleared++;
        }
    }

    for (let col = 0; col < cols; col++) {
        if (grid.every(row => row[col] !== 0)) {
            for (let row = 0; row < rows; row++) {
                clearedCells.push({ x: col, y: row, color: grid[row][col] });
                grid[row][col] = 0;
            }
            for (let row = 0; row < rows; row++) {
                grid[row].splice(col, 1);
                grid[row].unshift(0);
            }
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 10;
        scoreDisplay.textContent = `Очки: ${score}`;
        clearedCells.forEach(cell => {
            animations.push({ x: cell.x, y: cell.y, color: cell.color, alpha: 1 });
        });
    }
}

function checkGameOver() {
    return nextBlocks.every(block => {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (canPlaceBlock(block, col, row)) {
                    return false;
                }
            }
        }
        return true;
    });
}

function update() {
    drawGrid();
    drawSelectedBlock();
    requestAnimationFrame(update);
}

canvas.addEventListener('mousemove', (e) => {
    if (selectedBlock) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
});

canvas.addEventListener('click', (e) => {
    if (selectedBlock) {
        const rect = canvas.getBoundingClientRect();
        const gridX = Math.floor((mouseX - offsetX) / gridSize);
        const gridY = Math.floor((mouseY - offsetY) / gridSize);
        if (canPlaceBlock(selectedBlock, gridX, gridY)) {
            placeBlock(selectedBlock, gridX, gridY);
            clearLines();
            nextBlocks.splice(selectedBlock.index, 1);
            if (nextBlocks.length === 0) {
                nextBlocks = generateNextBlocks();
            }
            selectedBlock = null;
            drawNextBlocks();
            if (checkGameOver()) {
                alert('Игра окончена! Очки: ' + score);
                grid = Array(rows).fill().map(() => Array(cols).fill(0));
                score = 0;
                scoreDisplay.textContent = `Очки: ${score}`;
                nextBlocks = generateNextBlocks();
                drawNextBlocks();
            }
        }
    }
});

nextBlocksDiv.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'CANVAS') {
        const index = parseInt(target.dataset.index);
        selectedBlock = { ...nextBlocks[index], index };
        const rect = target.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    }
});

drawGrid();
drawNextBlocks();
update();