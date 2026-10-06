import { input } from '../world/store'

function Pad({ action, label, className }) {
  const on = (e) => { e.preventDefault(); input[action] = true }
  const off = (e) => { e.preventDefault(); input[action] = false }
  return (
    <button
      className={'pad ' + (className || '')}
      aria-label={action}
      onPointerDown={on}
      onPointerUp={off}
      onPointerCancel={off}
      onPointerLeave={off}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

export default function TouchControls() {
  return (
    <div className="touch">
      <div className="touch-group">
        <Pad action="left" label="◀" />
        <Pad action="right" label="▶" />
      </div>
      <div className="touch-group">
        <Pad action="back" label="▼" />
        <Pad action="forward" label="▲" className="gas" />
      </div>
    </div>
  )
}
