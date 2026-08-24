/* Поиск УИК / первички / депутата по адресу. Без зависимостей. */
(function () {
  'use strict';
  var DATA = window.UIK_DATA;
  var UIK = {};
  DATA.uiks.forEach(function (u) { UIK[u.uik] = u; });

  /* ---------- нормализация ---------- */
  var TYPE_WORDS = {};
  ('ул улица улицы улице пер переулок переулки проезд проезды пр просп проспект пл площадь площади ' +
   'ш шоссе бул бульвар туп тупик наб набережная линия квартал ' +
   'г гор город д дер деревня деревни с сел село села п пос поселок посёлок поселки ' +
   'рп рабочий мкр мкрн микрорайон ст станция хутор тер территория массив зона ' +
   'дом дома корп корпус стр строение кв квартира округ богородский область ' +
   'снт днп днт дпк кп тсн нп гск дск жск тиз онт тсж спк вч мдз киз нтлпх мижз соо ижс'
  ).split(' ').forEach(function (w) { TYPE_WORDS[w] = 1; });

  // коллективные образования — не типы, а часть имени (СНТ и пр.) оставляем как есть
  var ABBR = {
    'б': 'большая', 'м': 'малая', 'стар': 'старая', 'нов': 'новая',
    'им': 'имени', 'интернационала': 'интернационала'
  };

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[«»"'`“”]/g, ' ')
      .replace(/[.,;:()\[\]!?]/g, ' ')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // токены для сравнения имён: без дефисов, без числовых окончаний (3-го -> 3)
  function nameTokens(s) {
    var t = norm(s).replace(/-/g, ' ');
    t = t.replace(/\b(\d+)\s*(го|я|й|ый|ой|ий|ая|ое|е)\b/g, '$1');
    var out = [], all = [];
    t.split(' ').forEach(function (w) {
      if (!w) return;
      if (ABBR[w]) w = ABBR[w];
      all.push(w);
      if (TYPE_WORDS[w]) return;
      out.push(w);
    });
    return out.length ? out : all;
  }

  function houseKey(h) {
    return norm(h).replace(/\s+/g, '')
      .replace(/корпус|корп|кор/g, 'к')
      .replace(/строение|стр/g, 'с');
  }
  function houseBase(h) {
    var m = houseKey(h).match(/^\d+/);
    return m ? m[0] : '';
  }
  function isHouseToken(t) {
    return /^\d+[а-я]?(\/\d+[а-я]?)?[а-я]?$/.test(t) && /^\d/.test(t);
  }

  /* ---------- расстояние Левенштейна с отсечкой ---------- */
  function lev(a, b, max) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i; var best = Infinity;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      for (j = 0; j <= b.length; j++) prev[j] = cur[j];
    }
    return prev[b.length];
  }

  // сопоставление токена запроса с токеном имени: 1 — точно, 0 — нет
  function tokenScore(q, w) {
    if (q === w) return 1;
    if (w.indexOf(q) === 0) return q.length >= 3 ? 0.94 : 0.6;   // префикс
    if (q.indexOf(w) === 0 && w.length >= 4) return 0.85;
    var max = q.length >= 11 ? 3 : (q.length >= 8 ? 2 : (q.length >= 5 ? 1 : 0));
    if (max === 0) return 0;
    var d = lev(q, w, max);
    if (d <= max) return 0.9 - 0.12 * d;                          // опечатка
    // опечатка в длинном префиксе (недописал слово)
    if (q.length >= 5 && w.length > q.length) {
      var d2 = lev(q, w.slice(0, q.length), 1);
      if (d2 <= 1) return 0.78;
    }
    return 0;
  }

  // сколько токенов запроса нашлось в имени (0..1) + использованные токены
  function matchName(qTokens, nameToks) {
    if (!qTokens.length || !nameToks.length) return null;
    var used = [], sum = 0, i, j;
    var taken = {};
    for (i = 0; i < qTokens.length; i++) {
      var best = 0, bestJ = -1;
      for (j = 0; j < nameToks.length; j++) {
        if (taken[j]) continue;
        var s = tokenScore(qTokens[i], nameToks[j]);
        if (s > best) { best = s; bestJ = j; }
      }
      if (best > 0) { taken[bestJ] = 1; sum += best; used.push(i); }
    }
    if (!used.length) return null;
    var cover = used.length / qTokens.length;             // доля токенов запроса
    var full = used.length / nameToks.length;             // насколько целиком имя покрыто
    var q = sum / used.length;
    return { score: q * (0.55 + 0.45 * full), cover: cover, used: used, quality: q };
  }

  /* ---------- подготовка индекса ---------- */
  var ENTRIES = DATA.entries.map(function (e) {
    var hk = {}, hb = {};
    (e.houses || []).forEach(function (h) { hk[houseKey(h)] = 1; hb[houseBase(h)] = 1; });
    return {
      raw: e,
      locToks: nameTokens(e.loc),
      allLocToks: (e.locs && e.locs.length ? e.locs : [e.loc]).map(nameTokens).filter(function (a) { return a.length; }),
      streetToks: nameTokens(e.street),
      houseKeys: hk, houseBases: hb,
      hasHouses: (e.houses || []).length > 0
    };
  });

  var LOC_LIST = {};
  ENTRIES.forEach(function (e) {
    e.allLocToks.forEach(function (t) { if (t.length) LOC_LIST[t.join(' ')] = 1; });
  });
  var LOC_KEYS = Object.keys(LOC_LIST).map(function (k) { return k.split(' '); });

  /* ---------- разбор запроса ---------- */
  function parseQuery(str) {
    var toks = nameTokens(str);
    var house = null;
    // дом = последний токен-номер, но не единственный токен и не первый (3 Интернационала)
    if (toks.length > 1 && isHouseToken(toks[toks.length - 1])) {
      house = toks[toks.length - 1];
      toks = toks.slice(0, -1);
    }
    // населённый пункт: ищем лучшее совпадение префикса токенов со списком НП
    var loc = null, rest = toks;
    var bestLoc = null;
    for (var take = Math.min(3, toks.length); take >= 1; take--) {
      for (var pos = 0; pos + take <= toks.length; pos++) {
        var part = toks.slice(pos, pos + take);
        for (var i = 0; i < LOC_KEYS.length; i++) {
          var m = matchName(part, LOC_KEYS[i]);
          if (m && m.cover === 1 && m.quality >= 0.85) {
            var sc = m.quality * take;
            if (!bestLoc || sc > bestLoc.sc) bestLoc = { sc: sc, toks: part, pos: pos, take: take };
          }
        }
      }
      if (bestLoc) break;
    }
    if (bestLoc && toks.length > bestLoc.take) {
      loc = bestLoc.toks;
      rest = toks.slice(0, bestLoc.pos).concat(toks.slice(bestLoc.pos + bestLoc.take));
    } else if (bestLoc) {
      loc = bestLoc.toks; rest = toks.slice();
    }
    return { locToks: loc, streetToks: rest, house: house, all: toks, uikNum: /^\d{3,4}$/.test(norm(str)) ? norm(str) : null };
  }

  /* ---------- поиск ---------- */
  function search(str) {
    var q = parseQuery(str);
    if (q.uikNum && UIK[q.uikNum]) return { mode: 'uik', uik: UIK[q.uikNum], query: q };

    var res = [];
    ENTRIES.forEach(function (e) {
      var locS = 0, locHit = false;
      if (q.locToks) {
        for (var i = 0; i < e.allLocToks.length; i++) {
          var m = matchName(q.locToks, e.allLocToks[i]);
          if (m && m.cover === 1 && m.score > locS) { locS = m.score; locHit = true; }
        }
        var singleWord = q.streetToks.length &&
                         q.locToks.join(' ') === q.streetToks.join(' ');
        if (!locHit && !singleWord) return;   // НП указан и не совпал
      }
      var sameQ = q.locToks && q.streetToks.length &&
                  q.locToks.join(' ') === q.streetToks.join(' ');
      if (sameQ && !locHit) {
        // одно слово: не НП — значит ищем как улицу/СНТ
      }
      var stS = 0, stFull = false, locOnly = false;
      if (q.streetToks.length) {
        if (!e.streetToks.length) {
          // запись на весь населённый пункт — подходит как fallback
          if (!locHit) return;
          stS = 0.08; locOnly = true;
        } else {
          var ms = matchName(q.streetToks, e.streetToks);
          if (!ms || ms.cover < 1 || ms.quality < 0.62) return;
          stS = ms.score; stFull = ms.quality > 0.97;
        }
      } else if (!locHit) {
        return;
      }

      var hS = 0, hTag = null;
      if (q.house) {
        var hk = houseKey(q.house);
        if (e.hasHouses) {
          if (e.houseKeys[hk]) { hS = 1; hTag = 'exact'; }
          else if (e.houseBases[houseBase(q.house)]) { hS = 0.8; hTag = 'base'; }
          else { hS = 0; hTag = 'miss'; }
        } else {
          hS = locOnly ? 0.3 : 0.7; hTag = 'all';           // вся улица / весь НП
        }
      } else {
        hS = e.hasHouses ? 0.5 : 0.6;
      }
      if (q.house && hTag === 'miss' && e.hasHouses) {
        // дома нет в границах — оставляем с большим штрафом (для подсказки)
        hS = 0.05;
      }
      var total = locS * 2.2 + stS * 3.4 + hS * 2.6 + (stFull ? 0.25 : 0);
      res.push({ e: e, score: total, locS: locS, stS: stS, hS: hS, hTag: hTag, locOnly: locOnly });
    });

    res.sort(function (a, b) { return b.score - a.score; });

    // свёртка по УИК: оставляем лучшую запись каждого участка
    var seen = {}, out = [];
    res.forEach(function (r) {
      var k = r.e.raw.uik;
      if (seen[k]) { seen[k].more.push(r); return; }
      r.more = []; seen[k] = r; out.push(r);
    });
    return { mode: 'list', items: out.slice(0, 8), query: q, total: out.length };
  }

  /* ---------- рендер ---------- */
  var $res = document.getElementById('results');
  var $q = document.getElementById('q');
  var $clear = document.getElementById('clear');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function hl(text, qtoks) {
    var out = esc(text);
    (qtoks || []).forEach(function (t) {
      if (t.length < 2) return;
      try {
        out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
      } catch (err) { }
    });
    return out;
  }
  function housesText(e) {
    var h = e.raw.houses || [];
    if (!h.length) return e.raw.street ? 'вся улица' : 'всё поселение';
    var s = h.slice(0, 24).join(', ');
    return h.length > 24 ? s + '… (всего ' + h.length + ')' : s;
  }
  function addrText(e) {
    var p = [];
    if (e.raw.loct) p.push(e.raw.loct + ' ' + e.raw.loc);
    else if (e.raw.loc) p.push(e.raw.loc);
    if (e.raw.street) p.push((e.raw.st ? e.raw.st + ' ' : '') + e.raw.street);
    return p.join(', ');
  }

  function cardHTML(r, best, qtoks) {
    var u = UIK[r.e.raw.uik] || {};
    var tags = [];
    if (r.hTag === 'exact') tags.push('<span class="tag ok">дом найден в границах</span>');
    if (r.hTag === 'base') tags.push('<span class="tag ok">дом совпал по номеру (без литеры)</span>');
    if (r.hTag === 'all') tags.push('<span class="tag info">участок охватывает адрес целиком</span>');
    if (r.hTag === 'miss') tags.push('<span class="tag warn">этого дома нет в списке участка</span>');
    if (r.locOnly) tags.push('<span class="tag warn">такой улицы нет в документах — участок по населённому пункту</span>');
    if (r.more && r.more.length) tags.push('<span class="tag">ещё ' + r.more.length + ' совпадений в этом УИК</span>');
    if (u.voters) tags.push('<span class="tag">избирателей: ' + esc(u.voters) + '</span>');

    return '<article class="card' + (best ? ' best' : '') + '">' +
      '<div class="uik"><div class="lbl">УИК</div><div class="num">' + esc(r.e.raw.uik) + '</div></div>' +
      '<div class="body">' +
        '<div class="row"><div class="k">Первичка</div><div class="v big">' + esc(u.po || '—') + '</div></div>' +
        '<div class="row"><div class="k">Депутат</div><div class="v big">' + esc(u.deputy || '—') +
          (u.dep_num ? ' <span class="tag">округ ' + esc(u.dep_num) + '</span>' : '') + '</div></div>' +
        '<div class="row"><div class="k">Адрес в границах</div><div class="v">' + hl(addrText(r.e), qtoks) + '</div></div>' +
        '<div class="row"><div class="k">Дома</div><div class="v">' + esc(housesText(r.e)) + '</div></div>' +
        '<div class="row"><div class="k">Где голосовать</div><div class="v">' + esc(u.address || '—') + '</div></div>' +
        (tags.length ? '<div class="tags">' + tags.join('') + '</div>' : '') +
      '</div></article>';
  }

  function uikCardHTML(u) {
    var mine = ENTRIES.filter(function (e) { return e.raw.uik === u.uik; });
    var list = mine.slice(0, 40).map(function (e) { return addrText(e); }).join('; ');
    return '<article class="card best">' +
      '<div class="uik"><div class="lbl">УИК</div><div class="num">' + esc(u.uik) + '</div></div>' +
      '<div class="body">' +
        '<div class="row"><div class="k">Первичка</div><div class="v big">' + esc(u.po || '—') + '</div></div>' +
        '<div class="row"><div class="k">Депутат</div><div class="v big">' + esc(u.deputy || '—') + '</div></div>' +
        '<div class="row"><div class="k">Где голосовать</div><div class="v">' + esc(u.address || '—') + '</div></div>' +
        '<div class="row"><div class="k">Границы</div><div class="v">' + esc(list) + (mine.length > 40 ? '…' : '') + '</div></div>' +
      '</div></article>';
  }

  function render(str) {
    var s = norm(str);
    if (!s) {
      $res.innerHTML = '<div class="empty"><div class="big">Начните вводить адрес</div>' +
        '<p class="hint">Например: «Ногинск самодеятельная 10», «пос Обухово советская 25», «СНТ Березка», «1871»</p></div>';
      return;
    }
    var r = search(str);
    if (r.mode === 'uik') { $res.innerHTML = uikCardHTML(r.uik); return; }

    if (!r.items.length) {
      $res.innerHTML = '<div class="empty"><div class="big">Ничего не нашлось</div>' +
        '<p class="hint">Попробуйте только улицу или только населённый пункт. Например: «самодеятельная».</p></div>';
      return;
    }
    var qtoks = r.query.streetToks.concat(r.query.locToks || []);
    var html = '';
    var top = r.items[0], second = r.items[1];
    var ambiguous = second && (top.score - second.score) < 0.35;
    if (ambiguous) {
      html += '<div class="notice"><b>Подходит несколько участков.</b> Уточните номер дома или населённый пункт — ниже все варианты из документов.</div>';
    }
    r.items.forEach(function (it, i) { html += cardHTML(it, i === 0 && !ambiguous, qtoks); });
    if (r.total > r.items.length) {
      html += '<div class="empty hint">Показаны ' + r.items.length + ' из ' + r.total + ' участков — уточните запрос.</div>';
    }
    $res.innerHTML = html;
  }

  /* ---------- события ---------- */
  var t = null;
  $q.addEventListener('input', function () {
    $clear.hidden = !$q.value;
    clearTimeout(t);
    t = setTimeout(function () { render($q.value); }, 60);
  });
  $clear.addEventListener('click', function () {
    $q.value = ''; $clear.hidden = true; render(''); $q.focus();
  });

  var examples = ['Ногинск самодеятельная 10', 'пос Обухово советская 25', 'Старая Купавна горького 2', 'д Молзино'];
  var $chips = document.getElementById('chips');
  $chips.innerHTML = examples.map(function (x) { return '<button class="chip" type="button">' + esc(x) + '</button>'; }).join('');
  $chips.addEventListener('click', function (ev) {
    if (ev.target.classList.contains('chip')) {
      $q.value = ev.target.textContent; $clear.hidden = false; render($q.value); $q.focus();
    }
  });

  document.getElementById('stats').textContent =
    DATA.uiks.length + ' участков · ' + DATA.entries.length + ' адресных записей';

  render('');
  $q.focus();

  window.__uikSearch = search; // для автотестов
})();
