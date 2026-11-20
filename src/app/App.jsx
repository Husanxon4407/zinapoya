import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './state.jsx';
import Layout from '../shared/components/Layout.jsx';
import Backdrop from '../shared/components/Backdrop.jsx';
import Landing from '../features/home/pages/Landing.jsx';
import { ForgotPassword, Login, ResetPassword, Signup, signInErrorFromUrl } from '../features/account/pages/Auth.jsx';
import Home from '../features/speaking/pages/SpeakingHome.jsx';
import Gate from '../shared/components/Gate.jsx';
import LangPicker from '../shared/components/LangPicker.jsx';
import { AREAS, areaPath, isArea } from '../shared/data/areas.js';
import { safePath, takeNextPath } from '../shared/lib/area.js';

// The first screens (main page, login, Home) load at once. Every other page is downloaded only
// when it is opened, so the site starts fast on slow phones. The service worker still saves
// all of them in the background, so later visits and offline use are instant.
const page = (load, name = 'default') => lazy(() => load().then((m) => ({ default: m[name] })));
const TryIt = page(() => import('../features/speaking/pages/TryIt.jsx'));
const AreaLanding = page(() => import('../features/home/pages/AreaLanding.jsx'));
const AreaMain = page(() => import('../features/home/pages/AreaMain.jsx'));
const MyLearning = page(() => import('../features/home/pages/MyLearning.jsx'));
const Welcome = page(() => import('../features/account/pages/Welcome.jsx'));
const PartPage = page(() => import('../features/speaking/pages/PartPage.jsx'));
const Practice = page(() => import('../features/speaking/pages/Practice.jsx'));
const MockExam = page(() => import('../features/speaking/pages/MockExam.jsx'), 'MockExam');
const Workout = page(() => import('../features/speaking/pages/MockExam.jsx'), 'Workout');
const Games = page(() => import('../features/games/pages/Games.jsx'));
const Roulette = page(() => import('../features/games/pages/Roulette.jsx'));
const LinkerBingo = page(() => import('../features/games/pages/LinkerBingo.jsx'));
const StoryBuilder = page(() => import('../features/games/pages/StoryBuilder.jsx'));
const DebateArena = page(() => import('../features/games/pages/DebateArena.jsx'));
const Phrases = page(() => import('../features/words/pages/Phrases.jsx'));
const Quiz = page(() => import('../features/games/pages/Quiz.jsx'));
const WordSprint = page(() => import('../features/games/pages/WordSprint.jsx'));
const Pronounce = page(() => import('../features/games/pages/Pronounce.jsx'));
const Vocab = page(() => import('../features/words/pages/Vocab.jsx'));
const VocabTopic = page(() => import('../features/words/pages/VocabTopic.jsx'));
const Progress = page(() => import('../features/progress/pages/Progress.jsx'));
const History = page(() => import('../features/progress/pages/History.jsx'));
const Profile = page(() => import('../features/account/pages/Profile.jsx'));
const Mistakes = page(() => import('../features/progress/pages/Mistakes.jsx'));
const Privacy = page(() => import('../features/account/pages/Privacy.jsx'));
const Teacher = page(() => import('../features/teacher/pages/Teacher.jsx'));
const TeacherStudent = page(() => import('../features/teacher/pages/Teacher.jsx'), 'TeacherStudent');
// CEFR Writing (everything for it lives in src/features/writing).
const WritingHome = page(() => import('../features/writing/pages/WritingHome.jsx'));
const WritingTask = page(() => import('../features/writing/pages/WritingTask.jsx'));
const WritingResult = page(() => import('../features/writing/pages/WritingResult.jsx'));
const WritingGames = page(() => import('../features/writing/games/WritingGames.jsx'));
const CefrHub = page(() => import('../features/home/pages/CefrHub.jsx'));
const PointHunter = page(() => import('../features/writing/games/PointHunter.jsx'));
const RegisterSwitch = page(() => import('../features/writing/games/RegisterSwitch.jsx'));
const LetterPuzzle = page(() => import('../features/writing/games/LetterPuzzle.jsx'));
const FixTheMistake = page(() => import('../features/writing/games/FixTheMistake.jsx'));

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
        <LangPicker />
      </div>
    </>
  );
}

// Where a logged-in visitor goes from /login or /signup: ?next=… (a page that asked them to log in) or "My learning".
// (Order: ?next=… → the page saved before logging in → the area they registered for → My learning.)
function AfterAuth() {
  const [params] = useSearchParams();
  const [to] = useState(() => {
    const saved = takeNextPath();
    const area = params.get('area');
    return safePath(params.get('next')) || saved || (isArea(area) ? areaPath(area) : '/my');
  });
  return <Navigate to={to} replace />;
}

// Things that happen right after logging in, wherever the student is:
// 1. Back from Google or an email link: open the page they started from (saved before leaving).
// 2. A new student answers the quick "About you" questions once, then continues where they were.
function AuthFlow() {
  const { user, needsAbout } = useApp();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const userId = user?.id;

  useEffect(() => {
    // On the login / sign-up pages AfterAuth does this itself.
    if (!userId || AUTH_PAGES.includes(pathname)) return;
    const next = takeNextPath();
    if (next && next !== pathname + search) navigate(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (needsAbout && !NO_ABOUT.some((p) => pathname.startsWith(p))) {
      navigate(`/welcome?next=${encodeURIComponent(pathname === '/' ? '/my' : pathname + search)}`, { replace: true });
    }
  }, [needsAbout, pathname, search, navigate]);
  return null;
}
// (Login and sign-up pages first send the student on; the questions come on the page they land on.)
const AUTH_PAGES = ['/login', '/signup', '/forgot'];
const NO_ABOUT = ['/welcome', '/privacy', '/reset-password', ...AUTH_PAGES];

const lazyEl = (el) => <Suspense fallback={<PageLoading />}>{el}</Suspense>;

function Screens() {
  const { user, authReady, recovering } = useApp();
  const { pathname } = useLocation();

  // The main page shows at once: it does not wait for the login check (on a slow network that can
  // take seconds when the saved session has to be refreshed). Only its login buttons wait (Hero).
  if (!authReady && pathname !== '/') {
    return (
      <div className="splash">
        <div className="spinner" />
      </div>
    );
  }

  if (recovering) return <ResetPassword />;

  // One map of pages for everyone. Guests can open every homepage and look around each area;
  // pages that save something show a "Free account needed" card instead (Gate).
  return (
    <>
      <ScrollToTop />
      <AuthFlow />
      <Routes>
        {/* A failed Google sign-in comes back to "/": show the reason on the login page. */}
        <Route path="/" element={signInErrorFromUrl() ? <Navigate to={`/login${window.location.search}`} replace /> : <Landing />} />
        <Route path="/login" element={user ? <AfterAuth /> : <Login />} />
        <Route path="/signup" element={user ? <AfterAuth /> : <Signup />} />
        <Route path="/forgot" element={user ? <AfterAuth /> : <ForgotPassword />} />
        <Route path="/try" element={lazyEl(<TryIt />)} />
        <Route path="/learn/:id" element={lazyEl(<AreaLanding />)} />
        <Route path="/welcome" element={user ? lazyEl(<Welcome />) : <Navigate to="/login?next=%2Fwelcome" replace />} />
        {!user && <Route path="/privacy" element={lazyEl(<Privacy />)} />}

        <Route element={<Layout />}>
          <Route path="/my" element={<Gate why="Log in to see your areas and progress."><MyLearning /></Gate>} />
          <Route path="/cefr" element={<CefrHub />} />
          <Route path="/speaking" element={<Home />} />
          {AREAS.filter((a) => a.id !== 'cefr').map((a) => (
            <Route key={a.id} path={areaPath(a.id)} element={<AreaMain areaId={a.id} />} />
          ))}
          <Route path="/part/:key" element={<PartPage />} />
          <Route path="/practice/:key/:id" element={<Gate feature="cefr.speaking"><Practice /></Gate>} />
          <Route path="/mock" element={<Gate feature="cefr.mock"><MockExam /></Gate>} />
          <Route path="/workout" element={<Gate feature="cefr.speaking"><Workout /></Gate>} />
          <Route path="/writing" element={<WritingHome />} />
          <Route path="/writing/games" element={<WritingGames />} />
          <Route path="/writing/games/point-hunter" element={<PointHunter />} />
          <Route path="/writing/games/register-switch" element={<RegisterSwitch />} />
          <Route path="/writing/games/letter-puzzle" element={<LetterPuzzle />} />
          <Route path="/writing/games/fix-the-mistake" element={<FixTheMistake />} />
          <Route path="/writing/result/:attemptId" element={<Gate why="Log in to see your writing feedback."><WritingResult /></Gate>} />
          <Route path="/writing/:part/:id" element={<WritingTask />} />
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
          <Route path="/progress" element={<Gate why="Log in to see your progress."><Progress /></Gate>} />
          <Route path="/history" element={<Gate why="Log in to see your answers."><History /></Gate>} />
          <Route path="/profile" element={<Gate why="Log in to see your profile."><Profile /></Gate>} />
          <Route path="/mistakes" element={<Gate why="Log in to see your mistakes."><Mistakes /></Gate>} />
          {user && <Route path="/privacy" element={<Privacy inApp />} />}
          <Route path="/teacher" element={<Gate><Teacher /></Gate>} />
          <Route path="/teacher/:id" element={<Gate><TeacherStudent /></Gate>} />
          <Route path="/reset-password" element={<Gate><ResetPassword /></Gate>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
