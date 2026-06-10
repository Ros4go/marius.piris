// CLASSE NON IMPLEMENTEE POUR LE MOMENT
class Level {
  constructor() {
    this.sprites = [];
    this.entity = [];
    this.backMap = [];
    this.frontMap = [];
  }

  loadImage(imageName) {
    var img = new Image();
    imageName = 'images/tileSet/' + imageName + '.png';
    img.src = imageName;
    return img;
  }
    
  initSprites(map) {
    for (let column = 0; column < map.length; column++) {
      for (let row = 0; row < map[column].length; row++) {
        if(map[column][row] >= 0 && !this.sprites.hasOwnProperty(map[column][row]+1)) {
          this.sprites[map[column][row]+1] = this.loadImage(map[column][row]+1);
        }
      }
    }
  }
  
  createLvl(lvl) {
    this.entity = [];
    this.backMap = [];
    this.sprites = [];
    this.frontMap = [];
    
    let unCollidableTiles = [ 42, 43, 44, 45, 122, 123, 124, 125, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 457, 458, 527, 528, 612, 720, 721, 722, 723, 724, 126, 127, 128, 129, 484, 485, 486, 487, 488, 489, 490, 491, 568, 569, 570, 571, 572, 573, 574, 575, 526, 528, 529, 530, 610, 611, 612, 614, 652, 653, 654, 655, 656, 657, 658, 659, 893, 894, 895, 1189, 1273, 1273, 1189, 1195, 1279, 1196, 1280, 852, 1193, 1194, 855, 856, 936, 1277, 1278, 853, 937, 795, 879, 963, 1047, 1458, 1191, 1192, 1275, 1276, 1304, 1305, 1306, 1307, 1388, 1389, 1390, 1391, 1472, 1473, 1474, 1475, 1556, 1557, 1558, 1559, 1640, 1641, 1642, 1643, 1459, 1189, 1190, 1273, 1274, 1105, 1106];
    let backTiles = [1047, 963, 879, 795, 852, 936, 1641, 1642, 1558, 1557, 1473, 1474, 1388, 1389, 1390, 1391, 1304, 1305, 1306, 1307, 1459, 1458]
    
    let tableauTiles = [];
    let map = lvl;
    this.initSprites(map);
    for (let column = 0; column < map.length; column++) {
      let col = [];
      for (let row = 0; row < map[column].length; row++) {
        if(map[column][row] >=0 && map[column][row] <=2015 && map[column][row] != 1396 && map[column][row] != 1651 && !backTiles.includes(map[column][row])) {
          let settings = {};
          let collide = true;
          switch (map[column][row]) {

            // PLATEFORMES QUI BOUGE
            case 1394:
              settings = { distanceX: 3};
              break;
            case 1395:
              settings = { distanceY: 3};
              break;
            case 1397:
              settings = { changeLvl: "lvl1" };
              break;
            case 1398:
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
        else if (map[column][row] == 1396) {
          this.spawnX = row * 16;
          this.spawnY = column * 16;
        }
        else if (map[column][row] == 1651) {
          this.entity.push(new Entity(row * 16, column * 16, 'images/tileSet/' + (766+1) + '.png'));
        }
        else if(backTiles.includes(map[column][row])) {
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

  updateEntity() {
    for(let nb = 0; nb < this.entity.length; nb++) {
      this.entity[nb].followTarget = this.player;
      this.entity[nb].update();
    }
  }

  renderEntity(c) {
    for(let nb = 0; nb < this.entity.length; nb++) {
      this.entity[nb].render(c);
    }
  }
  
  render(c) {
    
  }

  update() {
  
  }
}