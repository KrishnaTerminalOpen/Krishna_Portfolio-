import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg portfolio-navbar">
      <div className="container">

        {/* Logo */}
        <a className="navbar-brand" href="/">
          KS.
        </a>

        {/* Mobile Menu Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#portfolioNavbar"
          aria-controls="portfolioNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list"></i>
        </button>

        {/* Navigation Links */}
        <div
          className="collapse navbar-collapse"
          id="portfolioNavbar"
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">

            <li className="nav-item">
              <a className="nav-link active" href="/">
                Home
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/about">
                About
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/skills">
                Skills
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/projects">
                Projects
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/experience">
                Experience
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/certifications">
                Certifications
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/contact">
                Contact
              </a>
            </li>

          </ul>

          {/* Contact Button */}
          <a href="/contact" className="btn connect-btn">
            Let's Connect <i className="bi bi-arrow-right"></i>
          </a>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;