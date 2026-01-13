import type { ComponentType } from 'react';
import DiagrammingAgentPost from '../content/posts/designing-a-diagramming-agent';

export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  featured?: boolean;
  content: ComponentType;
}

export const posts: Post[] = [
  {
    slug: 'designing-a-diagramming-agent',
    title: 'A Prompt for Grounded Codebase Diagrams',
    date: 'January 2026',
    description: 'AI diagrams are useless if you can\'t click them. Here\'s a prompt that generates diagrams where every node links to real code.',
    featured: true,
    content: DiagrammingAgentPost,
  },
];

export const featuredPosts = posts.filter((post) => post.featured);
