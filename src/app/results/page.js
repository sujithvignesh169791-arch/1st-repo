'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const DEMO_SESSION = {
    config: { role: 'Software Engineer', experience: 'Mid Level (2-5 yrs)', type: 'behavioral', difficulty: 'medium' },
    timer: 847, date: new Date().toISOString(), hasVideoAnalysis: true,
    answers: {
        0: "I'm a software engineer with 3 years of experience building scalable web applications. I led a team of four to deliver a customer portal that reduced support tickets by 40%.",
        1: "Last year our production database went down during peak traffic. I isolated the deadlock, rolled back the deployment, and restored service within 45 minutes.",
        2: "I organized informal knowledge sessions every Friday, improving the team's code quality and reducing PR review cycles by 30%.",
    },
    metrics: {
        0: { clarity: 88, confidence: 82, content: 91, structure: 85, tone: 87, overall: 87, wordCount: 72 },
        1: { clarity: 92, confidence: 89, content: 90, structure: 95, tone: 88, overall: 91, wordCount: 68 },
        2: { clarity: 79, confidence: 84, content: 82, structure: 78, tone: 85, overall: 82, wordCount: 52 },
    },
    videoData: {
        0: { eyeContact: 84, faceDetected: true, confidence: 88, posture: 'Good' },
        1: { eyeContact: 91, faceDetected: true, confidence: 85, posture: 'Good' },
        2: { eyeContact: 72, faceDetected: true, confidence: 78, posture: 'Sit up' },
    },
    questions: [
        { q: "Tell me about yourself.", category: "Background" },
        { q: "Describe a time you faced a challenge.", category: "Problem Solving" },
        { q: "Give an example of leadership.", category: "Leadership" },
    ],
};

const COURSES = [
    { icon: '🎓', platform: 'Coursera', title: 'Communication Skills for Engineers', duration: '6 hrs', level: 'Beginner', free: true, gap: 'Communication & Clarity' },
    { icon: '⚡', platform: 'Udemy', title: 'Master the STAR Interview Method', duration: '4 hrs', level: 'Beginner', free: false, gap: 'Answer Structure' },
    { icon: '🧠', platform: 'edX', title: 'Leadership Principles for Tech Professionals', duration: '8 hrs', level: 'Intermediate', free: true, gap: 'Leadership Skills' },
    { icon: '🎥', platform: 'LinkedIn Learning', title: 'Video Interview Confidence & Body Language', duration: '3 hrs', level: 'Beginner', free: false, gap: 'Camera Presence & Eye Contact' },
];

const PATHWAYS = [
    { match: '94%', title: 'Senior Software Engineer', desc: 'Your technical depth and leadership scores align strongly with senior IC roles.', salary: '$120k – $180k/yr' },
    { match: '81%', title: 'Engineering Team Lead', desc: 'Your collaboration and leadership answers show strong management potential.', salary: '$140k – $200k/yr' },
    { match: '76%', title: 'Solutions Architect', desc: 'Solid structured thinking matches architect profiles.', salary: '$150k – $220k/yr' },
];

const RESUME_TIPS = [
    { original: 'Worked on customer portal project', improved: 'Led a 4-person engineering team to deliver a self-serve customer portal, reducing support ticket volume by 40% and improving NPS by 18 points.' },
    { original: 'Helped fix production issues', improved: 'Diagnosed and resolved a critical database deadlock in production, restoring service within 45 minutes and implementing monitoring to prevent recurrence.' },
];

function MetricBar({ label, value, color }) {
    const [width, setWidth] = useState(0);
    useEffect(() => { const t = setTimeout(() => setWidth(value), 400); return () => clearTimeout(t); }, [value]);
    return (
        <div className="metric-row">
            <div className="metric-row-header">
                <span className="metric-row-label">{label}</span>
                <span className="metric-row-value" style={{ color }}>{value}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${width}%`, background: color }} /></div>
        </div>
    );
}

function CircleScore({ value, color, size = 160 }) {
    const [pct, setPct] = useState(0);
    useEffect(() => { const t = setTimeout(() => setPct(value), 400); return () => clearTimeout(t); }, [value]);
    const r = (size / 2) - 10;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        </svg>
    );
}

export default function ResultsPage() {
    const searchParams = useSearchParams();
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const isDemo = searchParams.get('demo');
        if (isDemo) { setSession(DEMO_SESSION); return; }
        const stored = localStorage.getItem('lastSession');
        setSession(stored ? JSON.parse(stored) : DEMO_SESSION);
    }, [searchParams]);

    if (!session) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div><div style={{ color: 'var(--text-secondary)' }}>Loading results...</div></div>
        </div>
    );

    const allMetrics = Object.values(session.metrics || {});
    const avg = (key) => allMetrics.length ? Math.round(allMetrics.reduce((s, m) => s + (m[key] || 0), 0) / allMetrics.length) : 0;
    const overallScore = avg('overall');
    const grade = overallScore >= 90 ? 'Excellent 🏆' : overallScore >= 75 ? 'Good 👍' : overallScore >= 60 ? 'Average 📈' : 'Needs Work 💪';
    const gradeColor = overallScore >= 90 ? 'var(--accent-green)' : overallScore >= 75 ? 'var(--accent-cyan)' : overallScore >= 60 ? 'var(--accent-amber)' : '#f87171';
    const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // Video averages
    const vidData = session.videoData || {};
    const vidValues = Object.values(vidData);
    const avgEyeContact = vidValues.length ? Math.round(vidValues.reduce((s, v) => s + (v.eyeContact || 0), 0) / vidValues.length) : 0;
    const avgVidConfidence = vidValues.length ? Math.round(vidValues.reduce((s, v) => s + (v.confidence || 0), 0) / vidValues.length) : 0;
    const faceDetectedPct = vidValues.length ? Math.round((vidValues.filter(v => v.faceDetected).length / vidValues.length) * 100) : 0;

    const tabs = session.hasVideoAnalysis
        ? ['overview', 'video', 'feedback', 'courses', 'resume', 'pathways']
        : ['overview', 'feedback', 'courses', 'resume', 'pathways'];
    const tabLabels = { overview: '📊 Overview', video: '🎥 Video Analysis', feedback: '💬 Feedback', courses: '🎓 Courses', resume: '📄 Resume', pathways: '🚀 Pathways' };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-inner">
                    <Link href="/" className="navbar-logo"><div className="logo-icon">🤖</div>InterviewAI</Link>
                    <Link href="/interview" className="btn btn-primary btn-sm">🔄 New Interview</Link>
                </div>
            </nav>

            <div className="page-wrapper">
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="page-header animate-fade-up">
                        <div className="section-tag" style={{ display: 'inline-flex', marginBottom: '12px' }}>✦ Performance Report</div>
                        <h1 className="page-title">Interview Analysis Complete</h1>
                        <p className="page-subtitle">{session.config?.role} · {session.config?.experience} · Session: {formatTimer(session.timer || 0)}</p>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0', marginBottom: '32px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 18px', color: activeTab === tab ? 'var(--accent-violet-light)' : 'var(--text-secondary)', fontWeight: activeTab === tab ? '700' : '500', fontFamily: 'Inter, sans-serif', fontSize: '13px', borderBottom: activeTab === tab ? '2px solid var(--accent-violet-light)' : '2px solid transparent', transition: 'all 0.2s', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
                                {tabLabels[tab]}
                            </button>
                        ))}
                    </div>

                    {/* ── OVERVIEW ── */}
                    {activeTab === 'overview' && (
                        <div className="results-grid animate-fade-up">
                            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Overall Score</div>
                                <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CircleScore value={overallScore} color={gradeColor} size={160} />
                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '42px', fontWeight: '700', color: gradeColor }}>{overallScore}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>out of 100</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: gradeColor, marginTop: '16px' }}>{grade}</div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <span className="tag tag-violet">📝 {Object.keys(session.answers || {}).length} Q's</span>
                                    <span className="tag tag-cyan">⏱ {formatTimer(session.timer || 0)}</span>
                                    {session.hasVideoAnalysis && <span className="tag tag-green">🎥 Video Analyzed</span>}
                                </div>
                            </div>

                            <div className="glass-card">
                                <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Skill Breakdown</div>
                                <div className="metrics-list">
                                    <MetricBar label="🗣️ Clarity" value={avg('clarity')} color="var(--accent-cyan)" />
                                    <MetricBar label="💪 Confidence" value={avg('confidence')} color="var(--accent-violet-light)" />
                                    <MetricBar label="📦 Content Quality" value={avg('content')} color="var(--accent-green)" />
                                    <MetricBar label="🏗️ Answer Structure" value={avg('structure')} color="var(--accent-amber)" />
                                    <MetricBar label="🎵 Tone & Delivery" value={avg('tone')} color="var(--accent-pink)" />
                                </div>
                            </div>

                            {session.hasVideoAnalysis && (
                                <div className="glass-card">
                                    <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>🎥 Video Metrics</div>
                                    <div className="metrics-list">
                                        <MetricBar label="👁️ Eye Contact" value={avgEyeContact} color="var(--accent-cyan)" />
                                        <MetricBar label="💪 Presence Confidence" value={avgVidConfidence} color="var(--accent-violet-light)" />
                                        <MetricBar label="😊 Face Visible" value={faceDetectedPct} color="var(--accent-green)" />
                                    </div>
                                </div>
                            )}

                            <div className="glass-card">
                                <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '16px' }}>✅ Strengths</div>
                                <div className="tags-list">
                                    {avg('structure') > 75 && <span className="tag tag-green">Strong structure</span>}
                                    {avg('content') > 75 && <span className="tag tag-green">Rich content</span>}
                                    {avg('clarity') > 75 && <span className="tag tag-green">Clear communication</span>}
                                    {avgEyeContact > 75 && <span className="tag tag-green">Great eye contact</span>}
                                    {avgVidConfidence > 75 && <span className="tag tag-green">Strong presence</span>}
                                    <span className="tag tag-green">Completeness</span>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: '#f87171', textTransform: 'uppercase', margin: '20px 0 16px' }}>⚠️ Improve</div>
                                <div className="tags-list">
                                    {avg('structure') <= 75 && <span className="tag tag-red">Answer structure</span>}
                                    {avg('content') <= 75 && <span className="tag tag-red">Content depth</span>}
                                    {avgEyeContact <= 75 && <span className="tag tag-red">Eye contact</span>}
                                    <span className="tag tag-amber">Quantify achievements</span>
                                    <span className="tag tag-amber">More examples</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── VIDEO ANALYSIS TAB ── */}
                    {activeTab === 'video' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-up">
                            {/* Summary cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {[
                                    { label: 'Avg Eye Contact', value: `${avgEyeContact}%`, color: avgEyeContact > 70 ? 'var(--accent-green)' : 'var(--accent-amber)', icon: '👁️' },
                                    { label: 'Camera Presence', value: `${avgVidConfidence}%`, color: 'var(--accent-violet-light)', icon: '💪' },
                                    { label: 'Face Visible', value: `${faceDetectedPct}%`, color: 'var(--accent-cyan)', icon: '😊' },
                                ].map((s, i) => (
                                    <div key={i} className="glass-card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
                                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px', fontWeight: '700', color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Per-question video breakdown */}
                            <div className="glass-card">
                                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>📋 Per-Question Video Breakdown</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {Object.entries(vidData).map(([i, vd]) => {
                                        const q = session.questions?.[i];
                                        return (
                                            <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px', color: 'var(--text-secondary)' }}>Q{parseInt(i) + 1}: {q?.q?.substring(0, 60)}...</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                                    {[
                                                        { label: '👁️ Eye Contact', val: vd.eyeContact, color: vd.eyeContact > 70 ? 'var(--accent-green)' : 'var(--accent-amber)' },
                                                        { label: '💪 Confidence', val: vd.confidence, color: 'var(--accent-violet-light)' },
                                                        { label: '😊 Face', val: vd.faceDetected ? 100 : 0, color: vd.faceDetected ? 'var(--accent-green)' : '#f87171' },
                                                        { label: '📍 Posture', val: vd.posture, isText: true, color: vd.posture === 'Good' ? 'var(--accent-green)' : 'var(--accent-amber)' },
                                                    ].map(m => (
                                                        <div key={m.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 8px' }}>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>{m.label}</div>
                                                            <div style={{ fontSize: '20px', fontWeight: '800', color: m.color }}>{m.isText ? m.val : `${m.val}%`}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Video-specific AI suggestions */}
                            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(124,58,237,0.08))' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>🤖 AI Video Coaching Suggestions</div>
                                {[
                                    { icon: '👁️', title: avgEyeContact > 75 ? 'Excellent Eye Contact' : 'Improve Eye Contact', body: avgEyeContact > 75 ? 'You maintained strong eye contact with the camera throughout your session. This projects confidence and engagement to interviewers.' : 'Look directly at your camera lens — not the screen — to simulate natural eye contact. Practice with a sticky note on your camera as a focus point.', color: avgEyeContact > 75 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' },
                                    { icon: '🎙️', title: 'Voice & Clarity', body: 'Speak at a moderate pace — not too fast, not too slow. Pause briefly between key points to let important ideas land. Avoid speaking too quietly when nervous.', color: 'rgba(124,58,237,0.1)' },
                                    { icon: '😊', title: 'Facial Expression', body: 'Even in video interviews, a subtle smile when greeting and expressing enthusiasm makes a strong impression. Avoid looking nervous or blank by practicing in front of a mirror.', color: 'rgba(236,72,153,0.1)' },
                                    { icon: '📐', title: 'Setup & Environment', body: 'Position your camera at eye level, ensure good lighting from the front, and use a clean, professional background. These non-verbal cues affect perception before you say a word.', color: 'rgba(6,182,212,0.1)' },
                                ].map((s, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '16px', padding: '16px', background: s.color, borderRadius: '12px' }}>
                                        <div style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>{s.icon}</div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '5px' }}>{s.title}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>{s.body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── FEEDBACK TAB ── */}
                    {activeTab === 'feedback' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {Object.entries(session.answers || {}).map(([i, answer]) => {
                                const m = (session.metrics || {})[i] || {};
                                const q = (session.questions || [])[i];
                                const vd = vidData[i];
                                return (
                                    <div key={i} className="glass-card animate-fade-up">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Question {parseInt(i) + 1}</div>
                                                <div style={{ fontSize: '16px', fontWeight: '600', maxWidth: '560px', lineHeight: '1.5' }}>{q?.q || `Q${parseInt(i) + 1}`}</div>
                                            </div>
                                            {m.overall && <div style={{ fontSize: '28px', fontWeight: '800', color: m.overall >= 80 ? 'var(--accent-green)' : m.overall >= 60 ? 'var(--accent-amber)' : '#f87171', fontFamily: 'Space Grotesk, sans-serif' }}>{m.overall}%</div>}
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', borderLeft: '3px solid var(--border)', fontStyle: 'italic' }}>
                                            "{answer.substring(0, 200)}{answer.length > 200 ? '...' : ''}"
                                        </div>
                                        {m.overall && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                                {[['Clarity', m.clarity, 'var(--accent-cyan)'], ['Confidence', m.confidence, 'var(--accent-violet-light)'], ['Content', m.content, 'var(--accent-green)'], ['Structure', m.structure, 'var(--accent-amber)'], ['Tone', m.tone, 'var(--accent-pink)']].map(([l, v, c]) => (
                                                    <div key={l} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 4px' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: '700', color: c }}>{v}%</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{l}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {vd && (
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                                <span className="tag tag-cyan">👁️ Eye Contact: {vd.eyeContact}%</span>
                                                <span className="tag tag-violet">💪 Cam Confidence: {vd.confidence}%</span>
                                                <span className={`tag ${vd.posture === 'Good' ? 'tag-green' : 'tag-amber'}`}>📍 Posture: {vd.posture}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div className="feedback-item">
                                                <div className="feedback-icon-wrapper" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
                                                <div><div className="feedback-text-title">What worked well</div><div className="feedback-text-body">{m.structure > 80 ? 'Clear and logical structure. ' : ''}{m.content > 80 ? 'Rich and relevant content. ' : ''}{m.confidence > 80 ? 'Confident delivery. ' : 'Showed genuine understanding.'}</div></div>
                                            </div>
                                            <div className="feedback-item">
                                                <div className="feedback-icon-wrapper" style={{ background: 'rgba(245,158,11,0.1)' }}>💡</div>
                                                <div><div className="feedback-text-title">How to improve</div><div className="feedback-text-body">{m.content <= 80 ? 'Add specific metrics (e.g., "reduced load time by 35%"). ' : ''}{m.structure <= 80 ? 'Use STAR format more explicitly. ' : ''}Try to be more concrete with real numbers for maximum impact.</div></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── COURSES TAB ── */}
                    {activeTab === 'courses' && (
                        <div className="animate-fade-up">
                            <div className="glass-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '42px' }}>🎓</div>
                                    <div><div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Personalized Learning Roadmap</div><div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Courses targeting your specific skill gaps based on interview + video performance.</div></div>
                                </div>
                            </div>
                            {COURSES.map((c, i) => (
                                <div key={i} className="course-card">
                                    <div className="course-thumb" style={{ background: `hsl(${i * 60 + 200}, 60%, 20%)` }}>{c.icon}</div>
                                    <div className="course-info">
                                        <div className="course-platform">{c.platform}</div>
                                        <div className="course-title">{c.title}</div>
                                        <div className="course-meta"><span>📅 {c.duration}</span><span>📊 {c.level}</span><span className={`course-badge ${c.free ? 'course-badge-free' : 'course-badge-paid'}`}>{c.free ? '✓ Free' : 'Paid'}</span></div>
                                        <div style={{ marginTop: '6px' }}><span className="tag tag-violet" style={{ fontSize: '11px' }}>Addresses: {c.gap}</span></div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm">View →</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── RESUME TAB ── */}
                    {activeTab === 'resume' && (
                        <div className="animate-fade-up">
                            <div className="glass-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(124,58,237,0.08))' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '42px' }}>📄</div>
                                    <div><div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>AI Resume Suggestions</div><div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Your best spoken answers, converted into punchy resume bullet points.</div></div>
                                </div>
                            </div>
                            {RESUME_TIPS.map((tip, i) => (
                                <div key={i} className="glass-card" style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Bullet Point {i + 1}</div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#f87171', fontWeight: '700', marginBottom: '6px' }}>❌ BEFORE (Weak)</div>
                                        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '14px', fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>• {tip.original}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: '700', marginBottom: '6px' }}>✅ AFTER (Impact-Driven)</div>
                                        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '14px', fontSize: '14px', lineHeight: '1.6' }}>• {tip.improved}</div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={() => navigator.clipboard?.writeText('• ' + tip.improved)}>📋 Copy</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── PATHWAYS TAB ── */}
                    {activeTab === 'pathways' && (
                        <div className="animate-fade-up">
                            <div className="glass-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(16,185,129,0.08))' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '42px' }}>🚀</div>
                                    <div><div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Career Pathway Navigator</div><div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Roles you're best positioned for based on your performance profile.</div></div>
                                </div>
                            </div>
                            {PATHWAYS.map((p, i) => (
                                <div key={i} className="pathway-card">
                                    <div className="pathway-match">{p.match}</div>
                                    <div className="pathway-info">
                                        <div className="pathway-title">{p.title}</div>
                                        <div className="pathway-desc">{p.desc}</div>
                                        <div className="pathway-salary">💰 {p.salary}</div>
                                    </div>
                                    <button className="btn btn-cyan btn-sm">Explore →</button>
                                </div>
                            ))}
                            <div className="glass-card" style={{ marginTop: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <div style={{ fontSize: '14px', color: 'var(--accent-amber)', fontWeight: '700', marginBottom: '8px' }}>📈 Progression Insight</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                                    Your average score of <strong style={{ color: 'var(--text-primary)' }}>{overallScore}%</strong> places you in the <strong style={{ color: 'var(--text-primary)' }}>top 30%</strong> of candidates. With 3 more focused sessions and recommended courses, you could reach the <strong style={{ color: 'var(--accent-green)' }}>90th percentile</strong>.
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '36px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link href="/interview" className="btn btn-primary">🔄 Start New Session</Link>
                        <Link href="/dashboard" className="btn btn-secondary">📊 View Dashboard</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
