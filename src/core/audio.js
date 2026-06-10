// Web Audio SFX — generated tones, no audio files. Ported from the mockup.
// AudioContext is created lazily on first user gesture (browser autoplay policy).

let actx = null

function ctx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    actx = new AC()
  }
  // Resume if the context was suspended before a user gesture.
  if (actx.state === 'suspended') actx.resume()
  return actx
}

function tone(freq, dur, type = 'square', vol = 0.06) {
  const a = ctx()
  if (!a) return
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(vol, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur)
  o.connect(g)
  g.connect(a.destination)
  o.start()
  o.stop(a.currentTime + dur)
}

export const sfx = {
  blip: () => tone(660, 0.06, 'square', 0.05),
  select: () => {
    tone(880, 0.07, 'square', 0.06)
    setTimeout(() => tone(1320, 0.12, 'triangle', 0.06), 60)
  },
  back: () => tone(300, 0.1, 'sawtooth', 0.05),
  attack: () => {
    tone(110, 0.18, 'sawtooth', 0.09)
    setTimeout(() => tone(220, 0.15, 'square', 0.07), 80)
    setTimeout(() => tone(440, 0.25, 'triangle', 0.06), 160)
  },
}
