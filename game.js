// 游戏配置
const config = {
    paddleWidth: 100,
    paddleHeight: 20,
    ballRadius: 10,
    brickRowCount: 5,
    brickColumnCount: 8,
    brickWidth: 80,
    brickHeight: 20,
    brickPadding: 10,
    brickOffsetTop: 50,
    brickOffsetLeft: 60,
    ballSpeed: 4,
    paddleSpeed: 8
};

// 游戏状态
let score = 0;
let lives = 3;
let gameRunning = true;

// 游戏对象
const paddle = {
    x: 0,
    y: 0,
    width: config.paddleWidth,
    height: config.paddleHeight,
    dx: 0
};

const ball = {
    x: 0,
    y: 0,
    radius: config.ballRadius,
    dx: 0,
    dy: 0
};

let bricks = [];

// DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverElement = document.querySelector('.game-over');
const finalScoreElement = document.getElementById('final-score');

// 游戏状态
let waitingForLaunch = false;

/**
 * 独立的碰撞检测纯函数
 * @param {Object} rect1 - 第一个矩形对象
 * @param {Object} rect2 - 第二个矩形对象
 * @returns {boolean} 是否发生碰撞
 */
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 初始化游戏
function init() {
    // 初始化球拍位置
    paddle.x = canvas.width / 2 - config.paddleWidth / 2;
    paddle.y = canvas.height - config.paddleHeight - 10;
    
    // 初始化球位置
    resetBall();
    
    // 初始化砖块
    initBricks();
    
    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 开始游戏循环
    gameLoop();
}

// 重置球的位置
function resetBall() {
    waitingForLaunch = true;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - config.ballRadius - 5;
    ball.dx = 0;
    ball.dy = 0;
}

// 初始化砖块
function initBricks() {
    bricks = [];
    for (let c = 0; c < config.brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < config.brickRowCount; r++) {
            const x = c * (config.brickWidth + config.brickPadding) + config.brickOffsetLeft;
            const y = r * (config.brickHeight + config.brickPadding) + config.brickOffsetTop;
            const color = `hsl(${r * 30}, 70%, 50%)`;
            bricks[c][r] = { x, y, status: 1, color };
        }
    }
}

// 键盘事件处理
function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
        paddle.dx = -config.paddleSpeed;
    } else if (e.key === 'ArrowRight') {
        paddle.dx = config.paddleSpeed;
    } else if (e.key === ' ' && waitingForLaunch) {
        // 空格键发射球
        waitingForLaunch = false;
        ball.dx = config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = -config.ballSpeed;
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        paddle.dx = 0;
    }
}

// 更新游戏对象
function update() {
    if (!gameRunning) return;
    
    // 更新球拍位置
    paddle.x += paddle.dx;
    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x + config.paddleWidth > canvas.width) {
        paddle.x = canvas.width - config.paddleWidth;
    }
    
    // 如果球在等待发射，跟随球拍移动
    if (waitingForLaunch) {
        ball.x = paddle.x + paddle.width / 2;
        return;
    }
    
    // 更新球位置
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // 球与墙壁碰撞
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    
    // 球掉出底部
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        livesElement.textContent = lives;
        
        if (lives > 0) {
            resetBall();
        } else {
            gameRunning = false;
            showGameOver();
        }
    }
    
    // 球与球拍碰撞
    if (checkCollision(
        { x: ball.x - ball.radius, y: ball.y - ball.radius, width: ball.radius * 2, height: ball.radius * 2 },
        { x: paddle.x, y: paddle.y, width: paddle.width, height: paddle.height }
    )) {
        ball.dy = -Math.abs(ball.dy);
        // 根据碰撞位置调整水平速度
        const hitPos = (ball.x - paddle.x) / paddle.width - 0.5;
        ball.dx = hitPos * config.ballSpeed * 2;
    }
    
    // 球与砖块碰撞
    for (let c = 0; c < config.brickColumnCount; c++) {
        for (let r = 0; r < config.brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                if (checkCollision(
                    { x: ball.x - ball.radius, y: ball.y - ball.radius, width: ball.radius * 2, height: ball.radius * 2 },
                    { x: brick.x, y: brick.y, width: config.brickWidth, height: config.brickHeight }
                )) {
                    ball.dy = -ball.dy;
                    brick.status = 0;
                    score += 10;
                    scoreElement.textContent = score;
                    
                    // 检查是否所有砖块都被清除
                    if (checkWin()) {
                        gameRunning = false;
                        alert('恭喜你获胜！得分: ' + score);
                    }
                }
            }
        }
    }
}

// 检查是否获胜
function checkWin() {
    for (let c = 0; c < config.brickColumnCount; c++) {
        for (let r = 0; r < config.brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// 显示游戏结束界面
function showGameOver() {
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// 重新开始游戏
function restartGame() {
    score = 0;
    lives = 3;
    gameRunning = true;
    waitingForLaunch = false;
    
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    gameOverElement.style.display = 'none';
    
    initBricks();
    resetBall();
}

// 渲染游戏
function render() {
    // 清空画布
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制得分和生命值（在画布上）
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 20, 30);
    ctx.fillText('Lives: ' + lives, canvas.width - 100, 30);
    
    // 绘制球拍
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // 绘制球
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.closePath();
    
    // 如果球在等待发射，显示提示
    if (waitingForLaunch) {
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('按空格键发射球', canvas.width / 2 - 80, canvas.height / 2);
    }
    
    // 绘制砖块
    for (let c = 0; c < config.brickColumnCount; c++) {
        for (let r = 0; r < config.brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, config.brickWidth, config.brickHeight);
            }
        }
    }
}

// 游戏循环
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 启动游戏
window.addEventListener('load', init);

// 全局函数，供HTML调用
window.restartGame = restartGame;