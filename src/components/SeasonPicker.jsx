import { SEASON_LOOK, TIME_LOOK } from '../world/seasons'
import { SEASONS, TIMES, setSeason, setTimeOfDay, useSeason, useTimeOfDay } from '../world/store'

export default function SeasonPicker() {
  const season = useSeason()
  const time = useTimeOfDay()
  return (
    <div className="seasons">
      <div role="radiogroup" aria-label="Season" className="seg">
        {SEASONS.map((s, i) => (
          <button
            key={s}
            role="radio"
            aria-checked={season === s}
            className={season === s ? 'active' : ''}
            onClick={() => setSeason(s)}
            title={`${SEASON_LOOK[s].label} (${i + 1})`}
          >
            <span aria-hidden="true">{SEASON_LOOK[s].icon}</span>
            <span className="season-label">{SEASON_LOOK[s].label}</span>
          </button>
        ))}
      </div>
      <span className="seg-divider" aria-hidden="true" />
      <div role="radiogroup" aria-label="Time of day" className="seg">
        {TIMES.map((t) => (
          <button
            key={t}
            role="radio"
            aria-checked={time === t}
            className={time === t ? 'active' : ''}
            onClick={() => setTimeOfDay(t)}
            title={`${TIME_LOOK[t].label} (N)`}
          >
            <span aria-hidden="true">{TIME_LOOK[t].icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
