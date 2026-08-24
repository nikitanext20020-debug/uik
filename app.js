/* Поиск УИК / первички / депутата по адресу. Без зависимостей. */
(function () {
  'use strict';
  var DATA = window.UIK_DATA;
  var UIK = {};
  DATA.uiks.forEach(function (u) { UIK[u.uik] = u; });

  var VOTE_URL = 'https://www.gosuslugi.ru/600307/1/form';

  /* ---------- нормализация ---------- */
  var TYPE_WORDS = {};
  ('\u0443\u043b \u0443\u043b\u0438\u0446\u0430 \u0443\u043b\u0438\u0446\u044b \u0443\u043b\u0438\u0446\u0435 \u043f\u0435\u0440 \u043f\u0435\u0440\u0435\u0443\u043b\u043e\u043a \u043f\u0435\u0440\u0435\u0443\u043b\u043a\u0438 \u043f\u0440\u043e\u0435\u0437\u0434 \u043f\u0440\u043e\u0435\u0437\u0434\u044b \u043f\u0440 \u043f\u0440\u043e\u0441\u043f \u043f\u0440\u043e\u0441\u043f\u0435\u043a\u0442 \u043f\u043b \u043f\u043b\u043e\u0449\u0430\u0434\u044c \u043f\u043b\u043e\u0449\u0430\u0434\u0438 ' +
   '\u0448 \u0448\u043e\u0441\u0441\u0435 \u0431\u0443\u043b \u0431\u0443\u043b\u044c\u0432\u0430\u0440 \u0442\u0443\u043f \u0442\u0443\u043f\u0438\u043a \u043d\u0430\u0431 \u043d\u0430\u0431\u0435\u0440\u0435\u0436\u043d\u0430\u044f \u043b\u0438\u043d\u0438\u044f \u043a\u0432\u0430\u0440\u0442\u0430\u043b ' +
   '\u0433 \u0433\u043e\u0440 \u0433\u043e\u0440\u043e\u0434 \u0434 \u0434\u0435\u0440 \u0434\u0435\u0440\u0435\u0432\u043d\u044f \u0434\u0435\u0440\u0435\u0432\u043d\u0438 \u0441 \u0441\u0435\u043b \u0441\u0435\u043b\u043e \u0441\u0435\u043b\u0430 \u043f \u043f\u043e\u0441 \u043f\u043e\u0441\u0435\u043b\u043e\u043a \u043f\u043e\u0441\u0451\u043b\u043e\u043a \u043f\u043e\u0441\u0435\u043b\u043a\u0438 ' +
   '\u0440\u043f \u0440\u0430\u0431\u043e\u0447\u0438\u0439 \u043c\u043a\u0440 \u043c\u043a\u0440\u043d \u043c\u0438\u043a\u0440\u043e\u0440\u0430\u0439\u043e\u043d \u0441\u0442 \u0441\u0442\u0430\u043d\u0446\u0438\u044f \u0445\u0443\u0442\u043e\u0440 \u0442\u0435\u0440 \u0442\u0435\u0440\u0440\u0438\u0442\u043e\u0440\u0438\u044f \u043c\u0430\u0441\u0441\u0438\u0432 \u0437\u043e\u043d\u0430 ' +
   '\u0434\u043e\u043c \u0434\u043e\u043c\u0430 \u043a\u043e\u0440\u043f \u043a\u043e\u0440\u043f\u0443\u0441 \u0441\u0442\u0440 \u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435 \u043a\u0432 \u043a\u0432\u0430\u0440\u0442\u0438\u0440\u0430 \u043e\u043a\u0440\u0443\u0433 \u0431\u043e\u0433\u043e\u0440\u043e\u0434\u0441\u043a\u0438\u0439 \u043e\u0431\u043b\u0430\u0441\u0442\u044c ' +
   '\u0441\u043d\u0442 \u0434\u043d\u043f \u0434\u043d\u0442 \u0434\u043f\u043a \u043a\u043f \u0442\u0441\u043d \u043d\u043f \u0433\u0441\u043a \u0434\u0441\u043a \u0436\u0441\u043a \u0442\u0438\u0437 \u043e\u043d\u0442 \u0442\u0441\u0436 \u0441\u043f\u043a \u0432\u0447 \u043c\u0434\u0437 \u043a\u0438\u0437 \u043d\u0442\u043b\u043f\u0445 \u043c\u0438\u0436\u0437 \u0441\u043e\u043e \u0438\u0436\u0441'
  ).split(' ').forEach(function (w) { TYPE_WORDS[w] = 1; });

  var ABBR = {
    '\u0431': '\u0431\u043e\u043b\u044c\u0448\u0430\u044f', '\u043c': '\u043c\u0430\u043b\u0430\u044f', '\u0441\u0442\u0430\u0440': '\u0441\u0442\u0430\u0440\u0430\u044f', '\u043d\u043e\u0432': '\u043d\u043e\u0432\u0430\u044f',
    '\u0438\u043c': '\u0438\u043c\u0435\u043d\u0438', '\u0438\u043d\u0442\u0435\u0440\u043d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u0430': '\u0438\u043d\u0442\u0435\u0440\u043d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u0430'
  };

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/\u0451/g, '\u0435')
      .replace(/[\u00ab\u00bb"'`\u201c\u201d]/g, ' ')
      .replace(/[.,;:()\[\]!?]/g, ' ')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // токены для сравнения имён: без дефисов, без числовых окончаний (3-го -> 3)
  function nameTokens(s) {
    var t = norm(s).replace(/-/g, ' ');
    t = t.replace(/\b(\d+)\s*(\u0433\u043e|\u044f|\u0439|\u044b\u0439|\u043e\u0439|\u0438\u0439|\u0430\u044f|\u043e\u0435|\u0435)\b/g, '$1');
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
      .replace(/\u043a\u043e\u0440\u043f\u0443\u0441|\u043a\u043e\u0440\u043f|\u043a\u043e\u0440/g, '\u043a')
      .replace(/\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435|\u0441\u0442\u0440/g, '\u0441');
  }
  function houseBase(h) {
    var m = houseKey(h).match(/^\d+/);
    return m ? m[0] : '';
  }
  function isHouseToken(t) {
    return /^\d+[\u0430-\u044f]?(\/\d+[\u0430-\u044f]?)?[\u0430-\u044f]?$/.test(t) && /^\d/.test(t);
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

  function tokenScore(q, w) {
    if (q === w) return 1;
    if (w.indexOf(q) === 0) return q.length >= 3 ? 0.94 : 0.6;
    if (q.indexOf(w) === 0 && w.length >= 4) return 0.85;
    var max = q.length >= 11 ? 3 : (q.length >= 8 ? 2 : (q.length >= 5 ? 1 : 0));
    if (max === 0) return 0;
    var d = lev(q, w, max);
    if (d <= max) return 0.9 - 0.12 * d;
    if (q.length >= 5 && w.length > q.length) {
      var d2 = lev(q, w.slice(0, q.length), 1);
      if (d2 <= 1) return 0.78;
    }
    return 0;
  }

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
    var cover = used.length / qTokens.length;
    var full = used.length / nameToks.length;
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
    if (toks.length > 1 && isHouseToken(toks[toks.length - 1])) {
      house = toks[toks.length - 1];
      toks = toks.slice(0, -1);
    }
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
        if (!locHit && !singleWord) return;
      }
      var stS = 0, stFull = false, locOnly = false;
      if (q.streetToks.length) {
        if (!e.streetToks.length) {
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
          hS = locOnly ? 0.3 : 0.7; hTag = 'all';
        }
      } else {
        hS = e.hasHouses ? 0.5 : 0.6;
      }
      if (q.house && hTag === 'miss' && e.hasHouses) hS = 0.05;

      var total = locS * 2.2 + stS * 3.4 + hS * 2.6 + (stFull ? 0.25 : 0);
      res.push({ e: e, score: total, locS: locS, stS: stS, hS: hS, hTag: hTag, locOnly: locOnly });
    });

    res.sort(function (a, b) { return b.score - a.score; });

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
    if (!h.length) return e.raw.street ? '\u0432\u0441\u044f \u0443\u043b\u0438\u0446\u0430' : '\u0432\u0441\u0451 \u043f\u043e\u0441\u0435\u043b\u0435\u043d\u0438\u0435';
    var s = h.slice(0, 24).join(', ');
    return h.length > 24 ? s + '\u2026 (\u0432\u0441\u0435\u0433\u043e ' + h.length + ')' : s;
  }
  function addrText(e) {
    var p = [];
    if (e.raw.loct) p.push(e.raw.loct + ' ' + e.raw.loc);
    else if (e.raw.loc) p.push(e.raw.loc);
    if (e.raw.street) p.push((e.raw.st ? e.raw.st + ' ' : '') + e.raw.street);
    return p.join(', ');
  }

  function actionsHTML() {
    return '<div class="actions">' +
      '<a class="btn btn-yes" href="' + VOTE_URL + '" target="_blank" rel="noopener noreferrer">' +
        '\u2713 \u0413\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u0442\u044c</a>' +
      '<span class="runaway"><button class="btn btn-no" type="button">\u041d\u0435 \u0431\u0443\u0434\u0443 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u0442\u044c</button></span>' +
      '</div>';
  }

  function jokeHTML(str, r) {
    var J = window.UIK_JOKES;
    if (!J || !J.pick) return '';
    var ctx = { q: str, street: '', loc: '', uik: '' };
    if (r.mode === 'uik') {
      ctx.uik = r.uik.uik;
      var own = ENTRIES.filter(function (e) { return e.raw.uik === r.uik.uik; })[0];
      if (own) { ctx.street = own.raw.street || ''; ctx.loc = own.raw.loc || ''; }
    } else if (r.items && r.items.length) {
      var e0 = r.items[0].e.raw;
      ctx.street = e0.street || ''; ctx.loc = e0.loc || ''; ctx.uik = e0.uik;
    }
    var j = J.pick(ctx);
    if (!j) return '';
    return '<div class="joke"><span class="joke-ic">' + j.icon + '</span>' +
      '<div class="joke-txt"><span class="lbl">\u041c\u0435\u0441\u0442\u043d\u044b\u0435 \u0437\u0430\u043c\u0435\u0442\u043a\u0438</span>' +
      esc(j.text) + '</div></div>';
  }

  function cardHTML(r, best, qtoks) {
    var u = UIK[r.e.raw.uik] || {};
    var tags = [];
    if (r.hTag === 'exact') tags.push('<span class="tag ok">\u0434\u043e\u043c \u043d\u0430\u0439\u0434\u0435\u043d \u0432 \u0433\u0440\u0430\u043d\u0438\u0446\u0430\u0445</span>');
    if (r.hTag === 'base') tags.push('<span class="tag ok">\u0434\u043e\u043c \u0441\u043e\u0432\u043f\u0430\u043b \u043f\u043e \u043d\u043e\u043c\u0435\u0440\u0443 (\u0431\u0435\u0437 \u043b\u0438\u0442\u0435\u0440\u044b)</span>');
    if (r.hTag === 'all') tags.push('<span class="tag info">\u0443\u0447\u0430\u0441\u0442\u043e\u043a \u043e\u0445\u0432\u0430\u0442\u044b\u0432\u0430\u0435\u0442 \u0430\u0434\u0440\u0435\u0441 \u0446\u0435\u043b\u0438\u043a\u043e\u043c</span>');
    if (r.hTag === 'miss') tags.push('<span class="tag warn">\u044d\u0442\u043e\u0433\u043e \u0434\u043e\u043c\u0430 \u043d\u0435\u0442 \u0432 \u0441\u043f\u0438\u0441\u043a\u0435 \u0443\u0447\u0430\u0441\u0442\u043a\u0430</span>');
    if (r.locOnly) tags.push('<span class="tag warn">\u0442\u0430\u043a\u043e\u0439 \u0443\u043b\u0438\u0446\u044b \u043d\u0435\u0442 \u0432 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0445 \u2014 \u0443\u0447\u0430\u0441\u0442\u043e\u043a \u043f\u043e \u043d\u0430\u0441\u0435\u043b\u0451\u043d\u043d\u043e\u043c\u0443 \u043f\u0443\u043d\u043a\u0442\u0443</span>');
    if (r.more && r.more.length) tags.push('<span class="tag">\u0435\u0449\u0451 ' + r.more.length + ' \u0441\u043e\u0432\u043f\u0430\u0434\u0435\u043d\u0438\u0439 \u0432 \u044d\u0442\u043e\u043c \u0423\u0418\u041a</span>');
    if (u.voters) tags.push('<span class="tag">\u0438\u0437\u0431\u0438\u0440\u0430\u0442\u0435\u043b\u0435\u0439: ' + esc(u.voters) + '</span>');

    return '<article class="card' + (best ? ' best' : '') + '">' +
      '<div class="uik"><div class="lbl">\u0423\u0418\u041a</div><div class="num">' + esc(r.e.raw.uik) + '</div></div>' +
      '<div class="body">' +
        '<div class="row"><div class="k">\u041f\u0435\u0440\u0432\u0438\u0447\u043a\u0430</div><div class="v big">' + esc(u.po || '\u2014') + '</div></div>' +
        '<div class="row"><div class="k">\u0414\u0435\u043f\u0443\u0442\u0430\u0442</div><div class="v big">' + esc(u.deputy || '\u2014') +
          (u.dep_num ? ' <span class="tag">\u043e\u043a\u0440\u0443\u0433 ' + esc(u.dep_num) + '</span>' : '') + '</div></div>' +
        '<div class="row"><div class="k">\u0410\u0434\u0440\u0435\u0441 \u0432 \u0433\u0440\u0430\u043d\u0438\u0446\u0430\u0445</div><div class="v">' + hl(addrText(r.e), qtoks) + '</div></div>' +
        '<div class="row"><div class="k">\u0414\u043e\u043c\u0430</div><div class="v">' + esc(housesText(r.e)) + '</div></div>' +
        '<div class="row"><div class="k">\u0413\u0434\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u0442\u044c</div><div class="v">' + esc(u.address || '\u2014') + '</div></div>' +
        (tags.length ? '<div class="tags">' + tags.join('') + '</div>' : '') +
        actionsHTML() +
      '</div></article>';
  }

  function uikCardHTML(u) {
    var mine = ENTRIES.filter(function (e) { return e.raw.uik === u.uik; });
    var list = mine.slice(0, 40).map(function (e) { return addrText(e); }).join('; ');
    return '<article class="card best">' +
      '<div class="uik"><div class="lbl">\u0423\u0418\u041a</div><div class="num">' + esc(u.uik) + '</div></div>' +
      '<div class="body">' +
        '<div class="row"><div class="k">\u041f\u0435\u0440\u0432\u0438\u0447\u043a\u0430</div><div class="v big">' + esc(u.po || '\u2014') + '</div></div>' +
        '<div class="row"><div class="k">\u0414\u0435\u043f\u0443\u0442\u0430\u0442</div><div class="v big">' + esc(u.deputy || '\u2014') + '</div></div>' +
        '<div class="row"><div class="k">\u0413\u0434\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u0442\u044c</div><div class="v">' + esc(u.address || '\u2014') + '</div></div>' +
        '<div class="row"><div class="k">\u0413\u0440\u0430\u043d\u0438\u0446\u044b</div><div class="v">' + esc(list) + (mine.length > 40 ? '\u2026' : '') + '</div></div>' +
        actionsHTML() +
      '</div></article>';
  }

  /* ---------- убегающая кнопка ---------- */
  function attachRunaway(btn) {
    var tries = 0, last = 0, x = 0;

    function move() {
      var wrap = btn.parentNode;
      var maxX = Math.max(0, wrap.clientWidth - btn.offsetWidth);
      var nx = Math.random() * maxX;
      if (maxX > 20 && Math.abs(nx - x) < maxX * 0.45) nx = (x < maxX / 2) ? maxX : 0;
      x = nx;
      btn.style.left = Math.round(x) + 'px';
      btn.style.top = (Math.random() * 6 - 3).toFixed(1) + 'px';
      btn.style.transform = 'rotate(' + (Math.random() * 14 - 7).toFixed(1) + 'deg)';
    }

    function flee(ev) {
      if (btn.classList.contains('done')) {
        if (ev && ev.cancelable) ev.preventDefault();
        return;
      }
      var now = Date.now();
      if (now - last < 350) {                 // один жест = одна попытка
        if (ev && ev.cancelable) ev.preventDefault();
        return;
      }
      last = now;
      tries++;
      if (ev && ev.cancelable) ev.preventDefault();
      if (tries >= 3) {
        btn.classList.add('done');
        btn.textContent = '\u0418\u0437\u0432\u0438\u043d\u0438\u0442\u0435, \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e';
        btn.style.left = '0px'; btn.style.top = '2px'; btn.style.transform = 'none';
        return;
      }
      move();
    }

    var tap = null;
    // мышь/стилус: реагируем на нажатие, а не на наведение
    btn.addEventListener('pointerdown', function (ev) {
      if (!ev.pointerType || ev.pointerType === 'mouse' || ev.pointerType === 'pen') flee(ev);
    });
    // тач: слушаем пассивно, чтобы не ломать скролл страницы
    btn.addEventListener('touchstart', function (ev) {
      var t0 = ev.touches && ev.touches[0];
      tap = t0 ? { x: t0.clientX, y: t0.clientY, t: Date.now() } : null;
    }, { passive: true });
    btn.addEventListener('touchend', function (ev) {
      var t0 = ev.changedTouches && ev.changedTouches[0];
      if (!tap || !t0) { tap = null; return; }
      var dx = Math.abs(t0.clientX - tap.x), dy = Math.abs(t0.clientY - tap.y);
      var dt = Date.now() - tap.t;
      tap = null;
      if (dx < 16 && dy < 16 && dt < 800) flee(ev);   // тап, а не свайп-скролл
    });
    btn.addEventListener('click', flee);
  }

  function bindCards() {
    var list = $res.querySelectorAll('.btn-no');
    for (var i = 0; i < list.length; i++) attachRunaway(list[i]);
  }

  function render(str) {
    var s = norm(str);
    if (!s) {
      $res.innerHTML = '<div class="empty"><div class="big">\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u0432\u0432\u043e\u0434\u0438\u0442\u044c \u0430\u0434\u0440\u0435\u0441</div>' +
        '<p class="hint">\u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: \u00ab\u041d\u043e\u0433\u0438\u043d\u0441\u043a \u0441\u0430\u043c\u043e\u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u0430\u044f 10\u00bb, \u00ab\u043f\u043e\u0441 \u041e\u0431\u0443\u0445\u043e\u0432\u043e \u0441\u043e\u0432\u0435\u0442\u0441\u043a\u0430\u044f 25\u00bb, \u00ab\u0421\u041d\u0422 \u0411\u0435\u0440\u0435\u0437\u043a\u0430\u00bb, \u00ab1871\u00bb</p></div>';
      return;
    }
    var r = search(str);
    if (r.mode === 'uik') {
      $res.innerHTML = jokeHTML(str, r) + uikCardHTML(r.uik);
      bindCards();
      return;
    }

    if (!r.items.length) {
      $res.innerHTML = '<div class="empty"><div class="big">\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0448\u043b\u043e\u0441\u044c</div>' +
        '<p class="hint">\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0442\u043e\u043b\u044c\u043a\u043e \u0443\u043b\u0438\u0446\u0443 \u0438\u043b\u0438 \u0442\u043e\u043b\u044c\u043a\u043e \u043d\u0430\u0441\u0435\u043b\u0451\u043d\u043d\u044b\u0439 \u043f\u0443\u043d\u043a\u0442. \u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: \u00ab\u0441\u0430\u043c\u043e\u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u0430\u044f\u00bb.</p></div>';
      return;
    }
    var qtoks = r.query.streetToks.concat(r.query.locToks || []);
    var html = jokeHTML(str, r);
    var top = r.items[0], second = r.items[1];
    var ambiguous = second && (top.score - second.score) < 0.35;
    if (ambiguous) {
      html += '<div class="notice"><b>\u041f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0443\u0447\u0430\u0441\u0442\u043a\u043e\u0432.</b> \u0423\u0442\u043e\u0447\u043d\u0438\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u0434\u043e\u043c\u0430 \u0438\u043b\u0438 \u043d\u0430\u0441\u0435\u043b\u0451\u043d\u043d\u044b\u0439 \u043f\u0443\u043d\u043a\u0442 \u2014 \u043d\u0438\u0436\u0435 \u0432\u0441\u0435 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u044b \u0438\u0437 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432.</div>';
    }
    r.items.forEach(function (it, i) { html += cardHTML(it, i === 0 && !ambiguous, qtoks); });
    if (r.total > r.items.length) {
      html += '<div class="empty hint">\u041f\u043e\u043a\u0430\u0437\u0430\u043d\u044b ' + r.items.length + ' \u0438\u0437 ' + r.total + ' \u0443\u0447\u0430\u0441\u0442\u043a\u043e\u0432 \u2014 \u0443\u0442\u043e\u0447\u043d\u0438\u0442\u0435 \u0437\u0430\u043f\u0440\u043e\u0441.</div>';
    }
    $res.innerHTML = html;
    bindCards();
  }

  /* ---------- события ---------- */
  var t = null;
  $q.addEventListener('input', function () {
    $clear.hidden = !$q.value;
    clearTimeout(t);
    t = setTimeout(function () { render($q.value); }, 70);
  });
  $q.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { $q.blur(); }
  });
  $clear.addEventListener('click', function () {
    $q.value = ''; $clear.hidden = true; render(''); $q.focus();
  });

  var examples = ['\u041d\u043e\u0433\u0438\u043d\u0441\u043a \u0441\u0430\u043c\u043e\u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u0430\u044f 10', '\u041d\u043e\u0433\u0438\u043d\u0441\u043a \u0442\u0435\u043a\u0441\u0442\u0438\u043b\u0435\u0439 31',
    '\u043f\u043e\u0441 \u041e\u0431\u0443\u0445\u043e\u0432\u043e \u0441\u043e\u0432\u0435\u0442\u0441\u043a\u0430\u044f 25', '\u0421\u0442\u0430\u0440\u0430\u044f \u041a\u0443\u043f\u0430\u0432\u043d\u0430 \u0433\u043e\u0440\u044c\u043a\u043e\u0433\u043e 2', '\u0434 \u041c\u043e\u043b\u0437\u0438\u043d\u043e', '\u0421\u041d\u0422 \u0411\u0435\u0440\u0435\u0437\u043a\u0430'];
  var $chips = document.getElementById('chips');
  $chips.innerHTML = examples.map(function (x) { return '<button class="chip" type="button">' + esc(x) + '</button>'; }).join('');
  $chips.addEventListener('click', function (ev) {
    if (ev.target.classList.contains('chip')) {
      $q.value = ev.target.textContent; $clear.hidden = false; render($q.value);
      if (window.innerWidth > 640) $q.focus();
    }
  });

  document.getElementById('stats').textContent =
    DATA.uiks.length + ' \u0443\u0447\u0430\u0441\u0442\u043a\u043e\u0432 \u00b7 ' + DATA.entries.length + ' \u0430\u0434\u0440\u0435\u0441\u043d\u044b\u0445 \u0437\u0430\u043f\u0438\u0441\u0435\u0439';

  render('');

  window.__uikSearch = search; // для автотестов
})();
