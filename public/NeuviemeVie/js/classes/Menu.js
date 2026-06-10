class Menu {
  constructor(c){
    this.keys ={pause:{pressed:false}}
    this.img = new Image();
    this.img.src = 'images/foreground/Menu.png'; // On récupère l'image du menu
    this.textResume = "Resume";
    this.textSave = "Save";
    this.textLoad = "Load";
    this.textParameter = "Parameter";
    this.textLeave = "Leave";
    this.ctx = c;
    this.rect;
    this.event;
    this.mouseX;
    this.mouseY;
    this.textWidth;
    this.textHeight;
    this.mouseIsOnTxt = false;
  }

  render(){
    this.menuOn();
  }
 
  update() {
    this.handleMouse();
  }
  
  menuOn(){ // Quand le menu est activé
    if (this.keys.pause.pressed){
      this.ctx.drawImage(this.img, 5*16, -1*16 ); 
      this.ctx.font = "bold 11px Comic Sans MS";
      // Vérifier si la souris est sur le texte
      const textMetrics = this.ctx.measureText(this.textResume);
      this.textWidth = textMetrics.width;
      this.textHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
      if(this.mouseIsOnTxt) {
        this.ctx.fillStyle = '#FF0000';
      }
      else {
        this.ctx.fillStyle = '#6B2C0B';
      }

      this.ctx.fillText(this.textResume, 11*16, 6*16);
      this.ctx.fillText(this.textSave,  12*16, 7*16);
      this.ctx.fillText(this.textLoad, 11*16, 8*16);
      this.ctx.fillText(this.textParameter, 13*16, 9*16);
      this.ctx.fillText(this.textLeave, 10 *16, 10*16);
    }
  }
  
  handleMouse(){ // Tout qui est gérer par la souris passe par cette fonction.
    // Calcule pour déterminer la position de la souris sur le canvas.
     this.mouseX = this.event.clientX - this.rect.left;
    this.mouseY = this.event.clientY - this.rect.top;
    // Si la souris est sur le texte alors on change à true
    if (this.mouseX >= 44*16 && this.mouseX <= 54*16 && this.mouseY <= 24*16 && this.mouseY >= 22*16) {        // Changer la couleur du texte
        this.mouseIsOnTxt = true;
        //console.log("héhoooo du bateau");
      }
      else {
        this.mouseIsOnTxt = false;
      }
    //console.log("Mouse position: (" + this.mouseX + ", " + this.mouseY + ")");
    //console.log("test : 44*16 " + (this.mouseX >= (44*16)));
    //console.log("test : 54*16 " + (this.mouseX <= (54*16)));
    //console.log("test : 24*16 " + (this.mouseY <= (24*16)));
    //console.log("test4 : 22*16 " + (this.mouseY >= (22*16)));
    //console.log("height : "+ this.textHeight + "widht :" +this.textWidth)      
  
  }

  // -----------------------------------------------
  // Fonctions qui gèrent les boutons
  // -----------------------------------------------
  
  resume(){
    
  }
  
  save(){

  }

  load(){

  }

  parametre(){
    

  }

  leave(){

  }
}