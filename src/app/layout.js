import './globals.css';

export const metadata = {
  title: 'InterviewAI – AI-Driven Mock Interview Simulator',
  description: 'Ace your next interview with AI-powered practice sessions. Get instant feedback on communication, tone, clarity, and content quality, plus personalized career roadmaps.',
  keywords: 'mock interview, AI interview, interview practice, career insights, interview feedback, job preparation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="mesh-bg" />
        {children}
      </body>
    </html>
  );
}
