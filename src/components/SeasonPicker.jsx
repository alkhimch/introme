import { SEASON_LOOK } from '../world/seasons'
import { SEASONS, setSeason, useSeason } from '../world/store'

export default function SeasonPicker() {
  const season = useSeason()
  return (
    <div className="seasons" role="radiogroup" aria-label="Season">
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
  )
}
