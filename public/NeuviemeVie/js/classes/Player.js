class Player {
  constructor(tableauTiles, screenWidth, screenHeight, spawnX, spawnY, animation) { // Constructeur
    this.position = { // Position du joueur
      x: spawnX,
      y: spawnY,
    }
    this.speedBoost = { // Position du joueur
      x: 0,
      y: 0,
    }
    this.camera = { // Position de la caméra
      width: screenWidth / 2.5,
      height: screenHeight / 2.5,
      position: {
        cx: this.position.x,
        cy: this.position.y,
        x: this.position.x - (screenWidth / 2),
        y: this.position.y - (screenHeight / 2),
      }
    }
    this.velocity = { // Vitesse horizontal et vertical du joueur
      x: 0,
      y: 0,
    }
    this.width = 12; // Largeur
    this.height = 22; // Hauteur

    this.gravity = 0.3; // Force de la gravité
    this.speed = 2; // Vitesse de marche
    this.jumpHeight = 5.2; // Hauteur de saut
    this.canJump = true; // Sur true si le joueur est au sol, false sinon => permet d'autoriser le saut ou non
    this.canDoubleJump = false;
    this.doubleJumpHeight = 7;

    this.preventInput = false; // Autoriser ou non les mouvements
    this.lastDirection = 'right'; // Enregistre la dernière direction à laquel fait face le joueur afin de gerer les animations
    this.lastDirection2 = 'right';
    this.isOnMovingPlatformX = false;
    this.isOnMovingPlatformY = false;

    this.currentLvl = "lvl0";

    this.keys = { // Touches en lien avec le joueur
      left: { pressed: false },
      right: { pressed: false },
      up: { pressed: false },
      dash: { pressed: false },
      slide: { pressed: false },
      interact: { pressed: false }
    }

    this.hitbox = { // Position et hauteur/largeur de la hitbox
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      width: this.width,
      height: this.height,
    }

    this.tabTiles = tableauTiles; // Tableau contenant toutes les Tiles de la map afin d'aider à la détection des collisions avec le joueur

    // ANIMATIONS
    //[spriteIdle, spriteIdleLeft, spriteDash, spriteJumpRight, spriteJumpLeft, spriteRunRight, spriteRunLeft]
    this.spriteIdle = animation[0];
    this.spriteIdleLeft = animation[1];
    this.spriteDash = animation[2];
    this.spriteJumpRight = animation[3];
    this.spriteJumpLeft = animation[4];
    this.spriteRunRight = animation[5];
    this.spriteRunLeft = animation[6];
    // Current Sprite
    this.currentSprite = this.spriteIdle[0];
    // Define the size of a frame
    this.frameWidth = 50;
    this.frameHeight = 37;
    // Rows and columns start from 0
    this.row = 0;
    this.column = 0;
    // The sprite image frame starts from 0
    this.currentFrame = 0;

    // DEBUG
    this.debug = {
      cameraRender: false,
      hitboxRender: false,
    }

    // POUVOIRS
    this.canJump2 = true;
    this.allowBunnyHop = false;
    this.allowDoubleJump = true;
    this.dashSpeed = 3;
    this.dashTime = 3000;
    this.canDash = true;
    this.canDash2 = true;
    this.lastDash = new Date(-3000);
    this.lastDash2 = new Date(+3000);
    this.slideTime = 3000;
    this.canSlide = true;
    this.canSlide2 = true;
    this.lastSlide = new Date(-3000);
    this.lastSlide2 = new Date(+3000);
    this.isSliding = false;
    this.hangRoof = true; // Permet de s'accrocher au plafond
  }

  updateHitbox() { // Hitbox pour les collisions du joueur
    this.hitbox = { // Position et hauteur/largeur de la hitbox
      sizeW: this.hitbox.sizeW,
      sizeH: this.hitbox.sizeH,
      position: {
        x: this.position.x + 2,
        y: this.position.y,
      },
      width: this.width,
      height: this.height + 2,
    }
  }

  renderHitbox(c) {
    c.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Couleur de la Hitbox
    c.fillRect( // Permet de dessiner la Hitbox sur le canvas (afin de visualiser la détection des collisions)
      this.hitbox.position.x,
      this.hitbox.position.y,
      this.hitbox.width,
      this.hitbox.height
    );
  }

  renderHitboxBig(c) {
    c.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Couleur de la Hitbox
    c.fillRect( // Permet de dessiner la Hitbox sur le canvas (afin de visualiser la détection des collisions)
      this.hitboxBig.position.x,
      this.hitboxBig.position.y,
      this.hitboxBig.width,
      this.hitboxBig.height
    );
  }

  applyGravity() { // Applique la gravité au joueur
    this.velocity.y += this.gravity;
    if (this.velocity.y > 10) {
      this.velocity.y = 10
    }
    this.position.y += this.velocity.y;
  }

  handleInput() { // Gère ce qu'il se passe lorsque les touches sont appuyés
    if (this.preventInput) { return } // Si on empèche l'utilisation des touches => alors on return rien afin de quitter la fonction

    if (!this.isOnMovingPlatformX) {
      this.velocity.x = 0; // On reset la velocité horizontal à 0
    }

    if (this.keys.right.pressed) { // Si la touche correspondant à la droite est enfoncée :
      this.velocity.x = this.speed; // On accélère vers la droite
      this.lastDirection = 'right'; // On enregistre la direction afin de gérer l'animation
      this.lastDirection2 = 'right';
    }
    else if (this.keys.left.pressed) {
      this.velocity.x = -this.speed;
      this.lastDirection = 'left';
      this.lastDirection2 = 'left';
    }
    else {
      if (this.lastDirection2 == 'left' && this.lastDirection == 'left') {
        this.lastDirection = 'idleLeft';
      }
      else if (this.lastDirection2 == 'right' && this.lastDirection == 'right') {
        this.lastDirection = 'idleRight';
      }
    }

    if (this.keys.up.pressed) {
      this.jump();
    }

    if (this.keys.dash.pressed) {
      this.dash();
    }

    if (this.keys.slide.pressed) {
      this.slide();
    }
  }

  jump() {
    if (this.velocity.y == 0 && this.canJump && (this.canJump2 || this.allowBunnyHop)) { // Vérifie que l'on est autorisé a sauter
      this.velocity.y = -this.jumpHeight;
      this.canJump = false;
      this.canJump2 = false;
      this.canDoubleJump = true;
    } else if (this.canDoubleJump && this.allowDoubleJump && this.canJump2) {
      this.velocity.y = -this.doubleJumpHeight;
      this.canDoubleJump = false;
    }
  }

  dash() {
    this.lastDash2 = new Date();
    if ((this.lastDash2.getTime() - this.lastDash.getTime()) > this.dashTime) {
      this.lastDash = this.lastDash2;
      this.canDash = true;
    }
    else {
      this.canDash = false;
    }

    let speed = this.dashSpeed;
    if (this.canDash && this.canDash2) {
      if (this.keys.up.pressed && this.keys.right.pressed) {
        this.speedBoost.x = speed;
        this.velocity.y = - this.jumpHeight;
        this.lastDirection = 'dashRight';
      }
      if (this.keys.up.pressed && this.keys.left.pressed) {
        this.speedBoost.x = -speed;
        this.velocity.y = - this.jumpHeight;
        this.lastDirection = 'dashLeft';
      }
      if (this.keys.left.pressed && !this.keys.up.pressed) {
        this.speedBoost.x = -speed;
        this.lastDirection = 'dashLeft';
      }
      if (this.keys.right.pressed && !this.keys.up.pressed) {
        this.speedBoost.x = speed;
        this.lastDirection = 'dashRight';
      }
      if ((this.keys.up.pressed || this.keys.dash.pressed) && !this.keys.right.pressed && !this.keys.left.pressed) {
        this.velocity.y = - this.jumpHeight;
      }

      this.canDash = true;
      this.canDash2 = false;
    }
  }

  slide() {
    this.lastSlide2 = new Date();
    //console.log(this.lastSlide2.getTime() +"-"+ this.lastSlide.getTime() +" : " +  (this.lastSlide2.getTime() - this.lastSlide.getTime()))
    if ((this.lastSlide2.getTime() - this.lastSlide.getTime()) > this.slideTime) {
      this.lastSlide = this.lastSlide2;
      this.canSlide = true;
    }
    else {
      this.canSlide = false;
    }

    let speed = this.dashSpeed;
    if (this.canSlide && this.canSlide2 && this.isSliding == false) {
      if (this.keys.slide.pressed && this.keys.right.pressed) {
        this.speedBoost.x = speed;
        this.lastDirection = 'dashRight';
      }
      else if (this.keys.slide.pressed && this.keys.left.pressed) {
        this.speedBoost.x = -speed;
        this.lastDirection = 'dashLeft';
      }
      else if (this.lastDirection2 == 'left' && this.keys.slide.pressed) {
        this.speedBoost.x = -speed;
        this.lastDirection = 'dashLeft';
      }
      else if (this.lastDirection2 == 'right' && this.keys.slide.pressed) {
        this.speedBoost.x = speed;
        this.lastDirection = 'dashRight';
      }

      this.isSliding = true;
      this.canSlide = true;
      this.canSlide2 = false;
    }
  }

  updatePosition() {
    if (this.speedBoost.x >= 1) {
      this.speedBoost.x -= 0.1;
    }
    else if (this.speedBoost.x <= -1) {
      this.speedBoost.x += 0.1;
    }
    else if (this.speedBoost.x != 0) {
      this.speedBoost.x = 0;
      this.isSliding = false;
      this.position.x = Math.round(this.position.x); // On arondie pour mieux gerer les collisions

      if (this.velocity.x == 0 && this.lastDirection2 == 'left') {
        this.lastDirection = 'idleLeft';
      }
      else if (this.velocity.x == 0 && this.lastDirection2 == 'right') {
        this.lastDirection = 'idleRight';
      }
    }
    this.position.x += this.velocity.x + 1 * this.speedBoost.x;
  }

  handleCollisions() {
    // On parcourt toutes les tuiles de la carte pour détecter les collisions
    for (let i = 0; i < this.tabTiles.length; i++) {
      for (let j = 0; j < this.tabTiles[i].length; j++) {
        let tile = this.tabTiles[i][j];

        // Si la tuile est une tuile de collision
        if (tile.collision) {
          // On calcule la distance entre le joueur et la tuile courante
          let distX = Math.abs(this.position.x - tile.x);
          let distY = Math.abs(this.position.y - tile.y);

          // On calcule la somme des demi-largeurs et demi-hauteurs
          let sumHalfWidths = (this.hitbox.width / 2) + (tile.width / 2);
          let sumHalfHeights = (this.hitbox.height / 2) + (tile.height / 2);

          // Si la distance est inférieure à la somme des demi-largeurs et demi-hauteurs, il y a collision
          if (distX < sumHalfWidths && distY < sumHalfHeights) {
            if (tile.changeLvl != "") {
              this.currentLvl = tile.changeLvl;
            }
            // On détermine l'axe de la collision
            let overlapX = sumHalfWidths - distX;
            let overlapY = sumHalfHeights - distY;

            if (overlapX < overlapY && !tile.canTravers) {
              // La collision est horizontale
              if (this.position.x < tile.x) {
                this.position.x = Math.round(this.position.x - overlapX);
                this.velocity.x = 0;
              }
              else {
                this.position.x = Math.round(this.position.x + overlapX);
                this.velocity.x = 0;
              }
            }
            else if (!tile.canTravers) {
              // La collision est verticale
              if (this.position.y < tile.y) {
                this.position.y = Math.round(this.position.y - overlapY);
                this.velocity.y = 0;
                if (tile.movingDirection == "X") {
                  this.velocity.x = tile.direction * tile.speed;
                  this.isOnMovingPlatformX = true;
                }
                else if (tile.movingDirection == "Y") {
                  this.isOnMovingPlatformY = true;
                }
                else {
                  this.isOnMovingPlatformX = false;
                  this.isOnMovingPlatformY = false;
                }
                this.canJump = true;
              }
              else {
                //this.position.y = Math.round(this.position.y + overlapY);
                this.velocity.y = 0.5;
              }
              if (this.lastDirection == 'up') {
                this.lastDirection = this.lastDirection2;
              }
            }
            else if (tile.canTravers && this.velocity.y > 0) {
              this.position.y = Math.round(this.position.y - overlapY);
              this.velocity.y = 0;
              this.canJump = true;
            }
          }
        }
      }
    }
  }

  setPosition(x, y) { // Pour déplacer le joueur en cas de changement de niveau
    this.position.x = x;
    this.position.y = y;
    this.camera.position.cx = x;
    this.camera.position.cy = y;
  }

  updateCamera() { // Mise à jour du point central de la caméra
    if (this.position.x + this.width > this.camera.position.cx + (this.camera.width / 2)) {
      this.camera.position.cx = this.position.x + this.width - (this.camera.width / 2);
    }
    else if (this.position.x < this.camera.position.cx - (this.camera.width / 2)) {
      this.camera.position.cx = this.position.x + (this.camera.width / 2);
    }

    if (this.position.y < this.camera.position.cy - (this.camera.height / 2)) {
      this.camera.position.cy = this.position.y + (this.camera.height / 2);
    }
    else if (this.position.y + this.height > this.camera.position.cy + (this.camera.height / 2)) {
      this.camera.position.cy = this.position.y + this.height - (this.camera.height / 2);
    }
    // On arondie pour que cela soit moins flou
    this.camera.position.x = Math.round(this.camera.position.cx - (this.camera.width / 2));
    this.camera.position.y = Math.round(this.camera.position.cy - (this.camera.height / 2));
  }

  renderCamera(c) {
    c.fillStyle = 'rgba(0, 255, 0, 0.5)'; // Couleur de la Hitbox
    c.fillRect( // Permet de dessiner la Hitbox sur le canvas (afin de visualiser la détection des collisions)
      this.camera.position.x,
      this.camera.position.y,
      this.camera.width,
      this.camera.height
    );
  }

  animate(c) {
    // Calcul de la frame
    this.currentFrame++;

    // La boucle
    this.maxFrame = 60;
    if (this.currentFrame > this.maxFrame) {
      this.currentFrame = 0;
    }

    // Gestion des images de l'animation
    if (this.velocity.y > 0 && !this.isOnMovingPlatformY) {
      this.lastDirection = 'up';
    }
    if (this.velocity.y < 0) {
      this.lastDirection = 'down';
    }

    if (this.lastDirection == 'idle' || this.lastDirection == 'idleRight') {
      if (this.currentFrame < 30 && this.currentFrame >= 0) {
        this.currentSprite = this.spriteIdle[0];
      }
      if (this.currentFrame <= 60 && this.currentFrame >= 30) {
        this.currentSprite = this.spriteIdle[1];
      }
    }

    if (this.lastDirection == 'idleLeft') {
      if (this.currentFrame < 30 && this.currentFrame >= 0) {
        this.currentSprite = this.spriteIdleLeft[0];
      }
      if (this.currentFrame <= 60 && this.currentFrame >= 30) {
        this.currentSprite = this.spriteIdleLeft[1];
      }
    }

    if (this.lastDirection == 'up' && this.lastDirection2 == 'right') {
      this.currentSprite = this.spriteJumpRight[2];
    }
    if (this.lastDirection == 'up' && this.lastDirection2 == 'left') {
      this.currentSprite = this.spriteJumpLeft[2];
    }

    if (this.lastDirection == 'down' && this.lastDirection2 == 'left') {
      this.currentSprite = this.spriteJumpLeft[1];
    }
    if (this.lastDirection == 'down' && this.lastDirection2 == 'right') {
      this.currentSprite = this.spriteJumpRight[1];
    }
    if (this.lastDirection == 'dashRight' || this.speedBoost.x > 0) {
      this.currentSprite = this.spriteDash[0];
    }
    if (this.lastDirection == 'dashLeft' || this.speedBoost.x < 0) {
      this.currentSprite = this.spriteDash[1];
    }

    if (this.lastDirection == 'right' && this.lastDirection2 == 'right') {
      if (this.currentFrame < 7.5 && this.currentFrame >= 0) {
        this.currentSprite = this.spriteRunRight[0];
      }
      else if (this.currentFrame < 15 && this.currentFrame >= 7.5) {
        this.currentSprite = this.spriteRunRight[1];
      }
      else if (this.currentFrame < 22.5 && this.currentFrame >= 15) {
        this.currentSprite = this.spriteRunRight[2];
      }
      else if (this.currentFrame < 30 && this.currentFrame >= 22.5) {
        this.currentSprite = this.spriteRunRight[3];
      }
      else if (this.currentFrame <= 37.5 && this.currentFrame >= 30) {
        this.currentSprite = this.spriteRunRight[4];
      }
      else if (this.currentFrame <= 45 && this.currentFrame >= 37.5) {
        this.currentSprite = this.spriteRunRight[5];
      }
      else if (this.currentFrame <= 52.5 && this.currentFrame >= 45) {
        this.currentSprite = this.spriteRunRight[6];
      }
      else if (this.currentFrame <= 60 && this.currentFrame >= 52.5) {
        this.currentSprite = this.spriteRunRight[7];
      }
    }

    if (this.lastDirection == 'left' && this.lastDirection2 == 'left') {
      if (this.currentFrame < 7.5 && this.currentFrame >= 0) {
        this.currentSprite = this.spriteRunLeft[0];
      }
      else if (this.currentFrame < 15 && this.currentFrame >= 7.5) {
        this.currentSprite = this.spriteRunLeft[1];
      }
      else if (this.currentFrame < 22.5 && this.currentFrame >= 15) {
        this.currentSprite = this.spriteRunLeft[2];
      }
      else if (this.currentFrame < 30 && this.currentFrame >= 22.5) {
        this.currentSprite = this.spriteRunLeft[3];
      }
      else if (this.currentFrame <= 37.5 && this.currentFrame >= 30) {
        this.currentSprite = this.spriteRunLeft[4];
      }
      else if (this.currentFrame <= 45 && this.currentFrame >= 37.5) {
        this.currentSprite = this.spriteRunLeft[5];
      }
      else if (this.currentFrame <= 52.5 && this.currentFrame >= 45) {
        this.currentSprite = this.spriteRunLeft[6];
      }
      else if (this.currentFrame <= 60 && this.currentFrame >= 52.5) {
        this.currentSprite = this.spriteRunLeft[7];
      }
    }

    try { // On évite les erreur d'affichage comme ceci
      c.drawImage(this.currentSprite, this.column * this.frameWidth, this.row * this.frameHeight, this.frameWidth, this.frameHeight, this.position.x, this.position.y, this.frameWidth, this.frameHeight);
    } catch { }
  }

  render(c) {
    if (this.debug.cameraRender) { this.renderCamera(c); }
    if (this.debug.hitboxRender) { this.renderHitbox(c); }
    this.animate(c);
  }

  update() { // Mise à jour de la position, des collisions etc
    this.handleInput();
    this.updateCamera();
    this.updatePosition();
    this.updateHitbox();
    this.applyGravity();
    this.handleCollisions();
    this.updateHitbox();
  }
}