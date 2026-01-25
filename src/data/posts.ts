import type { ComponentType } from 'react';
import AiSiteModificationArchitecturePost from '../blog-content/posts/ai-site-modification-architecture';
import DiagrammingAgentPost from '../blog-content/posts/designing-a-diagramming-agent';

export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  featured?: boolean;
  pinned?: boolean;
  content: ComponentType;
}

export const posts: Post[] = [
  {
    slug: 'ai-site-modification-architecture',
    title: 'Building an AI Site Modification API',
    date: 'January 2026',
    description: 'The technical architecture behind using GitHub Issues + Copilot + Cloudflare Workers as an AI-powered site editing API.',
    featured: true,
    content: AiSiteModificationArchitecturePost,
  },
  {
    slug: 'designing-a-diagramming-agent',
    title: 'A Prompt for Grounded Codebase Diagrams',
    date: 'January 2026',
    description: 'AI diagrams are useless if you can\'t click them. Here\'s a prompt that generates diagrams where every node links to real code.',
    pinned: true,
    content: DiagrammingAgentPost,
  },
];

export const featuredPosts = posts.filter((post) => post.featured);
export const pinnedPost = posts.find((post) => post.pinned);
export const latestPost = posts.find((post) => !post.pinned);
