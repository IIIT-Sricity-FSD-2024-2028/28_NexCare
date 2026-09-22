// The <nex-care-logo> web component from front-end/logo.js, as a React component.
export default function NexCareLogo({ scale = 1 }) {
  return (
    <div className="nx-logo" style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}>
      <div className="nx-logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <span className="nx-logo-text">
        <span className="nex">NEX</span>
        <span className="care">CARE</span>
      </span>
    </div>
  );
}
