  class Game {
  constructor() { // Constructeur
    this.gameStarted = false; // Dit si le jeu est démarré ou non
    this.canvas = document.querySelector('canvas'); // Récupère l'élément canvas depuis la page html
    this.c = this.canvas.getContext('2d'); // On indique que c'est un jeu en 2d
    this.canvas.width = 16 * 16 * 1.5; // Ecran 16neuvième et tiles de 16*16
    this.canvas.height = 16 * 9 * 1.5;

    // MENU
    this.menu = new Menu(this.c);
    this.stop = false;
    this.verifPause = true;
    
    this.spawnX = 0;
    this.spawnY = 0;
    this.playerAnimation = this.initPlayerAnim();
    
    // Background
    this.initCanvas();

    // LVL
    this.lvl0 = this.readCsvFile('levels/mapTutoriel.csv');
    this.canChangeLvl1 = true;
    this.lvl1 = this.readCsvFile('levels/mapHallPortes.csv');
    this.canChangeLvl2 = false;
    this.lvl2 = this.readCsvFile('levels/mapLvl1.csv');
    this.entity = [];
    this.backMap = [];
    this.sprites = [];
    this.frontMap = [];
    this.portes = [];
    this.createLvl(this.lvl0);
    this.player = new Player(this.frontMap, this.canvas.width, this.canvas.height, this.spawnX, this.spawnY, this.playerAnimation); // Le joueu
    this.cameraSettings = {initialPosition: [this.player.position.x, this.player.position.y], scaleX: 16.0, scaleY: 9.0, width: this.canvas.width, height: this.canvas.height};
    this.camera = new Camera(this.c, this.cameraSettings);

    // TIME
    this.tempsDepart = new Date();
    this.tempsActuel = new Date();
    this.calculTemps = 0;

    // FPS
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = Date.now();

    // MUSIQUES
    this.initMusic(); // on initialise les musiques !
  }

  initCanvas() { // Image de l'arrière plan
    this.sky = new Image();
    this.sky.src = "images/background/sky.png";
    this.sun = new Image();
    this.sun.src = "images/background/sun.png";
    this.stars = new Image();
    this.stars.src = "images/background/stars.png";
    this.stars2 = new Image();
    this.stars2.src = "images/background/stars2.png";
    this.clouds = new Image();
    this.clouds.src = "images/background/clouds.png";
    this.clouds2 = new Image();
    this.clouds2.src = "images/background/clouds2.png";
  }
    
  renderCanvas() { // Coloration du canvas
    // Affichage des images du constructeur 
    this.c.drawImage(this.sky, 0, 0);
    this.c.drawImage(this.sun, 0, 0);
    this.c.drawImage(this.stars, 0, 0);
    this.c.drawImage(this.stars2, 0, 0);
    this.c.drawImage(this.clouds, 0, 0);
    this.c.drawImage(this.clouds2, 0, 0);
    
    /*
    class Layer {
      constructor(image, speedModifier) {
      this.x = 0;
      this.y = 0;
      this.width = 2400;
      this.height = 700;
      this.x2 = this.width;
      this.image = image;
      this.speedModifier = speedModifier;
      this.speed = gameSpeed * this.speedModifier;
      }
    }

    update(){
      this.speed = gameSpeed * this.speedModifier; 
      if (this.x <= -this.width) {
        this.x = this.width + this.x2 - this.speed;
      }
      if (this.x2 <= -this.width) {
        this.x2 = this.width + this.x - this.speed;
      }
      this.x = Math.floor(this.x - this.speed);
      this.x2 = Math.floor(this.x2 - this.speed);
    }

    draw() {
      c.drawImage(this.image, this.x, this.y, this.width, this.height);
      c.drawImage(this.image, this.x2, this.y, this.width, this.height);
    }

    const sky = new Layer(sky, 0,5);
    const sun = new Layer(sun, 0,5);

    const gameObjects = [sky, sun];
    
    function animate() {
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      gameObjects.forEach(object => {
        object.update();
        object.draw();
      })
      requestAnimationFrame(animate);
    };
    animate();
    */
  }

  detectInput() { // Permet de detecter les touches sur lesquelles appuie le joueur
    window.addEventListener("mousemove", (event) => {
      // Obtenir les coordonnées de la souris par rapport au canvas
      this.menu.rect = this.canvas.getBoundingClientRect();
      this.menu.event = event;
    });
    
    window.addEventListener('keydown', (event) => { // L'écouteur (listener)
      //console.log(event.keyCode);
      if ((event.ctrlKey || event.keyCode === 16) && (event.keyCode === 68 || event.keyCode === 81 || event.keyCode === 90 || event.keyCode === 83)) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (this.player.preventInput) { return }
      switch (event.key) {
        case 'z':
          this.player.keys.up.pressed = true; // On transmet l'information au joueur : "Touche z est enfoncée" 
          break;
        case ' ':
          this.player.keys.up.pressed = true;
          break;
        case 'w':
          this.player.keys.up.pressed = true;
          break;
        case 'ArrowUp':
          this.player.keys.up.pressed = true;
          break;
        case 'q':
          this.player.keys.left.pressed = true;
          this.player.keys.right.pressed = false;
          break;
        case 'a':
          this.player.keys.left.pressed = true;
          this.player.keys.right.pressed = false;
          break;
        case 'ArrowLeft':
          this.player.keys.left.pressed = true;
          this.player.keys.right.pressed = false;
          break;
        case 'd':
          this.player.keys.right.pressed = true;
          this.player.keys.left.pressed = false;
          break;
        case 'ArrowRight':
          this.player.keys.right.pressed = true;
          this.player.keys.left.pressed = false;
          break;
        case 'Shift':
          this.player.keys.dash.pressed = true;
          break;
        case 'Control':
          this.player.keys.slide.pressed = true;
          break;
        case 'Escape' : 
          this.menu.keys.pause.pressed = true;
          break;
        case 'e':
          this.player.keys.interact.pressed = true;
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'z':
          this.player.keys.up.pressed = false; // On transmet l'information au joueur : "Touche z n'est pas enfoncée" 
          this.player.canJump2 = true;
          break;
        case 'w':
          this.player.keys.up.pressed = false; // On transmet l'information au joueur : "Touche z n'est pas enfoncée" 
          this.player.canJump2 = true;
          break;
        case ' ':
          this.player.keys.up.pressed = false;
          this.player.canJump2 = true;
          break;
        case 'ArrowUp':
          this.player.keys.up.pressed = false;
          this.player.canJump2 = true;
          break;
        case 'q':
          this.player.keys.left.pressed = false;
          break;
        case 'a':
          this.player.keys.left.pressed = false;
          break;
        case 'ArrowLeft':
          this.player.keys.left.pressed = false;
          break;
        case 'd':
          this.player.keys.right.pressed = false;
          break;
        case 'ArrowRight':
          this.player.keys.right.pressed = false;
          break;
        case 'Shift':
          this.player.keys.dash.pressed = false;
          this.player.canDash2 = true;
          break;
        case 'Control':
          this.player.keys.slide.pressed = false;
          this.player.canSlide2 = true;
          break;
        case 'Escape' : 
          this.menu.keys.pause.pressed = false;
          this.verifPause = true;
          break;
        case 'e':
          this.player.keys.interact.pressed = false;
          break;
      }
    });
  }

  readCsvFile(file) { // Transforme un fichier csv en matrice utilisable 
    let mapData = [];
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        let lines = xhr.responseText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          let cells = lines[i].split(',');
          mapData[i] = [];
          for (let j = 0; j < cells.length; j++) {
            mapData[i][j] = parseInt(cells[j]);
          }
        }
      }
    };
    xhr.open('GET', file, false);
    xhr.send();
    return mapData;
  }

  isPaused(){
    if(this.verifPause == true) {
      if (this.stop  == false && this.menu.keys.pause.pressed == true){
        this.stop = true;
        this.verifPause = false;
      }
      else if (this.stop == true && this.menu.keys.pause.pressed == true){
        this.stop = false;
        this.verifPause = false;
      }
    }
  }
    
  initPlayerAnim() {
    // Animations du joueur (de les charger ici est plus optimisé)
    let spriteIdle0 = new Image();
    spriteIdle0.src = 'images/player/idle-01.png';
    let spriteIdle1 = new Image();
    spriteIdle1.src = 'images/player/idle-02.png';
    let spriteIdle = [spriteIdle0, spriteIdle1];

    let spriteIdleLeft0 = new Image();
    spriteIdleLeft0.src = 'images/player/idleLeft-01.png';
    let spriteIdleLeft1 = new Image();
    spriteIdleLeft1.src = 'images/player/idleLeft-02.png';
    let spriteIdleLeft = [spriteIdleLeft0, spriteIdleLeft1];

    let spriteDash0 = new Image();
    spriteDash0.src = 'images/player/dash-02.png';
    let spriteDashLeft0 = new Image();
    spriteDashLeft0.src = 'images/player/dashLeft-02.png';
    let spriteDash = [spriteDash0, spriteDashLeft0];
    
    let spriteJumpRight0 = new Image();
    spriteJumpRight0.src = 'images/player/jump/jumpRight1.png';
    let spriteJumpRight1 = new Image();
    spriteJumpRight1.src = 'images/player/jump/jumpRight2.png';
    let spriteJumpRight2 = new Image();
    spriteJumpRight2.src = 'images/player/jump/jumpRight3.png';
    let spriteJumpRight = [spriteJumpRight0, spriteJumpRight1, spriteJumpRight2];

    let spriteJumpLeft0 = new Image();
    spriteJumpLeft0.src = 'images/player/jump/jumpLeft1.png';
    let spriteJumpLeft1 = new Image();
    spriteJumpLeft1.src = 'images/player/jump/jumpLeft2.png';
    let spriteJumpLeft2 = new Image();
    spriteJumpLeft2.src = 'images/player/jump/jumpLeft3.png';
    let spriteJumpLeft = [spriteJumpLeft0, spriteJumpLeft1, spriteJumpLeft2];
    
    let spriteRunRight1 = new Image();
    spriteRunRight1.src = 'images/player/run/runRight-01.png';
    let spriteRunRight2 = new Image();
    spriteRunRight2.src = 'images/player/run/runRight-02.png';
    let spriteRunRight3 = new Image();
    spriteRunRight3.src = 'images/player/run/runRight-03.png';
    let spriteRunRight4 = new Image();
    spriteRunRight4.src = 'images/player/run/runRight-04.png';
    let spriteRunRight5 = new Image();
    spriteRunRight5.src = 'images/player/run/runRight-05.png';
    let spriteRunRight6 = new Image();
    spriteRunRight6.src = 'images/player/run/runRight-06.png';
    let spriteRunRight7 = new Image();
    spriteRunRight7.src = 'images/player/run/runRight-07.png';
    let spriteRunRight8 = new Image();
    spriteRunRight8.src = 'images/player/run/runRight-08.png';
    let spriteRunRight = [spriteRunRight1, spriteRunRight2, spriteRunRight3, spriteRunRight4, spriteRunRight5, spriteRunRight6, spriteRunRight7, spriteRunRight8];

    let spriteRunLeft1 = new Image();
    spriteRunLeft1.src = 'images/player/run/runLeft-01.png';
    let spriteRunLeft2 = new Image();
    spriteRunLeft2.src = 'images/player/run/runLeft-02.png';
    let spriteRunLeft3 = new Image();
    spriteRunLeft3.src = 'images/player/run/runLeft-03.png';
    let spriteRunLeft4 = new Image();
    spriteRunLeft4.src = 'images/player/run/runLeft-04.png';
    let spriteRunLeft5 = new Image();
    spriteRunLeft5.src = 'images/player/run/runLeft-05.png';
    let spriteRunLeft6 = new Image();
    spriteRunLeft6.src = 'images/player/run/runLeft-06.png';
    let spriteRunLeft7 = new Image();
    spriteRunLeft7.src = 'images/player/run/runLeft-07.png';
    let spriteRunLeft8 = new Image();
    spriteRunLeft8.src = 'images/player/run/runLeft-08.png';
    let spriteRunLeft = [spriteRunLeft1, spriteRunLeft2, spriteRunLeft3, spriteRunLeft4, spriteRunLeft5, spriteRunLeft6, spriteRunLeft7, spriteRunLeft8];

    let anime = [spriteIdle, spriteIdleLeft, spriteDash, spriteJumpRight, spriteJumpLeft, spriteRunRight, spriteRunLeft];
    return anime;
  }

  loadImage(imageName) { // Permet de charger des images a partir d'un nom
    var img = new Image();
    imageName = 'images/tileSet/' + imageName + '.png';
    img.src = imageName;
    return img;
  }
    
  initSprites(map) { // Initialises les sprites des tiles d'un niveau
    for (let column = 0; column < map.length; column++) {
      for (let row = 0; row < map[column].length; row++) {
        if(map[column][row] >= 0 && !this.sprites.hasOwnProperty(map[column][row]+1)) {
          this.sprites[map[column][row]+1] = this.loadImage(map[column][row]+1);
        }
      }
    }
  }

  changeLvl() { // Fais les ajustements nécessaire au changements de niveau
    if(this.player.currentLvl == "lvl1" && this.canChangeLvl1 && !this.canChangeLvl2) {
      this.createLvl(this.lvl1); // Change le niveau
      this.player.setPosition(this.spawnX, this.spawnY); // Téléporte le joueur
      this.player.tabTiles = this.frontMap;
      this.canChangeLvl1 = false;
      this.canChangeLvl2 = true;
      this.player.currentLvl == "lvl1";
    }

    if (this.portes[0] != null) {
      if(((this.player.position.x - this.portes[0].x) < 1*16) && ((this.player.position.y - this.portes[0].y) < 1*16) && this.player.keys.interact.pressed && this.canChangeLvl2) {
        this.createLvl(this.lvl2);
        this.player.setPosition(this.spawnX, this.spawnY);
        this.player.tabTiles = this.frontMap;
        this.player.currentLvl = "lvl2";
        this.canChangeLvl1 = true;
        this.canChangeLvl2 = false;
      }
    }
  }
    
  createLvl(lvl) { // Algorythme de création des niveaux
    this.entity = [];
    this.backMap = [];
    this.sprites = [];
    this.frontMap = [];
    
    let unCollidableTiles = [ 42, 43, 44, 45, 122, 123, 124, 125, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 457, 458, 527, 528, 612, 720, 721, 722, 723, 724, 126, 127, 128, 129, 484, 485, 486, 487, 488, 489, 490, 491, 568, 569, 570, 571, 572, 573, 574, 575, 526, 528, 529, 530, 610, 611, 612, 614, 652, 653, 654, 655, 656, 657, 658, 659, 893, 894, 895, 1189, 1273, 1273, 1189, 1195, 1279, 1196, 1280, 852, 1193, 1194, 855, 856, 936, 1277, 1278, 853, 937, 795, 879, 963, 1047, 1458, 1191, 1192, 1275, 1276, 1304, 1305, 1306, 1307, 1388, 1389, 1390, 1391, 1472, 1473, 1474, 1475, 1556, 1557, 1558, 1559, 1640, 1641, 1642, 1643, 1459, 1189, 1190, 1273, 1274, 1105, 1106, 544, 545, 546, 547, 972, 973,	974, 975, 1056,	1057,	1058,	1059, 804, 805,	806, 807,	808, 888,	889, 890,	891, 892, 1140,	1141,	1142,	1143, 1224,	1225,	1226,	1227, 809, 810, 811, 811]; // Les id des tiles qui ne sont pas collidalble (que l'on peut traverser)
    let backTiles = [1047, 963, 879, 795, 852, 936, 1641, 1642, 1558, 1557, 1473, 1474, 1388, 1389, 1390, 1391, 1304, 1305, 1306, 1307, 1459, 1458]
    
    let tableauTiles = [];
    let map = lvl;
    this.initSprites(map); // Initialisation des sprites de la map
    for (let column = 0; column < map.length; column++) {
      let col = [];
      for (let row = 0; row < map[column].length; row++) {
        if(map[column][row] >=0 && map[column][row] <=2015 && map[column][row] != 1396 && map[column][row] != 1651 && !backTiles.includes(map[column][row])) { // Gestion des plateformes spéciales
          let settings = {};
          let collide = true;
          switch (map[column][row]) {

            // PLATEFORMES QUI BOUGE
            case 399:
              settings = { distanceX: 3};
              break;
            case 253:
              settings = { distanceY: 3};
              break;
            case 254:
              settings = { distanceY: 3};
              break;
            case 255:
              settings = { distanceY: 3};
              break;
            case 1397:
              settings = { changeLvl: "lvl1" };
              break;
            case 342:
              settings = { cX: row * 16, cY: column * 16, rayon: 3*16, speed: 5, positionCercle: 1};
              break;
            case 1399:
              settings = { distanceY: 5, speed: 8, Thwomp: true};
              break;
            case 1478:
              settings = { doorO : true};
              break;
            case 1479:
              settings = { cX: row * 16, cY: column * 16, rayon: 3*16, speed: 5, positionCercle: 2};
              break;
            case 1480:
              settings = { distanceX: 6, distanceY: 6 };
              break;
            case 1481:
              break;
            case 1482:
              break;
            case 1483:
              break;
            case 1562:
              break;
            case 1563:
              break;
            case 1564:
              break;
            case 1565:
              break;
            case 1566:
              break;
            case 1567:
              break;
            case 1646:
              break;
            case 1647:
              break;
            case 1648:
              break;
            case 1649:
              break;
            case 1650:
              break;
            case 1651:
              break;
            case 373:
              settings = { canTravers : true};
              break;
            case 374:
              settings = { canTravers : true};
              break;
          }
          if(unCollidableTiles.includes(map[column][row])){
            collide = false;
          }
          col.push(new Tile(row * 16, column * 16, this.sprites[map[column][row]+1], collide, settings));
        }
        else if (map[column][row] == 1396) { // Position d'apparition du joueur
          this.spawnX = row * 16;
          this.spawnY = column * 16;
        }
        else if (map[column][row] == 1651) { // Apparition d'un clé
          this.entity.push(new Entity(row * 16, column * 16, 'images/tileSet/' + (766+1) + '.png'));
        }
        else if (map[column][row] == 852) { // Les portes qui permettent le changement de niveau 
          this.portes.push({x: row * 16, y: column * 16});
        }
        else if(backTiles.includes(map[column][row])) { // Les tiles en arrière plan
          this.backMap.push(new Tile(row * 16, column * 16, this.sprites[map[column][row]+1], false));
        }
      }
      tableauTiles.push(col);
    }
    
    this.frontMap = tableauTiles;
  }

  renderMap(c) { // Parcours le tableau qui contient toute les Tiles et les affiches
    for (let column = 0; column < this.frontMap.length; column++) {
      for (let row = 0; row < this.frontMap[column].length; row++) {
        try { // les instructions à essayer si tout se passe bien
          this.frontMap[column][row].render(c);
        } catch (e) {
        }
      }
    }
  }
    
  renderBackMap(c) { // Parcours le tableau qui contient toute les Tiles et les affiches
    for (let column = 0; column < this.backMap.length; column++) {
      try { // les instructions à essayer si tout se passe bien
          this.backMap[column].render(c);
      } catch (e) {
      }
    }
  }

  updateMap() { // Met à jour la position de certaines tiles qui bougent par exemple
    for (let column = 0; column < this.frontMap.length; column++) {
      for (let row = 0; row < this.frontMap[column].length; row++) {
        this.frontMap[column][row].update();
      }
    }
  }

  updateChrono() { //Met à jour le chronomètre
    this.tempsActuel = new Date();
    this.calculTemps = this.tempsActuel.getTime() - this.tempsDepart.getTime();
  }

  renderChrono() { //Affiche le chronomètre
    let millisecondes = this.calculTemps % 1000;
    let secondes = Math.floor((this.calculTemps / 1000) % 60);
    let minutes = Math.floor((this.calculTemps / (1000 * 60)) % 60);
    let heures = Math.floor((this.calculTemps / (1000 * 60 * 60)) % 24);

    // Affichage fond pour chronomètre et FPS
    this.c.globalAlpha = 0.2;
    this.c.fillStyle = "#000000";
    this.c.fillRect((this.player.camera.position.cx - 13*16), (this.player.camera.position.cy - 7*16), 9.5*16, 1.3*16);

    // Affichage chronomètre
    this.c.globalAlpha = 1;
    this.c.font = "10px Arial";
    let txt = heures + ':' + minutes + ':' + secondes + '.' + millisecondes;
    this.c.fillStyle = "#FFFFFF";
    this.c.fillText(txt, (this.player.camera.position.cx - 7*16), (this.player.camera.position.cy - 6*16));
  }

  updateFPS() { // Met  à jour le compteur de FPS
    this.frameCount = this.frameCount + 1;
  
    const now = Date.now();
    const elapsed = now - this.lastTime;
  
    if (elapsed >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  renderFPS() { // Affiche les FPS
    this.c.globalAlpha = 1;
    this.c.fillStyle = "#C41E3A"; 
    this.c.font = "10px Arial";
    this.c.fillText("FPS : " + this.fps, (this.player.camera.position.cx - 11.5*16), (this.player.camera.position.cy - 6*16));
  }

  updateEntity() { // Met à jour les clefs
    for(let nb = 0; nb < this.entity.length; nb++) {
      this.entity[nb].followTarget = this.player;
      this.entity[nb].update();
    }
  }

  renderEntity(c) { // Affiche les clefs
    for(let nb = 0; nb < this.entity.length; nb++) {
      this.entity[nb].render(c);
    }
  }

  initMusic() { // Initialise le volume de la musique a 10 par défaut
    this.globalVolume = 10;
    
    // La music du menu de séléction des niveaux
    this.hub = new Audio({
    loop: true,
    volume: this.globalVolume,
    src: ['Music/haute_hub.WAV']});
    
    // Le theme qui joue quand le chat apparait à l'écrant
    this.catTheme = new Audio({
    loop: true,
    volume: this.globalVolume,
    src: ['Music/pharaon_cat_s_theme.WAV']});

    // Theme du tutoriel
    this.tuto = new Audio({
    loop: true,
    volume: this.globalVolume,
    src: ['Music/imperfect_cat_s_sadness.WAV']}); // theme du tutoriel    
    
    this.tuto.play();
  }
    
  // BOUCLE DU JEU :
  render() { // AFFICHAGE
    if(this.calculTemps > 7000 && this.stop == false) {
      this.renderCanvas(); // Affichage de l'arrière plan
      
      this.camera.begin();
      // Affichage du jeu dans la caméra :
      this.renderBackMap(this.c);
      this.player.render(this.c); // Affiche le joueur
      this.renderMap(this.c); // Afficher la map
      this.renderEntity(this.c);
      this.renderFPS();
      this.renderChrono(); // Affichage du chrono
      this.camera.end();
    }
    else if(this.stop) { // Des que la touche Echap est détecté, met le jeu en pause
      this.menu.render(this.c);
    }
  }

  update() { //TOUT LE RESTE
    this.updateChrono(); // Met à jour le chronomètre
    if(this.calculTemps > 7000 && this.stop == false) {
      this.gameStarted = true; // Dit que le jeu est démarré
      this.detectInput(); // Détecte les actions faites sur le clavier
      this.updateMap(); // Met à jour la position des Tiles sur la map
      this.updateEntity();
      this.player.update(); // Met à jour le joueur
      this.changeLvl();
      
      //this.song02.play();
      this.camera.moveTo(this.player.camera.position.cx, this.player.camera.position.cy);
  
      // Affichage des FPS
      this.updateFPS();

      //pause du jeu
      this.isPaused();
    }
    else if(this.stop) { //Des que la touche Echap est détecté, met le jeu en pause
      this.menu.update();
      this.isPaused();
    }
  }
}