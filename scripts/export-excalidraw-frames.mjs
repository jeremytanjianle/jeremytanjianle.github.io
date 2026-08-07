import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const jobs = [
  {
    source: 'assets/excalidraw/self-driving-hedge-fund.excalidraw',
    frames: [{ index: 0, output: 'public/img/self-driving-hedge-fund-architecture.svg' }],
  },
  {
    source: 'assets/excalidraw/adgen.excalidraw',
    frames: [
      { index: 1, output: 'public/img/adgen-agent-architecture.svg' },
    ],
  },
];

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const n = (value) => Number(value.toFixed(2));
const paint = (value) => value === 'transparent' ? 'none' : value;
const opacity = (element) => (element.opacity ?? 100) / 100;
const rotation = (element) => {
  if (!element.angle) return '';
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  return ` transform="rotate(${n(element.angle * 180 / Math.PI)} ${n(cx)} ${n(cy)})"`;
};

function arrowBounds(element) {
  const points = element.points ?? [[0, 0], [element.width, element.height]];
  const xs = points.map(([x]) => element.x + x);
  const ys = points.map(([, y]) => element.y + y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function elementBounds(element) {
  if (element.type === 'arrow' || element.type === 'line') return arrowBounds(element);
  return [element.x, element.y, element.x + element.width, element.y + element.height];
}

function frameViewport(frame, elements) {
  const bounds = [[frame.x, frame.y, frame.x + frame.width, frame.y + frame.height], ...elements.map(elementBounds)];
  const left = Math.min(...bounds.map((b) => b[0]));
  const top = Math.min(...bounds.map((b) => b[1]));
  const right = Math.max(...bounds.map((b) => b[2]));
  const bottom = Math.max(...bounds.map((b) => b[3]));
  const pad = 24;
  return [left - pad, top - pad, right - left + pad * 2, bottom - top + pad * 2];
}

function renderText(element) {
  const lines = element.text.split('\n');
  const anchor = element.textAlign === 'center' ? 'middle' : element.textAlign === 'right' ? 'end' : 'start';
  const x = element.textAlign === 'center' ? element.x + element.width / 2 : element.textAlign === 'right' ? element.x + element.width : element.x;
  const lineHeight = element.fontSize * (element.lineHeight ?? 1.25);
  const font = element.fontFamily === 3
    ? 'Cascadia Code, Consolas, monospace'
    : element.fontFamily === 2
      ? 'Arial, Helvetica, sans-serif'
      : 'Comic Sans MS, Segoe UI Emoji, cursive';
  const tspans = lines.map((line, index) => `<tspan x="${n(x)}" dy="${index === 0 ? 0 : n(lineHeight)}">${esc(line)}</tspan>`).join('');
  return `<text x="${n(x)}" y="${n(element.y + element.fontSize)}" text-anchor="${anchor}" fill="${paint(element.strokeColor)}" font-family="${font}" font-size="${element.fontSize}" opacity="${opacity(element)}"${rotation(element)}>${tspans}</text>`;
}

function renderArrow(element) {
  const points = element.points ?? [[0, 0], [element.width, element.height]];
  const coords = points.map(([x, y]) => [n(element.x + x), n(element.y + y)]);
  const roundedPath = () => {
    if (!element.roundness || coords.length < 3) {
      return coords.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
    }

    const commands = [`M ${coords[0][0]} ${coords[0][1]}`];
    for (let index = 1; index < coords.length - 1; index += 1) {
      const previous = coords[index - 1];
      const current = coords[index];
      const next = coords[index + 1];
      const incoming = Math.hypot(current[0] - previous[0], current[1] - previous[1]);
      const outgoing = Math.hypot(next[0] - current[0], next[1] - current[1]);
      const radius = Math.min(28, incoming * 0.35, outgoing * 0.35);
      const before = [
        current[0] + (previous[0] - current[0]) * radius / incoming,
        current[1] + (previous[1] - current[1]) * radius / incoming,
      ];
      const after = [
        current[0] + (next[0] - current[0]) * radius / outgoing,
        current[1] + (next[1] - current[1]) * radius / outgoing,
      ];
      commands.push(`L ${n(before[0])} ${n(before[1])}`);
      commands.push(`Q ${current[0]} ${current[1]} ${n(after[0])} ${n(after[1])}`);
    }
    commands.push(`L ${coords.at(-1)[0]} ${coords.at(-1)[1]}`);
    return commands.join(' ');
  };
  const d = roundedPath();
  const dash = element.strokeStyle === 'dashed' ? ' stroke-dasharray="10 8"' : element.strokeStyle === 'dotted' ? ' stroke-dasharray="3 7"' : '';
  const markerStart = element.startArrowhead ? ' marker-start="url(#arrowhead-start)"' : '';
  const markerEnd = element.endArrowhead ? ' marker-end="url(#arrowhead-end)"' : '';
  return `<path d="${d}" fill="none" stroke="${paint(element.strokeColor)}" stroke-width="${element.strokeWidth ?? 1}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity(element)}"${dash}${markerStart}${markerEnd}${rotation(element)}/>`;
}

function renderElement(element, files) {
  if (element.type === 'text') return renderText(element);
  if (element.type === 'arrow' || element.type === 'line') return renderArrow(element);

  const common = `fill="${paint(element.backgroundColor)}" stroke="${paint(element.strokeColor)}" stroke-width="${element.strokeWidth ?? 1}" opacity="${opacity(element)}"${rotation(element)}`;
  if (element.type === 'rectangle') {
    const radius = element.roundness ? Math.min(18, element.width / 8, element.height / 8) : 0;
    return `<rect x="${n(element.x)}" y="${n(element.y)}" width="${n(element.width)}" height="${n(element.height)}" rx="${n(radius)}" ${common}/>`;
  }
  if (element.type === 'ellipse') {
    return `<ellipse cx="${n(element.x + element.width / 2)}" cy="${n(element.y + element.height / 2)}" rx="${n(element.width / 2)}" ry="${n(element.height / 2)}" ${common}/>`;
  }
  if (element.type === 'diamond') {
    const points = [
      [element.x + element.width / 2, element.y],
      [element.x + element.width, element.y + element.height / 2],
      [element.x + element.width / 2, element.y + element.height],
      [element.x, element.y + element.height / 2],
    ].map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
    return `<polygon points="${points}" ${common}/>`;
  }
  if (element.type === 'image') {
    const file = files[element.fileId];
    if (!file?.dataURL) return '';
    return `<image href="${esc(file.dataURL)}" x="${n(element.x)}" y="${n(element.y)}" width="${n(element.width)}" height="${n(element.height)}" preserveAspectRatio="none" opacity="${opacity(element)}"${rotation(element)}/>`;
  }
  return '';
}

function exportFrame(scene, frame, output) {
  const elements = scene.elements.filter((element) => !element.isDeleted && element.frameId === frame.id);
  const [x, y, width, height] = frameViewport(frame, elements);
  const background = scene.appState?.viewBackgroundColor ?? '#ffffff';
  const body = elements.map((element) => renderElement(element, scene.files ?? {})).join('\n  ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${n(x)} ${n(y)} ${n(width)} ${n(height)}" role="img" aria-label="${esc(frame.name ?? 'Architecture diagram')}">
  <defs>
    <marker id="arrowhead-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker>
    <marker id="arrowhead-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 10 0 L 0 5 L 10 10 z" fill="context-stroke"/></marker>
  </defs>
  <rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}" fill="${paint(background)}"/>
  ${body}
</svg>
`;
  const destination = path.join(root, output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, svg);
  console.log(`${output} (${Math.round(width)}×${Math.round(height)})`);
}

for (const job of jobs) {
  const scene = JSON.parse(fs.readFileSync(path.join(root, job.source), 'utf8'));
  const frames = scene.elements.filter((element) => !element.isDeleted && element.type === 'frame');
  for (const target of job.frames) exportFrame(scene, frames[target.index], target.output);
}
