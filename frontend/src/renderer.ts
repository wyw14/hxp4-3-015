import type {
  BackgroundStar,
  AnchorPoint,
  Connection,
  ScreenPoint,
  CurvePoint,
  Nebula,
  Meteor,
  StardustBurst
} from './types';
import { rotatePoint, colorToRgb } from './utils';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private width: number = 0;
  private height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = width;
    this.height = height;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  getCenter(): ScreenPoint {
    return { x: this.width / 2, y: this.height / 2 };
  }

  private clear(): void {
    this.ctx.fillStyle = '#02030a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(10, 15, 40, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 10, 1)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBackgroundStars(
    stars: BackgroundStar[],
    rotation: number,
    time: number
  ): void {
    const center = this.getCenter();

    for (const star of stars) {
      const rotated = rotatePoint(
        { x: star.x, y: star.y },
        { x: 0, y: 0 },
        rotation * star.z
      );

      const px = center.x + rotated.x * (0.3 + star.z * 0.8);
      const py = center.y + rotated.y * (0.3 + star.z * 0.8);

      if (px < -20 || px > this.width + 20 || py < -20 || py > this.height + 20) {
        continue;
      }

      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const brightness = star.baseBrightness * (0.6 + 0.4 * twinkle);

      this.ctx.beginPath();
      this.ctx.arc(px, py, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `${star.color}${this.alphaToHex(brightness)}`;
      this.ctx.fill();

      if (brightness > 0.5 && star.size > 1) {
        const glowR = star.size * 3;
        const glow = this.ctx.createRadialGradient(px, py, 0, px, py, glowR);
        glow.addColorStop(0, `${star.color}${this.alphaToHex(brightness * 0.3)}`);
        glow.addColorStop(1, `${star.color}00`);
        this.ctx.beginPath();
        this.ctx.arc(px, py, glowR, 0, Math.PI * 2);
        this.ctx.fillStyle = glow;
        this.ctx.fill();
      }
    }
  }

  drawLightPollution(
    time: number,
    config: { baseIntensity: number; variability: number; speed: number }
  ): void {
    const layers = 5;
    for (let i = 0; i < layers; i++) {
      const phase = time * config.speed * (0.5 + i * 0.2);
      const offsetX = Math.sin(phase + i * 1.7) * 150;
      const offsetY = Math.cos(phase * 0.7 + i * 2.3) * 120;
      const sizeW = 200 + Math.sin(phase * 1.3 + i) * 100;
      const sizeH = 180 + Math.cos(phase * 0.9 + i * 1.5) * 80;

      const cx = this.width * (0.2 + i * 0.18) + offsetX;
      const cy = this.height * (0.3 + (i % 2) * 0.4) + offsetY;

      const intensity = Math.max(0, config.baseIntensity +
        Math.sin(time * config.speed * 2 + i * 0.8) * config.variability);

      const colors = [
        `rgba(100, 150, 255, ${Math.max(0, intensity * 0.15)})`,
        `rgba(180, 100, 255, ${Math.max(0, intensity * 0.12)})`,
        `rgba(255, 150, 200, ${Math.max(0, intensity * 0.1)})`
      ];

      const glow = this.ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, Math.max(1, Math.max(sizeW, sizeH))
      );
      glow.addColorStop(0, colors[i % colors.length]);
      glow.addColorStop(0.5, `rgba(80, 100, 180, ${Math.max(0, intensity * 0.06)})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = glow;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawNebulas(nebulas: Nebula[], time: number): void {
    for (const nebula of nebulas) {
      const phase = time * nebula.warpSpeed + nebula.phaseOffset;
      const wobbleX = Math.sin(phase) * nebula.baseRadius * 0.15;
      const wobbleY = Math.cos(phase * 0.8) * nebula.baseRadius * 0.15;
      const currentRadius = nebula.baseRadius * (1 + Math.sin(phase * 1.3) * 0.15);
      const intensity = nebula.baseIntensity * (0.7 + Math.sin(phase * 0.6) * 0.3);

      const cx = nebula.x + wobbleX;
      const cy = nebula.y + wobbleY;

      const { r, g, b } = nebula.color;

      const glow = this.ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, currentRadius
      );
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
      glow.addColorStop(0.4, `rgba(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.8)}, ${Math.floor(b * 0.9)}, ${intensity * 0.6})`);
      glow.addColorStop(0.7, `rgba(${Math.floor(r * 0.4)}, ${Math.floor(g * 0.5)}, ${Math.floor(b * 0.7)}, ${intensity * 0.3})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = glow;
      this.ctx.fillRect(0, 0, this.width, this.height);

      const innerRadius = currentRadius * 0.5;
      const swirlPhase = phase * 2;
      for (let i = 0; i < 3; i++) {
        const angle = swirlPhase + (i * Math.PI * 2) / 3;
        const swirlX = cx + Math.cos(angle) * innerRadius * 0.4;
        const swirlY = cy + Math.sin(angle) * innerRadius * 0.4;
        const swirlR = currentRadius * (0.25 + Math.sin(swirlPhase + i) * 0.05);

        const swirl = this.ctx.createRadialGradient(
          swirlX, swirlY, 0,
          swirlX, swirlY, swirlR
        );
        swirl.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.8})`);
        swirl.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = swirl;
        this.ctx.fillRect(0, 0, this.width, this.height);
      }
    }
  }

  drawMeteors(meteors: Meteor[]): void {
    for (const meteor of meteors) {
      const rgb = colorToRgb(meteor.color);
      const alpha = meteor.brightness;

      const dx = -meteor.vx;
      const dy = -meteor.vy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const nx = dx / len;
      const ny = dy / len;

      const tailX = meteor.x + nx * meteor.length;
      const tailY = meteor.y + ny * meteor.length;

      const tailGradient = this.ctx.createLinearGradient(
        tailX, tailY,
        meteor.x, meteor.y
      );
      tailGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      tailGradient.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.2})`);
      tailGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.6})`);
      tailGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);

      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(meteor.x, meteor.y);
      this.ctx.strokeStyle = tailGradient;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      const headGlowR = 6;
      const headGlow = this.ctx.createRadialGradient(
        meteor.x, meteor.y, 0,
        meteor.x, meteor.y, headGlowR
      );
      headGlow.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      headGlow.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.7})`);
      headGlow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      this.ctx.beginPath();
      this.ctx.arc(meteor.x, meteor.y, headGlowR, 0, Math.PI * 2);
      this.ctx.fillStyle = headGlow;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(meteor.x, meteor.y, 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fill();
    }
  }

  drawStardustBursts(bursts: StardustBurst[]): void {
    for (const burst of bursts) {
      for (const p of burst.particles) {
        if (p.brightness <= 0.01 || p.life >= p.maxLife) continue;

        const rgb = colorToRgb(p.color);
        const alpha = p.brightness;

        if (p.size > 1) {
          const glowR = p.size * 4;
          const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          glow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.5})`);
          glow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          this.ctx.fillStyle = glow;
          this.ctx.fill();
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        this.ctx.fill();
      }
    }
  }

  getAnchorScreenPos(anchor: AnchorPoint, rotation: number): ScreenPoint {
    const center = this.getCenter();
    const maxDim = Math.min(this.width, this.height) * 0.9;
    const relX = (anchor.x - 0.5) * maxDim;
    const relY = (anchor.y - 0.5) * maxDim;
    const rotated = rotatePoint({ x: relX, y: relY }, { x: 0, y: 0 }, rotation);
    return {
      x: center.x + rotated.x,
      y: center.y + rotated.y
    };
  }

  drawAnchorPoints(
    anchors: AnchorPoint[],
    rotation: number,
    time: number,
    showFreq: boolean,
    highlightedId: string | null,
    connectedIds: Set<string>
  ): void {
    for (const anchor of anchors) {
      const pos = this.getAnchorScreenPos(anchor, rotation);
      const twinkle = Math.sin(time * anchor.frequency * 0.8) * 0.3 + 0.7;
      const brightness = (anchor.baseBrightness ?? 0.7) * twinkle;
      const size = (anchor.size ?? 3) * (highlightedId === anchor.id ? 1.8 : 1);

      const isAnchor = anchor.id.startsWith('a') || anchor.id.startsWith('b') || anchor.id.startsWith('c');
      const baseColor = isAnchor ? { r: 200, g: 220, b: 255 } : { r: 180, g: 180, b: 200 };
      const isConnected = connectedIds.has(anchor.id);
      const connColor = isConnected ? { r: 255, g: 215, b: 100 } : baseColor;

      const glowR = size * 8;
      const glow = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
      glow.addColorStop(0, `rgba(${connColor.r}, ${connColor.g}, ${connColor.b}, ${brightness * 0.5})`);
      glow.addColorStop(0.4, `rgba(${connColor.r}, ${connColor.g}, ${connColor.b}, ${brightness * 0.15})`);
      glow.addColorStop(1, `rgba(${connColor.r}, ${connColor.g}, ${connColor.b}, 0)`);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
      this.ctx.fillStyle = glow;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${connColor.r}, ${connColor.g}, ${connColor.b}, ${brightness})`;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();

      if (highlightedId === anchor.id) {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, size * 2.5, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time * 5) * 0.3})`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      if (showFreq && isAnchor) {
        this.ctx.font = '11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = `rgba(160, 196, 255, ${brightness * 0.9})`;
        this.ctx.fillText(`${anchor.frequency.toFixed(1)}Hz`, pos.x, pos.y - size - 10);
      }
    }
  }

  drawCurve(
    points: CurvePoint[],
    color: string,
    lineWidth: number = 3,
    opacity: number = 1,
    glow: boolean = true
  ): void {
    if (points.length < 2) return;

    if (glow) {
      for (let pass = 3; pass >= 1; pass--) {
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          this.ctx.lineTo(points[i].x, points[i].y);
        }
        const alpha = opacity * (0.15 / pass);
        this.ctx.strokeStyle = color + this.alphaToHex(alpha);
        this.ctx.lineWidth = lineWidth + pass * 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
      }
    }

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.strokeStyle = color + this.alphaToHex(opacity);
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  drawConnections(connections: Connection[], time: number): void {
    for (const conn of connections) {
      const pulse = 0.7 + Math.sin(time * 2) * 0.3;
      const opacity = conn.opacity * pulse;

      if (conn.valid) {
        this.drawCurve(conn.curve, '#ffd700', 3, opacity, true);

        for (const pt of conn.curve) {
          if (Math.random() < 0.02) {
            const r = 2 + Math.random() * 3;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 230, 150, ${opacity * 0.6})`;
            this.ctx.fill();
          }
        }
      } else {
        this.drawCurve(conn.curve, '#ff6b6b', 2, opacity * 0.6, false);
      }
    }
  }

  drawCurrentPath(
    points: CurvePoint[],
    startAnchor: AnchorPoint | null,
    currentPos: ScreenPoint,
    time: number,
    rotation: number
  ): void {
    if (!startAnchor) return;

    const startPos = this.getAnchorScreenPos(startAnchor, rotation);
    const fullPath: CurvePoint[] = [{ x: startPos.x, y: startPos.y }, ...points, currentPos];

    const wave = Math.sin(time * 8) * 0.2 + 0.8;
    this.drawCurve(fullPath, '#a0c4ff', 2.5, wave, true);
  }

  drawCreatureOutline(
    anchors: AnchorPoint[],
    edges: { from: string; to: string }[],
    connections: Connection[],
    rotation: number,
    progress: number
  ): void {
    const connectedEdges = new Set(
      connections.filter(c => c.valid).map(c => `${c.from}-${c.to}`)
    );

    let drawCount = 0;
    const totalToDraw = Math.floor(edges.length * progress);
    let hasAnyConnected = false;

    for (const edge of edges) {
      const edgeKey = `${edge.from}-${edge.to}`;
      const edgeKeyRev = `${edge.to}-${edge.from}`;
      const isConnected = connectedEdges.has(edgeKey) || connectedEdges.has(edgeKeyRev);
      if (isConnected) hasAnyConnected = true;

      if (!isConnected && drawCount >= totalToDraw) continue;
      drawCount++;

      const from = anchors.find(a => a.id === edge.from);
      const to = anchors.find(a => a.id === edge.to);
      if (!from || !to) continue;

      const fromPos = this.getAnchorScreenPos(from, rotation);
      const toPos = this.getAnchorScreenPos(to, rotation);

      const lineOpacity = isConnected ? 0.9 : 0.15 + progress * 0.2;
      const lineWidth = isConnected ? 2 : 1;

      this.ctx.beginPath();
      this.ctx.moveTo(fromPos.x, fromPos.y);
      this.ctx.lineTo(toPos.x, toPos.y);
      this.ctx.strokeStyle = `rgba(160, 196, 255, ${lineOpacity})`;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }

    if (progress >= 0.9 && hasAnyConnected) {
      const center = this.getCenter();
      const glow = this.ctx.createRadialGradient(
        center.x, center.y, 0,
        center.x, center.y, Math.max(this.width, this.height) * 0.5
      );
      glow.addColorStop(0, `rgba(255, 200, 100, ${0.08 + progress * 0.1})`);
      glow.addColorStop(0.5, `rgba(255, 180, 80, ${0.04 + progress * 0.05})`);
      glow.addColorStop(1, 'rgba(255, 180, 50, 0)');
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawCompletionEffect(time: number, progress: number): void {
    if (progress < 1) return;

    const center = this.getCenter();
    const pulse = Math.sin(time * 2.5) * 0.15 + 0.85;
    const maxR = Math.max(this.width, this.height) * 0.75;

    for (let i = 0; i < 4; i++) {
      const phase = (time * 0.5 + i * 0.25) % 1;
      const r = Math.max(1, maxR * (0.2 + i * 0.2 + phase * 0.15) * pulse);
      const alpha = Math.max(0, (0.18 - i * 0.035) * (Math.sin(time * 1.5 + i * 0.8) * 0.3 + 0.7));

      const innerR = Math.max(0, r * 0.7);
      const ring = this.ctx.createRadialGradient(center.x, center.y, innerR, center.x, center.y, r);
      ring.addColorStop(0, `rgba(255, 225, 100, 0)`);
      ring.addColorStop(0.6, `rgba(255, 200, 80, ${alpha})`);
      ring.addColorStop(1, `rgba(255, 180, 50, 0)`);

      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
      this.ctx.fillStyle = ring;
      this.ctx.fill();
    }

    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      const baseAngle = (i / particleCount) * Math.PI * 2;
      const angle = baseAngle + time * 0.8 + Math.sin(time * 1.5 + i * 0.3) * 0.2;
      const minDist = 80 + (i % 5) * 30;
      const dist = Math.max(0, minDist + Math.sin(time * 2 + i * 0.5) * 60 + i * 3);
      const x = center.x + Math.cos(angle) * dist;
      const y = center.y + Math.sin(angle) * dist;
      const size = Math.max(0.1, 1.5 + Math.sin(time * 3.5 + i * 0.7) * 2);
      const alpha = Math.max(0, Math.min(1, 0.4 + Math.sin(time * 2.5 + i * 0.4) * 0.4));

      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 235, 160, ${alpha})`;
      this.ctx.fill();

      if (size > 2) {
        const glowR = Math.max(0.1, size * 4);
        const glow = this.ctx.createRadialGradient(x, y, 0, x, y, glowR);
        glow.addColorStop(0, `rgba(255, 230, 150, ${alpha * 0.4})`);
        glow.addColorStop(1, 'rgba(255, 230, 150, 0)');
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowR, 0, Math.PI * 2);
        this.ctx.fillStyle = glow;
        this.ctx.fill();
      }
    }
  }

  beginFrame(): void {
    this.clear();
  }

  private alphaToHex(alpha: number): string {
    const clamped = Math.max(0, Math.min(1, alpha));
    const hex = Math.round(clamped * 255).toString(16).padStart(2, '0');
    return hex;
  }
}
