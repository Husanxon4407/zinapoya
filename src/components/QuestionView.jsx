import { PARTS } from '../data/parts.js';
import { stepLabel, useT } from '../i18n/index.js';

// Shows what the examiner shows: pictures, cue card questions or the For/Against table.
export default function QuestionView({ step, compact = false }) {
  const part = PARTS[step.part];
  const t = useT();
  return (
    <div className={`qview ${compact ? 'qview--compact' : ''}`}>
      <div className="qview__tag" style={{ background: part.soft, color: part.ink }}>
        {part.emoji} {t(part.name)} · {stepLabel(t, step.label)}
      </div>

      {step.image && <img className="qview__img" src={step.image} alt={step.setTitle || step.label} />}
      {!step.image && step.emoji && <div className="qview__emoji" style={{ background: part.soft }}>{step.emoji}</div>}

      {step.list ? (
        <ul className="qview__list">
          {step.list.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      ) : (
        <h2 className="qview__prompt">{step.prompt}</h2>
      )}

      {step.table && (
        <div className="debate-table">
          <div className="debate-table__col debate-table__col--for">
            <h4>👍 For</h4>
            <ul>
              {step.table.for.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="debate-table__col debate-table__col--against">
            <h4>👎 Against</h4>
            <ul>
              {step.table.against.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
