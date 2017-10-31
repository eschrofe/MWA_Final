var game = new Phaser.Game(1280, 720, Phaser.AUTO, '', {
  preload: preload,
  create: create,
  update: update
  }, false, false);

var aKey, dKey, sKey, wKey, leftKey, rightKey, upKey, downKey, zKey, delKey, spaceKey,
    weapon, tankSmoke, tank, gun, gunSmoke, explosion, map, layer,
    scoreText, livesText, turnText, angleText,
    turnTime = 0, turnTimer,
    lives = 3, score = 0, 
    currentPlayer = 2, //to make one loop through player creation then set to player one
    playerOneLives = 3,  //user input in future
    playerOneAngle = 0,
    playerOneScore = 0,
    playerTwoLives = 3, //user input in future
    playerTwoAngle = 0,
    playerTwoScore = 0,
    playerOneControlsMenu, playerTwoControlsMenu,
    levelSelect,
    shotDelay = 500,
    tankHit = false,
    tileMapName = 'dirt',
    differentLevel = false;

function preload() {
  levelSelect();

  game.load.image('background', 'assets/background.png');
  game.load.image('cannon', 'assets/gun.png');
  game.load.image('bullet', 'assets/bullet.png');
  game.load.image('groundTile', 'assets/groundTile.png');
  game.load.spritesheet('tankbody', 'assets/tankBody.png', 21, 11);
  game.load.spritesheet('explosion', 'assets/explosion.png', 40, 40);
  game.load.spritesheet('tankSmoke', 'assets/smoke.png', 20, 30);
  game.load.spritesheet('gunsmoke', 'assets/gunsmoke.png', 37, 20);
}

function levelSelect() {

  var levelNumber = Math.floor(Math.random() * (8 - 1 + 1)) + 1;
  var levelName;

  switch (levelNumber) {
    case 1:
      levelName = 'level1';
      break;
    case 2:
      levelName = 'twoTowers';
      break;
    case 3:
      levelName = 'level3';
      break;
    case 4:
      levelName = 'level4';
      break;
    case 5:
      levelName = 'level5';
      break;
    case 6:
      levelName = 'level6';
      break;
    case 7:
      levelName = 'level7';
      break;
    case 8:
      levelName = 'level8';
      break;
    default:
      levelName = 'ground';
  }

  game.load.tilemap(tileMapName, 'assets/' + levelName + '.json', null, Phaser.Tilemap.TILED_JSON);

}

function create() {

  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.clearBeforeRender = false;

  game.add.sprite(0, 0, 'background');

  //foreground

  map = game.add.tilemap(tileMapName);
  map.addTilesetImage('groundTile', 'groundTile');
  map.setCollisionByExclusion([0], true, 'ground');
  layer = map.createLayer('ground');
  layer.resizeWorld();
  
  //countdown timer for turns

  turnTimer = game.time.create(false);

  //hit explosion

  explosion = game.add.sprite( 100, 100, 'explosion');
  explosion.animations.add('explosion', '', 10, true);
  explosion.kill();

  //bullet smoke

  gunSmoke = game.add.sprite(100, 100, 'gunsmoke');
  gunSmoke.animations.add('playerOneGunSmoke', [0, 1, 2, 3, 4], 10);
  gunSmoke.animations.add('playerTwoGunSmoke', [9, 8, 7, 6, 5], 10);
  gunSmoke.kill();

  //tank smoke

  tankSmoke = game.add.sprite(100, 100, 'tankSmoke');
  tankSmoke.animations.add('tankSmoke', [0, 1, 2, 3, 4], 5, true);

  //gun bullet

  weapon = game.add.weapon('1', 'bullet');

  //player setup

  playerOneCreate();
  playerTwoCreate();

  // Scoreboard Text

  playerText = game.add.text(game.width / 2, 10, 'Current Player: ' + currentPlayer, {
    fontSize: '24px',
    fill: '#000'
  });
    turnText = game.add.text(game.width / 2, 40, 'Time Left: ' + turnTime, {
    fontSize: '24px',
    fill: '#000'
  });
  playerOneLivesText = game.add.text(10, 10, 'Lives: ' + playerOneLives, {
    fontSize: '24px',
    fill: '#000'
  });

  playerOneAngleText = game.add.text(10, 40, 'Angle: ' + playerOneAngle, {
    fontSize: '24px',
    fill: '#000'
  });
  playerOneScoreText = game.add.text(10, 70, 'Score: ' + playerOneScore, {
    fontSize: '24px',
    fill: '#000'
  });
  playerTwoLivesText = game.add.text(game.width - 120, 10, 'Lives: ' + playerTwoLives, {
    fontSize: '24px',
    fill: '#000'
  });
  playerTwoAngleText = game.add.text(game.width - 120, 40, 'Angle: ' + playerTwoAngle, {
    fontSize: '24px',
    fill: '#000'
  });
  playerTwoScoreText = game.add.text(game.width - 120, 70, 'Score: ' + playerTwoScore, {
    fontSize: '24px',
    fill: '#000'
  });

  //center menu

  mainMenu = game.add.graphics();
  mainMenu.beginFill(0x000000);
  mainMenu.drawRect(game.width / 4, game.height / 4, game.width / 2, game.height / 2);
  mainMenu.alpha = 0.9;
  mainMenu.endFill();
  
  var mainMenuText = game.add.text(game.width / 2, game.height / 2.5, 'Tank Wars', {
    fontSize: '48px',
    fill: '#fff'
  });
  var mainMenuStartText = game.add.text(game.width / 2, (game.height / 4) * 2.5, 'Press space or touch to begin', {
    fontSize: '36px',
    fill: '#fff'
  });

  mainMenu.addChild(mainMenuText);
  mainMenu.addChild(mainMenuStartText);

  mainMenuText.anchor.set(0.5, 0.5);
  mainMenuStartText.anchor.set(0.5, 0.5);

  //Control menus

  var playerOneControls = ['w', 'up', 'a', 'down', 's', 'left', 'd', 'right', 'z', 'fire'];
  var playerTwoControls = ['up', 'up', 'down', 'down', 'left', 'left', 'right', 'right', 'delete', 'fire'];

  playerOneControlsMenu = controls(game.width / 12.8, playerOneControls, -30);
  playerTwoControlsMenu = controls((game.width / 12.8) * 10.2, playerTwoControls, 0);

  //if new level, not new game

  if (differentLevel) {
    mainMenu.revive();
    playerOneControlsMenu.revive();
    playerTwoControlsMenu.revive();

    mainMenuText.visible = false;

    mainMenuStartText.position.set(game.width / 2, game.height / 2);

  }

  changePlayer();  //player setup

  game.paused = true;

  //for changing players early, possible conflict with timer
  //escKey = game.input.keyboard.addKey(Phaser.Keyboard.ESC);
  //escKey.onDown.add(changePlayer, this);

  //start game

  spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  spaceKey.onDown.add(gameBegin, this);

  game.input.onTap.addOnce(gameBegin, this);
}

//setup both control menus

function controls(boxX, controlsArray, textSpacing) {

  var controlsMenu = game.add.graphics();
  controlsMenu.beginFill(0x000000);
  controlsMenu.drawRect(boxX, game.height / 4, (game.width / 8) + (game.width / 32), game.height / 3);
  controlsMenu.alpha = 0.9;
  controlsMenu.endFill();
  controlsMenu.anchor.set(0.5, 0.5);

  controlsArray.forEach(function (control, index) {
    var controlsText;
    
    var controlsMod = index % 2;
    
    if(!controlsMod) {
      controlsText = game.add.text(boxX + (game.width / 60), (game.height / 4) + (index * 25), controlsArray[index] + ':', {
        fontSize: '24px',
        fill: '#fff'
      });
      
    } else {
      controlsText = game.add.text(boxX + (game.width / 10) + textSpacing, (game.height / 4) + ((index - 1) * 25), controlsArray[index], {
        fontSize: '24px',
        fill: '#fff'
      });
      
    }
    controlsMenu.addChild(controlsText);
   
  });
  return controlsMenu;

}

//setup various values at player change

function changePlayer() {
  tankSmoke.visible = false;

  turnTimer.removeAll();
  shotDelay = 500;

  if (!tankHit) {
    explosion.kill();
  }
  tankHit = false;

  //reset drag if enabled, so player can move freely
  playerTwoTank.body.drag.set(0);
  playerOneTank.body.drag.set(0);
  moveStop();

  //disable keyboard keys of previous player, and enable keys of current player
  switch (currentPlayer) {
    case 1: currentPlayer = 2;
      aKey.enabled = false;
      dKey.enabled = false;
      wKey.enabled = false;
      sKey.enabled = false;
      zKey.enabled = false;
      leftKey.enabled = true;
      rightKey.enabled = true;
      upKey.enabled = true;
      downKey.enabled = true;
      delKey.enabled = true;
      playerOneScore = score;
      playerTwoLives = lives;
      if (!lives) {
        tankSmoke.visible = true;
        tankSmoke.animations.play('tankSmoke');
      }
      score = playerTwoScore;
      lives = playerOneLives;
      scoreText = playerTwoScoreText;
      livesText = playerOneLivesText;
      
      break;

    case 2: currentPlayer = 1;
      aKey.enabled = true;
      dKey.enabled = true;
      wKey.enabled = true;
      sKey.enabled = true;
      zKey.enabled = true;
      leftKey.enabled = false;
      rightKey.enabled = false;
      upKey.enabled = false;
      downKey.enabled = false;
      delKey.enabled = false;
      playerTwoScore = score;
      playerOneLives = lives;
      if (!lives) {
        tankSmoke.visible = true;
        tankSmoke.animations.play('tankSmoke');
      }
      score = playerOneScore;
      lives = playerTwoLives;
      scoreText = playerOneScoreText;
      livesText = playerTwoLivesText;
      break;
    default:
      currentPlayer = 1;
      break;
  }


  if (!lives) {
    killPlayer();
  }

  //gives player atleast 20 seconds for their turn
  turnTimer.add(20000, outOfTime, this);

  turnTimer.start();
  playerText.text = 'Current Player: ' + currentPlayer;

  movementSetup();

}

function playerOneCreate() {

  playerOneTank = game.add.sprite(Math.random() * ((game.width / 2) - 50) + 50, 0, 'tankbody');
  game.physics.arcade.enable(playerOneTank);
  playerOneTank.animations.add('right', [0, 1, 2, 3], 20, true);
  playerOneTank.animations.add('left', [4, 5, 6, 7], 20, true);
  playerOneTank.body.gravity.y = 500;
  playerOneTank.body.bounce.setTo(0, 0.4);
  playerOneTank.body.collideWorldBounds = true;

  playerOneTankGun = game.add.sprite(0, 0, 'cannon');

  //movement keys

  aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
  dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
  aKey.onDown.add(moveLeft, this);
  dKey.onDown.add(moveRight, this);
  aKey.onUp.add(moveStop, this);
  dKey.onUp.add(moveStop, this);

  //cannon movement keys

  wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
  sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
  wKey.onDown.add(gunUpAngle, this);
  sKey.onDown.add(gunDownAngle, this);

  //cannon fire key

  zKey = game.input.keyboard.addKey(Phaser.Keyboard.Z);
  zKey.onDown.add(gunFire, weapon);

  return playerOneTank;

}

function playerTwoCreate() {

  playerTwoTank = game.add.sprite(Math.random() * ((game.width - 50) - (game.width / 2)) + (game.width / 2), 0, 'tankbody');
  game.physics.arcade.enable(playerTwoTank);
  playerTwoTank.animations.add('right', [0, 1, 2, 3], 20, true);
  playerTwoTank.animations.add('left', [4, 5, 6, 7], 20, true);
  playerTwoTank.body.gravity.y = 500;
  playerTwoTank.body.bounce.setTo(0, 0.4);
  playerTwoTank.body.collideWorldBounds = true;

  playerTwoTankGun = game.add.sprite(0, 0, 'cannon');
  playerTwoTankGun.angle += -180;

  //movement keys

  leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
  rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
  leftKey.onDown.add(moveLeft, this);
  rightKey.onDown.add(moveRight, this);
  leftKey.onUp.add(moveStop, this);
  rightKey.onUp.add(moveStop, this);

  //cannon movement keys

  upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
  downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
  upKey.onDown.add(gunDownAngle, this);  //down is up because gun
  downKey.onDown.add(gunUpAngle, this);  //is facing other direction

  //cannon fire key

  delKey = game.input.keyboard.addKey(Phaser.Keyboard.DELETE);
  delKey.onDown.add(gunFire, weapon);

  return playerTwoTank;

}

function gameBegin() {

  mainMenu.kill();
  playerOneControlsMenu.kill();
  playerTwoControlsMenu.kill();
  game.input.keyboard.removeKey(Phaser.Keyboard.SPACEBAR);
  game.input.onTap.add(gunFire, this);  //currently tapping after game start only fires gun.
  game.paused = false;

}

function update() {

  //pause turn timer, when shot is made
  if (turnTimer.paused) {
    shotDelay -= 1;
  }

  //resume timer after short delay, and kill bullet(s) if speed becomes slow
  if (!shotDelay) {
    turnTimer.resume();
    weapon.bullets.forEach(function (bullet) {
      if (bullet.body.speed < 0.5) {
        weapon.killAll();
      }
    });
  }

  if (!turnTimer.paused) {
    turnTime = (turnTimer.next - game.time.time) / 1000;

    turnText.text = 'Time Left: ' + turnTime.toFixed(0);
  }

  //align gun with tank while each update/frame
    playerOneTankGun.alignTo(playerOneTank, Phaser.RIGHT_CENTER, -5, -4);
    playerTwoTankGun.alignTo(playerTwoTank, Phaser.RIGHT_CENTER, -16, -2);

  //collision
  game.physics.arcade.collide(playerOneTank, playerTwoTank, tankTouchFriction);
  game.physics.arcade.collide(playerOneTank, layer);
  game.physics.arcade.collide(playerTwoTank, layer);
  game.physics.arcade.collide(weapon.bullets, layer);

  //bullet collision

  game.physics.arcade.overlap(playerOneTank, weapon.bullets, bulletHitSuccess, null, this);
  game.physics.arcade.overlap(playerTwoTank, weapon.bullets, bulletHitSuccess, null, this);
  
  tankSmoke.alignTo(tank);

  weapon.onKill.add(onBulletKill, this);

}

function outOfTime() {


  if (weapon.bullets.total) {
    weapon.killAll();
  } else {
    changePlayer();
  }

}

//tank movement 

function tankTouchFriction(playerOneTank, playerTwoTank) {
  if (currentPlayer == 1) {
    playerTwoTank.body.drag.set(5, '');
  } else {
    playerOneTank.body.drag.set(5, '');
  }
}

function movementSetup() {

  if (currentPlayer == 1) {
    tank = playerOneTank;
    gun = playerOneTankGun;
    angleText = playerOneAngleText;
    gunSmoke.anchor.x = 0;
    gunSmoke.anchor.y = 1;
    gunSmoke.alignTo(gun, Phaser.CENTER);
  }
  if (currentPlayer == 2) {
    tank = playerTwoTank;
    gun = playerTwoTankGun;
    angleText = playerTwoAngleText;
    gunSmoke.anchor.x = 1;
    gunSmoke.anchor.y = 1;
    gunSmoke.alignTo(gun, Phaser.LEFT_CENTER, '', -10);
  }
  weapon.trackSprite(gun, 10, 0, true);

}

function moveLeft() {

  tank.body.velocity.x = - 50;
  tank.animations.play('left');
}

function moveRight() {

     tank.body.velocity.x = 50;
     tank.animations.play('right');

}

function moveStop() {

  movementSetup();
  tank.body.velocity.x = 0;
  tank.animations.stop('left');
  tank.animations.stop('right');
}

//gun movement

function gunUpAngle() {

  if ((gun.angle > -90 && currentPlayer == 1) || (gun.angle > -180 && currentPlayer == 2)) {
    gun.angle = Math.round(gun.angle) - 1;

    if (currentPlayer == 1) {  //needed so not treated as a bool
      gunSmoke.angle = gun.angle;
    } else {
      gunSmoke.angle = gun.angle + 180;
    }

    if (currentPlayer == 1) {
      angleText.text = 'Angle: ' + (Math.round(gun.angle * -1).toFixed(0));
    } else {
      angleText.text = 'Angle: ' + (gun.angle + 180).toFixed(0);
    }  
  }

}

function gunDownAngle() {

  if ((gun.angle < 0 && currentPlayer == 1) || (gun.angle < -90 && currentPlayer == 2)) {
    gun.angle += 1;

    if (currentPlayer == 1) {
      gunSmoke.angle = gun.angle;
    } else {
      gunSmoke.angle = gun.angle + 180;
    }

    if (currentPlayer == 1) {
      angleText.text = 'Angle: ' + (Math.round(gun.angle * -1).toFixed(0));
    } else {
      angleText.text = 'Angle: ' + (gun.angle + 180).toFixed(0);
    }
  }

}

function gunFire() {

  weapon.fireAngle = gun.angle;
  weapon.bulletGravity.y = 32;  //min 32  //max 100 //total 'power' 68
  weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
  weapon.bulletKillDistance = 1500;
     
  weapon.fire();
  weapon.bullets.setAll('body.bounce.x', 0.25);
  weapon.bullets.setAll('body.bounce.y', 0.25);
  weapon.bullets.setAll('body.drag.x', 2);

  weapon.onFire.add(onBulletFire);
  
}

function onBulletFire() {  //animation can only play when a bullet is fired
  gunSmoke.revive();
  turnTimer.pause();

  if (currentPlayer == 1) {
    gunSmoke.animations.play('playerOneGunSmoke', null, false, true);
  } else {
    gunSmoke.animations.play('playerTwoGunSmoke', null, false, true);
  }

}

function onBulletKill() {

  turnTimer.resume();
  changePlayer();
}

function bulletHitSuccess(hitTank) {
  tankHit = true;
  weapon.pauseAll();
     
  explosion.revive();
  explosion.alignTo(weapon.bullets, Phaser.RIGHT_CENTER, -16, -2);
  explosion.animations.play('explosion');
  if (tank != hitTank) {
    updateLives();
    updateScore();
  }
  weapon.killAll();
}

function updateScore() {

  score += 1;
  scoreText.text = "Score: " + score;

}

function updateLives() {

  lives -= 1;
  if (lives < 0) {
    lives = 0;

    killPlayer();

  }
  livesText.text = "Lives: " + lives;


}

function killPlayer() {

  tank.kill();
  gun.kill();

  gameOver();

}

function gameOver() {

  turnTimer.stop();
  game.paused = true;

  gameOverMenu = game.add.graphics();
  gameOverMenu.beginFill(0x000000);
  gameOverMenu.drawRect(game.width / 4, game.height / 4, game.width / 2, game.height / 2);
  gameOverMenu.alpha = 0.9;
  gameOverMenu.endFill();

  var playerWinText;
  
  if (playerOneLives == playerTwoLives) {

    playerWinText = game.add.text(game.width / 2, game.height / 2.5, 'DRAW', {
      fontSize: '64px',
      fill: '#fff'
    });
  } else {
    playerWinText = game.add.text(game.width / 2, game.height / 2.5, 'Player ' + currentPlayer + ' Wins!', {
      fontSize: '48px',
      fill: '#fff'
    });
  }
  
  var menuContinueText = game.add.text(game.width / 2, (game.height / 4) * 2.5, 'Press space or touch to continue', {
      fontSize: '36px',
      fill: '#fff'
    });
  
  playerWinText.anchor.set(0.5, 0.5);
  menuContinueText.anchor.set(0.5, 0.5);

  spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  spaceKey.onDown.add(newLevel, this);

  game.input.onTap.addOnce(newLevel, this);

}

function newLevel() {

  game.input.keyboard.removeKey(Phaser.Keyboard.SPACEBAR);
  gameOverMenu.kill();
  game.cache.destroy();
  playerOneLives = 3;
  playerTwoLives = 3;
  lives = 3;
  differentLevel = true;
  levelSelect();
  preload();
  game.load.start();
  game.load.onFileError.add(function () { console.log("file load error!") });
  game.load.onLoadComplete.add(newTileMapLoaded);
  
}

function newTileMapLoaded() {

  game.paused = false;
  create();

}