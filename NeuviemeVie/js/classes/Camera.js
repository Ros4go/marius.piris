class Camera {
  constructor(context, settings = {}) {
    this.lookAt = settings.initialPosition || [0, 0];
    this.context = context;
    this.width = settings.width;
    this.height = settings.height;
    this.viewport = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
      scale: [settings.scaleX || 1.0, settings.scaleY || 1.0]
    };
    this.init();
  }

  init() {
    this.updateViewport();
  }

  begin() {
    this.context.save();
    this.applyScale();
    this.applyTranslation();
  }

  end() {
    this.context.restore();
  }

  applyScale() {
    //this.context.scale(this.viewport.scale[0], this.viewport.scale[1]);
  }

  applyTranslation() {
    this.context.translate(-this.viewport.left, -this.viewport.top);
  }

  updateViewport() {
    this.viewport.width = this.width;
    this.viewport.height = this.height; 
    
    this.viewport.left = Math.floor(this.lookAt[0] - (this.viewport.width / 2.0));
    this.viewport.top = Math.floor(this.lookAt[1] - (this.viewport.height / 2.0));
    this.viewport.right = this.viewport.left + this.viewport.width / 2;
    this.viewport.bottom = this.viewport.top + this.viewport.height / 2; 
    
    this.viewport.scale[0] = this.width / this.viewport.width;
    this.viewport.scale[1] = this.height / this.viewport.height;
  }

  moveTo(x, y) {
    this.lookAt[0] = x;
    this.lookAt[1] = y;
    this.updateViewport();
  }
};