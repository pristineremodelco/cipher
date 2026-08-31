/** The app's own mark: the four operations, with equals picked out. */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="5.4" strokeLinecap="round" fill="none">
        <path d="M10 20H26M18 12V28" />
        <path d="M33 20H51" />
        <path d="M12.3 37.3L23.7 48.7M23.7 37.3L12.3 48.7" />
      </g>
      <circle cx="44" cy="43" r="12.5" fill="var(--accent)" />
      <g stroke="var(--on-accent)" strokeWidth="4.2" strokeLinecap="round" fill="none">
        <path d="M37.5 39.6H50.5M37.5 46.4H50.5" />
      </g>
    </svg>
  )
}

export function Backspace() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M8.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11L2.5 12z" fill="currentColor" />
      {/* Cut in the colour behind the tag rather than drawn in the same one,
          or the cross disappears into the fill. */}
      <path
        d="M11 9.5l5 5m0-5l-5 5"
        fill="none"
        stroke="var(--key-face, var(--accent))"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Clock() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5V12l3 1.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Gear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <mask id="gear-hub">
        <rect width="24" height="24" fill="#fff" />
        <circle cx="12" cy="12" r="3.2" fill="#000" />
      </mask>
      <g mask="url(#gear-hub)" fill="currentColor">
        <circle cx="12" cy="12" r="7" />
        {/* Four bars at 45 degree steps give eight even teeth, so the gear
            stays symmetrical instead of relying on hand-written curves. */}
        {[0, 45, 90, 135].map((angle) => (
          <rect
            key={angle}
            x="10.3"
            y="2.4"
            width="3.4"
            height="19.2"
            rx="1.1"
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
      </g>
    </svg>
  )
}
