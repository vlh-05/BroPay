import { Link } from "react-router-dom";
import "./Index.css";

export default function Index() {
  return (
    <div className="home-container">
      {/* Navigation */}
      <header className="home-header">
        <div className="header-content">
          <Link to="/" className="logo">
            🚀 BroPay
          </Link>
          <div className="nav-buttons">
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Fast, Secure Payment Solutions</h1>
            <p>
              Send and receive payments instantly with BroPay. Secure, reliable,
              and trusted by thousands.
            </p>

            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                Start Free Trial →
              </Link>
              <button className="btn btn-secondary btn-large">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Feature Illustration */}
          <div className="hero-features">
            <div className="feature-box">
              <div className="feature-icon">⚡</div>
              <div>
                <p className="feature-title">Instant Transfers</p>
                <p className="feature-desc">Send money in seconds</p>
              </div>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🔒</div>
              <div>
                <p className="feature-title">Bank-Level Security</p>
                <p className="feature-desc">Your data is always protected</p>
              </div>
            </div>
            <div className="feature-box">
              <div className="feature-icon">👥</div>
              <div>
                <p className="feature-title">Easy Splitting</p>
                <p className="feature-desc">Split bills with friends instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-card-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Transfers complete in seconds, not days</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">🔒</div>
            <h3>Completely Secure</h3>
            <p>Enterprise-grade encryption protects your money</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">👥</div>
            <h3>Built for Groups</h3>
            <p>Perfect for splitting expenses with friends</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2>Ready to get started?</h2>
          <p>
            Join thousands of users who trust BroPay for their payment needs.
          </p>
          <Link to="/register" className="btn btn-primary btn-large">
            Create Your Account →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>BroPay</h4>
            <p>Fast, secure payment solutions for everyone.</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#security">Security</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 BroPay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
