import './Header.css';

function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <div className="app-logo">₹</div>
          <div className="app-brand-text">
            <span className="app-title">Expense Tracker</span>
            <span className="app-subtitle">Personal finance, simplified</span>
          </div>
        </div>

        <span className="app-date">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </header>
  );
}

export default Header;
