const LABELS = ['Hospital', 'Department', 'Date & Doctor', 'Details'];

export default function StepIndicator({ step }) {
  return (
    <div className="step-indicator">
      <div className="step-progress">
        {LABELS.map((_, i) => (
          <div className="step-item" key={i}>
            <div className={`step-circle${step >= i ? ' active' : ''}${step > i ? ' completed' : ''}`}>{step > i ? '✓' : i + 1}</div>
            {i < LABELS.length - 1 && <div className={`step-line${step >= i + 1 ? ' active' : ''}`} />}
          </div>
        ))}
      </div>
      <div className="step-labels">
        {LABELS.map((l) => <span className="step-label" key={l}>{l}</span>)}
      </div>
    </div>
  );
}
