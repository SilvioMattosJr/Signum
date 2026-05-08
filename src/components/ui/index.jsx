import { Check, AlertCircle, X, GripVertical } from 'lucide-react';
import OptimizedInput from './OptimizedInput.jsx';

export { OptimizedInput };

/* ── CheckRow ─────────────────────────────────────────────────── */
export function CheckRow({ checked, onChange, label, required, invalid }) {
  return (
    <div
      className={`check-row ${checked ? 'on' : ''} ${invalid && !checked ? 'err-state' : ''}`}
      onClick={onChange}
      role="checkbox" aria-checked={checked} tabIndex={0}
      onKeyDown={e => (e.key===' '||e.key==='Enter') && onChange()}
    >
      <div className="check-box">
        {checked && <Check size={10} strokeWidth={3} color="#05090f" />}
      </div>
      <span className="check-label">
        {label}
        {required && <span style={{ color:'var(--cyan)', marginLeft:3 }}>*</span>}
      </span>
    </div>
  );
}

/* ── Field ────────────────────────────────────────────────────── */
export function Field({ label, required, error, children, style }) {
  return (
    <div className="form-group" style={style}>
      {label && (
        <label className="label">
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error && (
        <div className="err-msg">
          <AlertCircle size={11} />{error}
        </div>
      )}
    </div>
  );
}

/* ── RadioGroup ───────────────────────────────────────────────── */
export function RadioGroup({ value, onChange, options, label }) {
  return (
    <div>
      {label && <div className="label" style={{ marginBottom:8 }}>{label}</div>}
      <div className="radio-group">
        {options.map(o => (
          <div
            key={o.value}
            className={`radio-opt ${value===o.value ? 'on' : ''}`}
            onClick={() => onChange(o.value)}
            role="radio" aria-checked={value===o.value} tabIndex={0}
            onKeyDown={e => (e.key===' '||e.key==='Enter') && onChange(o.value)}
          >
            <div className="radio-dot" />
            {o.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SecCard ──────────────────────────────────────────────────── */
export function SecCard({ icon, title, badge, onRemove, dragHandleProps, children, style }) {
  return (
    <div className="card sec-card anim-up" style={{ ...style, marginBottom: dragHandleProps ? 0 : undefined }}>
      <div className="sec-head" style={{ gap: dragHandleProps ? 10 : undefined }}>
        {dragHandleProps && (
          <div className="drag-handle" {...dragHandleProps} title="Arrastar para reordenar" style={{ cursor:'grab', display:'flex', flexShrink:0, color:'var(--t3)' }}>
            <GripVertical size={17} />
          </div>
        )}
        <div className="sec-title" style={{ flex: 1 }}>
          {icon && <span className="sec-icon">{icon}</span>}
          {title}
          {badge && <span className="badge badge-cyan" style={{ fontSize:'.65rem' }}>{badge}</span>}
        </div>
        {onRemove && (
          <button className="btn btn-danger btn-sm" onClick={onRemove}>
            <X size={12} /><span className="hide-sm">Remover</span>
          </button>
        )}
      </div>
      <div className="sec-body">{children}</div>
    </div>
  );
}

/* ── SubTitle ─────────────────────────────────────────────────── */
export function SubTitle({ icon, children }) {
  return (
    <div className="sub-title">
      {icon && <span style={{ color:'var(--cyan)' }}>{icon}</span>}
      {children}
    </div>
  );
}
