import { useRef } from 'react';
import { Link } from 'react-router-dom';
import NexCareLogo from '../../components/NexCareLogo';
import useStylesheet from '../../hooks/useStylesheet';
import useLandingEffects from './useLandingEffects';
import landingCss from '../../styles/landing.css?url';

// front-end/landing/landing.html, markup converted one-to-one. landing.css is
// mounted for the life of the route (its element selectors would leak into the
// portals if bundled), and landing.js lives in useLandingEffects.
export default function LandingPage() {
  const rootRef = useRef(null);
  useStylesheet(landingCss);
  useLandingEffects(rootRef);
  const year = new Date().getFullYear();

  return (
    <div className="landing-page" ref={rootRef}>
      {/* Navbar */}
      <nav id="navbar">
          <div className="container">
              <div className="nav-content">
                  <NexCareLogo />

                  {/* Navigation Links */}
                  <div className="nav-links">
                      <a href="#home" className="nav-link">Home</a>
                      <a href="#features" className="nav-link">Features</a>
                      <a href="#how-it-works" className="nav-link">How It Works</a>
                      <a href="#reviews" className="nav-link">Reviews</a>
                      <a href="#contact" className="nav-link">Contact Us</a>
                  </div>

                  {/* Auth Buttons */}
                  <div className="auth-buttons">
                      <Link to="/login" className="btn-signin">Sign In </Link>
                      <Link to="/signup" className="btn-primary">Register</Link>
                  </div>
              </div>
          </div>
      </nav>

      <main>
          {/* Hero Section */}
          <section id="home" className="hero">
              <div className="container">
                  <div className="hero-grid">
                      {/* Left Content */}
                      <div className="hero-content">
                          <h1 className="hero-title">NexCare – Smart Hospital Operations Platform</h1>

                          <p className="hero-description">
                              Seamlessly connect patients, hospital staff, ambulance teams, and management personnel
                              into one unified digital platform. Transform healthcare operations with intelligent automation,
                              real-time coordination, and streamlined workflows that improve patient care and operational efficiency.
                          </p>

                          <div className="hero-badges">
                              <div className="hero-badge">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                  </svg>
                                  <span>Find Hospitals by Speciality</span>
                              </div>
                              <div className="hero-badge">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                  </svg>
                                  <span>Book Appointments Online</span>
                              </div>
                              <div className="hero-badge">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                  </svg>
                                  <span>Emergency Ambulance Services</span>
                              </div>
                          </div>

                          <div className="hero-buttons">
                              <Link to="/login" className="btn-primary btn-large">
                                  Sign In
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                                  </svg>
                              </Link>

                              <Link to="/signup" className="btn-outline btn-large">Create Account</Link>
                              <Link to="/patient/hospital-search" className="btn-secondary btn-large">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                                  </svg>
                                  Find Hospitals
                              </Link>
                              <Link to="/hospital-registration" className="btn-secondary btn-large" style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-2a2 2 0 0 1 4 0v2"/><path d="M12 21v-2a2 2 0 0 1 4 0v2"/><path d="M3 21l9-9 9 9"/>
                                  </svg>
                                  Register Hospital
                              </Link>
                          </div>
                      </div>

                      {/* Right Illustration */}
                      <div className="hero-illustration">
                          <div className="dashboard-card floating">
                              <div className="dashboard-header">
                                  <h3>Dashboard Overview</h3>
                                  <div className="status-indicator"></div>
                              </div>
                            
                              <div className="dashboard-grid">
                                  <div className="stat-card stat-blue">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                                      </svg>
                                      <p className="stat-value">3K+</p>
                                      <p className="stat-label">Patients</p>
                                  </div>
                                
                                  <div className="stat-card stat-green">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                      </svg>
                                      <p className="stat-value">5K+</p>
                                      <p className="stat-label">Requests</p>
                                  </div>
                                
                                  <div className="stat-card stat-purple">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                      </svg>
                                      <p className="stat-value">200+</p>
                                      <p className="stat-label">Staff</p>
                                  </div>
                                
                                  <div className="stat-card stat-orange">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                      </svg>
                                      <p className="stat-value">300+</p>
                                      <p className="stat-label">Ambulance Requests</p>
                                  </div>
                              </div>
                          </div>

                          {/* Floating Icon */}
                          <div className="floating-icon rotating">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                              </svg>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          {/* Trust Section */}
          <section className="trust-section">
              <div className="container">
                  <div className="section-header">
                      <h2>Trusted by Healthcare Professionals</h2>
                      <p>Supporting efficient healthcare operations for patients, staff, and emergency services.</p>
                  </div>

                  <div className="stats-grid">
                      <div className="stat-card-large">
                          <div className="stat-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                              </svg>
                          </div>
                          <div className="stat-number" data-target="3000" data-suffix="+">0</div>
                          <div className="stat-text">Patients Managed</div>
                      </div>

                      <div className="stat-card-large">
                  <div className="stat-icon pulsing">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                  </div>
                  <div className="stat-number" data-target="5000" data-suffix="+">0</div>
                  <div className="stat-text">Appointments Scheduled</div>
              </div>

                      <div className="stat-card-large">
                          <div className="stat-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-2a2 2 0 0 1 4 0v2"/><path d="M12 21v-2a2 2 0 0 1 4 0v2"/><path d="M3 21l9-9 9 9"/>
                              </svg>
                          </div>
                          <div className="stat-number" data-target="50" data-suffix="+">0</div>
                          <div className="stat-text">Hospitals Listed</div>
                      </div>

                      <div className="stat-card-large">
      <div className="stat-icon pulsing">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8H15V6C15 4.89543 14.1046 4 13 4H5C3.89543 4 3 4.89543 3 6V16C3 17.1046 3.89543 18 5 18H6.18421C6.58354 19.165 7.69351 20 9 20C10.3065 20 11.4165 19.165 11.8158 18H16.1842C16.5835 19.165 17.6935 20 19 20C20.3065 20 21.4165 19.165 21.8158 18H23V14L20 10V8C20 6.89543 19.1046 6 18 6H17V8Z" />
              <path d="M15 8V12H20" />
              <path d="M7 11H11" />
              <path d="M9 9V13" />
              <circle cx="9" cy="18" r="2" />
              <circle cx="19" cy="18" r="2" />
          </svg>
      </div>
      <div className="stat-number" data-target="300" data-suffix="+">0</div>
      <div className="stat-text">Ambulance Requests</div>
  </div>
                  </div>
              </div>
          </section>

          {/* Hospital Search Preview Section */}
          <section className="hospital-search-preview">
              <div className="container">
                  <div className="section-header">
                      <h2>Find Your Perfect Hospital</h2>
                      <p>Search by speciality, location, and services to discover the right healthcare facility</p>
                  </div>

                  <div className="search-preview-container">
                      <div className="search-preview-card">
                          <div className="search-preview-header">
                              <div className="search-preview-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                                  </svg>
                              </div>
                              <h3>Smart Hospital Search</h3>
                          </div>

                          <div className="search-preview-filters">
                              <div className="filter-preview">
                                  <span className="filter-label">Speciality</span>
                                  <span className="filter-value">Cardiology</span>
                              </div>
                              <div className="filter-preview">
                                  <span className="filter-label">Location</span>
                                  <span className="filter-value">Tirupati</span>
                              </div>
                              <div className="filter-preview">
                                  <span className="filter-label">Services</span>
                                  <span className="filter-value">Emergency</span>
                              </div>
                          </div>

                          <div className="search-preview-results">
                              <div className="result-item">
                                  <div className="result-icon">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-2a2 2 0 0 1 4 0v2"/><path d="M12 21v-2a2 2 0 0 1 4 0v2"/><path d="M3 21l9-9 9 9"/>
                                      </svg>
                                  </div>
                                  <div className="result-content">
                                      <h4>NexCare AIIMS Super Speciality Hospital</h4>
                                      <p>Cardiology • Emergency • 24/7</p>
                                  </div>
                                  <div className="result-rating">
                                      <span>4.8</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                      </svg>
                                  </div>
                              </div>

                              <div className="result-item">
                                  <div className="result-icon">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-2a2 2 0 0 1 4 0v2"/><path d="M12 21v-2a2 2 0 0 1 4 0v2"/><path d="M3 21l9-9 9 9"/>
                                      </svg>
                                  </div>
                                  <div className="result-content">
                                      <h4>Apollo Health City</h4>
                                      <p>Cardiology • Multi-Speciality</p>
                                  </div>
                                  <div className="result-rating">
                                      <span>4.6</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                      </svg>
                                  </div>
                              </div>
                          </div>

                          <div className="search-preview-cta">
                              <Link to="/patient/hospital-search" className="btn-primary btn-large">
                                  Start Searching
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                                  </svg>
                              </Link>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          {/* Features Section */}
          <section id="features" className="features-section">
              <div className="container">
                  <div className="section-header">
                      <h2>Comprehensive Healthcare Features</h2>
                      <p>Everything you need to manage modern healthcare operations in one powerful platform</p>
                  </div>

                  <div className="features-grid">
                      <div className="feature-card">
                          <div className="feature-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="8" y2="8"/><line x1="19.5" x2="19.5" y1="5.5" y2="10.5"/>
                              </svg>
                          </div>
                          <h3>Patient Registration and Profile Management</h3>
                          <p>Efficiently manage patient information with secure digital profiles, complete medical history, and instant access to records.</p>
                      </div>

                      <div className="feature-card">
                          <div className="feature-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                              </svg>
                          </div>
                          <h3>Smart Appointment Booking</h3>
                          <p>Find hospitals by speciality, book appointments with specialists, and manage your healthcare journey with intelligent scheduling.</p>
                      </div>

                      <div className="feature-card">
                          <div className="feature-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-2a2 2 0 0 1 4 0v2"/><path d="M12 21v-2a2 2 0 0 1 4 0v2"/><path d="M3 21l9-9 9 9"/>
                              </svg>
                          </div>
                          <h3>Hospital Search & Discovery</h3>
                          <p>Search and discover hospitals by speciality, location, and services. Find the right healthcare facility for your needs with detailed information.</p>
                      </div>

                      <div className="feature-card">
                          <div className="feature-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.579l-1.5-4.5A1 1 0 0 0 16.382 7h-2.764a1 1 0 0 0-.894.553l-1.5 3a1 1 0 0 1-.894.553H9.5a1 1 0 0 0-1 1V12"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                              </svg>
                          </div>
                          <h3>Emergency Ambulance Request System</h3>
                          <p>Rapid response coordination for emergency services with real-time tracking and automated dispatch.</p>
                      </div>

                      <div className="feature-card">
                          <div className="feature-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
                              </svg>
                          </div>
                          <h3>Staff Workflow Management</h3>
                          <p>Automate routine tasks and manage workflows efficiently to reduce staff burden and errors.</p>
                      </div>

                      <div className="feature-card">
                          <div className="feature-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                              </svg>
                          </div>
                          <h3>Hospital Operations Monitoring Dashboard</h3>
                          <p>Real-time insights and analytics to monitor hospital performance, resource utilization, and key metrics.</p>
                      </div>

                      <div className="feature-card">
                          <div className="feature-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m12 12-4-4"/><path d="M12 12v8"/><path d="m12 12 5 5"/><circle cx="12" cy="12" r="9"/>
                              </svg>
                          </div>
                          <h3>Real-Time Hospital Coordination</h3>
                          <p>Seamless communication between departments, staff, and teams to ensure smooth operations across the hospital.</p>
                      </div>
                  </div>
              </div>
          </section>

          {/* Roles Section */}
          <section id="roles" className="roles-section">
              <div className="container">
                  <div className="section-header">
                      <h2>Designed for Every Healthcare Role</h2>
                      <p>Tailored experiences for each member of your healthcare team</p>
                  </div>

                  <div className="roles-grid">
                      <div className="role-card role-blue">
                          <div className="role-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                              </svg>
                          </div>
                          <h3>Patient</h3>
                          <p>Search hospitals by speciality, find the right healthcare facility, book appointments with specialists, request emergency ambulance services, and track your medical history all in one place.</p>
                      </div>

                      <div className="role-card role-green">
                          <div className="role-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="17" cy="11" r="3"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
                              </svg>
                          </div>
                          <h3>Hospital Staff</h3>
                          <p>Process patient registrations, manage appointments, coordinate with departments, and handle workflows efficiently.</p>
                      </div>

                      <div className="role-card role-red">
                          <div className="role-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.579l-1.5-4.5A1 1 0 0 0 16.382 7h-2.764a1 1 0 0 0-.894.553l-1.5 3a1 1 0 0 1-.894.553H9.5a1 1 0 0 0-1 1V12"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                              </svg>
                          </div>
                          <h3>Ambulance Staff</h3>
                          <p>Receive and respond to emergency requests, track ambulance availability, navigate to patients, and coordinate with hospital staff for smooth handoffs.</p>
                      </div>

                      <div className="role-card role-purple">
                          <div className="role-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                              </svg>
                          </div>
                          <h3>Management</h3>
                          <p>Monitor hospital operations, analyze performance metrics, manage staff assignments, oversee all departments, and make data-driven decisions.</p>
                      </div>
                  </div>
              </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="how-it-works-section">
              <div className="container">
                  <div className="section-header">
                      <h2>How NexCare Works</h2>
                      <p>A simple, streamlined process that transforms healthcare operations</p>
                  </div>

                  <div className="steps-grid">
                      <div className="step">
                          <div className="step-number">1</div>
                          <div className="step-card">
                              <div className="step-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>
                                  </svg>
                              </div>
                              <h3>Register or Sign In</h3>
                              <p>Create your account or log in to access your personalized dashboard based on your role in the healthcare system.</p>
                          </div>
                      </div>

                      <div className="step">
                          <div className="step-number">2</div>
                          <div className="step-card">
                              <div className="step-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                                  </svg>
                              </div>
                              <h3>Find Hospital & Book Appointment</h3>
                              <p>Search hospitals by speciality, select the right facility, book appointments with specialists, or request emergency ambulance services.</p>
                          </div>
                      </div>

                      <div className="step">
                          <div className="step-number">3</div>
                          <div className="step-card">
                              <div className="step-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/>
                                  </svg>
                              </div>
                              <h3>Staff Manage and Process Requests</h3>
                              <p>Hospital and ambulance staff receive notifications and efficiently manage incoming requests through their workflow dashboard.</p>
                          </div>
                      </div>

                      <div className="step">
                          <div className="step-number">4</div>
                          <div className="step-card">
                              <div className="step-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                  </svg>
                              </div>
                              <h3>Management Monitors Hospital Operations</h3>
                              <p>Hospital management oversees all operations, analyzes performance metrics, and ensures smooth coordination across departments.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </section>


          {/* Benefits Section */}
          <section className="benefits-section">
              <div className="container">
                  <div className="section-header">
                      <h2>Key Benefits</h2>
                      <p>Discover how NexCare transforms healthcare operations and improves outcomes</p>
                  </div>

                  <div className="benefits-grid">
                      <div className="benefit-card">
                          <div className="benefit-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                              </svg>
                          </div>
                          <div>
                              <h3>Faster Hospital Workflows</h3>
                              <p>Automate routine processes and reduce manual tasks, allowing staff to focus on patient care.</p>
                          </div>
                      </div>

                      <div className="benefit-card">
                          <div className="benefit-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                          </div>
                          <div>
                              <h3>Improved Emergency Response</h3>
                              <p>Real-time ambulance dispatch and tracking ensures the fastest possible response to emergencies.</p>
                          </div>
                      </div>

                      <div className="benefit-card">
                          <div className="benefit-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                              </svg>
                          </div>
                          <div>
                              <h3>Centralized Healthcare Data</h3>
                              <p>All patient records, appointments, and medical history in one secure, accessible location.</p>
                          </div>
                      </div>

                      <div className="benefit-card">
                          <div className="benefit-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m12 12-4-4"/><path d="M12 12v8"/><path d="m12 12 5 5"/><circle cx="12" cy="12" r="9"/>
                              </svg>
                          </div>
                          <div>
                              <h3>Better Coordination Between Teams</h3>
                              <p>Seamless communication across departments ensures everyone stays informed and aligned.</p>
                          </div>
                      </div>

                      <div className="benefit-card">
                          <div className="benefit-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                              </svg>
                          </div>
                          <div>
                              <h3>Easy Hospital Discovery</h3>
                              <p>Find the right hospital by speciality, location, and services with intuitive search and detailed facility information.</p>
                          </div>
                      </div>

                      <div className="benefit-card">
                          <div className="benefit-icon pulsing">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                              </svg>
                          </div>
                          <div>
                              <h3>Enhanced Patient Service Experience</h3>
                              <p>Simplified hospital search, streamlined booking, shorter wait times, and better communication improve patient satisfaction.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          {/* Reviews Section */}
          <section id="reviews" className="testimonials-section">
              <div className="container">
                  <div className="section-header">
                      <h2>What Healthcare Teams Say</h2>
                      <p>Trusted by healthcare professionals across the country</p>
                  </div>

                  <div className="testimonials-grid">
                      <div className="testimonial-card">
                          <div className="quote-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                              </svg>
                          </div>
                          <div className="rating">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                          </div>
                          <p className="testimonial-quote">"NexCare has revolutionized how we manage patient appointments. The interface is intuitive, and our workflow burden has decreased significantly."</p>
                          <div className="testimonial-author">
                              <div className="author-avatar">D</div>
                              <div>
                                  <p className="author-name">Dr. Sarah Johnson</p>
                                  <p className="author-role">Chief Medical Officer, Metro Hospital</p>
                              </div>
                          </div>
                      </div>

                      <div className="testimonial-card">
                          <div className="quote-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                              </svg>
                          </div>
                          <div className="rating">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                          </div>
                          <p className="testimonial-quote">"The emergency ambulance dispatch system is incredible. Response times have improved by 40%, and the real-time tracking gives us peace of mind."</p>
                          <div className="testimonial-author">
                              <div className="author-avatar">M</div>
                              <div>
                                  <p className="author-name">Michael Chen</p>
                                  <p className="author-role">Emergency Services Director</p>
                              </div>
                          </div>
                      </div>

                      <div className="testimonial-card">
                          <div className="quote-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                              </svg>
                          </div>
                          <div className="rating">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                          </div>
                          <p className="testimonial-quote">"As part of hospital management, having all hospital operations data in one dashboard has been game-changing. We make better decisions faster."</p>
                          <div className="testimonial-author">
                              <div className="author-avatar">L</div>
                              <div>
                                  <p className="author-name">Linda Martinez</p>
                                  <p className="author-role">Hospital Operations Manager</p>
                              </div>
                          </div>
                      </div>

                      <div className="testimonial-card">
                          <div className="quote-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                              </svg>
                          </div>
                          <div className="rating">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                          </div>
                          <p className="testimonial-quote">"Booking appointments is so easy now. I love being able to manage my health records and communicate with my doctors all in one place."</p>
                          <div className="testimonial-author">
                              <div className="author-avatar">J</div>
                              <div>
                                  <p className="author-name">James Wilson</p>
                                  <p className="author-role">Patient</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          {/* Contact Us Section */}
          <section id="contact" className="contact-section">
              <div className="container">
                  <div className="section-header">
                      <h2>Contact Us</h2>
                      <p>Reach out to NexCare support for onboarding, demos, and technical help.</p>
                  </div>

                  <div className="contact-grid">
                      <div className="contact-card">
                          <div className="contact-card-header">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                              </svg>
                              <h3>Email</h3>
                          </div>
                          <p><a href="mailto:support@nexcare.com">support@nexcare.com</a></p>
                      </div>

                      <div className="contact-card">
                          <div className="contact-card-header">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              <h3>Phone</h3>
                          </div>
                          <p><a href="tel:+1234567890">+1 (234) 567-890</a></p>
                      </div>

                      <div className="contact-card">
                          <div className="contact-card-header">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              <h3>Address</h3>
                          </div>
                          <p>123 Healthcare Blvd, Medical City, HC 12345</p>
                      </div>
                  </div>
              </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
              <div className="cta-background"></div>
              <div className="cta-pattern"></div>
              <div className="container">
                  <div className="cta-content">
                    
                      <h2 className="cta-title">Transform Hospital Operations with NexCare</h2>
                    
                      <p className="cta-description">
                          Join thousands of healthcare providers who are already experiencing the future of hospital management
                      </p>

                      <div className="cta-buttons">
                          <Link to="/signup" className="btn-white btn-large">
                              <span>Register Now</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                              </svg>
                          </Link>
                        
                          <Link to="/login" className="btn-outline-white btn-large">Sign In</Link>
                      </div>

                      <div className="trust-badges">
                          <div className="badge">
                              <div className="badge-dot"></div>
                              <span>Secure and Reliable</span>
                          </div>
                          <div className="badge">
                              <div className="badge-dot"></div>
                              <span>24/7 Support</span>
                          </div>
                          <div className="badge">
                              <div className="badge-dot"></div>
                              <span>Protected Access</span>
                          </div>
                      </div>
                  </div>
              </div>
          </section>
      </main>

      {/* Footer */}
      <footer className="footer">
          <div className="container">
              <div className="footer-grid">
                  {/* Brand Column */}
                  <div className="footer-brand">
                      <div className="logo">
      <div className="logo-icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
      </div>
      <span className="logo-text">
          <span className="nexcare">NEXCARE</span>
      </span>
  </div>

                      <p>Smart Hospital Operations Platform connecting patients, staff, and administrators for better healthcare.</p>
                      <div className="social-links">
                          <a href="#" className="social-link">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                              </svg>
                          </a>
                          <a href="#" className="social-link">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
                              </svg>
                          </a>
                          <a href="#" className="social-link">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                              </svg>
                          </a>
                      </div>
                  </div>

                  {/* Quick Links */}
                  <div className="footer-column">
                      <h3>Quick Links</h3>
                      <ul>
                          <li><a href="#home">Home</a></li>
                          <li><a href="#features">Features</a></li>
                          <li><a href="#roles">Roles</a></li>
                          <li><a href="#how-it-works">How It Works</a></li>
                          <li><a href="#contact">Contact</a></li>
                      </ul>
                  </div>

                  {/* Resources */}
                  <div className="footer-column">
                      <h3>Resources</h3>
                      <ul>
                          <li><a href="#">Documentation</a></li>
                          <li><a href="#">API Reference</a></li>
                          <li><a href="#">Support</a></li>
                          <li><a href="#">Privacy Policy</a></li>
                          <li><a href="#">Terms of Service</a></li>
                      </ul>
                  </div>

                  {/* Contact Info */}
                  <div className="footer-column">
                      <h3>Contact Us</h3>
                      <ul className="contact-list">
                          <li>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                              </svg>
                              <div>
                                  <p className="contact-label">Email</p>
                                  <a href="mailto:support@nexcare.com">support@nexcare.com</a>
                              </div>
                          </li>
                          <li>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              <div>
                                  <p className="contact-label">Phone</p>
                                  <a href="tel:+1234567890">+1 (234) 567-890</a>
                              </div>
                          </li>
                          <li>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              <div>
                                  <p className="contact-label">Address</p>
                                  <p>123 Healthcare Blvd, Medical City, HC 12345</p>
                              </div>
                          </li>
                      </ul>
                  </div>
              </div>

              {/* Bottom Bar */}
              <div className="footer-bottom">
                  <p>© <span id="current-year">{year}</span> NexCare – Hospital Operational Administration System. All rights reserved.</p>
                  <div className="footer-links">
                      <a href="#">Privacy Policy</a>
                      <a href="#">Terms of Service</a>
                      <a href="#">Cookie Policy</a>
                  </div>
              </div>
          </div>
      </footer>

    
    
    </div>
  );
}
