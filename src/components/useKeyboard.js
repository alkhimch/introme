import { useEffect } from 'react'
import { commands, input } from '../world/store'

const MAP = {
  ArrowUp: 'forward', KeyW: 'forward',
  ArrowDown: 'back', KeyS: 'back',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'brake',
}

export default function useKeyboard(onKey) {
  useEffect(() => {
    const down = (e) => {
      if (e.target.closest?.('input, textarea')) return
      const k = MAP[e.code]
      if (k) { input[k] = true; e.preventDefault(); onKey?.('drive') }
      if (e.code === 'KeyR') commands.resetCount++
    }
    const up = (e) => { const k = MAP[e.code]; if (k) input[k] = false }
    const blur = () => Object.keys(input).forEach((k) => (input[k] = false))
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [onKey])
}
