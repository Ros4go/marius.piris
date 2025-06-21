import projects from '../data/projects.js';

export default function Projects() {
  return (
    <section id="projects" className="min-h-screen py-24 px-4 bg-gray-900 text-gray-200">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-10">Projets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-xl shadow-md">
              <img src={proj.images[0]} alt={proj.title} className="w-full h-48 object-cover mb-4 rounded" />
              <h3 className="text-2xl font-semibold text-white mb-2">{proj.title}</h3>
              <p className="text-gray-300 line-clamp-3">{proj.description.replace(/<[^>]+>/g, '').slice(0, 150)}...</p>
              <a href={proj.link} target="_blank" className="text-purple-400 underline mt-2 inline-block">Voir plus</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}