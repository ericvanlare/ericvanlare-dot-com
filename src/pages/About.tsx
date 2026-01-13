import { Header } from '../components/Header';
import { ProjectCard } from '../components/ProjectCard';

function About() {
  return (
    <main className="min-h-screen px-6 sm:px-12 max-w-3xl mx-auto py-12">
      <Header />

      <section className="mb-16">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          About
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
          UX engineer building new experiences only possible with generative AI.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">NaiadAI</h2>
        <ProjectCard
          title="Naiad Lens"
          subtitle="AI-powered IDE plugin for understanding large codebases"
          description="Naiad Lens helps developers make sense of complex codebases through interactive, clickable diagrams. Available for JetBrains IDEs and VSCode/Cursor."
          thumbnailSrc={`${import.meta.env.BASE_URL}thumbnails/naiad-lens.svg`}
          linkUrl="https://naiadai.com"
          linkText="Visit NaiadAI →"
          isExternal
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Projects</h2>
        <ProjectCard
          title="PaintMyCity"
          subtitle="Generate unique artistic depictions of cities using neural style transfer"
          description="An interactive web app that researches city landmarks, composes them into a custom scene, and applies neural style transfer to create artistic renditions in the style of famous paintings."
          thumbnailSrc={`${import.meta.env.BASE_URL}thumbnails/paintmycity.svg`}
          linkUrl="/projects/paintmycity"
          linkText="Try PaintMyCity →"
        />
      </section>
    </main>
  );
}

export default About;
