class Engine {
  constructor(time_step, update, render) {
    this.accumulated_time = 0;
    this.animation_frame_request = undefined;
    this.time = undefined;
    this.time_step = time_step;
    this.updated = false; // Indique si l'animation a été mise à jour depuis le dernier rendu
    this.update = update;
    this.render = render;
  }

  // Fonction qui gère l'animation en boucle
  run(time_stamp) {
    this.accumulated_time += time_stamp - this.time;
    this.time = time_stamp;
    if (this.accumulated_time >= this.time_step * 3) {
      this.accumulated_time = this.time_step;
    }

    while (this.accumulated_time >= this.time_step) {
      this.accumulated_time -= this.time_step;
      this.update(time_stamp);
      this.updated = true;
    }

    // Si l'animation a été mise à jour, on appelle la fonction de rendu
    if (this.updated) {
      this.updated = false;
      this.render(time_stamp);
    }

    // On demande au navigateur d'appeler la fonction handleRun à chaque nouvelle frame
    this.animation_frame_request = window.requestAnimationFrame(
      this.handleRun.bind(this)
    );
  }

  handleRun(time_step) { // Fonction qui sert d'intermédiaire pour appeler la fonction run à chaque nouvelle frame
    this.run(time_step);
  }

  start() {
    this.accumulated_time = this.time_step;
    this.time = window.performance.now();
    this.animation_frame_request = window.requestAnimationFrame( // While true
      this.handleRun.bind(this)
    );
  }

  stop() {
    window.cancelAnimationFrame(this.animation_frame_request);
  }
}