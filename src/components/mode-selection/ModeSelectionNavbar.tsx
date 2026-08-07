import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LifeBuoy } from 'lucide-react';
import { studentRoutes } from '../../utils/routes';
import Logo from './Logo';

export default function ModeSelectionNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`ms-nav ${scrolled ? 'ms-nav--scrolled' : ''}`}>
      <div className="ms-nav__inner">
        <div className="ms-nav__left">
          <Link
            to={studentRoutes.dashboard}
            className="ms-nav__back"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>

          <Link
            to={studentRoutes.dashboard}
            className="ms-nav__logo"
            aria-label="Aɪra — go to dashboard"
          >
            <Logo size="md" markId="nav-mark" />
          </Link>

          <nav className="ms-nav__crumbs" aria-label="Breadcrumb">
            <Link to={studentRoutes.dashboard} className="ms-nav__crumb">
              Dashboard
            </Link>
            <ChevronRight className="ms-nav__sep" aria-hidden />
            <span className="ms-nav__crumb ms-nav__crumb--current" aria-current="page">
              Select mode
            </span>
          </nav>

          <span className="ms-nav__mobile-step" aria-current="page">
            Select mode
          </span>
        </div>

        <Link to="/blog" className="ms-btn ms-btn--ghost">
          <LifeBuoy className="h-4 w-4" aria-hidden />
          <span className="ms-btn__label">Explore guides</span>
        </Link>
      </div>
    </header>
  );
}
