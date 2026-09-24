class Entity {
  constructor(x, y, sprite) {
    this.x = x;
    this.y = y;
    this.sprite = new Image();
    this.sprite.src = sprite;
    this.followTarget = null;
    this.following = false;
    this.followDistance = 40;
    this.collide = true;
  }

  updatePosition() {
    if (this.followTarget) { // Si l'on doit suivre une cible
      const dx = this.followTarget.position.x - this.x;
      const dy = this.followTarget.position.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= 20 || this.following) {
        if (!this.following) {
          this.following = true;
        }

        // Si la distance est plus grande que la distance de suivi, on se déplace vers la cible
        if (distance > this.followDistance) {
          const angle = Math.atan2(dy, dx);
          this.x += Math.cos(angle) * (distance - this.followDistance);
          this.y += Math.sin(angle) * (distance - this.followDistance);
        }
      }
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
    }
  }

  render(c) {
    try {
      c.drawImage(this.sprite, this.x, this.y);
    } catch { }
  }

  update() {
    this.updatePosition();
  }
};