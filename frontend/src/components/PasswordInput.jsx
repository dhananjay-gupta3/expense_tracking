import { useState } from 'react';
import { LockIcon, EyeIcon, EyeOffIcon } from './icons.jsx';
import './PasswordInput.css';

// Password field with a lock icon and a show/hide toggle
function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required,
  autoFocus,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="icon-input-wrap">
      <span className="icon-input-icon">
        <LockIcon />
      </span>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        autoFocus={autoFocus}
        className="icon-input-field has-toggle"
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={-1}
      >
        <span key={visible} className="pw-toggle-icon">
          {visible ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
        </span>
      </button>
    </div>
  );
}

export default PasswordInput;
