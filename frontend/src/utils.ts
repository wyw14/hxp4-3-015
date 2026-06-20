import type {
  BackgroundStar,
  ScreenPoint,
  CurvePoint,
  Nebula,
  StardustParticle,
  CelestialState
} from './types';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(p1: ScreenPoint, p2: ScreenPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateBackgroundStars(count: number, width: number, height: number): BackgroundStar[] {
  const stars: BackgroundStar[] = [];
  const colors = [
    '#ffffff', '#f8f7ff', '#e8f4ff', '#fff4e6',
    '#ffe8e8', '#e8ffe8', '#f0f0ff'
  ];

  for (let i = 0; i < count; i++) {
    const z = Math.random();
    stars.push({
      x: Math.random() * width * 2 - width * 0.5,
      y: Math.random() * height * 2 - height * 0.5,
      z,
      size: 0.3 + z * 1.8,
      baseBrightness: 0.2 + z * 0.6,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  return stars;
}

export function smoothPath(points: CurvePoint[], tension: number = 0.5): CurvePoint[] {
  if (points.length < 3) return [...points];

  const result: CurvePoint[] = [];
  const n = points.length;

  result.push({ x: points[0].x, y: points[0].y, t: 0 });

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(n - 1, i + 1)];
    const p3 = points[Math.min(n - 1, i + 2)];

    const steps = 12;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        tension * 2 * p1.x +
        (-p0.x + p2.x) * tension * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tension * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tension * t3;

      const y =
        tension * 2 * p1.y +
        (-p0.y + p2.y) * tension * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tension * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tension * t3;

      result.push({ x, y });
    }
  }

  return result;
}

export function quadraticBezier(
  p0: ScreenPoint,
  p1: ScreenPoint,
  p2: ScreenPoint,
  steps: number = 30
): CurvePoint[] {
  const result: CurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    result.push({ x, y, t });
  }
  return result;
}

export function cubicBezier(
  p0: ScreenPoint,
  p1: ScreenPoint,
  p2: ScreenPoint,
  p3: ScreenPoint,
  steps: number = 40
): CurvePoint[] {
  const result: CurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
    result.push({ x, y, t });
  }
  return result;
}

export function simplifyPath(points: ScreenPoint[], tolerance: number = 3): ScreenPoint[] {
  if (points.length < 3) return [...points];

  const result: ScreenPoint[] = [points[0]];
  let lastAdded = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    const d = distance(points[i], lastAdded);
    if (d >= tolerance) {
      result.push(points[i]);
      lastAdded = points[i];
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

export function rotatePoint(
  point: ScreenPoint,
  center: ScreenPoint,
  angle: number
): ScreenPoint {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

export function colorToRgb(color: string): { r: number; g: number; b: number } {
  const hex = color.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createCelestialState(): CelestialState {
  return {
    meteors: [],
    nebulas: [],
    stardustBursts: [],
    nextMeteorId: 0,
    nextStardustId: 0,
    meteorSpawnTimer: 0,
    stardustSpawnTimer: 0
  };
}

export function generateNebulas(count: number, width: number, height: number): Nebula[] {
  const nebulas: Nebula[] = [];
  const nebulaColors = [
    { r: 120, g: 80, b: 200 },
    { r: 80, g: 120, b: 220 },
    { r: 200, g: 100, b: 150 },
    { r: 100, g: 180, b: 200 },
    { r: 180, g: 120, b: 220 }
  ];

  for (let i = 0; i < count; i++) {
    nebulas.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      baseRadius: 150 + Math.random() * 300,
      phaseOffset: Math.random() * Math.PI * 2,
      color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
      baseIntensity: 0.03 + Math.random() * 0.05,
      warpSpeed: 0.1 + Math.random() * 0.3
    });
  }
  return nebulas;
}

export function spawnMeteor(
  state: CelestialState,
  width: number,
  height: number
): void {
  const meteorColors = ['#ffffff', '#e8f4ff', '#fff4e6', '#f8f7ff'];
  const fromLeft = Math.random() > 0.5;
  const fromTop = Math.random() > 0.5;

  let startX: number, startY: number;
  if (fromLeft) {
    startX = -50;
    startY = Math.random() * height * 0.6;
  } else {
    startX = width + 50;
    startY = Math.random() * height * 0.6;
  }
  if (fromTop) {
    startY = -50;
    startX = Math.random() * width;
  }

  const angle = Math.atan2(height / 2 - startY, width / 2 - startX) + (Math.random() - 0.5) * 0.5;
  const speed = 400 + Math.random() * 600;
  const baseBrightness = 0.6 + Math.random() * 0.4;

  state.meteors.push({
    id: state.nextMeteorId++,
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    length: 60 + Math.random() * 120,
    baseBrightness,
    brightness: baseBrightness,
    color: meteorColors[Math.floor(Math.random() * meteorColors.length)],
    life: 0,
    maxLife: 2 + Math.random() * 2
  });
}

export function spawnStardustBurst(
  state: CelestialState,
  width: number,
  height: number
): void {
  const safeMargin = 50;
  const minDim = Math.min(width, height);
  const actualMargin = minDim < 200 ? minDim * 0.1 : safeMargin;
  const burstX = actualMargin + Math.random() * Math.max(0, width - actualMargin * 2);
  const burstY = actualMargin + Math.random() * Math.max(0, height - actualMargin * 2);
  const particleCount = 15 + Math.floor(Math.random() * 20);
  const particles: StardustParticle[] = [];
  const dustColors = ['#ffffff', '#ffe8c8', '#c8e8ff', '#fff0f5', '#e8fff0'];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 40;
    const baseBrightness = 0.3 + Math.random() * 0.7;
    particles.push({
      x: burstX,
      y: burstY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0.5 + Math.random() * 2,
      baseBrightness,
      brightness: baseBrightness,
      life: 0,
      maxLife: 1.5 + Math.random() * 2,
      color: dustColors[Math.floor(Math.random() * dustColors.length)]
    });
  }

  state.stardustBursts.push({
    id: state.nextStardustId++,
    particles,
    x: burstX,
    y: burstY
  });
}

export function updateCelestialState(
  state: CelestialState,
  delta: number,
  width: number,
  height: number
): void {
  state.meteorSpawnTimer -= delta;
  state.stardustSpawnTimer -= delta;

  if (state.meteorSpawnTimer <= 0) {
    if (Math.random() < 0.4) {
      spawnMeteor(state, width, height);
    }
    state.meteorSpawnTimer = 2 + Math.random() * 6;
  }

  if (state.stardustSpawnTimer <= 0) {
    if (Math.random() < 0.5) {
      spawnStardustBurst(state, width, height);
    }
    state.stardustSpawnTimer = 3 + Math.random() * 7;
  }

  state.meteors = state.meteors.filter(meteor => {
    meteor.x += meteor.vx * delta;
    meteor.y += meteor.vy * delta;
    meteor.life += delta;

    const lifeRatio = Math.min(1, meteor.life / meteor.maxLife);
    const fadeStart = 0.6;
    if (lifeRatio >= fadeStart) {
      const fadeProgress = (lifeRatio - fadeStart) / (1 - fadeStart);
      meteor.brightness = meteor.baseBrightness * (1 - fadeProgress);
    } else {
      meteor.brightness = meteor.baseBrightness;
    }

    const outOfBounds =
      meteor.x < -150 || meteor.x > width + 150 ||
      meteor.y < -150 || meteor.y > height + 150;
    const expired = meteor.life >= meteor.maxLife;

    return !outOfBounds && !expired && meteor.brightness > 0.01;
  });

  state.stardustBursts = state.stardustBursts.filter(burst => {
    let hasAlive = false;
    for (const p of burst.particles) {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life += delta;

      const lifeRatio = Math.min(1, p.life / p.maxLife);
      const fadeStart = 0.4;
      if (lifeRatio >= fadeStart) {
        const fadeProgress = (lifeRatio - fadeStart) / (1 - fadeStart);
        p.brightness = p.baseBrightness * (1 - fadeProgress);
      } else {
        p.brightness = p.baseBrightness;
      }

      if (p.life < p.maxLife && p.brightness > 0.01) {
        hasAlive = true;
      }
    }
    return hasAlive;
  });
}

export function cleanupOutOfBoundsCelestial(
  state: CelestialState,
  width: number,
  height: number
): void {
  state.meteors = state.meteors.filter(meteor =>
    meteor.x >= -150 && meteor.x <= width + 150 &&
    meteor.y >= -150 && meteor.y <= height + 150
  );

  state.stardustBursts = state.stardustBursts.filter(burst => {
    let hasInBounds = false;
    for (const p of burst.particles) {
      if (p.x >= -50 && p.x <= width + 50 && p.y >= -50 && p.y <= height + 50) {
        hasInBounds = true;
        break;
      }
    }
    return hasInBounds;
  });
}
