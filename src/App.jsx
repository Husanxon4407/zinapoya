import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './state.jsx';
import Layout from './components/Layout.jsx';
import Backdrop from './components/Backdrop.jsx';
import Landing from './pages/Landing.jsx';
import { ForgotPassword, Login, ResetPassword, Signup, signInErrorFromUrl } from './pages/Auth.jsx';
import Home from './pages/Home.jsx';

// The first screens (main page, login, Home) load at once. Every other page is downloaded only
// when it is opened, so the site starts fast on slow phones. The service worker still saves
// all of them in the background, so later visits and offline use are instant.
const page = (load, name = 'default') => lazy(() => load().then((m) => ({ default: m[name] })));
const TryIt = page(() => import('./pages/TryIt.jsx'));
const PartPage = page(() => import('./pages/PartPage.jsx'));
const Practice = page(() => import('./pages/Practice.jsx'));
const MockExam = page(() => import('./pages/MockExam.jsx'), 'MockExam');
const Workout = page(() => import('./pages/MockExam.jsx'), 'Workout');
const Games = page(() => import('./pages/games/Games.jsx'));
const Roulette = page(() => import('./pages/games/Roulette.jsx'));
const LinkerBingo = page(() => import('./pages/games/LinkerBingo.jsx'));
const StoryBuilder = page(() => import('./pages/games/StoryBuilder.jsx'));
const DebateArena = page(() => import('./pages/games/DebateArena.jsx'));
const Phrases = page(() => import('./pages/Phrases.jsx'));
const Quiz = page(() => import('./pages/games/Quiz.jsx'));
const WordSprint = page(() => import('./pages/games/WordSprint.jsx'));
const Pronounce = page(() => import('./pages/games/Pronounce.jsx'));
const Vocab = page(() => import('./pages/Vocab.jsx'));
const VocabTopic = page(() => import('./pages/VocabTopic.jsx'));
const Progress = page(() => import('./pages/Progress.jsx'));
const History = page(() => import('./pages/History.jsx'));
const Profile = page(() => import('./pages/Profile.jsx'));
const Mistakes = page(() => import('./pages/Mistakes.jsx'));
const Privacy = page(() => import('./pages/Privacy.jsx'));
const Teacher = page(() => import('./pages/Teacher.jsx'));
const TeacherStudent = page(() => import('./pages/Teacher.jsx'), 'TeacherStudent');

export function PageLoading() {
  return (
    <div className="splash">
      <div className="spinner" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Links like /progress#leaderboard open at that section (after the page has drawn).
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
    if (hash && !target) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <Backdrop />
      <div className="app-layer">
        <Screens />
      </div>
    </>
  );
}

function Screens() {
  const { user, authReady, recovering } = useApp();

  if (!authReady) {
    return (
      <div className="splash">
        <div className="spinner" />
      </div>
    );
  }

  if (recovering) return <ResetPassword />;

  if (!user) {
    return (
      <>
        <ScrollToTop />
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* A failed Google sign-in comes back to "/": show the reason on the login page. */}
            <Route path="/" element={signInErrorFromUrl() ? <Navigate to={`/login${window.location.search}`} replace /> : <Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/try" element={<TryIt />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/part/:key" element={<PartPage />} />
          <Route path="/practice/:key/:id" element={<Practice />} />
          <Route path="/mock" element={<MockExam />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/roulette" element={<Roulette />} />
          <Route path="/games/bingo" element={<LinkerBingo />} />
          <Route path="/games/story" element={<StoryBuilder />} />
          <Route path="/games/debate" element={<DebateArena />} />
          <Route path="/games/quiz" element={<Quiz />} />
          <Route path="/games/sprint" element={<WordSprint />} />
          <Route path="/games/pronounce" element={<Pronounce />} />
          <Route path="/vocab" element={<Vocab />} />
          <Route path="/vocab/:id" element={<VocabTopic />} />
          <Route path="/phrases" element={<Phrases />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/privacy" element={<Privacy inApp />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/teacher/:id" element={<TeacherStudent />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
