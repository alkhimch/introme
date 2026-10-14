import { QUALITY } from '../world/quality'
import { QUALITIES, setQuality, suggestQuality, useQuality } from '../world/store'

// Graphics quality, chosen before driving off. Changing it rebuilds the 3D scene.
export default function QualityPicker() {
  const quality = useQuality()
  const suggested = suggestQuality()
  return (
    <fieldset className="quality">
      <legend>Graphics</legend>
      <div className="quality-options" role="radiogroup" aria-label="Graphics quality">
        {QUALITIES.map((q) => (
          <button key={q} role="radio" aria-checked={quality === q} className={quality === q ? 'active' : ''} onClick={() => setQuality(q)}>
            <strong>{QUALITY[q].label}</strong>
            <span>{q === suggested ? 'Recommended' : QUALITY[q].note}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
