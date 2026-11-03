import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { sfx } from '../lib/sound.js';
import { speak } from '../lib/speech.js';

const KEY = 'su_coach_chat';
const GREETING = {
  role: 'model',
  text: 'Hi! I’m your SpeakUp Coach 🎤 Ask me anything about the speaking exam, useful phrases, idioms or how to improve your answers.',
};
const QUICK = ['How do I start a Part 3 answer?', 'Explain “burn the midnight oil”', 'Give me tips for Part 1.1', 'Ask me a Part 2 question'];

function load() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || [GREETING];
  } catch {
    return [GREETING];
  }
}

const bold = (line) => line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith('**') && part.endsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : part));

// Turn **bold**, "- " bullets, "1." lists, ### headings and line breaks into simple formatting.
function Formatted({ text }) {
  return text
    .split('\n')
    .filter((line, i, all) => line.trim() || (i > 0 && all[i - 1].trim()))
    .map((raw, i) => {
      const line = raw.trimEnd();
      if (!line.trim()) return <div key={i} className="bubble__gap" />;
      const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
      if (bullet) return <p key={i} className="bubble__li">• {bold(bullet[1])}</p>;
      const num = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (num) return <p key={i} className="bubble__li">{num[1]}. {bold(num[2])}</p>;
      const head = line.match(/^\s*#{1,4}\s+(.*)$/);
      if (head) return <p key={i}><b>{head[1].replace(/\*\*/g, '')}</b></p>;
      return <p key={i}>{bold(line)}</p>;
    });
}

export default function CoachChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(load);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, busy]);

  async function send(text) {
    const q = text.trim();
    if (!q || busy) return;
    setError('');
    setInput('');
    const next = [...messages, { role: 'user', text: q }];
    setMessages(next);
    setBusy(true);
    let started = false;
    try {
      // The greeting is local only; send the real conversation. The answer appears word by word.
      const reply = await api.chat(
        next.filter((m) => m !== GREETING && m.text !== GREETING.text),
        (text) => {
          if (!started) {
            started = true;
            setBusy(false);
            setMessages((m) => [...m, { role: 'model', text }]);
          } else setMessages((m) => [...m.slice(0, -1), { role: 'model', text }]);
        },
      );
      if (started) setMessages((m) => [...m.slice(0, -1), { role: 'model', text: reply }]);
      else setMessages((m) => [...m, { role: 'model', text: reply }]);
      sfx('pop');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={`coach-fab ${open ? 'coach-fab--open' : ''}`}
        onClick={() => {
          sfx('click');
          setOpen(!open);
        }}
        aria-label={open ? 'Close coach chat' : 'Ask the coach'}
      >
        {open ? '✕' : '💬'}
        {!open && <span className="coach-fab__label">Ask the coach</span>}
      </button>

      {open && (
        <div className="coach" role="dialog" aria-label="SpeakUp Coach">
          <header className="coach__head">
            <span className="coach__avatar">🎓</span>
            <div>
              <strong>SpeakUp Coach</strong>
              <small>Only English speaking & exam questions</small>
            </div>
            <button
              className="icon-btn coach__clear"
              title="Start a new chat"
              onClick={() => {
                setMessages([GREETING]);
                setError('');
              }}
            >
              🗑️
            </button>
          </header>

          <div className="coach__list" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`bubble bubble--${m.role}`}>
                <Formatted text={m.text} />
                {m.role === 'model' && i > 0 && (
                  <button className="icon-btn bubble__speak" title="Listen" onClick={() => speak(m.text.replace(/\*\*/g, ''))}>
                    🔊
                  </button>
                )}
              </div>
            ))}
            {busy && (
              <div className="bubble bubble--model bubble--typing">
                <span />
                <span />
                <span />
              </div>
            )}
            {messages.length <= 1 && (
              <div className="coach__quick">
                {QUICK.map((q) => (
                  <button key={q} className="filter" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="notice notice--warn coach__error">{error}</p>}

          <form
            className="coach__form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input value={input} maxLength={500} placeholder="Ask about the speaking exam…" onChange={(e) => setInput(e.target.value)} />
            <button className="btn btn--small" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
