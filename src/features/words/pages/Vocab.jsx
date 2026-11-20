import { Link } from 'react-router-dom';
import { VOCAB } from '../data/vocab.js';

export default function Vocab() {
  return (
    <div>
      <h1>📚 Topic vocabulary</h1>
      <p className="muted">Exam topics with words, sentence structures and idioms. Each one has a simple meaning and a common example sentence.</p>

      <div className="vocab-grid">
        {VOCAB.map((t) => (
          <Link key={t.id} to={`/vocab/${t.id}`} className="vocab-card" style={{ '--c': t.color }}>
            <span className="vocab-card__emoji">{t.emoji}</span>
            <h3>{t.title}</h3>
            <p>{t.intro}</p>
            <div className="vocab-card__meta">
              <span>{t.words.length} words</span>
              <span>{t.structures.length} structures</span>
              <span>{t.idioms.length} idioms</span>
            </div>
          </Link>
        ))}
      </div>

      <Link to="/phrases" className="card phrases-link">
        <span className="phrases-link__emoji">💬</span>
        <div>
          <h3>Exam phrase bank</h3>
          <p className="muted">Ready-made phrases for Parts 1.1, 1.2, 2 and 3: starting answers, comparing pictures, telling stories, arguing.</p>
        </div>
        <span className="arrow">→</span>
      </Link>
    </div>
  );
}
