export default function StepIndicator({ currentStep, labels }) {
  return (
    <ol className="stepper" aria-label="Booking progress">
      {labels.map((label, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'todo';
        return (
          <li key={label} className={`stepper-item ${state}`}>
            <span className="stepper-circle" aria-hidden="true">
              {i < currentStep ? '✓' : i + 1}
            </span>
            <span className="stepper-label">{label}</span>
            {i < labels.length - 1 && <span className="stepper-line" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
