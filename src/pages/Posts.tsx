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

      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/posts/${post.slug}`}
            className="group block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-5 py-4 hover:border-accent-500/50 hover:shadow-sm transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {post.date}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default Posts;
