export function mulberry32(seed) {
  let a = seed >>> 0;
  const fn = () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Expose internal state for deterministic save/restore
  fn.getState = () => a >>> 0;
  fn.setState = (s) => { a = s >>> 0; };
  return fn;
}

export function pick(rng, arr) {
  if (!arr.length) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

export function weighted(rng, items) {
  if (!items.length) return undefined;
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r < 0) return item;
  }
  return items[items.length - 1];
}

export function shuffle(rng, arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
