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
    title: 'Designing a Diagramming Agent for Codebases',
    date: 'January 2026',
    description: 'How I built an AI agent that generates interactive diagrams to help developers understand complex codebases.',
    featured: true,
    content: DiagrammingAgentPost,
  },
];

export const featuredPosts = posts.filter((post) => post.featured);
