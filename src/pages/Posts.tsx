import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { posts } from '../data/posts';

function Posts() {
  return (
    <main className="min-h-screen px-6 sm:px-12 max-w-3xl mx-auto py-12">
      <Header />

      <h1 className="text-2xl sm:text-3xl font-bold mb-12 text-gray-900 dark:text-gray-100">
        Posts
      </h1>

      <div className="space-y-10">
        {posts.map((post) => (
          <article key={post.slug}>
            <Link to={`/posts/${post.slug}`} className="group block">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors mb-1">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {post.date}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {post.description}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

export default Posts;
