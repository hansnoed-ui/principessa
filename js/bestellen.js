// Bestellkarte: öffnet sich unter der Wiese, zeigt Glückskarte, Tasche und Shirt zum Anwählen,
// darunter das Formular. Wer weit genug hinaufscrollt, klappt sie wieder zu.
import { zeichne, imBild } from './figur.js';

// Hierhin gehen die Bestellungen (leer: das Mailprogramm öffnet sich ohne Empfänger)
const AN = '';

const karte = document.getElementById('bestellkarte');
const link = document.querySelector('.bestellen');
const form = karte.querySelector('form');
const reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Die erste Principessa als Bild für das Shirt
{
  const c = document.createElement('canvas'); c.width = c.height = 600;
  const { cx, by, s } = imBild(600); zeichne(c.getContext('2d'), cx, by, s, 5.4);
  const url = c.toDataURL('image/png');
  karte.querySelectorAll('image[data-principessa="1"]').forEach(i => i.setAttribute('href', url));
}

function oeffnen() {
  if (!karte.hidden) { karte.scrollIntoView({ behavior: reduziert ? 'auto' : 'smooth', block: 'start' }); return; }
  karte.hidden = false;
  link.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => {
    karte.classList.add('offen');
    karte.scrollIntoView({ behavior: reduziert ? 'auto' : 'smooth', block: 'start' });
    dispatchEvent(new Event('resize'));
  });
}
function schliessen() {
  karte.classList.remove('offen');
  karte.hidden = true;
  link.setAttribute('aria-expanded', 'false');
  dispatchEvent(new Event('resize'));
}
link.addEventListener('click', e => { e.preventDefault(); oeffnen(); });
karte.querySelector('.zu').addEventListener('click', () => { schliessen(); link.focus({ preventScroll: true }); });

// Ganz weggescrollt (die Karte liegt komplett unterhalb des Bildschirms): wieder zuklappen
new IntersectionObserver(([e]) => {
  if (karte.hidden || e.isIntersecting) return;
  if (e.boundingClientRect.top > innerHeight) schliessen();
}).observe(karte);

// Auswahl: Wer eine Option berührt, wählt das Produkt mit an. Die Bilder zeigen die Wahl live.
const produkte = [...karte.querySelectorAll('.produkt')];
const wert = n => form.querySelector(`input[name="${n}"]:checked`)?.value;
function funkeln(p) {
  if (reduziert) return;
  const bild = p.querySelector('.bild'), r = bild.getBoundingClientRect(), pr = p.getBoundingClientRect();
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('i'); s.className = 'funkelstern';
    s.style.left = (r.left - pr.left + r.width * (.15 + Math.random() * .7)) + 'px';
    s.style.top = (r.top - pr.top + r.height * (.1 + Math.random() * .7)) + 'px';
    s.style.setProperty('--d', Math.round(Math.random() * 350) + 'ms');
    s.style.setProperty('--g', (.6 + Math.random() * .8).toFixed(2));
    s.addEventListener('animationend', () => s.remove());
    p.append(s);
  }
}
function zeigen() {
  for (const p of produkte) p.classList.toggle('gewaehlt', p.querySelector('.wahl input').checked);
  // Kartenstapel nach Setgrösse
  const n = { '3er-Set': 2, '5er-Set': 4, '10er-Set': 6 }[wert('karte-set')] || 0;
  karte.querySelectorAll('.stapel').forEach(s => s.style.display = 6 - +s.dataset.i <= n ? '' : 'none');
  // Tasche wächst mit der Grösse
  karte.querySelector('.tasche-koerper').style.transform = wert('tasche-groesse') === 'klein' ? 'translate(18px, 30px) scale(.82)' : '';
  // Shirt: Farbe und Motiv
  const farben = { Weiss: '#fbf8f3', Rosa: '#f2c4d2', Hellblau: '#b4d2f4', Nachtblau: '#1e1a4c' };
  karte.querySelector('.shirt-stoff').setAttribute('fill', farben[wert('shirt-farbe')] || '#fbf8f3');
  karte.querySelectorAll('.motiv').forEach(g => g.style.display = g.dataset.motiv === wert('shirt-motiv') ? '' : 'none');
}
form.addEventListener('change', e => {
  const p = e.target.closest('.produkt'); if (!p) return;
  const box = p.querySelector('.wahl input');
  if (e.target !== box && !box.checked) box.checked = true;
  if (box.checked && (e.target === box || !p.classList.contains('gewaehlt'))) funkeln(p);
  form.querySelector('.hinweis-fehler').hidden = true;
  zeigen();
});
zeigen();

form.addEventListener('submit', e => {
  e.preventDefault();
  const hinweis = form.querySelector('.hinweis-fehler');
  const gewaehlt = produkte.filter(p => p.querySelector('.wahl input').checked);
  if (!gewaehlt.length) { hinweis.textContent = 'Bitte wähle mindestens etwas aus: Glückskarten, Tasche oder Shirt.'; hinweis.hidden = false; karte.querySelector('.produkte').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  if (!form.reportValidity()) return;
  hinweis.hidden = true;
  const d = new FormData(form);
  const zeilen = gewaehlt.map(p => ({
    karte: `– Glückskarten, ${d.get('karte-set')}`,
    tasche: `– Besondere Tasche, ${d.get('tasche-groesse')}, ${d.get('tasche-anzahl')}`,
    shirt: `– Shirt, ${d.get('shirt-farbe')}, Grösse ${d.get('shirt-groesse')}, Motiv ${d.get('shirt-motiv')}`,
  })[p.dataset.id]);
  const text = [
    'Liebe Katharina', '',
    'ich möchte gerne Principesse bestellen:', ...zeilen, '',
    d.get('wunsch') ? `Wünsche: ${d.get('wunsch')}` : null, d.get('wunsch') ? '' : null,
    d.get('name'), d.get('strasse'), d.get('ort'), d.get('email'),
  ].filter(z => z !== null).join('\n');
  location.href = `mailto:${AN}?subject=${encodeURIComponent('Bestellung Principesse')}&body=${encodeURIComponent(text)}`;
  form.querySelector('.danke').hidden = false;
});
