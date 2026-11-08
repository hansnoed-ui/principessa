// Verzauberter Text: Wörter erscheinen als Goldglitzer, danach läuft ab und zu eine Glitzerwelle hindurch.
// Bei jeder Welle meldet das Modul 'zauber', damit auch Kleid und Krone der Principessa aufglitzern.
const reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WELLE_ALLE = 12000;

for (const absatz of document.querySelectorAll('.zauber')) {
  // Wörter in Spans legen, Links und andere Elemente bleiben erhalten
  let i = 0;
  const zerlege = knoten => {
    for (const k of [...knoten.childNodes]) {
      if (k.nodeType === 3) {
        const teile = k.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
        for (const t of teile) {
          if (!t) continue;
          if (/^\s+$/.test(t)) { frag.append(' '); continue; }
          const s = document.createElement('span'); s.className = 'wort'; s.textContent = t; s.style.setProperty('--i', i++); frag.append(s);
        }
        k.replaceWith(frag);
      } else if (k.nodeType === 1) zerlege(k);
    }
  };
  zerlege(absatz);
  const spans = [...absatz.querySelectorAll('.wort')];
  if (reduziert) { absatz.classList.add('erwacht'); continue; }

  let sichtbar = false, uhr = null, welle = 0;
  const sterne = () => {
    const box = absatz.getBoundingClientRect(), eltern = absatz.parentElement.getBoundingClientRect();
    spans.forEach((sp, i) => {
      const titel = !!absatz.dataset.start;
      if (Math.random() > (titel ? 1 : .3)) return;   // beim Titel funkelt jedes Wort, und zwar mehrfach
      for (let k = 0; k < (titel ? 4 : 1); k++) {
      const r = sp.getBoundingClientRect(), st = document.createElement('i');
      st.className = 'funkelstern';
      st.style.left = (r.left - eltern.left + Math.random() * r.width) + 'px';
      st.style.top = (r.top - eltern.top + (Math.random() - .3) * r.height) + 'px';
      st.style.setProperty('--d', (i * 70 + Math.random() * 200) + 'ms');
      st.style.setProperty('--g', (titel ? .9 + Math.random() * .9 : .5 + Math.random() * .5).toFixed(2));
      st.addEventListener('animationend', () => st.remove());
      absatz.parentElement.append(st);
      }
    });
  };
  const zaubern = () => {
    if (!absatz.classList.contains('erwacht')) absatz.classList.add('erwacht');
    else { absatz.classList.remove('welle-a', 'welle-b'); absatz.classList.add(welle++ % 2 ? 'welle-b' : 'welle-a'); }
    sterne();
    dispatchEvent(new CustomEvent('zauber'));
  };
  // Absätze mit data-start zaubern erst, wenn dieses Ereignis kommt (der Titel unter dem Film wartet auf den Film)
  // …und glitzern bei «<ereignis>-welle» noch einmal auf (der Titel kurz vor dem Ausblenden)
  if (absatz.dataset.start) { addEventListener(absatz.dataset.start, zaubern, { once: true }); addEventListener(absatz.dataset.start + '-welle', zaubern); continue; }
  new IntersectionObserver(([e]) => {
    sichtbar = e.isIntersecting;
    if (sichtbar && !uhr) { zaubern(); uhr = setInterval(() => sichtbar && !document.hidden && zaubern(), WELLE_ALLE); }
    if (!sichtbar && uhr) { clearInterval(uhr); uhr = null; }
  }, { threshold: .6 }).observe(absatz);
}
