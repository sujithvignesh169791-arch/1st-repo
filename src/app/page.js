'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const features = [
  {
    icon: '🎙️',
    color: 'rgba(124,58,237,0.15)',
    title: 'Real-Time Answer Analysis',
    desc: 'AI evaluates your response for communication clarity, tone, content depth, and keyword relevance against the role instantly.'
  },
  {
    icon: '📊',
    color: 'rgba(6,182,212,0.15)',
    title: 'Multi-Dimensional Scoring',
    desc: 'Get scored across 7 key dimensions — Clarity, Confidence, Tone, Structure, Relevance, Depth, and STAR method usage.'
  },
  {
    icon: '💡',
    color: 'rgba(16,185,129,0.15)',
    title: 'Smart Strengths & Gaps',
    desc: 'Pinpoints exactly what you did well and where you dropped marks, with specific, actionable improvement tips per question.'
  },
  {
    icon: '🎓',
    color: 'rgba(245,158,11,0.15)',
    title: 'Personalized Course Roadmap',
    desc: 'Based on your skill gaps, we recommend curated courses from Coursera, edX, and Udemy to upgrade your profile.'
  },
  {
    icon: '📄',
    color: 'rgba(236,72,153,0.15)',
    title: 'Resume Improvement Hints',
    desc: 'Your best spoken answers are converted into polished resume bullet points you can inject directly into your CV.'
  },
  {
    icon: '🚀',
    color: 'rgba(139,92,246,0.15)',
    title: 'Career Pathway Navigator',
    desc: 'Performance trends across sessions reveal which roles you are naturally strongest for, with salary ranges and pathways.'
  },
];

const roles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'Marketing Manager', 'Business Analyst'];

export default function HomePage() {
  const [activeRole, setActiveRole] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setActiveRole(r => (r + 1) % roles.length), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar" style={{ background: scrolled ? 'rgba(10,10,15,0.95)' : 'rgba(10,10,15,0.7)' }}>
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <div className="logo-icon">🤖</div>
            InterviewAI
          </Link>
          <div className="navbar-links">
            <Link href="/interview" className="navbar-link">Practice</Link>
            <Link href="/dashboard" className="navbar-link">Dashboard</Link>
            <Link href="/results?demo=1" className="navbar-link">Results</Link>
          </div>
          <Link href="/interview" className="btn btn-primary btn-sm">Start Practice →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            AI-Powered Career Preparation Platform
          </div>

          <h1 className="hero-title">
            Ace Every Interview<br />
            with <span className="gradient-text">AI Coaching</span>
          </h1>

          <p className="hero-desc">
            Practice for{' '}
            <span style={{ color: 'var(--accent-violet-light)', fontWeight: 600, transition: 'all 0.3s' }}>
              {roles[activeRole]}
            </span>
            {' '}roles with an AI interviewer that gives real-time feedback on your communication, confidence, and content quality.
          </p>

          <div className="hero-actions">
            <Link href="/interview" className="btn btn-primary btn-lg">
              🎙️ Start Mock Interview
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              📊 View Dashboard
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">7</div>
              <div className="hero-stat-label">Skills Analyzed</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-number">50+</div>
              <div className="hero-stat-label">Interview Categories</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-number">AI</div>
              <div className="hero-stat-label">Instant Feedback</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-number">∞</div>
              <div className="hero-stat-label">Practice Sessions</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">✦ Features</div>
            <h2 className="section-title">Everything You Need to Land the Job</h2>
            <p className="section-desc">
              Beyond just a chatbot — a complete career intelligence system that grows with your performance.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">✦ Process</div>
            <h2 className="section-title">How It Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { step: '01', icon: '⚙️', title: 'Configure Your Session', desc: 'Choose your target role, interview type, and difficulty level.' },
              { step: '02', icon: '🎙️', title: 'Answer AI Questions', desc: 'Respond to dynamic questions generated for your specific role and context.' },
              { step: '03', icon: '🔍', title: 'Get Deep Analysis', desc: 'Receive a full breakdown of tone, clarity, structure, and content quality.' },
              { step: '04', icon: '📈', title: 'Follow Your Roadmap', desc: 'Act on course suggestions, resume tips, and job pathway recommendations.' },
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '3px', color: 'var(--accent-violet-light)', marginBottom: '16px' }}>{s.step}</div>
                <div style={{ fontSize: '42px', marginBottom: '16px' }}>{s.icon}</div>
                <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '10px' }}>{s.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: '60px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '28px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚀</div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '700', marginBottom: '16px' }}>
            Ready to Level Up?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: '1.7' }}>
            Start your first AI mock interview session now — no signup required. Get your first detailed performance report in minutes.
          </p>
          <Link href="/interview" className="btn btn-primary btn-lg">
            Begin Your First Interview 🎙️
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="navbar-logo" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
            InterviewAI
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            © 2026 InterviewAI · Empowering Decent Work & Economic Growth 🌍
          </div>
        </div>
      </footer>
    </>
  );
}
