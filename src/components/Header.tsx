import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useDarkMode();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="flex items-center justify-between pb-6 mb-10 sm:mb-12 border-b border-gray-200 dark:border-gray-800">
      <Link
        to="/"
        className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100"
      >
        Eric Van Lare
      </Link>

      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-8 text-base text-gray-600 dark:text-gray-400">
        <Link to="/posts" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          Posts
        </Link>
        <Link to="/about" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          About
        </Link>
        <a
          href="https://github.com/ericvanlare"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          GitHub
        </a>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile hamburger button */}
      <button
        onClick={toggleMenu}
        className="sm:hidden p-2 text-gray-600 dark:text-gray-400"
        aria-label="Toggle menu"
      >
        {menuOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sm:hidden z-50">
          <nav className="flex flex-col px-6 py-4 space-y-4 text-lg text-gray-700 dark:text-gray-300">
            <Link
              to="/posts"
              onClick={closeMenu}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Posts
            </Link>
            <Link
              to="/about"
              onClick={closeMenu}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              About
            </Link>
            <a
              href="https://github.com/ericvanlare"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              GitHub
            </a>
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                closeMenu();
              }}
              className="flex items-center gap-2 text-left hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {darkMode ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Light mode
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark mode
                </>
              )}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
