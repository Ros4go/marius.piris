// app.jsx
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Projects from './components/Projects.jsx';
import FrometonsGame from './components/FrometonsGame.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <div className="bg-gray-900 text-white font-inter min-h-screen">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <Hero />
        <About />
        <Projects />
        <FrometonsGame />
        <Contact />
      </main>
    </div>
  );
}
