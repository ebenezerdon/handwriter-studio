(function(){
  'use strict';
  window.App = window.App || {};

  // Application state with sensible defaults
  const defaultState = {
    mode: 'letters',
    paper: 'letter',
    orientation: 'portrait',
    margins: 12, // mm
    lineHeight: 72, // px per row
    fontSize: 44,
    repeat: 8,
    guides: 'primary', // primary | grid
    traceStyle: 'ghost', // dotted | outline | ghost
    letters: 'abc',
    uppercase: false,
    words: '',
    zoom: 80, // percent
    ink: '#0f172a'
  };

  function getState(){
    const saved = window.App.Util.loadState();
    return Object.assign({}, defaultState, saved || {});
  }

  function bindRangeHints($form){
    $form.find('input[type=range]').each(function(){
      const name = this.name; const $hint = $form.find('.hint[data-bind='+name+']');
      const update = function(){
        let val = $(this).val();
        if (name === 'zoom') val = val + '%';
        $hint.text(val);
      };
      $(this).on('input change', update); update.call(this);
    });
  }

  function toggleSections(state){
    $('[data-section=letters]').toggleClass('hidden', state.mode !== 'letters');
    $('[data-section=words]').toggleClass('hidden', state.mode !== 'words');
  }

  function readForm($form){
    const formData = new FormData($form[0]);
    const state = {
      mode: formData.get('mode') || 'letters',
      paper: formData.get('paper') || 'letter',
      orientation: formData.get('orientation') || 'portrait',
      margins: parseFloat(formData.get('margins') || '12'),
      lineHeight: parseInt(formData.get('lineHeight') || '72', 10),
      fontSize: parseInt(formData.get('fontSize') || '44', 10),
      repeat: Math.max(1, parseInt(formData.get('repeat') || '8', 10)),
      guides: formData.get('guides') || 'primary',
      traceStyle: formData.get('traceStyle') || 'ghost',
      letters: (formData.get('letters') || '').replace(/\s+/g, ''),
      uppercase: !!formData.get('uppercase'),
      words: (formData.get('words') || '').trim(),
      zoom: parseInt(formData.get('zoom') || '80', 10),
      ink: formData.get('ink') || '#0f172a'
    };
    return state;
  }

  function populateForm($form, state){
    $form.find('[name=mode][value='+state.mode+']').prop('checked', true);
    $form.find('[name=paper]').val(state.paper);
    $form.find('[name=orientation]').val(state.orientation);
    $form.find('[name=margins]').val(state.margins).trigger('input');
    $form.find('[name=lineHeight]').val(state.lineHeight).trigger('input');
    $form.find('[name=fontSize]').val(state.fontSize).trigger('input');
    $form.find('[name=repeat]').val(state.repeat);
    $form.find('[name=guides]').val(state.guides);
    $form.find('[name=traceStyle]').val(state.traceStyle);
    $form.find('[name=letters]').val(state.letters);
    $form.find('[name=uppercase]').prop('checked', !!state.uppercase);
    $form.find('[name=words]').val(state.words);
    $form.find('[name=zoom]').val(state.zoom).trigger('input');
    $form.find('[name=ink]').val(state.ink);
  }

  function computeContentList(state){
    if (state.mode === 'letters'){
      let letters = state.letters || '';
      if (!letters) letters = 'abc';
      if (state.uppercase) letters = letters.toUpperCase();
      return letters.split('');
    }
    if (state.mode === 'words'){
      const arr = state.words.split(/\n+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length; });
      return arr.length ? arr : ['cat','dog','bird'];
    }
    return [];
  }

  function setZoom(state){
    const $sheet = $('#sheet');
    const zoom = (state.zoom || 100) / 100;
    $sheet.css('transform', 'scale(' + zoom + ')');
  }

  function setupQuickKeys($form){
    $form.on('click', '.key', function(){
      const key = $(this).data('key');
      const $letters = $form.find('[name=letters]');
      if (key === 'clear') { $letters.val(''); return; }
      if (key === 'upper') { $form.find('[name=uppercase]').prop('checked', true); return; }
      if (key === 'lower') { $form.find('[name=uppercase]').prop('checked', false); return; }
      if (key === 'vowels') { $letters.val('aeiou'); return; }
      if (key === 'consonants') { $letters.val('bcdfghjklmnpqrstvwxyz'); return; }
      if (key === 'abc') { $letters.val('abcdefghijklmnopqrstuvwxyz'); return; }
    });
  }

  function buildPrimaryRows(sheetDims, state){
    const pxMargin = window.App.Util.toPxFromMm(state.margins);
    const innerW = sheetDims.w - pxMargin * 2;
    const innerH = sheetDims.h - pxMargin * 2;
    const rows = Math.max(1, Math.floor(innerH / state.lineHeight));

    const $sheet = $('#sheet');
    $sheet.empty();
    $sheet.css({ width: sheetDims.w + 'px', height: sheetDims.h + 'px' });

    const $inner = $('<div class="page-inner"></div>');
    const $margins = $('<div class="sheet-margins"></div>').css({ padding: state.margins + 'mm' });

    const $traceLayer = $('<div class="trace-layer" aria-hidden="true"></div>');

    const items = computeContentList(state);

    for (let r = 0; r < rows; r++){
      const top = pxMargin + r * state.lineHeight;
      const $row = $('<div class="hw-row" aria-hidden="true"></div>').css({ top: top + 'px', height: state.lineHeight + 'px' });
      $row.append('<div class="guide top"></div>');
      $row.append('<div class="guide mid"></div>');
      $row.append('<div class="guide base"></div>');
      $inner.append($row);

      if (state.mode === 'blank') continue;

      // Place trace units
      const repeat = state.repeat;
      const baselineY = Math.round(top + state.lineHeight * 0.78);
      const leftStart = pxMargin + 8; // a little inset from margin
      let cursorX = leftStart;
      const spacing = Math.floor(state.fontSize * 0.75);

      for (let i = 0; i < repeat; i++){
        const text = state.mode === 'letters' ? (items[i % Math.max(1, items.length)] || '') : (items[(r + i) % Math.max(1, items.length)] || '');
        const frag = window.App.Util.buildTraceSVG(text, { fontSize: state.fontSize, ink: state.ink, traceStyle: state.traceStyle, lineHeight: state.lineHeight });
        if (cursorX + frag.width > (pxMargin + innerW)) break;
        const $unit = $('<div class="trace-unit"></div>').css({ left: cursorX + 'px', top: (baselineY - frag.height) + 'px', width: frag.width + 'px', height: frag.height + 'px' });
        $unit.html(frag.svg);
        $traceLayer.append($unit);
        cursorX += frag.width + spacing;
      }
    }

    $inner.append($traceLayer);
    $margins.append($inner);
    $sheet.append($margins);
  }

  function buildGridSheet(sheetDims, state){
    const pxMargin = window.App.Util.toPxFromMm(state.margins);
    const innerW = sheetDims.w - pxMargin * 2;
    const innerH = sheetDims.h - pxMargin * 2;

    const $sheet = $('#sheet');
    $sheet.empty();
    $sheet.css({ width: sheetDims.w + 'px', height: sheetDims.h + 'px' });

    const $inner = $('<div class="page-inner"></div>');
    const $margins = $('<div class="sheet-margins"></div>').css({ padding: state.margins + 'mm' });

    const $grid = $('<div class="grid-bg"></div>').css({ left: pxMargin + 'px', top: pxMargin + 'px', width: innerW + 'px', height: innerH + 'px' });
    $inner.append($grid);

    if (state.mode !== 'blank'){
      const items = computeContentList(state);
      const $traceLayer = $('<div class="trace-layer" aria-hidden="true"></div>');
      const cols = Math.max(1, Math.floor(innerW / (state.fontSize * 2)));
      const rows = Math.max(1, Math.floor(innerH / (state.fontSize * 2)));
      let idx = 0;
      const cellW = Math.floor(innerW / cols);
      const cellH = Math.floor(innerH / rows);
      for (let r = 0; r < rows; r++){
        for (let c = 0; c < cols; c++){
          const txt = items[idx % items.length]; idx++;
          const frag = window.App.Util.buildTraceSVG(txt, { fontSize: state.fontSize, ink: state.ink, traceStyle: state.traceStyle, lineHeight: cellH });
          const left = pxMargin + c * cellW + Math.floor((cellW - frag.width) / 2);
          const top = pxMargin + r * cellH + Math.floor((cellH - frag.height) / 2);
          if (frag.width > cellW || frag.height > cellH) continue;
          const $unit = $('<div class="trace-unit"></div>').css({ left: left + 'px', top: top + 'px', width: frag.width + 'px', height: frag.height + 'px' });
          $unit.html(frag.svg);
          $traceLayer.append($unit);
        }
      }
      $inner.append($traceLayer);
    }

    $margins.append($inner);
    $sheet.append($margins);
  }

  function renderSheet(state){
    const dims = window.App.Util.computeSheetDims(state);
    window.App.Util.setInk(state.ink);
    if (state.guides === 'primary') buildPrimaryRows(dims, state); else buildGridSheet(dims, state);
    setZoom(state);
  }

  // Public API
  window.App.init = function(){
    const $form = $('#controls');
    const state = getState();

    bindRangeHints($form);
    populateForm($form, state);
    toggleSections(state);
    setupQuickKeys($form);

    // Update on input
    const debounced = window.App.Util.debounce(function(){ const s = readForm($form); window.App.state = s; toggleSections(s); renderSheet(s); window.App.Util.saveState(s); }, 120);
    $form.on('input change', 'input, select, textarea', debounced);
    $form.on('change', '[name=mode]', function(){ const s = readForm($form); toggleSections(s); });

    $('#btn-generate').on('click', function(){ const s = readForm($form); window.App.state = s; renderSheet(s); window.App.Util.saveState(s); });
    $('#btn-clear').on('click', function(){ if (confirm('Clear current content inputs?')){ $form.find('[name=letters]').val(''); $form.find('[name=words]').val(''); const s = readForm($form); window.App.state = s; renderSheet(s); } });
    $('#btn-save').on('click', function(){ const s = readForm($form); window.App.Util.saveState(s); $(this).text('Saved').prop('disabled', true); setTimeout(()=>{ $('#btn-save').text('Save Settings').prop('disabled', false); }, 800); });
    $('#btn-export').on('click', function(){ const s = readForm($form); const el = document.getElementById('sheet'); window.App.Util.exportElementToPDF(el, s); });
    $('#btn-print').on('click', function(){ window.print(); });

    window.App.state = state; // store globally
  };

  window.App.render = function(){ renderSheet(window.App.state || getState()); };
})();
