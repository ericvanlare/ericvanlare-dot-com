import { Link } from 'react-router-dom';

interface ProjectCardProps {
  title: string;
  subtitle: string;
  description: string;
  thumbnailSrc: string;
  linkUrl: string;
  linkText: string;
  isExternal?: boolean;
}

export function ProjectCard({
  title,
  subtitle,
  description,
  thumbnailSrc,
  linkUrl,
  linkText,
  isExternal = false,
}: ProjectCardProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <div className="w-full md:w-1/3 flex-shrink-0">
        <div className="aspect-video rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <img 
            src={thumbnailSrc}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="flex-1 border-l-4 border-accent-500 pl-6">
        <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {subtitle}
        </p>
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4 max-w-prose">
          {description}
        </p>
        {isExternal ? (
          <a 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block text-accent-600 dark:text-accent-400 hover:underline"
          >
            {linkText}
          </a>
        ) : (
          <Link 
            to={linkUrl} 
            className="inline-block text-accent-600 dark:text-accent-400 hover:underline"
          >
            {linkText}
          </Link>
        )}
      </div>
    </div>
  );
}
