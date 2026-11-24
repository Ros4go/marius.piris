const game = new Game();
// Les niveaux (CSV) sont chargés en asynchrone : on ne lance la boucle qu'une fois prêts.
game.load().then(() => {
  const engine = new Engine(1000 / 60, function() { game.update() }, function() { game.render() });
  engine.start(); //SERT DE WHILE TRUE
}).catch((err) => {
  console.error('Chargement du jeu impossible :', err);
});
