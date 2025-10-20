(function(){
  'use strict';
  window.App = window.App || {};

  const STORAGE_KEY = 'handwriter:v1';

  const Paper = {
    sizesPx: {
      letter: { w: 8.5 * 96, h: 11 * 96 },
      a4: { w: 8.27 * 96, h: 11.69 * 96 }
    },
    size: function(key, orientation){
      const base = this.sizesPx[key || 'letter'] || this.sizesPx.letter;
      if ((orientation || 'portrait') === 'landscape') return { w: Math.round(base.h), h: Math.round(base.w) };
      return { w: Math.round(base.w), h: Math.round(base.h) };
    }
  };

  const Util = {
    clamp(n, min, max){ return Math.max(min, Math.min(max, n)); },
    debounce(fn, wait){ let t; return function(){ clearTimeout(t); const args = arguments; const ctx = this; t = setTimeout(function(){ fn.apply(ctx, args); }, wait); }; },
    pxPerMm(){ return 96 / 25.4; },
    toPxFromMm(mm){ return mm * (96 / 25.4); },
    saveState(state){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){ console.warn('Save failed', e); } },
    loadState(){ try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } },
    measureText(text, fontSizePx, fontFamily){
      const canvas = Util._canvas || (Util._canvas = document.createElement('canvas'));
      const ctx = canvas.getContext('2d');
      ctx.font = fontSizePx + 'px ' + (fontFamily || "'Patrick Hand', cursive");
      const metrics = ctx.measureText(text);
      return Math.ceil(metrics.width);
    },
    // Build an inline SVG string for a text fragment with selected style
    buildTraceSVG(text, options){
      const fontSize = options.fontSize || 44;
      const ink = options.ink || '#0f172a';
      const style = options.traceStyle || 'dotted';
      const height = Math.max(options.lineHeight || (fontSize * 1.6), fontSize * 1.4);
      // Estimate width; add padding to avoid clipping
      const width = Util.measureText(text, fontSize, "'Patrick Hand', cursive") + Math.ceil(fontSize * 0.8);
      const baselineY = Math.round(height * 0.78);
      let cls = 'trace-dotted';
      if (style === 'outline') cls = 'trace-outline';
      if (style === 'ghost') cls = 'trace-ghost';
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" class="trace-svg" aria-hidden="true">
          <style>
            .trace-dotted{fill:none;stroke:${ink};stroke-width:1.6;stroke-dasharray:3 5;opacity:.9}
            .trace-outline{fill:none;stroke:${ink};stroke-width:1.6;opacity:.9}
            .trace-ghost{fill:${ink};opacity:.2}
          </style>
          <text x="0" y="${baselineY}" font-size="${fontSize}" class="${cls}">${Util.escape(text)}</text>
        </svg>`;
      return { svg, width, height };
    },
    escape(s){ return String(s).replace(/[&<>]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]; }); },
    setInk(color){ document.documentElement.style.setProperty('--ink', color || '#0f172a'); },
    computeSheetDims(state){ const s = Paper.size(state.paper, state.orientation); return { w: s.w, h: s.h }; },
    async exportElementToPDF(el, state){
      try {
        if (!window.jspdf || !window.html2canvas) { alert('PDF libraries failed to load.'); return; }
        // Temporarily remove preview scale for crisp export
        const wrap = document.getElementById('sheet');
        const prevTransform = wrap.style.transform;
        wrap.style.transform = 'none';
        await new Promise(function(res){ setTimeout(res, 50); });
        const canvas = await window.html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const dims = Util.computeSheetDims(state);
        // Use px units so we can map 1:1 from canvas pixels
        const orientation = state.orientation === 'landscape' ? 'l' : 'p';
        const doc = new window.jspdf.jsPDF({ orientation: orientation, unit: 'px', format: [dims.w, dims.h] });
        doc.addImage(imgData, 'PNG', 0, 0, dims.w, dims.h);
        const filename = 'handwriting-sheet.pdf';
        doc.save(filename);
        // Restore transform
        wrap.style.transform = prevTransform;
      } catch(e){
        console.error('Export failed', e); alert('Export failed. See console for details.');
      }
    }
  };

  window.App.Paper = Paper;
  window.App.Util = Util;
})();
