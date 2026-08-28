/**
 * Drives the Design Your Box configurator: step navigation, the inline SVG
 * preview, and building the written specification that gets posted with the
 * quote.
 *
 * The preview is drawn from the chosen proportions rather than from a stock
 * illustration, so a 200mm tall box looks tall and a cube looks like a cube.
 * Faces are shaded from one base color so a single swatch change repaints the
 * whole box without touching the DOM structure.
 */
export {};

type Dim = 'w' | 'd' | 'h';

const root = document.querySelector<HTMLElement>('[data-box-designer]');
if (root) {
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  const dots = [...root.querySelectorAll<HTMLElement>('[data-step-dot]')];
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-next]')!;
  const backBtn = root.querySelector<HTMLButtonElement>('[data-back]')!;
  const svg = root.querySelector<SVGSVGElement>('[data-svg]')!;
  const svgTitle = root.querySelector<SVGTitleElement>('[data-svg-title]')!;
  const stageNote = root.querySelector<HTMLElement>('[data-stage-note]')!;
  const form = root.querySelector<HTMLFormElement>('[data-bd-form]')!;
  const messageField = root.querySelector<HTMLInputElement>('[data-bd-message]')!;
  const notesField = root.querySelector<HTMLTextAreaElement>('[data-bd-notes]')!;
  const dimWarn = root.querySelector<HTMLElement>('[data-dim-warn]')!;
  const colorNote = root.querySelector<HTMLElement>('[data-color-note]')!;

  let step = 0;

  /* ---------------- step navigation ---------------- */
  function showStep(n: number) {
    step = Math.max(0, Math.min(panels.length - 1, n));
    panels.forEach((p, i) => p.classList.toggle('is-active', i === step));
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === step);
      d.classList.toggle('is-done', i < step);
    });
    backBtn.hidden = step === 0;
    nextBtn.hidden = step === panels.length - 1;
    if (step === panels.length - 1) buildSpec();
  }
  nextBtn.addEventListener('click', () => showStep(step + 1));
  backBtn.addEventListener('click', () => showStep(step - 1));
  dots.forEach((d, i) => {
    d.style.cursor = 'pointer';
    d.addEventListener('click', () => showStep(i));
  });

  /* ---------------- reading the current selection ---------------- */
  const checked = (name: string) =>
    root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);

  const dim = (which: Dim) =>
    Number(root.querySelector<HTMLInputElement>(`[data-dim="${which}"]`)?.value || 0);

  const addonInputs = () =>
    [...root.querySelectorAll<HTMLInputElement>('input[name="bd-addon"]:checked')];

  /* ---------------- color helpers ---------------- */
  /** Multiplies a hex color toward black; used to shade the side and top faces. */
  function shade(hex: string, factor: number) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.round(((n >> 16) & 255) * factor);
    const g = Math.round(((n >> 8) & 255) * factor);
    const b = Math.round((n & 255) * factor);
    return `rgb(${r},${g},${b})`;
  }

  /* ---------------- preview ---------------- */
  function draw() {
    const styleInput = checked('bd-style');
    const ratio = (styleInput?.dataset.ratio || '0.62,1,0.42').split(',').map(Number);
    const hex = checked('bd-color')?.dataset.hex || '#141414';
    const finish = checked('bd-finish')?.value || 'matte';
    const styleId = styleInput?.value || 'tuck';

    // Real dimensions drive the shape; the style ratio is only the fallback.
    const w = dim('w') || ratio[0] * 100;
    const d = dim('d') || ratio[2] * 100;
    const h = dim('h') || ratio[1] * 100;
    const maxDim = Math.max(w, d, h);
    const S = 108 / maxDim;              // scale so the largest edge fills the stage
    const fw = w * S, fd = d * S, fh = h * S;
    const skew = 0.5;                    // isometric-ish projection
    const cx = 118, base = 214;

    const set = (sel: string, pts: string) =>
      svg.querySelector<SVGPolygonElement>(`[data-face="${sel}"]`)?.setAttribute('points', pts);

    // front face
    const fx = cx - fw / 2, fy = base - fh;
    set('front', `${fx},${fy} ${fx + fw},${fy} ${fx + fw},${fy + fh} ${fx},${fy + fh}`);
    // right side, receding up-right
    set('side', `${fx + fw},${fy} ${fx + fw + fd * skew},${fy - fd * skew} ${fx + fw + fd * skew},${fy + fh - fd * skew} ${fx + fw},${fy + fh}`);
    // top
    set('top', `${fx},${fy} ${fx + fd * skew},${fy - fd * skew} ${fx + fw + fd * skew},${fy - fd * skew} ${fx + fw},${fy}`);
    // sheen sits over the front face only, and only when the finish is glossy
    set('sheen', `${fx},${fy} ${fx + fw},${fy} ${fx + fw},${fy + fh * 0.55} ${fx},${fy + fh * 0.8}`);

    const front = svg.querySelector<SVGPolygonElement>('[data-face="front"]')!;
    const side = svg.querySelector<SVGPolygonElement>('[data-face="side"]')!;
    const top = svg.querySelector<SVGPolygonElement>('[data-face="top"]')!;
    const sheen = svg.querySelector<SVGPolygonElement>('[data-face="sheen"]')!;

    front.setAttribute('fill', hex);
    side.setAttribute('fill', shade(hex, 0.72));
    top.setAttribute('fill', shade(hex, 0.88));
    // Uncoated and matte scatter light; gloss and soft-touch behave differently.
    const sheenOpacity = finish === 'gloss' ? 1 : finish === 'matte' ? 0.28 : finish === 'softtouch' ? 0.16 : 0.08;
    sheen.setAttribute('opacity', String(sheenOpacity));

    // add-on overlays
    const ids = addonInputs().map((i) => i.value);
    const win = svg.querySelector<SVGRectElement>('[data-face="window"]')!;
    if (ids.includes('window')) {
      win.setAttribute('x', String(fx + fw * 0.28));
      win.setAttribute('y', String(fy + fh * 0.22));
      win.setAttribute('width', String(fw * 0.44));
      win.setAttribute('height', String(fh * 0.42));
      win.setAttribute('opacity', '0.85');
    } else win.setAttribute('opacity', '0');

    const foil = svg.querySelector<SVGRectElement>('[data-face="foilband"]')!;
    if (ids.includes('foil')) {
      foil.setAttribute('x', String(fx + fw * 0.18));
      foil.setAttribute('y', String(fy + fh * 0.72));
      foil.setAttribute('width', String(fw * 0.64));
      foil.setAttribute('height', String(Math.max(3, fh * 0.05)));
      foil.setAttribute('opacity', '1');
    } else foil.setAttribute('opacity', '0');

    const rib = svg.querySelector<SVGRectElement>('[data-face="ribbon"]')!;
    if (ids.includes('ribbon')) {
      rib.setAttribute('x', String(fx + fw * 0.44));
      rib.setAttribute('y', String(fy));
      rib.setAttribute('width', String(Math.max(4, fw * 0.12)));
      rib.setAttribute('height', String(fh));
      rib.setAttribute('opacity', '0.9');
    } else rib.setAttribute('opacity', '0');

    // A cylinder drawn as a box reads as the wrong product, so swap the
    // faceted body for a barrel: rectangle body plus an elliptical cap.
    const isCyl = styleId === 'cylinder';
    const cap = svg.querySelector<SVGEllipseElement>('[data-face="cap"]')!;
    const body = svg.querySelector<SVGRectElement>('[data-face="body"]')!;
    [front, side, top, sheen].forEach((el) => el.setAttribute('opacity', isCyl ? '0' : el === sheen ? String(sheenOpacity) : '1'));
    if (isCyl) {
      const r = fw / 2;
      body.setAttribute('x', String(cx - r));
      body.setAttribute('y', String(base - fh));
      body.setAttribute('width', String(fw));
      body.setAttribute('height', String(fh));
      body.setAttribute('fill', hex);
      body.setAttribute('opacity', '1');
      cap.setAttribute('cx', String(cx));
      cap.setAttribute('cy', String(base - fh));
      cap.setAttribute('rx', String(r));
      cap.setAttribute('ry', String(Math.max(4, r * 0.28)));
      cap.setAttribute('fill', shade(hex, 0.88));
      cap.setAttribute('opacity', '1');
    } else {
      body.setAttribute('opacity', '0');
      cap.setAttribute('opacity', '0');
    }

    const styleName = styleInput?.dataset.label || 'Carton';
    const colorName = checked('bd-color')?.dataset.label || '';
    const finishName = checked('bd-finish')?.dataset.label || '';
    const materialName = checked('bd-material')?.dataset.label || '';
    svgTitle.textContent = `Preview of a ${styleName.toLowerCase()} in ${colorName.toLowerCase()}`;
    stageNote.textContent = `${styleName} · ${materialName.split(' ')[0]} · ${finishName.split(' ')[0].toLowerCase()}`;

    // summary panel
    const sum = (k: string, v: string) => {
      const el = root.querySelector<HTMLElement>(`[data-sum="${k}"]`);
      if (el) el.textContent = v;
    };
    sum('style', styleName);
    sum('size', `${dim('w')} × ${dim('d')} × ${dim('h')} mm`);
    sum('material', materialName);
    sum('finish', finishName);
    sum('color', colorName);
    sum('addons', addonInputs().map((i) => i.dataset.label).join(', ') || 'None');
    sum('qty', checked('bd-qty')?.value || '');

    const note = checked('bd-color')?.dataset.note;
    if (note) colorNote.textContent = note;

    // A tuck carton below ~20mm on any axis is not manufacturable in practice.
    const tooSmall = [dim('w'), dim('d'), dim('h')].some((v) => v > 0 && v < 20);
    dimWarn.hidden = !tooSmall;
    if (tooSmall) dimWarn.textContent = 'Anything under 20 mm on an axis is hard to run reliably — tell us the bottle size and we will advise.';
  }

  /* ---------------- specification text ---------------- */
  function buildSpec() {
    const lines = [
      'BOX SPECIFICATION (built with the Design Your Box tool)',
      '',
      `Structure : ${checked('bd-style')?.dataset.label || ''}`,
      `Size      : ${dim('w')} x ${dim('d')} x ${dim('h')} mm (W x D x H)`,
      `Material  : ${checked('bd-material')?.dataset.label || ''}`,
      `Finish    : ${checked('bd-finish')?.dataset.label || ''}`,
      `Color     : ${checked('bd-color')?.dataset.label || ''}`,
      `Add-ons   : ${addonInputs().map((i) => i.dataset.label).join(', ') || 'None'}`,
      `Quantity  : ${checked('bd-qty')?.value || ''} boxes`,
    ];
    const notes = notesField.value.trim();
    if (notes) lines.push('', 'Customer notes:', notes);
    messageField.value = lines.join('\n');
  }

  root.addEventListener('change', draw);
  root.addEventListener('input', draw);
  notesField.addEventListener('input', buildSpec);
  form.addEventListener('submit', buildSpec, true);

  draw();
  showStep(0);
}
