var game = new Phaser.Game(480, 320, Phaser.AUTO, null, {preload: preload, create: create, update: update}); // 创建一个新的Phaser游戏实例

var ball; // 球对象
var paddle; // 挡板对象
var bricks; // 砖块组
var newBrick; // 新砖块对象
var brickInfo; // 砖块信息
var scoreText; // 分数文本
var score = 0; // 初始分数
var lives = 3; // 初始生命数
var livesText; // 生命数文本
var lifeLostText; // 生命丢失文本
var playing = false; // 游戏是否正在进行
var startButton; // 开始按钮

// 预加载游戏资源
function preload() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; // 设置缩放模式
    game.scale.pageAlignHorizontally = true; // 水平居中
    game.scale.pageAlignVertically = true; // 垂直居中
    game.stage.backgroundColor = '#eee'; // 设置背景颜色
    game.load.image('paddle', 'paddle.png'); // 加载挡板图片
    game.load.image('brick', 'brick.png'); // 加载砖块图片
    game.load.spritesheet('ball', 'wobble.png', 20, 20); // 加载球的精灵表
    game.load.spritesheet('button', 'button.png', 120, 40); // 加载按钮的精灵表
}

// 创建游戏场景
function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE); // 启动物理系统
    game.physics.arcade.checkCollision.down = false; // 禁止下边界碰撞

    // 创建球
    ball = game.add.sprite(game.world.width*0.5, game.world.height-25, 'ball'); // 在屏幕底部中央创建球
    ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24); // 添加球的动画
    ball.anchor.set(0.5); // 设置球的锚点
    game.physics.enable(ball, Phaser.Physics.ARCADE); // 启用球的物理属性
    ball.body.collideWorldBounds = true; // 使球与世界边界碰撞
    ball.body.bounce.set(1); // 设置球的弹性
    ball.checkWorldBounds = true; // 检查球是否离开世界边界
    ball.events.onOutOfBounds.add(ballLeaveScreen, this); // 当球离开屏幕时调用ballLeaveScreen函数

    // 创建挡板
    paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle'); // 在屏幕底部中央创建挡板
    paddle.anchor.set(0.5,1); // 设置挡板的锚点
    game.physics.enable(paddle, Phaser.Physics.ARCADE); // 启用挡板的物理属性
    paddle.body.immovable = true; // 使挡板不可移动

    // 初始化砖块
    initBricks(); // 调用initBricks函数初始化砖块

    // 创建文本
    textStyle = { font: '18px Arial', fill: '#0095DD' }; // 定义文本样式
    scoreText = game.add.text(5, 5, 'Points: 0', textStyle); // 创建分数文本
    livesText = game.add.text(game.world.width-5, 5, 'Lives: '+lives, textStyle); // 创建生命数文本
    livesText.anchor.set(1,0); // 设置生命数文本的锚点
    lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, 'Life lost, tap to continue', textStyle); // 创建生命丢失文本
    lifeLostText.anchor.set(0.5); // 设置生命丢失文本的锚点
    lifeLostText.visible = false; // 初始时隐藏生命丢失文本

    // 创建开始按钮
    startButton = game.add.button(game.world.width*0.5, game.world.height*0.5, 'button', startGame, this, 1, 0, 2); // 创建开始按钮
    startButton.anchor.set(0.5); // 设置开始按钮的锚点
}

// 更新游戏状态
function update() {
    game.physics.arcade.collide(ball, paddle, ballHitPaddle); // 检测球与挡板的碰撞
    game.physics.arcade.collide(ball, bricks, ballHitBrick); // 检测球与砖块的碰撞
    if(playing) { // 如果游戏正在进行
        paddle.x = game.input.x || game.world.width*0.5; // 挡板跟随鼠标移动
    }
}

// 初始化砖块
function initBricks() {
    brickInfo = { // 定义砖块信息
        width: 50, // 砖块宽度
        height: 20, // 砖块高度
        count: { // 砖块数量
            row: 7, // 行数
            col: 3 // 列数
        },
        offset: { // 砖块偏移量
            top: 50, // 顶部偏移
            left: 60 // 左侧偏移
        },
        padding: 10 // 砖块间距
    }
    bricks = game.add.group(); // 创建砖块组
    for(c=0; c<brickInfo.count.col; c++) { // 遍历列数
        for(r=0; r<brickInfo.count.row; r++) { // 遍历行数
            var brickX = (r*(brickInfo.width+brickInfo.padding))+brickInfo.offset.left; // 计算砖块的X坐标
            var brickY = (c*(brickInfo.height+brickInfo.padding))+brickInfo.offset.top; // 计算砖块的Y坐标
            newBrick = game.add.sprite(brickX, brickY, 'brick'); // 创建新砖块
            game.physics.enable(newBrick, Phaser.Physics.ARCADE); // 启用砖块的物理属性
            newBrick.body.immovable = true; // 使砖块不可移动
            newBrick.anchor.set(0.5); // 设置砖块的锚点
            bricks.add(newBrick); // 将砖块添加到砖块组
        }
    }
}

// 球碰到砖块时的处理
function ballHitBrick(ball, brick) {
    var killTween = game.add.tween(brick.scale); // 创建砖块缩放动画
    killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None); // 设置动画目标和持续时间
    killTween.onComplete.addOnce(function(){ // 动画完成时的回调函数
        brick.kill(); // 销毁砖块
    }, this);
    killTween.start(); // 开始动画
    score += 10; // 增加分数
    scoreText.setText('Points: '+score); // 更新分数文本
    if(score === brickInfo.count.row*brickInfo.count.col*10) { // 如果所有砖块都被击中
        alert('You won the game, congratulations!'); // 弹出胜利提示
        location.reload(); // 重新加载页面
    }
}

// 球离开屏幕时的处理
function ballLeaveScreen() {
    lives--; // 减少生命数
    if(lives) { // 如果还有生命
        livesText.setText('Lives: '+lives); // 更新生命数文本
        lifeLostText.visible = true; // 显示生命丢失文本
        ball.reset(game.world.width*0.5, game.world.height-25); // 重置球的位置
        paddle.reset(game.world.width*0.5, game.world.height-5); // 重置挡板的位置
        game.input.onDown.addOnce(function(){ // 点击屏幕继续游戏
            lifeLostText.visible = false; // 隐藏生命丢失文本
            ball.body.velocity.set(150, -150); // 设置球的速度
        }, this);
    }
    else { // 如果没有生命
        alert('You lost, game over!'); // 弹出游戏结束提示
        location.reload(); // 重新加载页面
    }
}

// 球碰到挡板时的处理
function ballHitPaddle(ball, paddle) {
    ball.animations.play('wobble'); // 播放球的动画
    ball.body.velocity.x = -1*5*(paddle.x-ball.x); // 根据挡板位置调整球的水平速度
}

// 开始游戏
function startGame() {
    startButton.destroy(); // 销毁开始按钮
    ball.body.velocity.set(150, -150); // 设置球的初始速度
    playing = true; // 设置游戏状态为进行中
}