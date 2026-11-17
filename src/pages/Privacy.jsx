import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

// Public privacy page (Google sign-in needs a link to it). Keep it short and in simple English.
// inApp: opened while logged in, inside the normal top bar (so no second logo).
export default function Privacy({ inApp = false }) {
  return (
    <div className="privacy">
      {!inApp && (
        <Link to="/" className="logo">
          <Logo />
        </Link>
      )}
      <div className="card">
        <h1>Privacy policy</h1>
        <p className="muted">Last updated: 17 November 2026</p>

        <p>
          Zinapoya is a free website made by an English teacher to help students practise for the Multilevel (CEFR) speaking exam. This page
          explains what we save and why.
        </p>

        <h2>What we save</h2>
        <ul>
          <li>
            <strong>Your account:</strong> your name, email address and profile photo (if you add one, or if you sign in with Google).
          </li>
          <li>
            <strong>About you (all optional):</strong> the areas you study, your goal, your level, your exam date, your age range (not your
            birthday) and your phone number. We use them to suggest the right practice, count down to your exam and, if you give your phone
            number, to send reminders and important news about your lessons. Never for ads.
          </li>
          <li>
            <strong>Your practice:</strong> your voice recordings (only the newest 30), the text of what you said, your scores and the AI
            feedback, your game scores, saved words and phrases.
          </li>
          <li>
            <strong>Reminders:</strong> if you turn on daily reminders, a technical address that lets us send a notification to your device.
          </li>
        </ul>

        <h2>Why</h2>
        <p>Only to run Zinapoya: to keep your progress, show your history, give you feedback and send the reminders you asked for. We never sell your data and we show no ads.</p>

        <h2>Who can see it</h2>
        <ul>
          <li>You.</li>
          <li>Your teacher, who can see your answers, recordings, scores and your “About you” answers to help you improve.</li>
          <li>
            Other students only see your name, photo and weekly points if you are in this week’s top 10 on the leaderboard. They never see your
            answers or recordings.
          </li>
        </ul>

        <h2>Services we use</h2>
        <ul>
          <li>
            <strong>Supabase</strong> stores your account and practice data.
          </li>
          <li>
            <strong>Google Gemini</strong> reads the text of your answer (and sometimes listens to your recording) to write feedback. It is used
            only for that.
          </li>
          <li>
            <strong>Google sign-in</strong> (if you choose it) gives us your name, email and Google profile photo.
          </li>
          <li>
            <strong>Vercel</strong> hosts the website.
          </li>
        </ul>

        <h2>Deleting your data</h2>
        <p>Ask your teacher at any time and your account and everything saved with it will be deleted.</p>
      </div>
    </div>
  );
}
