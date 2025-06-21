export default function Hero() {
  return (
    <section id="hero" className="h-screen flex items-center justify-center text-center">
      <div>
        <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
          Marius Piris
        </h2>
        <p className="text-2xl text-gray-200 mb-8">
          Développeur de Jeux & Créateur Multimédia
        </p>
        <a href="#projects" className="px-6 py-3 bg-purple-700 text-white rounded-full hover:bg-purple-800">
          Découvrir mes Projets
        </a>
      </div>
    </section>
  );
}