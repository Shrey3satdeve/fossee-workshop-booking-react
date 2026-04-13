/**
 * Navbar.jsx
 *
 * Fixed top navigation bar.
 *
 * Design decisions:
 * - Glass morphism background so page content can partially show through —
 *   gives depth without eating visual space.
 * - The mobile nav slides down from underneath the bar (not a modal overlay)
 *   so the user always knows where they are.
 * - Active links get a subtle bottom border in the primary colour — common
 *   in academic / dashboard apps, familiar to student users.
 * - User avatar is the first letter of their name in a coloured circle —
 *   personalises the bar without a profile photo upload requirement.
 */

import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, BookOpen } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen]     = useState(false);
  const dropRef                     = useRef(null);
  const navigate                    = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile nav on route change
  const closeMobile = () => setMobileOpen(false);

  function handleLogout() {
    onLogout();
    navigate('/login');
  }

  const isInstructor = user?.position === 'instructor';
  const dashPath = isInstructor ? '/instructor' : '/dashboard';
  const initials  = user ? (user.first_name?.[0] ?? user.username?.[0] ?? '?').toUpperCase() : '';

  return (
    <header className={styles.header} role="banner">
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.inner}>
          {/* Brand */}
          <NavLink to={user ? dashPath : '/'} className={styles.brand} onClick={closeMobile}>
            <span className={styles.brandIcon} aria-hidden="true">
              <BookOpen size={20} />
            </span>
            <span>FOSSEE <strong>Workshops</strong></span>
          </NavLink>

          {/* Desktop links */}
          {user && (
            <ul className={styles.links} role="list">
              <li>
                <NavLink to={dashPath} className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                  My Workshops
                </NavLink>
              </li>
              <li>
                <NavLink to="/workshops" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                  Browse Types
                </NavLink>
              </li>
              {!isInstructor && (
                <li>
                  <NavLink to="/propose" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                    Propose
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink to="/stats" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                  Statistics
                </NavLink>
              </li>
            </ul>
          )}

          {/* Right side */}
          <div className={styles.right}>
            {user ? (
              <div className={styles.avatarWrap} ref={dropRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setDropOpen(!dropOpen)}
                  aria-expanded={dropOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <span className={styles.avatar}>{initials}</span>
                  <span className={styles.userName}>{user.first_name || user.username}</span>
                  <ChevronDown size={14} className={dropOpen ? styles.chevronUp : ''} />
                </button>

                {dropOpen && (
                  <div className={styles.dropdown} role="menu">
                    <NavLink
                      to="/profile"
                      className={styles.dropItem}
                      role="menuitem"
                      onClick={() => setDropOpen(false)}
                    >
                      <User size={14} /> Profile
                    </NavLink>
                    <div className={styles.dropDivider} />
                    <button className={styles.dropItemDanger} role="menuitem" onClick={handleLogout}>
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/login" className="btn btn-primary btn-sm">
                Sign In
              </NavLink>
            )}

            {/* Hamburger (mobile only) */}
            <button
              className={styles.ham}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        <div className={`${styles.mobile} ${mobileOpen ? styles.mobileOpen : ''}`} aria-hidden={!mobileOpen}>
          {user ? (
            <ul role="list">
              <li>
                <NavLink to={dashPath} className={styles.mobileLink} onClick={closeMobile}>My Workshops</NavLink>
              </li>
              <li>
                <NavLink to="/workshops" className={styles.mobileLink} onClick={closeMobile}>Browse Workshop Types</NavLink>
              </li>
              {!isInstructor && (
                <li>
                  <NavLink to="/propose" className={styles.mobileLink} onClick={closeMobile}>Propose a Workshop</NavLink>
                </li>
              )}
              <li>
                <NavLink to="/stats" className={styles.mobileLink} onClick={closeMobile}>Workshop Statistics</NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={styles.mobileLink} onClick={closeMobile}>My Profile</NavLink>
              </li>
              <li>
                <button className={styles.mobileLinkBtn} onClick={() => { closeMobile(); handleLogout(); }}>
                  Logout
                </button>
              </li>
            </ul>
          ) : (
            <ul role="list">
              <li><NavLink to="/login" className={styles.mobileLink} onClick={closeMobile}>Sign In</NavLink></li>
              <li><NavLink to="/register" className={styles.mobileLink} onClick={closeMobile}>Create Account</NavLink></li>
            </ul>
          )}
        </div>
      </nav>
    </header>
  );
}
