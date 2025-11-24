const game = new Game();
const engine = new Engine(1000 / 60, function() { game.update() }, function() { game.render() });
engine.start(); //SERT DE WHILE TRUE 