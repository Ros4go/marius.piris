export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950 bg-opacity-90 backdrop-blur-md shadow-xl p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Marius Piris
        </h1>
        <div className="flex space-x-6 text-lg">
          <a href="#hero" className="hover:text-purple-300">Accueil</a>
          <a href="#about" className="hover:text-purple-300">À Propos</a>
          <a href="#projects" className="hover:text-purple-300">Projets</a>
          <a href="#frometons" className="hover:text-purple-300">Jouer</a>
          <a href="#contact" className="hover:text-purple-300">Contact</a>
        </div>
      </div>
    </nav>
  );
}
