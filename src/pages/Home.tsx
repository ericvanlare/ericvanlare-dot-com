import { Link } from 'react-router-dom';

function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-6xl mx-auto py-12">
      <section className="mb-20">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight text-gray-900 dark:text-gray-100">
          Eric Van Lare
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
          UX Engineer & Founder
        </p>
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 max-w-2xl leading-relaxed">
          Building <a href="https://naiadai.com" target="_blank" rel="noopener noreferrer" className="text-accent-600 dark:text-accent-400 hover:underline">NaiadAI</a> and new user experiences only possible with Generative AI.
        </p>
      </section>

      <section className="mb-20">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-gray-100">NaiadAI</h2>
        <div className="border-l-4 border-accent-500 pl-6">
          <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Naiad Lens</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            AI-powered IDE plugin for understanding large codebases
          </p>
          <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
            Naiad Lens helps developers make sense of complex codebases through interactive, clickable diagrams. Available for JetBrains IDEs and VSCode/Cursor.
          </p>
          <a href="https://naiadai.com" target="_blank" rel="noopener noreferrer" className="inline-block text-accent-600 dark:text-accent-400 hover:underline">
            Visit NaiadAI →
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-gray-100">Projects</h2>
        <div className="border-l-4 border-accent-500 pl-6">
          <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">PaintMyCity</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Generate unique artistic depictions of cities using neural style transfer
          </p>
          <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
            An interactive web app that researches city landmarks, composes them into a custom scene, and applies neural style transfer to create artistic renditions in the style of famous paintings.
          </p>
          <Link to="/projects/paintmycity" className="inline-block text-accent-600 dark:text-accent-400 hover:underline">
            Try PaintMyCity →
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
