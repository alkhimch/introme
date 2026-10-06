// All sound is synthesised with the Web Audio API — no audio files to download or license.
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'introme-muted'
let ctx = null
let master, musicBus, sfxBus, reverb, noiseBuffer
let engine = null, screech = null
let musicTimer = 0
let lastBleat = 0

// ── Mute state (React-visible, persisted per browser) ──
let muted = false
try { muted = localStorage.getItem(STORAGE_KEY) === '1' } catch { /* storage unavailable */ }
const listeners = new Set()
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))
export const useMuted = () => useSyncExternalStore(subscribe, () => muted)

export function setMuted(value) {
  muted = value
  try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0') } catch { /* ignore */ }
  if (ctx) {
    master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.08)
    // Pause the whole graph while muted so it costs no CPU.
    if (value) setTimeout(() => { if (muted) ctx.suspend() }, 400)
    else ctx.resume()
  }
  listeners.forEach((l) => l())
}
export const toggleMuted = () => setMuted(!muted)

// ── Setup (must run inside a user gesture) ──
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended' && !muted) ctx.resume(); return }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 1
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14; comp.ratio.value = 4
  master.connect(comp).connect(ctx.destination)

  musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master)
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master)

  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const nd = noiseBuffer.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

  reverb = makeReverb(4.5)
  reverb.connect(musicBus)

  engine = makeEngine()
  screech = makeScreech()
  startMusic()
  if (muted) ctx.suspend()

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx.suspend()
    else if (!muted) ctx.resume()
  })
}

function makeReverb(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6)
  }
  const conv = ctx.createConvolver()
  conv.buffer = ir
  return conv
}

function noiseSource() {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  return src
}

// ── Engine: two detuned oscillators through a lowpass, with a "putt-putt" tremolo ──
function makeEngine() {
  const out = ctx.createGain(); out.gain.value = 0
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400; filter.Q.value = 4
  const shaper = ctx.createWaveShaper()
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i++) { const x = (i / 255) * 2 - 1; curve[i] = Math.tanh(x * 2.2) }
  shaper.curve = curve
  const a = ctx.createOscillator(); a.type = 'sawtooth'
  const b = ctx.createOscillator(); b.type = 'square'
  const trem = ctx.createGain(); trem.gain.value = 0.7
  const lfo = ctx.createOscillator(); lfo.type = 'square'
  const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.3
  lfo.connect(lfoDepth).connect(trem.gain)
  const rumble = noiseSource()
  const rumbleFilter = ctx.createBiquadFilter(); rumbleFilter.type = 'lowpass'; rumbleFilter.frequency.value = 160
  const rumbleGain = ctx.createGain(); rumbleGain.gain.value = 0
  a.connect(shaper); b.connect(shaper)
  shaper.connect(trem).connect(filter).connect(out)
  rumble.connect(rumbleFilter).connect(rumbleGain).connect(out)
  out.connect(sfxBus)
  a.start(); b.start(); lfo.start(); rumble.start()
  return { out, filter, a, b, lfo, rumbleGain }
}

// ── Tyre screech: band-passed noise with a wobbling centre frequency ──
function makeScreech() {
  const src = noiseSource()
  const bp1 = ctx.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = 2300; bp1.Q.value = 9
  const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 3600; bp2.Q.value = 12
  const wob = ctx.createOscillator(); wob.frequency.value = 9
  const wobDepth = ctx.createGain(); wobDepth.gain.value = 180
  wob.connect(wobDepth); wobDepth.connect(bp1.frequency); wobDepth.connect(bp2.frequency)
  const out = ctx.createGain(); out.gain.value = 0
  src.connect(bp1).connect(out)
  src.connect(bp2).connect(out)
  out.connect(sfxBus)
  src.start(); wob.start()
  return { out }
}

// Called every frame from the van. speed in world units/s (max ~20).
export function updateVehicleAudio({ speed, throttle, braking, steer }) {
  if (!ctx || ctx.state !== 'running') return
  const t = ctx.currentTime
  const sp = Math.abs(speed)
  // Three "gears": revs climb within a gear, then drop when it shifts up.
  const gears = [0, 6.5, 13, 20]
  let g = 0
  while (g < 2 && sp > gears[g + 1]) g++
  const rpm = Math.min(1, (sp - gears[g]) / (gears[g + 1] - gears[g]))
  const load = Math.max(0, throttle)
  const base = 34 + rpm * 46 + g * 9 + load * 6
  engine.a.frequency.setTargetAtTime(base, t, 0.06)
  engine.b.frequency.setTargetAtTime(base * 0.502, t, 0.06)
  engine.lfo.frequency.setTargetAtTime(base / 2, t, 0.06)
  engine.filter.frequency.setTargetAtTime(260 + rpm * 500 + load * 700 + g * 120, t, 0.08)
  engine.out.gain.setTargetAtTime(0.05 + Math.min(1, sp / 20) * 0.07 + load * 0.05, t, 0.1)
  engine.rumbleGain.gain.setTargetAtTime(Math.min(1, sp / 12) * 0.25, t, 0.1)

  const skid = Math.abs(steer) > 0.6 && sp > 14 ? (sp - 14) / 6 : 0
  const screechLevel = (braking && sp > 3 ? Math.min(1, sp / 16) : 0) * 0.16 + skid * 0.07
  screech.out.gain.setTargetAtTime(screechLevel, t, screechLevel > 0 ? 0.03 : 0.12)
}

// ── Sheep: a sawtooth "baa" with fast tremolo and two vocal formants ──
export function bleat(volume = 1, pan = 0) {
  if (!ctx || ctx.state !== 'running') return
  const t = ctx.currentTime
  if (t - lastBleat < 0.35) return
  lastBleat = t
  const dur = 0.55 + Math.random() * 0.35
  const f0 = 330 + Math.random() * 160
  const osc = ctx.createOscillator(); osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(f0 * 1.08, t)
  osc.frequency.linearRampToValueAtTime(f0, t + 0.12)
  osc.frequency.linearRampToValueAtTime(f0 * 0.86, t + dur)
  const trem = ctx.createGain(); trem.gain.value = 0.55
  const lfo = ctx.createOscillator(); lfo.frequency.value = 24 + Math.random() * 8
  const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.45
  lfo.connect(lfoDepth).connect(trem.gain)
  const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 820; f1.Q.value = 4
  const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1500; f2.Q.value = 5
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(0.5 * volume, t + 0.05)
  env.gain.setValueAtTime(0.5 * volume, t + dur * 0.7)
  env.gain.linearRampToValueAtTime(0, t + dur)
  const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null
  osc.connect(trem)
  trem.connect(f1).connect(env)
  trem.connect(f2).connect(env)
  if (panner) { panner.pan.value = Math.max(-1, Math.min(1, pan)); env.connect(panner).connect(sfxBus) } else env.connect(sfxBus)
  osc.start(t); lfo.start(t)
  osc.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05)
}

// ── Music: slow pentatonic pads, a wandering plucked melody and soft wind ──
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)
const CHORDS = [[57, 64, 72], [53, 60, 69], [60, 67, 76], [55, 62, 71]] // Am, F, C, G voicings
const SCALE = [69, 72, 74, 76, 79, 81, 84, 86] // A minor pentatonic, A4–D6

function pad(notes, start, length) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(0.035, start + 3)
  g.gain.setValueAtTime(0.035, start + length - 3)
  g.gain.linearRampToValueAtTime(0, start + length + 1)
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900
  g.connect(lp)
  lp.connect(musicBus)
  lp.connect(reverb)
  for (const n of notes) {
    for (const detune of [-6, 6]) {
      const o = ctx.createOscillator(); o.type = 'triangle'
      o.frequency.value = midi(n); o.detune.value = detune
      o.connect(g)
      o.start(start); o.stop(start + length + 1.2)
    }
  }
}

function pluck(note, start, vel) {
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = midi(note)
  const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = midi(note) * 2
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(0.07 * vel, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0008, start + 2.6)
  const g2 = ctx.createGain(); g2.gain.value = 0.18
  o.connect(g); o2.connect(g2).connect(g)
  g.connect(musicBus)
  g.connect(reverb)
  o.start(start); o2.start(start)
  o.stop(start + 2.7); o2.stop(start + 2.7)
}

function startMusic() {
  // Gentle wind bed
  const wind = noiseSource()
  const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 500
  const wg = ctx.createGain(); wg.gain.value = 0.025
  const wl = ctx.createOscillator(); wl.frequency.value = 0.07
  const wd = ctx.createGain(); wd.gain.value = 260
  wl.connect(wd).connect(wf.frequency)
  wind.connect(wf).connect(wg).connect(musicBus)
  wind.start(); wl.start()

  const BAR = 8, BEAT = 0.8
  let next = ctx.currentTime + 0.3, chord = 0, beatTime = next, idx = 3
  pad(CHORDS[0], next, BAR)
  const schedule = () => {
    const ahead = ctx.currentTime + 1.5
    while (next + BAR < ahead) {
      next += BAR
      chord = (chord + 1) % CHORDS.length
      pad(CHORDS[chord], next, BAR)
    }
    while (beatTime < ahead) {
      if (Math.random() < 0.45) {
        idx = Math.max(0, Math.min(SCALE.length - 1, idx + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]))
        pluck(SCALE[idx], beatTime, 0.6 + Math.random() * 0.4)
      }
      beatTime += BEAT * (Math.random() < 0.2 ? 1.5 : 1)
    }
  }
  schedule()
  clearInterval(musicTimer)
  musicTimer = setInterval(() => { if (ctx.state === 'running') schedule() }, 400)
}
