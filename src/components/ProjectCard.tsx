import { Link } from 'react-router-dom';

interface ProjectCardProps {
  title: string;
  subtitle: string;
  description: string;
  linkUrl: string;
  isExternal?: boolean;
}

export function ProjectCard({
  title,
  subtitle,
  description,
  linkUrl,
  isExternal = false,
}: ProjectCardProps) {
  const cardContent = (
    <>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {subtitle}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
        {description}
      </p>
    </>
  );

  const cardClassName = "group block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-5 py-4 hover:border-accent-500/50 hover:shadow-sm transition-all";

  if (isExternal) {
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link to={linkUrl} className={cardClassName}>
      {cardContent}
    </Link>
  );
}
