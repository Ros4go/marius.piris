 class Tile {
  constructor(x, y, image, collision, settings = {}) {
    this.x = x;
    this.y = y;
    this.height = settings.height || 16;
    this.width = 16;
    this.image = image; // Permet de récuperer une image 
    this.collision = collision;
    
    // CERCLE
    this.cX = settings.cX || 0; // Pour déterminer le centre du cercle
    this.cY = settings.cY || 0; // Pour déterminer le centre du cercle
    this.rayon = settings.rayon || 5 * 16;
    this.positionCercle = settings.positionCercle || 0;// Pour déterminer le numéro du cercle car certains toune dans un sens et l'autre de l'autre sens

    this.changeLvl = settings.changeLvl || "";
    
    this.distanceX = settings.distanceX || 0; // Permet de choisir la distance qu'on veux passer en paramètre pour la distance de déplacement
    this.distanceY = settings.distanceY || 0;
    
    this.direction = 1; // Juste une variable de décision facon True et False.
    this.movingDirection = "no"; // Transmet l'information au joueur
    
    this.speed = settings.speed || 1; // Une varible speed pour choisir la vitesse a laquel on veut que la plateform se déplace ou sinon reste pas défaut 1 
    
    this.positionX = this.x; // Récupère la position de X au départ
    this.positionY = this.y; // Récupère la position de y au départ

    this.Thwomp = settings.Thwomp || false; // Pour indiquer le type de plateforme

    this.doorO = settings.doorO || false; // Pour indiquer le type de plateforme

    this.canTravers = settings.canTravers || false;
    
  }
   
  mouvePlateformX() { // Plateform bougeant sur l'axe des X
    let distance = this.distanceX * this.width;
    // On met plusieurs conditions pour pas que ca crée des incohérence avec les autres plateformes.
    if (this.distanceX != 0 && this.distanceY == 0 && !this.Thwomp) {
      this.movingDirection = "X";
      
      if (this.direction == 1) {
        this.x += this.speed;
      } 
      else if (this.direction == -1) {
        this.x -= this.speed;
      }
      // Des qu'elle atteind une position, elle change de direction
      if (this.x <= this.positionX || this.x >= this.positionX + distance) {
        this.direction *= -1;
      }
    }
  }
  
  mouvePlateformY(){ // Plateform bougeant sur l'axe des Y
    let distance = this.distanceY * this.height;
    // On met plusieurs conditions pour pas que ca crée des incohérence avec les autres plateformes.
    if (this.distanceY != 0 && this.distanceX == 0 && !this.Thwomp) { // J'ai jouté le == 0 ici et depuis la plateforme vibre -_(0.0)_-
      this.movingDirection = "Y";
      
      if (this.direction == 1) {
        this.y -= this.speed;
      } 
      else if (this.direction == -1) {
        this.y += this.speed;
      }
      // Des qu'elle atteind une position, elle change de direction
      if (this.y >= this.positionY || this.y <= this.positionY - distance) {
        this.direction *= -1;
      }
    }
  }
  
  mouvePlateformXY(){
    let distance = this.distanceX * this.height;
    // On met plusieurs conditions pour pas que ca crée des incohérence avec les autres plateformes.
    if (this.distanceY != 0 && this.distanceX != 0 && !this.Thwomp) {
      this.movingDirection = "X";
      
      if (this.direction == 1) {
        this.x++;
        this.y--;
      } 
      else if (this.direction == -1) {
        this.y++;
        this.x--;  
      }
      // Des qu'elle atteind une position, elle change de direction
      if (this.y >= this.positionY || this.y <= this.positionY - distance) {
        this.direction *= -1;
      }
    }
  }
  
  mouvePlateformCercle(){    
    // On met plusieurs conditions pour pas que ca crée des incohérence avec les autres plateformes.
    if (this.cY != 0 && this.cX != 0 /*&& this.distanceX == 0 && this.distanceY == 0*/ && !this.Thwomp &&  this.positionCercle == 1) {
      this.movingDirection = "XY";
      let rayon = this.rayon; 
      let angle = Math.atan2(this.y - this.cY, this.x - this.cX); // Permet de calculer l'angle
      let tempX = this.x;
      let tempY = this.y;
        
      // Boucle de déplacement en cercle
      for (let i = 0; i < 360; i += 1) {
        // Calcul des nouvelles coordonnées
        angle += 0.00001 * this.speed;
        tempX = this.cX +  rayon * Math.cos(angle);
        tempY = this.cY +  rayon * Math.sin(angle);    
        
        // Mise à jour des coordonnées du tile
        this.x = Math.round(tempX);
        this.y = Math.round(tempY);
      }       
    }
  }
  
  mouvePlateformCercleInverse(){
    // On met plusieurs conditions pour pas que ca crée des incohérence avec les autres plateformes.
    if (this.cY != 0 && this.cX != 0 /*&& this.distanceX == 0 && this.distanceY == 0*/ && !this.Thwomp &&  this.positionCercle == 2) {
      this.movingDirection = "XY";
      let rayon = this.rayon; 
      let angle = Math.atan2(this.y - this.cY, this.x - this.cX); // Permet de calculer l'angle
      let tempX = this.x;
      let tempY = this.y;
        
      // Boucle de déplacement en cercle
      for (let i = 0; i < 360; i += 1) {
        //// Calcul des nouvelles coordonnées
        angle -= 0.00001 * this.speed;
        tempX = this.cX +  rayon * Math.cos(angle);
        tempY = this.cY+  rayon * Math.sin(angle);    
        
        // Mise à jour des coordonnées du tile
        this.x = Math.round(tempX);
        this.y = Math.round(tempY);
      }       
    }
  }
  
  plateformThwomp(){ // Ceux qui ont la ref :) et ceux qui n'ont pas la ref tempi
    let distance = this.distanceY * this.height;
    // On met plusieurs conditions pour pas que ca crée des incohérence avec les autres plateformes.
    if (this.distanceY != 0 && this.distanceX == 0 && this.Thwomp) {
      if (this.direction == 1) {
        this.y += this.speed;
      } 
      else if (this.direction == -1) {
        this.y--;
      }
      // Des qu'elle atteind une position, elle change de direction
      if (this.y - this.height >= this.positionY + distance || this.y <= this.positionY) {
        this.direction *= -1;
      }
    }
  }
  
  door(){
    // Normalement elle ne devrait pas s'activer toute seul mais seulement quand le joueur a la clé
      let stop = true;
      // Des qu'elle atteind une position, elle s'arrête
      if (this.y <= this.positionY - 2 *16){
        stop = false;
      }
      if (this.doorO == true){
        if (stop == true){
          this.y--; 
        }
        if (stop == false ){
         this.y; 
        }
      }
   } 
  
  loadImage(imageName) { // On récupère l'image de la tile
    var img = new Image();
    imageName = 'images/tileSet/' + imageName + '.png';
    img.src = imageName;
    return img;
  }
  
  render(ctx) { // Affichage
    ctx.drawImage(this.image, this.x, this.y);
  }
  
  update() {
    this.mouvePlateformX();
    this.mouvePlateformY();
    this.mouvePlateformXY();
    this.mouvePlateformCercle(); 
    this.mouvePlateformCercleInverse();
    this.plateformThwomp();
    this.door();
  }
}