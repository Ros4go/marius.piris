  class Game {
  constructor() { // Constructeur
    this.gameStarted = false; // Dit si le jeu est démarré ou non
    this.canvas = document.querySelector('canvas'); // Récupère l'élément canvas depuis la page html
    this.c = this.canvas.getContext('2d'); // On indique que c'est un jeu en 2d
    this.c.imageSmoothingEnabled = false;
    window.devicePixelRatio=2;
    this.c.imageSmoothingQuality = "high";
    this.c.webkitImageSmoothingEnabled = false;
    this.c.mozImageSmoothingEnabled = false;
    this.c.imageSmoothingEnabled = false;
    this.canvas.width = 16 * 16 * 1.5; // Ecran 16neuvième et tiles de 16*16
    this.canvas.height = 16 * 9 * 1.5;

    this.spawnX = 0;
    this.spawnY = 0;

    this.lvl0 = this.readCsvFile('levels/mapTutoriel.csv');
    //this.lvl1 = this.readCsvFile('levels/mapTest.csv');
    this.tabTiles = this.createLvl(); // Tableau temporaire indiquant la position de chaque Tile au joueur
    this.player = new Player(this.tabTiles, this.canvas.width, this.canvas.height, this.spawnX, this.spawnY); // Le joueur
    this.cameraSettings = {initialPosition: [this.player.position.x, this.player.position.y], scaleX: 16.0, scaleY: 9.0, width: this.canvas.width, height: this.canvas.height};
    this.camera = new Camera(this.c, this.cameraSettings);
    
    this.tempsDepart = new Date();
    this.tempsActuel = new Date();
    this.calculTemps = 0;
    
    this.catTheme = new Audio('Music/pharaon_cat_s_theme.WAV');
    this.imperfect_cat_s_sadness = new Audio('Music/imperfect_cat_s_sadness.WAV');
  }
  
  renderCanvas() { // Coloration du canvas
    //this.c.fillStyle = "#87CEEB"; // Choix de la couleur #87CEEB ou #99CCFF
    //this.c.fillRect(0, 0, this.canvas.width, this.canvas.height); // Remplis le canvas de cette couleur
    let grd = this.c.createRadialGradient(75, 50, 5, 90, 60, 100);
    grd.addColorStop(0, "#FFE87C");
    grd.addColorStop(1, "#87CEEB");
    
    // Fill with gradient
    this.c.fillStyle = grd;
    this.c.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  detectInput() { // Permet de detecter les touches sur lesquelles appuie le joueur
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
      }
    });
  }

  readCsvFile(file) {
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
  
  
  createLvl() {
    let tableauTiles = [];
    let map = this.lvl0;
      /*
      [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,10,11,12,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,2,1,1,1,1,0,0,1,1,0,0,0,0,0,0,0,1,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,0,0,2,2,2,1,1,2,2,1,0,0,0,1,1,1,2,2,2,2,1,1,1,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,5,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,-1,0,20,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];*///this.lvl1;
    
    for (let column = 0; column < map.length; column++) {
      let col = [];
      let randomNum = Math.floor(Math.random() * (10 - 3 + 1) + 3);
      for (let row = 0; row < map[column].length; row++) {
        switch (map[column][row]) {
          // SPAWN
          case 1396:
            this.spawnX = row * 16;
            this.spawnY = column * 16;
            break;
          // SOL
          case 87:
            col.push(new Tile(row * 16, column * 16, "tileSet/31.png", 1));
            break;
          // PLATEFORMES QUI BOUGE
          case 1394:
            col.push(new Tile(row * 16, column * 16, "tileSet/5016.png", 1, { distanceX: 3}));
            break;
          case 1395:
            col.push(new Tile(row * 16, column * 16, "tileSet/5419.png", 1, { distanceY: 3}));
            break;
          case 1397:
            col.push(new Tile(row * 16, column * 16, "tileSet/5316.png", 1, { distanceX: 6, distanceY: 6 }));
            break;
          case 1398:
            col.push(new Tile(row * 16, column * 16, "tileSet/5416.png", 1, { cX: row * 16, cY: column * 16, rayon: 3*16, speed: 5, positionCercle: 1}));
            break;
          case 1399:
            col.push(new Tile(row * 16, column * 16, "tileSet/5516.png", 1, { distanceY: 5, speed: 8, Thwomp: true}));
            break;
          case 1478:
            col.push(new Tile(row * 16, column * 16, "tileSet/5017.png", 1, { doorO : true}));
            break;
          case 1479:
            col.push(new Tile(row * 16, column * 16, "tileSet/5117.png", 1, { cX: row * 16, cY: column * 16, rayon: 3*16, speed: 5, positionCercle: 2}));
            break;
          case 1480:
            col.push(new Tile(row * 16, column * 16, "tileSet/5019.png", 1));
            break;
          case 1481:
            col.push(new Tile(row * 16, column * 16, "tileSet/5119.png", 1));
            break;
          case 1482:
            col.push(new Tile(row * 16, column * 16, "tileSet/5417.png", 1));
            break;
          case 1483:
            col.push(new Tile(row * 16, column * 16, "tileSet/5517.png", 1));
            break;
          case 1562:
            col.push(new Tile(row * 16, column * 16, "tileSet/5018.png", 1));
            break;
          case 1563:
            col.push(new Tile(row * 16, column * 16, "tileSet/5118.png", 1));
            break;
          case 1564:
            col.push(new Tile(row * 16, column * 16, "tileSet/5218.png", 1));
            break;
          case 1565:
            col.push(new Tile(row * 16, column * 16, "tileSet/5318.png", 1));
            break;
          case 1566:
            col.push(new Tile(row * 16, column * 16, "tileSet/5418.png", 1));
            break;
          case 1567:
            col.push(new Tile(row * 16, column * 16, "tileSet/5518.png", 1));
            break;
          case 1646:
            col.push(new Tile(row * 16, column * 16, "tileSet/5019.png", 1));
            break;
          case 1647:
            col.push(new Tile(row * 16, column * 16, "tileSet/5317.png", 1));
            break;
          case 1648:
            col.push(new Tile(row * 16, column * 16, "tileSet/5219.png", 1));
            break;
          case 1649:
            col.push(new Tile(row * 16, column * 16, "tileSet/5319.png", 1));
            break;
          case 1650:
            col.push(new Tile(row * 16, column * 16, "tileSet/5419.png", 1));
            break;
          case 1651:
            col.push(new Tile(row * 16, column * 16, "tileSet/5219.png", 1));
            break;
          // ASSETS
          case 0:
            col.push(new Tile(row * 16, column * 16, "tileSet/00.png", 1));
            break;
          case 1:
            col.push(new Tile(row * 16, column * 16, "tileSet/10.png", 1));
            break;
          case 2:
            col.push(new Tile(row * 16, column * 16, "tileSet/20.png", 1));
            break;
          case 3:
            col.push(new Tile(row * 16, column * 16, "tileSet/30.png", 1));
            break;
          case 4:
            col.push(new Tile(row * 16, column * 16, "tileSet/40.png", 1));
            break;
          case 5:
            col.push(new Tile(row * 16, column * 16, "tileSet/50.png", 1));
            break;
          case 6:
            col.push(new Tile(row * 16, column * 16, "tileSet/60.png", 0));
            break;
          case 7:
            col.push(new Tile(row * 16, column * 16, "tileSet/70.png", 0));
            break;
          case 8:
            col.push(new Tile(row * 16, column * 16, "tileSet/80.png", 0));
            break;
          case 9:
            col.push(new Tile(row * 16, column * 16, "tileSet/90.png", 0));
            break;
          case 84:
            col.push(new Tile(row * 16, column * 16, "tileSet/01.png", 1));
            break;
          case 85:
            col.push(new Tile(row * 16, column * 16, "tileSet/11.png", 1));
            break;
          case 89:
            col.push(new Tile(row * 16, column * 16, "tileSet/51.png", 1));
            break;
          case 90:
            col.push(new Tile(row * 16, column * 16, "tileSet/61.png", 0));
            break;
          case 91:
            col.push(new Tile(row * 16, column * 16, "tileSet/71.png", 0));
            break;
          case 92:
            col.push(new Tile(row * 16, column * 16, "tileSet/81.png", 0));
            break;
          case 93:
            col.push(new Tile(row * 16, column * 16, "tileSet/91.png", 0));
            break;
          case 168:
            col.push(new Tile(row * 16, column * 16, "tileSet/02.png", 1));
            break;
          case 169:
            col.push(new Tile(row * 16, column * 16, "tileSet/12.png", 1));
            break;
          case 170:
            col.push(new Tile(row * 16, column * 16, "tileSet/22.png", 1));
            break;
          case 171:
            col.push(new Tile(row * 16, column * 16, "tileSet/32.png", 1));
            break;
          case 172:
            col.push(new Tile(row * 16, column * 16, "tileSet/42.png", 1));
            break;
          case 173:
            col.push(new Tile(row * 16, column * 16, "tileSet/52.png", 1));
            break;
          case 174:
            col.push(new Tile(row * 16, column * 16, "tileSet/62.png", 0));
            break;
          case 175:
            col.push(new Tile(row * 16, column * 16, "tileSet/72.png", 0));
            break;
          case 176:
            col.push(new Tile(row * 16, column * 16, "tileSet/82.png", 0));
            break;
          case 177:
            col.push(new Tile(row * 16, column * 16, "tileSet/92.png", 0));
            break;
          case 252:
            col.push(new Tile(row * 16, column * 16, "tileSet/03.png", 1));
            break;
          case 253:
            col.push(new Tile(row * 16, column * 16, "tileSet/13.png", 1));
            break;
          case 254:
            col.push(new Tile(row * 16, column * 16, "tileSet/23.png", 1));
            break;
          case 255:
            col.push(new Tile(row * 16, column * 16, "tileSet/33.png", 1));
            break;
          case 256:
            col.push(new Tile(row * 16, column * 16, "tileSet/43.png", 1));
            break;
          case 257:
            col.push(new Tile(row * 16, column * 16, "tileSet/53.png", 1));
            break;
          case 258:
            col.push(new Tile(row * 16, column * 16, "tileSet/63.png", 0));
            break;
          case 259:
            col.push(new Tile(row * 16, column * 16, "tileSet/73.png", 0));
            break;
          case 260:
            col.push(new Tile(row * 16, column * 16, "tileSet/83.png", 0));
            break;
          case 261:
            col.push(new Tile(row * 16, column * 16, "tileSet/93.png", 0));
            break;
          case 336:
            col.push(new Tile(row * 16, column * 16, "tileSet/04.png", 1));
            break;
          case 337:
            col.push(new Tile(row * 16, column * 16, "tileSet/14.png", 1));
            break;
          case 338:
            col.push(new Tile(row * 16, column * 16, "tileSet/24.png", 1));
            break;
          case 339:
            col.push(new Tile(row * 16, column * 16, "tileSet/34.png", 1));
            break;
          case 340:
            col.push(new Tile(row * 16, column * 16, "tileSet/44.png", 1));
            break;
          case 341:
            col.push(new Tile(row * 16, column * 16, "tileSet/54.png", 1));
            break;
          case 342:
            col.push(new Tile(row * 16, column * 16, "tileSet/64.png", 1));
            break;
          case 344:
            col.push(new Tile(row * 16, column * 16, "tileSet/84.png", 0));
            break;
          case 345:
            col.push(new Tile(row * 16, column * 16, "tileSet/94.png", 0));
            break;
          case 428:
            col.push(new Tile(row * 16, column * 16, "tileSet/85.png", 0));
            break;
          case 429:
            col.push(new Tile(row * 16, column * 16, "tileSet/95.png", 0));
            break;
          case 95:
            col.push(new Tile(row * 16, column * 16, "tileSet/111.png", 1));
            break;
          case 96:
            col.push(new Tile(row * 16, column * 16, "tileSet/121.png", 1));
            break;
          case 97:
            col.push(new Tile(row * 16, column * 16, "tileSet/131.png", 1));
            break;
          case 99:
            col.push(new Tile(row * 16, column * 16, "tileSet/151.png", 1));
            break;
          case 100:
            col.push(new Tile(row * 16, column * 16, "tileSet/161.png", 1));
            break;
          case 101:
            col.push(new Tile(row * 16, column * 16, "tileSet/171.png", 1));
            break;
          case 103:
            col.push(new Tile(row * 16, column * 16, "tileSet/191.png", 1));
            break;
          case 104:
            col.push(new Tile(row * 16, column * 16, "tileSet/201.png", 1));
            break;
          case 106:
            col.push(new Tile(row * 16, column * 16, "tileSet/221.png", 1));
            break;
          case 107:
            col.push(new Tile(row * 16, column * 16, "tileSet/231.png", 1));
            break;
          case 109:
            col.push(new Tile(row * 16, column * 16, "tileSet/251.png", 1));
            break;
          case 110:
            col.push(new Tile(row * 16, column * 16, "tileSet/261.png", 1));
            break;
          case 179:
            col.push(new Tile(row * 16, column * 16, "tileSet/112.png", 1));
            break;
          case 180:
            col.push(new Tile(row * 16, column * 16, "tileSet/122.png", 1));
            break;
          case 181:
            col.push(new Tile(row * 16, column * 16, "tileSet/132.png", 1));
            break;
          case 183:
            col.push(new Tile(row * 16, column * 16, "tileSet/152.png", 1));
            break;
          case 184:
            col.push(new Tile(row * 16, column * 16, "tileSet/162.png", 1));
            break;
          case 185:
            col.push(new Tile(row * 16, column * 16, "tileSet/172.png", 1));
            break;
          case 187:
            col.push(new Tile(row * 16, column * 16, "tileSet/192.png", 1));
            break;
          case 188:
            col.push(new Tile(row * 16, column * 16, "tileSet/202.png", 1));
            break;
          case 190:
            col.push(new Tile(row * 16, column * 16, "tileSet/222.png", 1));
            break;
          case 191:
            col.push(new Tile(row * 16, column * 16, "tileSet/232.png", 1));
            break;
          case 193:
            col.push(new Tile(row * 16, column * 16, "tileSet/252.png", 1));
            break;
          case 194:
            col.push(new Tile(row * 16, column * 16, "tileSet/262.png", 1));
            break;
          case 263:
            col.push(new Tile(row * 16, column * 16, "tileSet/113.png", 1));
            break;
          case 264:
            col.push(new Tile(row * 16, column * 16, "tileSet/123.png", 1));
            break;
          case 265:
            col.push(new Tile(row * 16, column * 16, "tileSet/133.png", 1));
            break;
          case 267:
            col.push(new Tile(row * 16, column * 16, "tileSet/153.png", 1));
            break;
          case 268:
            col.push(new Tile(row * 16, column * 16, "tileSet/163.png", 1));
            break;
          case 269:
            col.push(new Tile(row * 16, column * 16, "tileSet/173.png", 1));
            break;
          case 355:
            col.push(new Tile(row * 16, column * 16, "tileSet/194.png", 1));
            break;
          case 356:
            col.push(new Tile(row * 16, column * 16, "tileSet/204.png", 1));
            break;
          case 431:
            col.push(new Tile(row * 16, column * 16, "tileSet/115.png", 1));
            break;
          case 432:
            col.push(new Tile(row * 16, column * 16, "tileSet/125.png", 1));
            break;
          case 433:
            col.push(new Tile(row * 16, column * 16, "tileSet/135.png", 1));
            break;
          case 435:
            col.push(new Tile(row * 16, column * 16, "tileSet/155.png", 1));
            break;
          case 437:
            col.push(new Tile(row * 16, column * 16, "tileSet/175.png", 1));
            break;
          case 439:
            col.push(new Tile(row * 16, column * 16, "tileSet/195.png", 1));
            break;
          case 440:
            col.push(new Tile(row * 16, column * 16, "tileSet/205.png", 1));
            break;
          case 442:
            col.push(new Tile(row * 16, column * 16, "tileSet/225.png", 1, { height: 3}));
            break;
          case 443:
            col.push(new Tile(row * 16, column * 16, "tileSet/235.png", 1, { height: 3}));
            break;
          case 444:
            col.push(new Tile(row * 16, column * 16, "tileSet/245.png", 1, { height: 3}));
            break;
          case 445:
            col.push(new Tile(row * 16, column * 16, "tileSet/255.png", 1, { height: 3}));
            break;
          case 446:
            col.push(new Tile(row * 16, column * 16, "tileSet/265.png", 1, { height: 3}));
            break;
          case 519:
            col.push(new Tile(row * 16, column * 16, "tileSet/156.png", 1));
            break;
          case 521:
            col.push(new Tile(row * 16, column * 16, "tileSet/176.png", 1));
            break;
          case 527:
            col.push(new Tile(row * 16, column * 16, "tileSet/236.png", 0));
            break;
          case 528:
            col.push(new Tile(row * 16, column * 16, "tileSet/246.png", 0));
            break;
          case 599:
            col.push(new Tile(row * 16, column * 16, "tileSet/117.png", 1));
            break;
          case 600:
            col.push(new Tile(row * 16, column * 16, "tileSet/127.png", 1));
            break;
          case 601:
            col.push(new Tile(row * 16, column * 16, "tileSet/137.png", 1));
            break;
          case 603:
            col.push(new Tile(row * 16, column * 16, "tileSet/157.png", 1));
            break;
          case 605:
            col.push(new Tile(row * 16, column * 16, "tileSet/177.png", 1));
            break;
          case 612:
            col.push(new Tile(row * 16, column * 16, "tileSet/247.png", 0));
            break;
          case 613:
            col.push(new Tile(row * 16, column * 16, "tileSet/257.png", 0));
            break;       
        }
      }
      tableauTiles.push(col);
    }
    
    return tableauTiles;
  }

  renderMap(c) { // Parcours le tableau qui contient toute les Tiles et les affiches
    for (let column = 0; column < this.tabTiles.length; column++) {
      for (let row = 0; row < this.tabTiles[column].length; row++) {
        this.tabTiles[column][row].render(this.c);
      }
    }
  }

  updateMap() { // Met à jour la position de certaines tiles qui bougent par exemple
    for (let column = 0; column < this.tabTiles.length; column++) {
      for (let row = 0; row < this.tabTiles[column].length; row++) {
        this.tabTiles[column][row].update();
      }
    }
  }

  updateChrono() {
    this.tempsActuel = new Date();
    this.calculTemps = this.tempsActuel.getTime() - this.tempsDepart.getTime();
  }

  renderChrono() {
    
    let millisecondes = this.calculTemps % 1000;
    let secondes = Math.floor((this.calculTemps / 1000) % 60);
    let minutes = Math.floor((this.calculTemps / (1000 * 60)) % 60);
    let heures = Math.floor((this.calculTemps / (1000 * 60 * 60)) % 24);

    this.c.fillStyle = "#000000"; 
    this.c.font = "10px Arial";
    let txt = heures + ':' + minutes + ':' + secondes + '.' + millisecondes;
    this.c.fillText(txt, (this.player.camera.position.cx - 10*16), (this.player.camera.position.cy - 6*16));
  }
  
  // BOUCLE DU JEU :
  render() { // AFFICHAGE    
    this.renderCanvas(); // Affichage du canvas
    
    this.camera.begin();
    // Affichage du jeu dans la caméra :
    this.player.render(this.c); // Affiche le joueur
    this.renderMap(this.c); // Afficher la map
    this.renderChrono(); // Affichage du chrono
    this.camera.end();
  }

  update() { //TOUT LE RESTE
    this.gameStarted = true; // Dit que le jeu est démarré
    this.updateChrono(); // Met à jour le chronomètre
    this.detectInput(); // Détecte les actions faites sur le clavier
    this.updateMap(); // Met à jour la position des Tiles sur la map
    this.player.update(); // Met à jour le joueur
    //this.song02.play();
    this.camera.moveTo(this.player.camera.position.cx, this.player.camera.position.cy);
  }
}