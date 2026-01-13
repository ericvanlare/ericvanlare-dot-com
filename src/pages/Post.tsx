import { useParams, Navigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { posts } from '../data/posts';

function Post() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/posts" replace />;
  }

  const PostContent = post.content;

  return (
    <main className="min-h-screen px-6 sm:px-12 max-w-3xl mx-auto py-12">
      <Header />

      <article>
        <header className="mb-12">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
            {post.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {post.date}
          </p>
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <PostContent />
        </div>
      </article>
    </main>
  );
}

export default Post;
