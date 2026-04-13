/* Footer — intentionally minimal so it never competes with content */

import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <p>
          Developed by{' '}
          <a
            href="https://fossee.in"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit FOSSEE website"
          >
            FOSSEE Group
          </a>
          , IIT Bombay
        </p>
        <p className={styles.copy}>
          Free &amp; Open Source Software for Education
        </p>
      </div>
    </footer>
  );
}
