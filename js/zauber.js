// Verzauberter Text: Wörter erscheinen als Goldglitzer, danach läuft ab und zu eine Glitzerwelle hindurch.
// Bei jeder Welle meldet das Modul 'zauber', damit auch Kleid und Krone der Principessa aufglitzern.
const reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WELLE_ALLE = 12000;

for (const absatz of document.querySelectorAll('.zauber')) {
  const woerter = absatz.textContent.trim().split(/\s+/);
  absatz.textContent = '';
  woerter.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'wort'; s.textContent = w; s.style.setProperty('--i', i);
    absatz.append(s, ' ');
  });
  const spans = [...absatz.querySelectorAll('.wort')];
  if (reduziert) { absatz.classList.add('erwacht'); continue; }

  let sichtbar = false, uhr = null, welle = 0;
  const sterne = () => {
    const box = absatz.getBoundingClientRect(), eltern = absatz.parentElement.getBoundingClientRect();
    spans.forEach((sp, i) => {
      if (Math.random() > .3) return;
      const r = sp.getBoundingClientRect(), st = document.createElement('i');
      st.className = 'funkelstern';
      st.style.left = (r.left - eltern.left + Math.random() * r.width) + 'px';
      st.style.top = (r.top - eltern.top + (Math.random() - .3) * r.height) + 'px';
      st.style.setProperty('--d', (i * 70 + Math.random() * 200) + 'ms');
      st.style.setProperty('--g', (.5 + Math.random() * .5).toFixed(2));
      st.addEventListener('animationend', () => st.remove());
      absatz.parentElement.append(st);
    });
  };
  const zaubern = () => {
    if (!absatz.classList.contains('erwacht')) absatz.classList.add('erwacht');
    else { absatz.classList.remove('welle-a', 'welle-b'); absatz.classList.add(welle++ % 2 ? 'welle-b' : 'welle-a'); }
    sterne();
    dispatchEvent(new CustomEvent('zauber'));
  };
  new IntersectionObserver(([e]) => {
    sichtbar = e.isIntersecting;
    if (sichtbar && !uhr) { zaubern(); uhr = setInterval(() => sichtbar && !document.hidden && zaubern(), WELLE_ALLE); }
    if (!sichtbar && uhr) { clearInterval(uhr); uhr = null; }
  }, { threshold: .6 }).observe(absatz);
}
