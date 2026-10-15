import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './state.jsx';
import Layout from './components/Layout.jsx';
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
import Progress from './pages/Progress.jsx';
import History from './pages/History.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
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
          <Route path="/phrases" element={<Phrases />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/history" element={<History />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
