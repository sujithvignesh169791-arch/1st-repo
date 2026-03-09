'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initFaceDetector, analyzeFrame as mlAnalyzeFrame, disposeFaceDetector } from './faceAnalyzer';

const questionBank = {
    behavioral: [
        { q: "Tell me about yourself and what makes you a strong candidate for this role.", hint: "Use the Present-Past-Future framework.", category: "Background" },
        { q: "Describe a time you faced a significant challenge at work. How did you handle it?", hint: "Use the STAR method: Situation, Task, Action, Result.", category: "Problem Solving" },
        { q: "Give an example of when you demonstrated strong leadership skills.", hint: "Focus on the impact your leadership had on the team.", category: "Leadership" },
        { q: "Tell me about a time you had to work under pressure to meet a tight deadline.", hint: "Highlight your time management and prioritization.", category: "Work Ethic" },
    ],
    technical: [
        { q: "Walk me through your approach to debugging a complex production issue.", hint: "Demonstrate systematic thinking: reproduce, isolate, test, resolve.", category: "Problem Solving" },
        { q: "How do you ensure code quality in a fast-paced development environment?", hint: "Mention code reviews, testing strategies, CI/CD pipelines.", category: "Best Practices" },
        { q: "Explain a complex technical concept from your field to a non-technical person.", hint: "Use analogies and real-world examples.", category: "Communication" },
    ],
    situational: [
        { q: "If a key project requirement changed two days before launch, what would you do?", hint: "Show your ability to assess impact and communicate with stakeholders.", category: "Adaptability" },
        { q: "How would you prioritize three equally urgent tasks from different managers?", hint: "Describe how you clarify urgency and make data-driven decisions.", category: "Prioritization" },
        { q: "You disagree strongly with a decision made by senior leadership. How do you handle it?", hint: "Demonstrate professional assertiveness and respectful dissent.", category: "Conflict Resolution" },
    ],
    mixed: [
        { q: "Tell me about yourself and what makes you a strong candidate for this role.", hint: "Use the Present-Past-Future framework.", category: "Background" },
        { q: "Walk me through your approach to debugging a complex production issue.", hint: "Demonstrate systematic thinking.", category: "Problem Solving" },
        { q: "If a key project requirement changed two days before launch, what would you do?", hint: "Show your ability to adapt quickly.", category: "Adaptability" },
        { q: "Give an example of when you demonstrated strong leadership skills.", hint: "Focus on impact.", category: "Leadership" },
    ],
};

const roles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'Marketing Manager', 'Business Analyst'];
const experiences = ['Entry Level (0-2 yrs)', 'Mid Level (2-5 yrs)', 'Senior Level (5-10 yrs)', 'Leadership (10+ yrs)'];
const interviewTypes = [
    { id: 'behavioral', icon: '🎯', label: 'Behavioral', sub: 'Situation-based' },
    { id: 'technical', icon: '🖥️', label: 'Technical', sub: 'Domain knowledge' },
    { id: 'situational', icon: '🧩', label: 'Situational', sub: 'Hypothetical scenarios' },
    { id: 'mixed', icon: '⚡', label: 'Mixed', sub: 'All types combined' },
];
const difficulties = [
    { id: 'easy', icon: '🌱', label: 'Beginner', sub: 'Build fundamentals' },
    { id: 'medium', icon: '🔥', label: 'Intermediate', sub: 'Industry standard' },
    { id: 'hard', icon: '🏆', label: 'Advanced', sub: 'Senior-level challenge' },
];

function analyzeAnswer(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const starKeywords = ['situation', 'task', 'action', 'result', 'achieved', 'led', 'improved', 'reduced', 'increased', 'team', 'project', 'managed'];
    const starScore = starKeywords.filter(k => text.toLowerCase().includes(k)).length;
    const clarity = Math.min(100, wordCount > 20 ? 60 + Math.min(40, starScore * 5) : wordCount * 2);
    const confidence = Math.min(100, wordCount > 30 ? 65 + Math.min(35, sentences * 4) : wordCount * 2);
    const content = Math.min(100, 50 + starScore * 8);
    const structure = Math.min(100, sentences > 0 ? Math.min(100, 40 + sentences * 12) : 20);
    const tone = Math.min(100, wordCount > 15 ? 70 + Math.floor(Math.random() * 25) : 50);
    const overall = Math.round((clarity + confidence + content + structure + tone) / 5);
    return { clarity, confidence, content, structure, tone, overall, wordCount };
}

export default function InterviewPage() {
    const router = useRouter();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const analyzeRef = useRef(null);
    const recorderRef = useRef(null);
    const finalTextRef = useRef('');

    const [phase, setPhase] = useState('permission');
    const [cameraError, setCameraError] = useState('');
    const [config, setConfig] = useState({ role: roles[0], experience: experiences[0], type: 'behavioral', difficulty: 'medium' });
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [metrics, setMetrics] = useState({});
    const [questionVideoData, setQuestionVideoData] = useState({});
    const [timer, setTimer] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [displayTranscript, setDisplayTranscript] = useState('');
    const [aiThinking, setAiThinking] = useState(false);
    const [videoMetrics, setVideoMetrics] = useState({ eyeContact: 0, faceDetected: false, confidence: 0, posture: 'Calibrating...', history: [] });
    const [speechSupported, setSpeechSupported] = useState(true);
    const [detectorReady, setDetectorReady] = useState(false);
    const [detectorStatus, setDetectorStatus] = useState('idle'); // idle | loading | ready | failed
    const videoMetricsRef = useRef({ eyeContact: 0, faceDetected: false, confidence: 0, posture: 'Calibrating...', history: [] });

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) setSpeechSupported(false);
        return () => {
            clearInterval(timerRef.current);
            clearInterval(analyzeRef.current);
            if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) { } }
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (recorderRef.current && recorderRef.current.state !== 'inactive') { try { recorderRef.current.stop(); } catch (e) { } }
            disposeFaceDetector();
        };
    }, []);

    const requestCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setPhase('setup');
            setCameraError('');
        } catch (err) {
            setCameraError('Camera/Mic access denied. Please allow access in your browser settings and try again.');
        }
    };

    const analyzeFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        try {
            const result = await mlAnalyzeFrame(
                videoRef.current,
                canvasRef.current,
                videoMetricsRef.current
            );
            videoMetricsRef.current = result;
            setVideoMetrics({ ...result });
        } catch (e) {
            console.warn('[analyzeFrame] error:', e.message);
        }
    }, []);

    const speakQuestion = useCallback((text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        setAiThinking(false);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88;
        utterance.pitch = 1.05;
        utterance.volume = 1;
        const trySpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const v = voices.find(v => (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Google UK English Female') || (v.lang === 'en-US' && v.name.includes('Female')))) || voices.find(v => v.lang.startsWith('en'));
            if (v) utterance.voice = v;
            utterance.onend = () => { setIsSpeaking(false); startListening(); };
            utterance.onerror = () => { setIsSpeaking(false); startListening(); };
            window.speechSynthesis.speak(utterance);
        };
        if (window.speechSynthesis.getVoices().length > 0) { trySpeak(); }
        else { window.speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true }); setTimeout(trySpeak, 500); }
    }, []);

    const startListening = useCallback(() => {
        finalTextRef.current = '';
        setDisplayTranscript('');
        setLiveTranscript('');
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        try {
            if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) { } }
            const rec = new SR();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';
            rec.onstart = () => setIsListening(true);
            rec.onend = () => setIsListening(false);
            rec.onerror = () => setIsListening(false);
            rec.onresult = (e) => {
                let interim = '';
                let final = finalTextRef.current;
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    if (e.results[i].isFinal) { final += e.results[i][0].transcript + ' '; }
                    else { interim = e.results[i][0].transcript; }
                }
                finalTextRef.current = final;
                setDisplayTranscript(final);
                setLiveTranscript(interim);
            };
            rec.start();
            recognitionRef.current = rec;
        } catch (e) { console.error(e); }
    }, []);

    const stopListening = () => {
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) { } }
        setIsListening(false);
    };

    const startInterview = async () => {
        const qs = questionBank[config.type] || questionBank.behavioral;
        setQuestions(qs);
        setCurrent(0);
        setAnswers({}); setMetrics({}); setQuestionVideoData({});
        setTimer(0);
        finalTextRef.current = '';
        setDisplayTranscript(''); setLiveTranscript('');
        setPhase('interview');
        setAiThinking(true);
        videoMetricsRef.current = { eyeContact: 0, faceDetected: false, confidence: 0, posture: 'Calibrating...', history: [] };
        setVideoMetrics(videoMetricsRef.current);

        // Initialize ML face detector in background
        setDetectorStatus('loading');
        initFaceDetector().then(success => {
            setDetectorReady(success);
            setDetectorStatus(success ? 'ready' : 'failed');
        });

        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        // Start analysis at 800ms intervals for smooth updates
        analyzeRef.current = setInterval(analyzeFrame, 800);

        if (streamRef.current) {
            try { const rec = new MediaRecorder(streamRef.current); rec.start(); recorderRef.current = rec; } catch (e) { }
        }
        setTimeout(() => speakQuestion(qs[0].q), 1500);
    };

    const saveCurrentAndNext = (goToIndex) => {
        const answerText = (finalTextRef.current || '').trim() || '(No verbal response recorded)';
        const updatedAnswers = { ...answers, [current]: answerText };
        const updatedMetrics = { ...metrics, [current]: analyzeAnswer(answerText) };
        const avgEyeContact = videoMetrics.history.length
            ? Math.round(videoMetrics.history.reduce((a, b) => a + b, 0) / videoMetrics.history.length)
            : videoMetrics.eyeContact;
        const updatedVideoData = { ...questionVideoData, [current]: { eyeContact: avgEyeContact, faceDetected: videoMetrics.faceDetected, confidence: videoMetrics.confidence, posture: videoMetrics.posture } };
        setAnswers(updatedAnswers); setMetrics(updatedMetrics); setQuestionVideoData(updatedVideoData);
        return { updatedAnswers, updatedMetrics, updatedVideoData };
    };

    const nextQuestion = () => {
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) { } }
        window.speechSynthesis?.cancel();
        const { updatedAnswers, updatedMetrics, updatedVideoData } = saveCurrentAndNext(current);
        if (current < questions.length - 1) {
            const next = current + 1;
            setCurrent(next);
            setAiThinking(true);
            finalTextRef.current = '';
            setDisplayTranscript(''); setLiveTranscript('');
            setVideoMetrics(prev => ({ ...prev, history: [] }));
            setTimeout(() => speakQuestion(questions[next].q), 800);
        } else {
            finishInterview(updatedAnswers, updatedMetrics, updatedVideoData);
        }
    };

    const finishInterview = (ans, met, vidData) => {
        clearInterval(timerRef.current); clearInterval(analyzeRef.current);
        try { recognitionRef.current?.stop(); } catch (e) { }
        window.speechSynthesis?.cancel();
        try { if (recorderRef.current?.state !== 'inactive') recorderRef.current.stop(); } catch (e) { }
        setPhase('analyzing');
        const sessionData = { config, answers: ans, metrics: met, questions, timer, date: new Date().toISOString(), videoData: vidData, hasVideoAnalysis: true };
        localStorage.setItem('lastSession', JSON.stringify(sessionData));
        setTimeout(() => router.push('/results'), 2800);
    };

    const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const wordCount = (displayTranscript + ' ' + liveTranscript).trim().split(/\s+/).filter(Boolean).length;

    // ─── PERMISSION PHASE ──────────────────────────────────────────
    if (phase === 'permission') {
        return (
            <>
                <nav className="navbar"><div className="navbar-inner"><Link href="/" className="navbar-logo"><div className="logo-icon">🤖</div>InterviewAI</Link></div></nav>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px', position: 'relative', zIndex: 1 }}>
                    <div style={{ maxWidth: '540px', textAlign: 'center' }}>
                        <div style={{ fontSize: '72px', marginBottom: '24px' }}>📸</div>
                        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>Enable Camera & Microphone</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
                            InterviewAI uses your camera to analyze <strong>eye contact, confidence & posture</strong> in real-time, and your microphone to transcribe your answers for AI feedback.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
                            {[['📷', 'Camera', 'Live video feed with facial analysis'], ['🎙️', 'Microphone', 'Real-time speech-to-text transcription'], ['🔒', 'Private', 'Video stays on your device — never uploaded']].map(([icon, title, desc]) => (
                                <div key={title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '22px', marginTop: '2px' }}>{icon}</span>
                                    <div><div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{title}</div><div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{desc}</div></div>
                                </div>
                            ))}
                        </div>
                        {cameraError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>{cameraError}</div>}
                        <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={requestCamera}>📷 Allow Camera & Start</button>
                        <div style={{ marginTop: '16px' }}>
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setPhase('setup')}>Skip camera — use text mode instead</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ─── SETUP PHASE ───────────────────────────────────────────────
    if (phase === 'setup') {
        return (
            <>
                <nav className="navbar"><div className="navbar-inner"><Link href="/" className="navbar-logo"><div className="logo-icon">🤖</div>InterviewAI</Link><Link href="/dashboard" className="navbar-link">Dashboard</Link></div></nav>
                <div className="page-wrapper">
                    <div className="page-header animate-fade-up">
                        <div className="section-tag" style={{ display: 'inline-flex', marginBottom: '12px' }}>✦ Session Setup</div>
                        <h1 className="page-title">Configure Your Interview</h1>
                        <p className="page-subtitle">Camera ready ✅ — Customize your practice session.</p>
                    </div>

                    {/* Camera preview small */}
                    {streamRef.current && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                            <div style={{ position: 'relative', width: '200px', height: '150px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--accent-violet)', boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}>
                                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(239,68,68,0.9)', borderRadius: '100px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />LIVE
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="setup-grid animate-fade-up-delay-1">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass-card">
                                <label className="form-label">Target Role</label>
                                <select className="form-select" value={config.role} onChange={e => setConfig(c => ({ ...c, role: e.target.value }))}>
                                    {roles.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="glass-card">
                                <label className="form-label">Experience Level</label>
                                <select className="form-select" value={config.experience} onChange={e => setConfig(c => ({ ...c, experience: e.target.value }))}>
                                    {experiences.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="glass-card">
                                <label className="form-label">Interview Type</label>
                                <div className="select-grid">
                                    {interviewTypes.map(t => (
                                        <div key={t.id} className={`select-option ${config.type === t.id ? 'selected' : ''}`} onClick={() => setConfig(c => ({ ...c, type: t.id }))}>
                                            <div className="select-option-icon">{t.icon}</div>
                                            <div className="select-option-label">{t.label}</div>
                                            <div className="select-option-sub">{t.sub}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass-card">
                                <label className="form-label">Difficulty Level</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {difficulties.map(d => (
                                        <div key={d.id} className={`select-option ${config.difficulty === d.id ? 'selected' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }} onClick={() => setConfig(c => ({ ...c, difficulty: d.id }))}>
                                            <span style={{ fontSize: '24px' }}>{d.icon}</span>
                                            <div><div className="select-option-label">{d.label}</div><div className="select-option-sub">{d.sub}</div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'var(--accent-violet-light)', marginBottom: '16px', textTransform: 'uppercase' }}>Session Preview</div>
                                {[['🎯 Role', config.role], ['📊 Level', config.experience], ['📝 Type', interviewTypes.find(t => t.id === config.type)?.label], ['📸 Analysis', 'Camera + Voice + Video'], ['❓ Questions', `${(questionBank[config.type] || questionBank.behavioral).length} questions`]].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{k}</span><span style={{ fontWeight: '600' }}>{v}</span>
                                    </div>
                                ))}
                                {!speechSupported && <div style={{ fontSize: '12px', color: 'var(--accent-amber)', padding: '8px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', marginTop: '8px' }}>⚠️ Speech recognition unavailable in this browser. Use Chrome for full features.</div>}
                                <button className="btn btn-primary" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }} onClick={startInterview}>🎙️ Begin Interview</button>
                            </div>
                        </div>
                    </div>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </>
        );
    }

    // ─── ANALYZING PHASE ───────────────────────────────────────────
    if (phase === 'analyzing') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '72px', marginBottom: '24px', animation: 'float 2s ease-in-out infinite' }}>🧠</div>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>Analyzing Your Performance</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '32px' }}>Processing video, voice, and content quality...</p>
                    <div style={{ width: '280px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', margin: '0 auto', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))', borderRadius: '2px', animation: 'analyzing-bar 2.5s ease forwards' }} />
                    </div>
                    <style>{`@keyframes analyzing-bar { from { width: 0% } to { width: 100% } }`}</style>
                    <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {['📊 Content Quality', '👁️ Eye Contact', '🎙️ Clarity', '🏗️ Answer Structure'].map((s, i) => (
                            <span key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', animation: `fadeInUp 0.5s ${i * 0.3}s both` }}>{s}</span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── INTERVIEW PHASE ───────────────────────────────────────────
    const q = questions[current];
    const progress = questions.length ? (current / questions.length) * 100 : 0;
    const eyeColor = videoMetrics.eyeContact > 70 ? 'var(--accent-green)' : videoMetrics.eyeContact > 40 ? 'var(--accent-amber)' : '#f87171';
    const postureGood = videoMetrics.posture?.startsWith('Good');

    return (
        <>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {/* TOP NAV */}
            <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/" className="navbar-logo" style={{ fontSize: '16px' }}><div className="logo-icon" style={{ width: '30px', height: '30px', fontSize: '14px' }}>🤖</div>InterviewAI</Link>
                <div style={{ flex: 1, margin: '0 24px' }}>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))', borderRadius: '2px', width: `${progress}%`, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Question {current + 1} of {questions.length}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(progress)}% complete</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '16px', color: 'var(--accent-amber)', fontWeight: '700' }}>⏱ {formatTimer(timer)}</span>
                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '12px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => { const { updatedAnswers, updatedMetrics, updatedVideoData } = saveCurrentAndNext(current); finishInterview(updatedAnswers, updatedMetrics, updatedVideoData); }}>End Session</button>
                </div>
            </nav>

            {/* MAIN INTERVIEW LAYOUT */}
            <div style={{ minHeight: '100vh', paddingTop: '60px', display: 'grid', gridTemplateColumns: '420px 1fr', gap: 0, position: 'relative', zIndex: 1 }}>

                {/* ── LEFT: CAMERA PANEL ── */}
                <div style={{ background: '#0a0a0f', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: '60px', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
                    {/* Camera Feed */}
                    <div style={{ position: 'relative', flex: '0 0 auto', aspectRatio: '4/3', background: '#000', overflow: 'hidden' }}>
                        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />

                        {/* Recording badge */}
                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', animation: 'pulse 1s ease-in-out infinite' }} />● REC {formatTimer(timer)}
                        </div>

                        {/* Eye contact overlay */}
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: eyeColor }}>{videoMetrics.eyeContact}%</div>
                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Eye Contact</div>
                        </div>

                        {/* Face detected indicator */}
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: videoMetrics.faceDetected ? 'var(--accent-green)' : '#f87171' }} />
                            {videoMetrics.faceDetected ? '✓ Face Detected' : '⚠ Face Not Clear'}
                        </div>

                        {/* Status badge */}
                        <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: isListening ? 'rgba(236,72,153,0.85)' : isSpeaking ? 'rgba(124,58,237,0.85)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', color: '#fff', transition: 'all 0.3s' }}>
                            {isSpeaking ? '🤖 ARIA Speaking' : isListening ? '🎙 Listening...' : '⏸ Paused'}
                        </div>
                    </div>

                    {/* Live Metrics Panel */}
                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>📊 Live Video Analysis</div>

                        {[
                            { label: '👁️ Eye Contact', val: videoMetrics.eyeContact, color: eyeColor },
                            { label: '💪 Confidence', val: videoMetrics.confidence, color: 'var(--accent-violet-light)' },
                        ].map(m => (
                            <div key={m.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                    <span style={{ fontWeight: '600' }}>{m.label}</span>
                                    <span style={{ fontWeight: '700', color: m.color }}>{m.val}%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: m.color, borderRadius: '3px', width: `${m.val}%`, transition: 'width 0.8s ease' }} />
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 14px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>📍 Posture</span>
                            <span style={{ fontWeight: '700', color: postureGood ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{videoMetrics.posture || 'Detecting...'}</span>
                        </div>

                        {/* ML Detector status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: detectorStatus === 'ready' ? 'var(--accent-green)' : detectorStatus === 'loading' ? 'var(--accent-amber)' : detectorStatus === 'failed' ? '#f87171' : 'var(--text-muted)', animation: detectorStatus === 'loading' ? 'pulse 1s infinite' : 'none', flexShrink: 0 }} />
                            {detectorStatus === 'loading' && 'Calibrating AI Vision...'}
                            {detectorStatus === 'ready' && 'ML Face Detection Active'}
                            {detectorStatus === 'failed' && 'Heuristic Mode (no WebGL)'}
                            {detectorStatus === 'idle' && 'Vision: Standby'}
                        </div>

                        {/* Eye contact history sparkline */}
                        {videoMetrics.history.length > 2 && (
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>Eye Contact Trend</div>
                                <svg width="100%" height="40" viewBox={`0 0 ${videoMetrics.history.length * 10} 40`} preserveAspectRatio="none">
                                    <polyline
                                        points={videoMetrics.history.map((v, i) => `${i * 10},${40 - (v * 0.4)}`).join(' ')}
                                        fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', padding: '14px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            💡 <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> Look directly at the camera lens for best eye contact score. Maintain a straight posture and speak clearly.
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: QUESTION + ANSWER PANEL ── */}
                <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>

                    {/* AI Avatar */}
                    <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto', boxShadow: isSpeaking ? '0 0 0 8px rgba(124,58,237,0.15), 0 0 50px rgba(124,58,237,0.5)' : '0 0 30px rgba(124,58,237,0.2)', transition: 'box-shadow 0.3s', animation: 'float 3s ease-in-out infinite' }}>🤖</div>
                            {isSpeaking && <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '2px solid var(--accent-violet-light)', animation: 'speaking-ring 1.5s ease-in-out infinite' }} />}
                        </div>
                        <div style={{ fontSize: '12px', color: isSpeaking ? 'var(--accent-violet-light)' : isListening ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: '600', marginTop: '10px', transition: 'color 0.3s' }}>
                            {isSpeaking ? '🔊 ARIA is speaking...' : isListening ? '🎙️ Listening to your answer...' : '🤖 ARIA — Your AI Interviewer'}
                        </div>
                    </div>

                    {/* Question Card */}
                    {!aiThinking && q && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', position: 'relative', overflow: 'hidden' }} className="animate-fade-up">
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan), var(--accent-pink))' }} />
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-violet-light)', background: 'rgba(124,58,237,0.1)', padding: '6px 14px', borderRadius: '100px', marginBottom: '16px' }}>📌 {q.category}</div>
                            <div style={{ fontSize: '20px', fontWeight: '600', lineHeight: '1.55', color: 'var(--text-primary)', marginBottom: '16px' }}>{q.q}</div>
                            {q.hint && <div style={{ fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>💡 <strong>Tip:</strong> {q.hint}</div>}
                        </div>
                    )}

                    {aiThinking && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'float 1s ease-in-out infinite' }}>🤔</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>ARIA is preparing your question...</div>
                        </div>
                    )}

                    {/* Live Transcript */}
                    {!aiThinking && (
                        <div className="animate-fade-up-delay-1">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>📝 Your Answer (Live Transcript)</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{wordCount} words</span>
                                    {isListening && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-pink)', animation: 'pulse 0.8s ease-in-out infinite' }} />}
                                </div>
                            </div>
                            <div style={{ minHeight: '140px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${isListening ? 'rgba(236,72,153,0.4)' : 'var(--border)'}`, borderRadius: '16px', padding: '20px', fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)', transition: 'border-color 0.3s', position: 'relative' }}>
                                {isListening && !displayTranscript && !liveTranscript && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Start speaking... your answer will appear here in real-time.</span>}
                                <span>{displayTranscript}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{liveTranscript}</span>
                                {isListening && <span style={{ display: 'inline-block', width: '2px', height: '18px', background: 'var(--accent-pink)', marginLeft: '3px', animation: 'pulse 1s infinite', verticalAlign: 'middle' }} />}
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    {!aiThinking && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }} className="animate-fade-up-delay-2">
                            <button
                                onClick={isListening ? stopListening : startListening}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '12px', border: `2px solid ${isListening ? 'var(--accent-pink)' : 'var(--border)'}`, background: isListening ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.04)', color: isListening ? 'var(--accent-pink)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
                            >
                                {isListening ? '⏹ Stop Recording' : '🎙️ Start Recording'}
                            </button>

                            <button
                                onClick={() => speakQuestion(q.q)}
                                disabled={isSpeaking}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', cursor: isSpeaking ? 'default' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: isSpeaking ? 0.5 : 1, fontFamily: 'Inter, sans-serif' }}
                            >
                                🔊 Replay Question
                            </button>

                            <button
                                className="btn btn-primary"
                                style={{ marginLeft: 'auto' }}
                                onClick={nextQuestion}
                                disabled={isSpeaking}
                            >
                                {current < questions.length - 1 ? 'Next Question →' : '✅ Finish Interview'}
                            </button>
                        </div>
                    )}

                    {/* Answering tips */}
                    {!aiThinking && isListening && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {['Speak clearly & at moderate pace', 'Use specific examples', 'Maintain eye contact with camera'].map(t => (
                                <span key={t} style={{ fontSize: '12px', color: 'var(--accent-green)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', padding: '5px 12px' }}>✓ {t}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
