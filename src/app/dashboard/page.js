'use client';
import Link from 'next/link';

const historyData = [
    { role: 'Software Engineer', type: 'Behavioral', date: 'Mar 9, 2026', score: 87, grade: 'Good', tags: ['clarity', 'structure'] },
    { role: 'Product Manager', type: 'Mixed', date: 'Mar 7, 2026', score: 74, grade: 'Average', tags: ['content', 'STAR method'] },
    { role: 'Data Scientist', type: 'Technical', date: 'Mar 5, 2026', score: 91, grade: 'Excellent', tags: ['confidence', 'depth'] },
    { role: 'Software Engineer', type: 'Situational', date: 'Mar 3, 2026', score: 68, grade: 'Average', tags: ['tone', 'examples'] },
];

function getScoreColor(s) {
    if (s >= 90) return { bg: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)' };
    if (s >= 75) return { bg: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' };
    if (s >= 60) return { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' };
    return { bg: 'rgba(239,68,68,0.15)', color: '#f87171' };
}

const trendData = [68, 74, 91, 87];
const maxVal = Math.max(...trendData);

export default function DashboardPage() {
    return (
        <>
            <nav className="navbar">
                <div className="navbar-inner">
                    <Link href="/" className="navbar-logo">
                        <div className="logo-icon">🤖</div>InterviewAI
                    </Link>
                    <div className="navbar-links">
                        <Link href="/interview" className="navbar-link">Practice</Link>
                        <Link href="/results?demo=1" className="navbar-link">Last Results</Link>
                    </div>
                    <Link href="/interview" className="btn btn-primary btn-sm">Start Practice →</Link>
                </div>
            </nav>

            <div className="page-wrapper">
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }} className="animate-fade-up">
                        <div>
                            <div className="section-tag" style={{ display: 'inline-flex', marginBottom: '10px' }}>✦ Career Dashboard</div>
                            <h1 className="page-title" style={{ marginBottom: '6px', textAlign: 'left' }}>Welcome back 👋</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Track your growth, review your strengths, and prepare for what's next.</p>
                        </div>
                        <Link href="/interview" className="btn btn-primary">🎙️ New Mock Interview</Link>
                    </div>

                    {/* Stats Row */}
                    <div className="dashboard-grid animate-fade-up-delay-1">
                        {[
                            { icon: '📝', value: '4', label: 'Sessions Completed', trend: '↑ +1 this week' },
                            { icon: '📊', value: '80%', label: 'Average Score', trend: '↑ +12% improvement' },
                            { icon: '🔥', value: '7', label: 'Day Streak', trend: '🏅 Keep it going!' },
                            { icon: '🚀', value: '3', label: 'Roles Practiced', trend: 'Software · PM · Data' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-card-icon">{s.icon}</div>
                                <div className="stat-card-value">{s.value}</div>
                                <div className="stat-card-label">{s.label}</div>
                                <div className="stat-card-trend">{s.trend}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>

                        {/* Score Trend Chart */}
                        <div className="glass-card animate-fade-up-delay-2">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '4px' }}>Score Trend</div>
                                    <div style={{ fontSize: '18px', fontWeight: '700' }}>Performance Over Time</div>
                                </div>
                                <span className="tag tag-green">↑ Improving</span>
                            </div>

                            {/* SVG Chart */}
                            <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 0 32px' }}>
                                {trendData.map((val, i) => {
                                    const heightPct = (val / 100) * 120;
                                    const color = getScoreColor(val).color;
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color }}>{val}%</div>
                                            <div style={{ width: '100%', height: `${heightPct}px`, background: `linear-gradient(to top, ${color}40, ${color}20)`, border: `2px solid ${color}`, borderRadius: '8px 8px 4px 4px', position: 'relative', transition: 'all 0.5s ease', minHeight: '20px' }}>
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, borderRadius: '4px 4px 0 0' }} />
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>{historyData[i]?.date?.split(',')[0]}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Connecting line hint */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <span style={{ fontSize: '20px' }}>📈</span>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your score improved by <strong style={{ color: 'var(--accent-green)' }}>+19 points</strong> (68% → 87%) over your last 4 sessions.</span>
                            </div>
                        </div>

                        {/* Skills Radar */}
                        <div className="glass-card animate-fade-up-delay-2">
                            <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>Avg Skill Scores</div>
                            {[
                                { label: '🗣️ Clarity', value: 85, color: 'var(--accent-cyan)' },
                                { label: '💪 Confidence', value: 82, color: 'var(--accent-violet-light)' },
                                { label: '📦 Content', value: 88, color: 'var(--accent-green)' },
                                { label: '🏗️ Structure', value: 79, color: 'var(--accent-amber)' },
                                { label: '🎵 Tone', value: 84, color: 'var(--accent-pink)' },
                            ].map(s => (
                                <div key={s.label} style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{s.label}</span>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: s.color }}>{s.value}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${s.value}%`, background: s.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Session History + Recommendations Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', marginBottom: '24px' }}>

                        {/* History */}
                        <div className="glass-card animate-fade-up-delay-3">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '17px', fontWeight: '700' }}>📋 Recent Sessions</div>
                                <Link href="/results?demo=1" style={{ fontSize: '13px', color: 'var(--accent-violet-light)', textDecoration: 'none', fontWeight: '600' }}>View All →</Link>
                            </div>
                            {historyData.map((h, i) => {
                                const c = getScoreColor(h.score);
                                return (
                                    <Link key={i} href="/results?demo=1" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div className="history-item">
                                            <div className="history-score-badge" style={{ background: c.bg, color: c.color }}>{h.score}</div>
                                            <div className="history-info">
                                                <div className="history-role">{h.role}</div>
                                                <div className="history-date">{h.type} · {h.date}</div>
                                                <div className="history-tags">
                                                    {h.tags.map(t => <span key={t} className="tag tag-violet" style={{ fontSize: '10px', padding: '3px 8px' }}>{t}</span>)}
                                                </div>
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '18px' }}>›</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Quick Actions + Next Steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-violet-light)', marginBottom: '16px' }}>⚡ Quick Actions</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <Link href="/interview" className="btn btn-primary" style={{ justifyContent: 'center', textDecoration: 'none' }}>🎙️ Practice Interview</Link>
                                    <Link href="/results?demo=1" className="btn btn-secondary" style={{ justifyContent: 'center', textDecoration: 'none', fontSize: '13px' }}>📊 Full Analysis Report</Link>
                                </div>
                            </div>

                            <div className="glass-card">
                                <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-amber)', marginBottom: '14px' }}>🔥 Next Steps</div>
                                {[
                                    { icon: '📚', text: 'Complete STAR Method course on Coursera', done: false },
                                    { icon: '✏️', text: 'Update resume with 3 AI-suggested bullets', done: true },
                                    { icon: '🎯', text: 'Practice for Product Manager role', done: false },
                                    { icon: '🔁', text: 'Repeat Technical interview with harder difficulty', done: false },
                                ].map((s, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px', opacity: s.done ? 0.5 : 1 }}>
                                        <span style={{ fontSize: '16px', marginTop: '1px' }}>{s.done ? '✅' : s.icon}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: s.done ? 'line-through' : 'none', lineHeight: '1.5' }}>{s.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Career Readiness Banner */}
                    <div className="glass-card animate-fade-up" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1))', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                        <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Career Readiness Score: <span style={{ color: 'var(--accent-green)' }}>80 / 100</span></div>
                        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 24px', lineHeight: '1.7' }}>
                            You're making great progress! Complete 2 more practice sessions and the recommended courses to push your readiness score above 90 and become a top-tier candidate.
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/interview" className="btn btn-cyan">Continue Practicing 🚀</Link>
                            <Link href="/results?demo=1" className="btn btn-secondary">View Full Report</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
