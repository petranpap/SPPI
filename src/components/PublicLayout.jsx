import { Link } from 'react-router-dom'

// Shared frame for the public pages (welcome, login, help): header, content, footer.
export default function PublicLayout({ user, hideSignIn = false, children }) {
  return (
    <div className="public-page">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span className="brand-pill">SPPI</span>
          <span className="brand-title">Corner Kick Recorder</span>
        </Link>

        <nav className="public-nav" aria-label="Site">
          <Link to="/help">Help &amp; FAQ</Link>
          {user
            ? <Link to="/app" className="cta cta--light">Open recorder</Link>
            : !hideSignIn && <Link to="/login" className="cta cta--light">Sign in</Link>}
        </nav>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-footer">
        <span>SPPI — Set-Piece Phase Instance · PhD research, Cyprus University of Technology</span>
        <Link to="/help">Help &amp; FAQ</Link>
      </footer>
    </div>
  )
}
