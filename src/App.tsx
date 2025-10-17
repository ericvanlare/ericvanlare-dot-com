import { ThemeToggle } from './components/ThemeToggle';

function App() {
  return (
    <>
      <ThemeToggle />
      
      <main className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-6xl mx-auto py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight text-gray-900 dark:text-gray-100">
            Eric Van Lare
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            UX Engineer & Founder
          </p>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 max-w-2xl leading-relaxed">
            Building <a href="https://naiadai.com" target="_blank" rel="noopener noreferrer" className="text-accent-600 dark:text-accent-400 hover:underline">NaiadAI</a> and crafting exceptional user experiences.
          </p>
        </section>

        {/* Projects Section */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-gray-100">Projects</h2>
          <div className="space-y-12">
            <div className="border-l-4 border-accent-500 pl-6">
              <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">NaiadAI</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Founder & CEO
              </p>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                Building the next generation of AI-powered tools.
              </p>
              <a href="https://naiadai.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-accent-600 dark:text-accent-400 hover:underline">
                Visit NaiadAI →
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
