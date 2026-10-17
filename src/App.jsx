import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './state.jsx';
import Layout from './components/Layout.jsx';
import Backdrop from './components/Backdrop.jsx';
import Landing from './pages/Landing.jsx';
import { ForgotPassword, Login, ResetPassword, Signup } from './pages/Auth.jsx';
import TryIt from './pages/TryIt.jsx';
import Home from './pages/Home.jsx';
import PartPage from './pages/PartPage.jsx';
import Practice from './pages/Practice.jsx';
import { MockExam, Workout } from './pages/MockExam.jsx';
import Games from './pages/games/Games.jsx';
import Roulette from './pages/games/Roulette.jsx';
import LinkerBingo from './pages/games/LinkerBingo.jsx';
import StoryBuilder from './pages/games/StoryBuilder.jsx';
import DebateArena from './pages/games/DebateArena.jsx';
import Phrases from './pages/Phrases.jsx';
import Quiz from './pages/games/Quiz.jsx';
import WordSprint from './pages/games/WordSprint.jsx';
import Vocab from './pages/Vocab.jsx';
import VocabTopic from './pages/VocabTopic.jsx';
import Progress from './pages/Progress.jsx';
import History from './pages/History.jsx';
import Profile from './pages/Profile.jsx';
import Mistakes from './pages/Mistakes.jsx';
import Privacy from './pages/Privacy.jsx';
import Teacher, { TeacherStudent } from './pages/Teacher.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
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
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/try" element={<TryIt />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
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
          <Route path="/vocab" element={<Vocab />} />
          <Route path="/vocab/:id" element={<VocabTopic />} />
          <Route path="/phrases" element={<Phrases />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/teacher/:id" element={<TeacherStudent />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
