var Fe = Object.defineProperty;
var Ye = (l, t, e) => (t in l ? Fe(l, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : (l[t] = e));
var Y = (l, t, e) => Ye(l, typeof t != 'symbol' ? t + '' : t, e);
import { d as Ae, e as je, c as de, b as $, l as ge, f as V, a as Qe } from '../chunks/CneGN6np.js';
import { i as Ee } from '../chunks/K7aIU5Yx.js';
import {
  a7 as Re,
  aA as Ke,
  aB as Ze,
  I as pe,
  h as q,
  ab as ue,
  ak as et,
  B as Pe,
  b as tt,
  q as n,
  P as X,
  C as nt,
  D as at,
  G as Oe,
  J as Se,
  e as ne,
  a1 as rt,
  K as Xe,
  c as Ue,
  L as st,
  ai as Ve,
  V as z,
  aC as Me,
  aD as Ce,
  a5 as Te,
  aE as ot,
  aF as lt,
  ag as it,
  aG as ct,
  d as ut,
  aH as ft,
  aI as dt,
  ac as Je,
  x as ie,
  aJ as gt,
  ae as mt,
  ad as vt,
  j as xe,
  F as E,
  aK as ht,
  m as yt,
  X as pt,
  aL as bt,
  p as me,
  aM as He,
  z as k,
  a as ve,
  y as A,
  aN as u,
  aO as be,
  aP as ke,
  A as U,
  T,
  t as j,
  f as _t,
  ax as wt,
  aQ as It,
  aR as K,
  aS as St
} from '../chunks/B1kvZUbr.js';
import { c as Ct, b as Nt, a as J, s as oe, e as _e } from '../chunks/CjSb9ldB.js';
import { p as x, i as ee } from '../chunks/CfjYUZpq.js';
var Pt = 'font-weight: bold',
  Tt = 'font-weight: normal';
function We(l) {
  console.warn(
    `%c[svelte] state_snapshot_uncloneable
%c${
      l
        ? `The following properties cannot be cloned with \`$state.snapshot\` — the return value contains the originals:

${l}`
        : 'Value cannot be cloned with `$state.snapshot` — the original value was returned'
    }
https://svelte.dev/e/state_snapshot_uncloneable`,
    Pt,
    Tt
  );
}
const Et = [];
function kt(l, t = !1) {
  if (!t) {
    const e = [],
      s = fe(l, new Map(), '', e);
    if (e.length === 1 && e[0] === '') We();
    else if (e.length > 0) {
      const o = e.length > 10 ? e.slice(0, 7) : e.slice(0, 10),
        i = e.length - o.length;
      let a = o.map(f => `- <value>${f}`).join(`
`);
      i > 0 &&
        (a += `
- ...and ${i} more`),
        We(a);
    }
    return s;
  }
  return fe(l, new Map(), '', Et);
}
function fe(l, t, e, s, o = null) {
  if (typeof l == 'object' && l !== null) {
    var i = t.get(l);
    if (i !== void 0) return i;
    if (l instanceof Map) return new Map(l);
    if (l instanceof Set) return new Set(l);
    if (Re(l)) {
      var a = Array(l.length);
      t.set(l, a), o !== null && t.set(o, a);
      for (var f = 0; f < l.length; f += 1) {
        var y = l[f];
        f in l && (a[f] = fe(y, t, `${e}[${f}]`, s));
      }
      return a;
    }
    if (Ke(l) === Ze) {
      (a = {}), t.set(l, a), o !== null && t.set(o, a);
      for (var d in l) a[d] = fe(l[d], t, `${e}.${d}`, s);
      return a;
    }
    if (l instanceof Date) return structuredClone(l);
    if (typeof l.toJSON == 'function') return fe(l.toJSON(), t, `${e}.toJSON()`, s, l);
  }
  if (l instanceof EventTarget) return l;
  try {
    return structuredClone(l);
  } catch {
    return s.push(e), l;
  }
}
function Gt(l, t) {
  return t;
}
function At(l, t, e, s) {
  for (var o = [], i = t.length, a = 0; a < i; a++) lt(t[a].e, o, !0);
  var f = i > 0 && o.length === 0 && e !== null;
  if (f) {
    var y = e.parentNode;
    it(y), y.append(e), s.clear(), Z(l, t[0].prev, t[i - 1].next);
  }
  ct(o, () => {
    for (var d = 0; d < i; d++) {
      var m = t[d];
      f || (s.delete(m.k), Z(l, m.prev, m.next)), ut(m.e, !f);
    }
  });
}
function Ot(l, t, e, s, o, i = null) {
  var a = l,
    f = { flags: t, items: new Map(), first: null };
  {
    var y = l;
    a = q ? pe(ue(y)) : y.appendChild(et());
  }
  q && Pe();
  var d = null,
    m = !1,
    b = X(() => {
      var r = e();
      return Re(r) ? r : r == null ? [] : Ve(r);
    });
  tt(() => {
    var r = n(b),
      h = r.length;
    if (m && h === 0) return;
    m = h === 0;
    let g = !1;
    if (q) {
      var w = nt(a) === at;
      w !== (h === 0) && ((a = Oe()), pe(a), Se(!1), (g = !0));
    }
    if (q) {
      for (var _ = null, v, N = 0; N < h; N++) {
        if (ne.nodeType === 8 && ne.data === rt) {
          (a = ne), (g = !0), Se(!1);
          break;
        }
        var W = r[N],
          R = s(W, N);
        (v = qe(ne, f, _, null, W, R, N, o, t, e)), f.items.set(R, v), (_ = v);
      }
      h > 0 && pe(Oe());
    }
    q || Mt(r, f, a, o, t, s, e),
      i !== null &&
        (h === 0
          ? d
            ? Xe(d)
            : (d = Ue(() => i(a)))
          : d !== null &&
            st(d, () => {
              d = null;
            })),
      g && Se(!0),
      n(b);
  }),
    q && (a = ne);
}
function Mt(l, t, e, s, o, i, a) {
  var f = l.length,
    y = t.items,
    d = t.first,
    m = d,
    b,
    r = null,
    h = [],
    g = [],
    w,
    _,
    v,
    N;
  for (N = 0; N < f; N += 1) {
    if (((w = l[N]), (_ = i(w, N)), (v = y.get(_)), v === void 0)) {
      var W = m ? m.e.nodes_start : e;
      (r = qe(W, t, r, r === null ? t.first : r.next, w, _, N, s, o, a)), y.set(_, r), (h = []), (g = []), (m = r.next);
      continue;
    }
    if (((v.e.f & Ce) !== 0 && Xe(v.e), v !== m)) {
      if (b !== void 0 && b.has(v)) {
        if (h.length < g.length) {
          var R = g[0],
            G;
          r = R.prev;
          var D = h[0],
            B = h[h.length - 1];
          for (G = 0; G < h.length; G += 1) De(h[G], R, e);
          for (G = 0; G < g.length; G += 1) b.delete(g[G]);
          Z(t, D.prev, B.next), Z(t, r, D), Z(t, B, R), (m = R), (r = B), (N -= 1), (h = []), (g = []);
        } else
          b.delete(v), De(v, m, e), Z(t, v.prev, v.next), Z(t, v, r === null ? t.first : r.next), Z(t, r, v), (r = v);
        continue;
      }
      for (h = [], g = []; m !== null && m.k !== _; )
        (m.e.f & Ce) === 0 && (b ?? (b = new Set())).add(m), g.push(m), (m = m.next);
      if (m === null) continue;
      v = m;
    }
    h.push(v), (r = v), (m = v.next);
  }
  if (m !== null || b !== void 0) {
    for (var F = b === void 0 ? [] : Ve(b); m !== null; ) (m.e.f & Ce) === 0 && F.push(m), (m = m.next);
    var P = F.length;
    if (P > 0) {
      var O = f === 0 ? e : null;
      At(t, F, O, y);
    }
  }
  (Te.first = t.first && t.first.e), (Te.last = r && r.e);
}
function qe(l, t, e, s, o, i, a, f, y, d) {
  var m = (y & ft) !== 0,
    b = (y & dt) === 0,
    r = m ? (b ? z(o, !1, !1) : Me(o)) : o,
    h = (y & ot) === 0 ? a : Me(a),
    g = { i: h, v: r, k: i, a: null, e: null, prev: e, next: s };
  try {
    return (
      (g.e = Ue(() => f(l, r, h, d), q)),
      (g.e.prev = e && e.e),
      (g.e.next = s && s.e),
      e === null ? (t.first = g) : ((e.next = g), (e.e.next = g.e)),
      s !== null && ((s.prev = g), (s.e.prev = g.e)),
      g
    );
  } finally {
  }
}
function De(l, t, e) {
  for (var s = l.next ? l.next.e.nodes_start : e, o = t ? t.e.nodes_start : e, i = l.e.nodes_start; i !== s; ) {
    var a = Je(i);
    o.before(i), (i = a);
  }
}
function Z(l, t, e) {
  t === null ? (l.first = e) : ((t.next = e), (t.e.next = e && e.e)),
    e !== null && ((e.prev = t), (e.e.prev = t && t.e));
}
function xt(l, t, e) {
  var i, a;
  if (!t || t === Ct(String(e ?? ''))) return;
  let s;
  const o = (i = l.__svelte_meta) == null ? void 0 : i.loc;
  o ? (s = `near ${o.file}:${o.line}:${o.column}`) : (a = xe) != null && a[E] && (s = `in ${xe[E]}`), ht(Nt(s));
}
function Wt(l, t, e = !1, s = !1, o = !1) {
  var i = l,
    a = '';
  ie(() => {
    var f = Te;
    if (a === (a = t() ?? '')) {
      q && Pe();
      return;
    }
    if ((f.nodes_start !== null && (gt(f.nodes_start, f.nodes_end), (f.nodes_start = f.nodes_end = null)), a !== '')) {
      if (q) {
        for (var y = ne.data, d = Pe(), m = d; d !== null && (d.nodeType !== 8 || d.data !== ''); )
          (m = d), (d = Je(d));
        if (d === null) throw (mt(), vt);
        o || xt(d.parentNode, y, a), Ae(ne, m), (i = pe(d));
        return;
      }
      var b = a + '';
      e ? (b = `<svg>${b}</svg>`) : s && (b = `<math>${b}</math>`);
      var r = je(b);
      if (((e || s) && (r = ue(r)), Ae(ue(r), r.lastChild), e || s)) for (; ue(r); ) i.before(ue(r));
      else i.before(r);
    }
  });
}
const $e = [
  ...` 	
\r\f \v\uFEFF`
];
function Dt(l, t, e) {
  var s = l == null ? '' : '' + l;
  if (e) {
    for (var o in e)
      if (e[o]) s = s ? s + ' ' + o : o;
      else if (s.length)
        for (var i = o.length, a = 0; (a = s.indexOf(o, a)) >= 0; ) {
          var f = a + i;
          (a === 0 || $e.includes(s[a - 1])) && (f === s.length || $e.includes(s[f]))
            ? (s = (a === 0 ? '' : s.substring(0, a)) + s.substring(f + 1))
            : (a = f);
        }
  }
  return s === '' ? null : s;
}
function le(l, t, e, s, o, i) {
  var a = l.__className;
  if (q || a !== e || a === void 0) {
    var f = Dt(e, s, i);
    (!q || f !== l.getAttribute('class')) && (f == null ? l.removeAttribute('class') : (l.className = f)),
      (l.__className = e);
  } else if (i && o !== i)
    for (var y in i) {
      var d = !!i[y];
      (o == null || d !== !!o[y]) && l.classList.toggle(y, d);
    }
  return i;
}
function C(l, ...t) {
  return (
    yt(() => {
      try {
        let e = !1;
        const s = [];
        for (const o of t) o && typeof o == 'object' && pt in o ? (s.push(kt(o, !0)), (e = !0)) : s.push(o);
        e && (bt(l), console.log('%c[snapshot]', 'color: grey', ...s));
      } catch {}
    }),
    t
  );
}
he[E] = 'src/lib/components/game/GameBoard.svelte';
var $t = J(V('<button><span> </span></button>'), he[E], [[34, 4, [[44, 6]]]]),
  Rt = J(V('<div class="game-board svelte-2620hu"></div>'), he[E], [[32, 0]]);
function he(l, t) {
  de(new.target), me(t, !1, he);
  let e = x(t, 'board', 8, '_________'),
    s = x(t, 'winningPositions', 8, null),
    o = x(t, 'disabled', 8, !1),
    i = x(t, 'currentPlayerSymbol', 8, null);
  const a = He();
  function f(r) {
    o() || u(e()[r], '_', !1) || a('cellClick', { position: r });
  }
  function y(r) {
    const h = e()[r];
    return u(h, '_') ? '' : h;
  }
  function d(r) {
    var h;
    return ((h = s()) == null ? void 0 : h.includes(r)) ?? !1;
  }
  function m(r) {
    return u(e()[r], '_', !1);
  }
  Ee();
  var b = Rt();
  return (
    Ot(
      b,
      4,
      () => Array(9),
      Gt,
      (r, h, g) => {
        var w = $t();
        let _;
        var v = A(w);
        let N;
        var W = A(v, !0);
        k(v),
          k(w),
          ie(
            (R, G, D, B) => {
              (_ = le(w, 1, 'cell svelte-2620hu', null, _, R)),
                (w.disabled = G),
                (N = le(v, 1, 'symbol svelte-2620hu', null, N, D)),
                oe(W, B);
            },
            [
              () => ({
                occupied: m(g),
                winning: d(g),
                disabled: o(),
                'hover-x': !o() && !m(g) && u(i(), 'X'),
                'hover-o': !o() && !m(g) && u(i(), 'O')
              }),
              () => o() || m(g),
              () => ({ x: u(y(g), 'X'), o: u(y(g), 'O') }),
              () => y(g)
            ],
            X
          ),
          _e('click', w, () => f(g)),
          $(r, w);
      }
    ),
    k(b),
    $(l, b),
    ve({ ...ge() })
  );
}
ae[E] = 'src/lib/components/game/GameStatus.svelte';
var Xt = J(V('<div> </div>'), ae[E], [[77, 4]]),
  Ut = J(V('<p class="help-text svelte-tzet23">Share your game link with a friend to start playing!</p>'), ae[E], [
    [83, 4]
  ]),
  Vt = J(
    V(
      '<div class="players svelte-tzet23"><div><span class="symbol x svelte-tzet23">X</span> <span class="name svelte-tzet23"> </span></div> <div class="vs svelte-tzet23">vs</div> <div><span class="symbol o svelte-tzet23">O</span> <span class="name svelte-tzet23"> </span></div></div>'
    ),
    ae[E],
    [
      [
        87,
        4,
        [
          [
            88,
            6,
            [
              [89, 8],
              [90, 8]
            ]
          ],
          [92, 6],
          [
            93,
            6,
            [
              [94, 8],
              [95, 8]
            ]
          ]
        ]
      ]
    ]
  ),
  Jt = J(V('<div><h2 class="status-message svelte-tzet23"> </h2> <!> <!> <!></div>'), ae[E], [[68, 0, [[74, 2]]]]);
function ae(l, t) {
  de(new.target), me(t, !1, ae);
  const e = z();
  let s = x(t, 'status', 8),
    o = x(t, 'currentPlayer', 8, null),
    i = x(t, 'player1Name', 8),
    a = x(t, 'player2Name', 8, null),
    f = x(t, 'isMyTurn', 8, !1),
    y = x(t, 'timeRemaining', 8, null);
  function d(P, O, H) {
    switch (P) {
      case 'PENDING':
        return 'Waiting for opponent...';
      case 'ACTIVE':
        return H ? `Your turn (${O})` : `Waiting for ${m()}'s move...`;
      case 'X_WIN':
        return `${r('X')} wins!`;
      case 'O_WIN':
        return `${r('O')} wins!`;
      case 'TIE':
        return "It's a tie!";
      case 'X_BY_RESIGN':
        return `${r('X')} wins - ${r('O')} resigned`;
      case 'O_BY_RESIGN':
        return `${r('O')} wins - ${r('X')} resigned`;
      case 'X_BY_TIMEOUT':
        return `${r('X')} wins - ${r('O')} timed out`;
      case 'O_BY_TIMEOUT':
        return `${r('O')} wins - ${r('X')} timed out`;
      default:
        return 'Unknown game state';
    }
  }
  function m() {
    return r(b(o()));
  }
  function b() {
    return u(o(), 'X') ? 'O' : 'X';
  }
  function r(P) {
    return P ? (u(P, 'X') ? i() : a() || 'Player 2') : 'Unknown';
  }
  function h() {
    return u(s(), 'ACTIVE') || u(s(), 'PENDING');
  }
  function g() {
    return !h();
  }
  be(
    () => (j(s()), j(o()), j(f())),
    () => {
      T(e, d(s(), o(), f()));
    }
  ),
    ke();
  var w = Jt();
  let _;
  var v = A(w),
    N = A(v, !0);
  k(v);
  var W = U(v, 2);
  {
    var R = P => {
      var O = Xt();
      let H;
      var re = A(O);
      k(O),
        ie(
          se => {
            (H = le(O, 1, 'timer svelte-tzet23', null, H, se)), oe(re, `Time remaining: ${y() ?? ''}s`);
          },
          [() => ({ warning: y() <= 10 })],
          X
        ),
        $(P, O);
    };
    ee(W, P => {
      u(s(), 'ACTIVE') && u(y(), null, !1) && P(R);
    });
  }
  var G = U(W, 2);
  {
    var D = P => {
      var O = Ut();
      $(P, O);
    };
    ee(G, P => {
      u(s(), 'PENDING') && P(D);
    });
  }
  var B = U(G, 2);
  {
    var F = P => {
      var O = Vt(),
        H = A(O);
      let re;
      var se = U(A(H), 2),
        c = A(se, !0);
      k(se), k(H);
      var I = U(H, 4);
      let S;
      var p = U(A(I), 2),
        M = A(p, !0);
      k(p),
        k(I),
        k(O),
        ie(
          (L, Q) => {
            (re = le(H, 1, 'player svelte-tzet23', null, re, L)),
              oe(c, i()),
              (S = le(I, 1, 'player svelte-tzet23', null, S, Q)),
              oe(M, a() || 'Waiting...');
          },
          [() => ({ active: u(o(), 'X') }), () => ({ active: u(o(), 'O') })],
          X
        ),
        $(P, O);
    };
    ee(B, P => {
      u(s(), 'ACTIVE') && P(F);
    });
  }
  return (
    k(w),
    ie(
      P => {
        (_ = le(w, 1, 'game-status svelte-tzet23', null, _, P)), oe(N, n(e));
      },
      [() => ({ pending: u(s(), 'PENDING'), active: u(s(), 'ACTIVE'), complete: g() })],
      X
    ),
    $(l, w),
    ve({ ...ge() })
  );
}
ce[E] = 'src/lib/components/game/GameControls.svelte';
var Ht = J(V('<button class="btn btn-primary svelte-1n7qm67"> </button>'), ce[E], [[34, 4]]),
  qt = J(V('<button class="btn btn-secondary svelte-1n7qm67">Quit Game</button>'), ce[E], [[40, 4]]),
  zt = J(V('<div class="game-controls svelte-1n7qm67"><!> <!></div>'), ce[E], [[32, 0]]);
function ce(l, t) {
  de(new.target), me(t, !1, ce);
  const e = z(),
    s = z();
  let o = x(t, 'gameStatus', 8),
    i = x(t, 'canQuit', 8, !1),
    a = x(t, 'isInGame', 8, !1);
  const f = He();
  function y() {
    f('newGame');
  }
  function d() {
    confirm('Are you sure you want to quit this game?') && f('quitGame');
  }
  function m() {
    return u(o(), 'PENDING', !1) && u(o(), 'ACTIVE', !1);
  }
  be(
    () => (j(a()), j(o())),
    () => {
      T(e, !a() || u(o(), 'PENDING') || m());
    }
  ),
    be(
      () => (j(i()), j(a())),
      () => {
        T(s, i() && a() && !m());
      }
    ),
    ke(),
    Ee();
  var b = zt(),
    r = A(b);
  {
    var h = _ => {
      var v = Ht(),
        N = A(v, !0);
      k(v), ie(() => oe(N, a() ? 'New Game' : 'Play')), _e('click', v, y), $(_, v);
    };
    ee(r, _ => {
      n(e) && _(h);
    });
  }
  var g = U(r, 2);
  {
    var w = _ => {
      var v = qt();
      _e('click', v, d), $(_, v);
    };
    ee(g, _ => {
      n(s) && _(w);
    });
  }
  return k(b), $(l, b), ve({ ...ge() });
}
we[E] = 'src/lib/components/game/PlayerHistory.svelte';
var Bt = J(
  V(
    '<div class="player-history svelte-3m1vbq"><h3 class="svelte-3m1vbq">Game History</h3> <div class="history-content svelte-3m1vbq"><!></div></div>'
  ),
  we[E],
  [
    [
      77,
      2,
      [
        [78, 4],
        [79, 4]
      ]
    ]
  ]
);
function we(l, t) {
  de(new.target), me(t, !1, we);
  const e = z();
  let s = x(t, 'history', 8, null),
    o = x(t, 'currentPlayerName', 8),
    i = x(t, 'opponentName', 8, null);
  function a(r, h) {
    if (u(r.totalEncounters, 0)) return `This is the first time you are playing against <strong>${i()}</strong>.`;
    let g = `You have played <strong>${i()}</strong> ${r.totalEncounters} times in the past.<br>`;
    const w = u(r.player1, h),
      _ = w ? r.player1AsX : r.player2AsX,
      v = w ? r.player2AsX : r.player1AsX;
    return (
      (g += f('X', _.totalWins, _.totalLosses, _.totalTies, _.wins, _.losses)),
      (g += f('O', v.totalWins, v.totalLosses, v.totalTies, v.wins, v.losses)),
      g
    );
  }
  function f(r, h, g, w, _, v) {
    const N = y(_),
      W = y(v);
    return `As player <strong>${r}</strong> you won ${h}${N}, lost ${g}${W}, and tied ${w}.<br>`;
  }
  function y(r) {
    if (u(r.byResignation + r.byTimeout, 0)) return '';
    let h = ' (';
    const g = [];
    return (
      r.byResignation && g.push(`${r.byResignation} by resignation`),
      r.byTimeout && g.push(`${r.byTimeout} by timeout`),
      (h += g.join(', ') + ')'),
      h
    );
  }
  be(
    () => (j(s()), j(o())),
    () => {
      T(e, s() ? a(s(), o()) : null);
    }
  ),
    ke();
  var d = Qe(),
    m = _t(d);
  {
    var b = r => {
      var h = Bt(),
        g = U(A(h), 2),
        w = A(g);
      Wt(w, () => n(e)), k(g), k(h), $(r, h);
    };
    ee(m, r => {
      n(e) && i() && r(b);
    });
  }
  return $(l, d), ve({ ...ge() });
}
class Lt {
  constructor(t = '') {
    Y(this, 'ws', null);
    Y(this, 'reconnectAttempts', 0);
    Y(this, 'maxReconnectAttempts', 5);
    Y(this, 'reconnectDelay', 1e3);
    Y(this, 'pingInterval', null);
    Y(this, 'isConnecting', !1);
    Y(this, 'currentGameId', null);
    Y(this, 'callbacks', {});
    (this.baseUrl = t),
      typeof window < 'u' &&
        document.addEventListener('visibilitychange', () => {
          document.visibilityState === 'visible' && !this.isConnected() && this.connect();
        });
  }
  async connect(t) {
    if (!(this.isConnecting || this.isConnected())) {
      t && (this.currentGameId = t), (this.isConnecting = !0);
      try {
        const e = this.getWebSocketUrl(this.currentGameId);
        console.log('Connecting to WebSocket:', e),
          (this.ws = new WebSocket(e)),
          (this.ws.onopen = () => {
            console.log('WebSocket connected for game:', this.currentGameId),
              (this.isConnecting = !1),
              (this.reconnectAttempts = 0),
              (this.reconnectDelay = 1e3),
              this.startPing();
          }),
          (this.ws.onmessage = s => {
            try {
              const o = JSON.parse(s.data);
              this.handleMessage(o);
            } catch (o) {
              console.error('Error parsing WebSocket message:', o);
            }
          }),
          (this.ws.onclose = s => {
            console.log('WebSocket closed:', s.code, s.reason),
              (this.isConnecting = !1),
              this.stopPing(),
              s.code !== 1011 && s.code !== 1012
                ? this.scheduleReconnect()
                : console.log('WebSocket service unavailable, not attempting reconnect');
          }),
          (this.ws.onerror = s => {
            console.error('WebSocket error:', s), (this.isConnecting = !1);
          });
      } catch (e) {
        console.error('Failed to create WebSocket connection:', e), (this.isConnecting = !1);
      }
    }
  }
  disconnect() {
    this.stopPing(), this.ws && (this.ws.close(1e3, 'Client disconnect'), (this.ws = null));
  }
  isConnected() {
    var t;
    return ((t = this.ws) == null ? void 0 : t.readyState) === WebSocket.OPEN;
  }
  async waitForConnection(t = 5e3) {
    if (this.isConnected()) return !0;
    !this.isConnecting && !this.ws && (await this.connect());
    const e = Date.now();
    for (; Date.now() - e < t; ) {
      if (this.isConnected()) return !0;
      await new Promise(s => setTimeout(s, 50));
    }
    return !1;
  }
  subscribeToGame(t, e) {
    this.connect(t).then(() => {
      this.isConnected() && this.send({ type: 'subscribe', gameId: t, playerId: e });
    });
  }
  unsubscribeFromGame(t) {
    this.isConnected() && this.send({ type: 'unsubscribe', gameId: t });
  }
  onGameUpdate(t) {
    this.callbacks.gameUpdate = t;
  }
  onPlayerJoined(t) {
    this.callbacks.playerJoined = t;
  }
  onError(t) {
    this.callbacks.error = t;
  }
  getWebSocketUrl(t) {
    if (typeof window > 'u') return '';
    let o = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//svelte-ttt-websocket.barrybecker4.workers.dev/websocket`;
    return t && (o += `?gameId=${encodeURIComponent(t)}`), console.log('WebSocket URL:', o), o;
  }
  send(t) {
    this.isConnected() ? this.ws.send(JSON.stringify(t)) : console.warn('Cannot send message: WebSocket not connected');
  }
  handleMessage(t) {
    switch ((console.log('Received WebSocket message:', t.type, t.gameId), t.type)) {
      case 'gameUpdate':
        this.callbacks.gameUpdate && this.callbacks.gameUpdate(t.data);
        break;
      case 'playerJoined':
        this.callbacks.playerJoined && this.callbacks.playerJoined(t.data);
        break;
      case 'subscribed':
        console.log('Successfully subscribed to game:', t.gameId);
        break;
      case 'pong':
        break;
      case 'error':
        console.error('WebSocket error message:', t.data),
          this.callbacks.error && this.callbacks.error(t.data.error || 'Unknown error');
        break;
      default:
        console.log('Unknown message type:', t.type);
    }
  }
  startPing() {
    this.stopPing(),
      (this.pingInterval = setInterval(() => {
        this.isConnected() && this.send({ type: 'ping' });
      }, 3e4));
  }
  stopPing() {
    this.pingInterval && (clearInterval(this.pingInterval), (this.pingInterval = null));
  }
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached, giving up on WebSocket');
      return;
    }
    this.reconnectAttempts++;
    const t = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${t}ms`),
      setTimeout(() => {
        this.connect();
      }, t);
  }
}
let Ne = null;
function Ft() {
  return Ne || (Ne = new Lt()), Ne;
}
ye[E] = 'src/routes/+page.svelte';
var Yt = J(
    V(
      '<div class="rounded-lg bg-white p-6 shadow-md"><div class="text-center"><h2 class="mb-4 text-xl font-semibold">Ready to Play?</h2> <button class="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">Play</button></div></div>'
    ),
    ye[E],
    [
      [
        442,
        2,
        [
          [
            443,
            4,
            [
              [444, 6],
              [445, 6]
            ]
          ]
        ]
      ]
    ]
  ),
  jt = J(V('<div class="space-y-4"><!> <!> <!></div>'), ye[E], [[454, 2]]),
  Qt = J(
    V(
      '<div class="container mx-auto max-w-lg p-4 svelte-9fja02"><h1 class="mb-6 text-center text-3xl font-bold">Online Tic-Tac-Toe</h1> <!> <!></div>'
    ),
    ye[E],
    [[438, 0, [[439, 2]]]]
  );
function ye(l, t) {
  de(new.target), me(t, !1, ye);
  let e = z(null),
    s = z(null),
    o = z(''),
    i = z(''),
    a = z(!1),
    f = z(null),
    y = null,
    d = null;
  wt(() => {
    T(o, localStorage.getItem('ttt-player-name') || ''),
      n(o) ||
        (T(o, prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1e3)}`),
        localStorage.setItem('ttt-player-name', n(o))),
      (d = Ft()),
      m();
  });
  function m() {
    d.onGameUpdate(c => {
      console.log(...C('log', '📩 Received game update:', c)), W(c);
    }),
      d.onPlayerJoined(c => {
        console.log(...C('log', '👋 Player joined notification received:', c)), R(c);
      }),
      d.onError(c => {
        console.error(...C('error', '❌ WebSocket error:', c)), alert(`Connection error: ${c}`);
      });
  }
  async function b() {
    try {
      console.log(...C('log', 'Creating game with playerName:', n(o)));
      const c = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: n(o) })
      });
      if (!c.ok) throw new Error(`Failed to create game: ${c.statusText}`);
      const I = await c.json();
      if (
        (console.log(...C('log', 'Game creation response:', I)),
        T(i, I.playerId),
        console.log(...C('log', 'Set playerId to:', n(i))),
        console.log(...C('log', 'Loading game state for gameId:', I.gameId)),
        await w(I.gameId),
        console.log(...C('log', 'Final gameState after loading:', n(e))),
        d && n(e))
      ) {
        console.log(...C('log', 'Attempting WebSocket connection for game:', n(e).gameId));
        try {
          await d.connect(n(e).gameId),
            await new Promise(S => setTimeout(S, 1e3)),
            d.isConnected()
              ? (console.log('✅ WebSocket connected successfully! Subscribing to updates...'),
                d.subscribeToGame(n(e).gameId, n(i)),
                h(n(e).gameId))
              : console.warn('❌ WebSocket connection failed');
        } catch (S) {
          console.error(...C('error', 'WebSocket connection error:', S));
        }
      }
    } catch (c) {
      console.error(...C('error', 'Error creating game:', c)), alert('Failed to create game. Please try again.');
    }
  }
  let r = null;
  function h(c) {
    r && clearInterval(r),
      console.log('🔄 Starting development polling for game state changes...'),
      (r = setInterval(async () => {
        try {
          n(e)
            ? (console.log('📡 Checking for game updates...'),
              await w(c),
              u(n(e).status, 'ACTIVE', !1) && u(n(e).status, 'PENDING', !1) && g())
            : g();
        } catch (I) {
          console.error(...C('error', 'Dev polling error:', I));
        }
      }, 1e3));
  }
  function g() {
    r && (clearInterval(r), (r = null), console.log('🛑 Stopped development polling'));
  }
  It(() => {
    d && (n(e) && d.unsubscribeFromGame(n(e).gameId), d.disconnect()), g(), D();
  });
  async function w(c) {
    var I;
    try {
      const S = await fetch(`/api/game/${c}`);
      if (!S.ok) throw new Error('Failed to load game');
      const p = await S.json();
      !n(i) && u(p.player1, n(o))
        ? (T(i, p.player1Id), console.log(...C('log', 'Set playerId to player1 ID:', n(i))))
        : !n(i) &&
          u(p.player2, n(o)) &&
          (T(i, p.player2Id), console.log(...C('log', 'Set playerId to player2 ID:', n(i))));
      const M = n(a),
        L = (I = n(e)) == null ? void 0 : I.board;
      T(e, {
        gameId: p.gameId,
        board: p.board,
        status: p.status,
        player1: { id: p.player1Id, symbol: 'X', name: p.player1 },
        player2: p.player2 ? { id: p.player2Id, symbol: 'O', name: p.player2 } : void 0,
        lastPlayer: p.lastPlayer || '',
        createdAt: Date.now(),
        lastMoveAt: p.lastMoveAt
      }),
        console.log(...C('log', 'Game state loaded:', n(e)));
      const Q = u(n(e).player1.id, n(i)) ? 'X' : 'O';
      u(p.status, 'PENDING')
        ? (T(a, !1), console.log('Game is PENDING - waiting for second player'))
        : (T(a, u(p.nextPlayer, Q) && u(p.status, 'ACTIVE')),
          console.log(...C('log', 'Turn setup - My symbol:', Q, 'Next player:', p.nextPlayer, 'Is my turn:', n(a))));
      const Ie = u(L, p.board, !1);
      (u(M, n(a), !1) || Ie) && (n(a) ? G() : D());
    } catch (S) {
      console.error(...C('error', 'Error loading game state:', S));
    }
  }
  async function _(c) {
    var S, p;
    if (!n(e) || !n(a) || u(n(e).status, 'ACTIVE', !1)) {
      console.log(
        ...C('log', 'Cannot make move - game state:', (S = n(e)) == null ? void 0 : S.status, 'isMyTurn:', n(a))
      );
      return;
    }
    if (u(n(e).board[c], '_', !1)) {
      console.log(...C('log', 'Position already taken:', c));
      return;
    }
    D();
    const I = n(a);
    T(a, !1);
    try {
      console.log(...C('log', 'Making move at position:', c));
      const M = await fetch(`/api/game/${n(e).gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: n(e).gameId, playerId: n(i), cellPosition: c })
      });
      if (!M.ok) {
        const Q = await M.text();
        throw new Error(`Failed to make move: ${Q}`);
      }
      const L = await M.json();
      console.log(...C('log', 'Move response:', L)), W(L);
    } catch (M) {
      console.error(...C('error', 'Error making move:', M)),
        T(a, I),
        n(a) && u((p = n(e)) == null ? void 0 : p.status, 'ACTIVE') && G();
    }
  }
  async function v() {
    if (n(e))
      try {
        (
          await fetch(`/api/game/${n(e).gameId}/quit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: n(i), reason: 'RESIGN' })
          })
        ).ok && D();
      } catch (c) {
        console.error(...C('error', 'Error quitting game:', c));
      }
  }
  async function N() {
    T(s, null);
  }
  function W(c) {
    if (!n(e) || !n(i)) return;
    console.log(...C('log', 'Updating game state from WebSocket:', c));
    const I = n(a),
      S = n(e).board;
    K(e, (n(e).board = c.board)),
      K(e, (n(e).status = c.status)),
      K(e, (n(e).lastPlayer = c.lastPlayer)),
      K(e, (n(e).lastMoveAt = c.lastMoveAt));
    const p = u(n(e).player1.id, n(i)) ? 'X' : 'O';
    u(c.status, 'PENDING')
      ? (T(a, !1), console.log('WebSocket update - Game still PENDING'))
      : (T(a, u(c.nextPlayer, p) && u(c.status, 'ACTIVE')),
        console.log(
          ...C('log', 'WebSocket turn update - My symbol:', p, 'Next player:', c.nextPlayer, 'Is my turn:', n(a))
        ));
    const M = u(S, c.board, !1);
    (u(I, n(a), !1) || M) && (n(a) ? G() : D()), u(c.status, 'ACTIVE', !1) && u(c.status, 'PENDING', !1) && N();
  }
  function R(c) {
    if (!n(e)) return;
    console.log(...C('log', 'Handling player joined:', c));
    const I = n(a);
    K(e, (n(e).status = c.status)),
      K(e, (n(e).player2 = c.player2 ? { id: c.player2Id, symbol: 'O', name: c.player2 } : void 0)),
      K(e, (n(e).lastPlayer = c.lastPlayer)),
      K(e, (n(e).lastMoveAt = c.lastMoveAt));
    const S = u(n(e).player1.id, n(i)) ? 'X' : 'O';
    T(a, u(c.nextPlayer, S) && u(c.status, 'ACTIVE')),
      console.log(
        ...C(
          'log',
          'Player joined - Game status:',
          c.status,
          'My symbol:',
          S,
          'Next player:',
          c.nextPlayer,
          'Is my turn:',
          n(a)
        )
      ),
      u(I, n(a), !1) && n(a) && G();
  }
  function G() {
    u(y, null, !1) ||
      (D(),
      T(f, 10),
      (y = setInterval(() => {
        u(n(f), null, !1) && (St(f, -1), n(f) <= 0 && (D(), v()));
      }, 1e3)));
  }
  function D() {
    y && (clearInterval(y), (y = null)), T(f, null);
  }
  function B() {
    return !n(e) || u(n(e).status, 'ACTIVE', !1) || !n(i) ? null : u(n(e).player1.id, n(i)) ? 'X' : 'O';
  }
  Ee();
  var F = Qt(),
    P = U(A(F), 2);
  {
    var O = c => {
        var I = Yt(),
          S = A(I),
          p = U(A(S), 2);
        k(S), k(I), _e('click', p, b), $(c, I);
      },
      H = c => {
        var I = jt(),
          S = A(I);
        const p = X(B),
          M = X(() => {
            var te;
            return ((te = n(e).player2) == null ? void 0 : te.name) || null;
          });
        ae(S, {
          get status() {
            return n(e).status;
          },
          get currentPlayer() {
            return n(p);
          },
          get player1Name() {
            return n(e).player1.name;
          },
          get player2Name() {
            return n(M);
          },
          get isMyTurn() {
            return n(a);
          },
          get timeRemaining() {
            return n(f);
          }
        });
        var L = U(S, 2);
        const Q = X(() => !n(a) || u(n(e).status, 'ACTIVE', !1)),
          Ie = X(B);
        he(L, {
          get board() {
            return n(e).board;
          },
          get disabled() {
            return n(Q);
          },
          get currentPlayerSymbol() {
            return n(Ie);
          },
          $$events: { cellClick: te => _(te.detail.position) }
        });
        var Ge = U(L, 2);
        const ze = X(() => {
            var te;
            return ((te = n(e)) == null ? void 0 : te.status) || 'PENDING';
          }),
          Be = X(() => n(e) && (u(n(e).status, 'ACTIVE') || u(n(e).status, 'PENDING'))),
          Le = X(() => u(n(e), null, !1));
        ce(Ge, {
          get gameStatus() {
            return n(ze);
          },
          get canQuit() {
            return n(Be);
          },
          get isInGame() {
            return n(Le);
          },
          $$events: {
            newGame: () => {
              T(e, null);
            },
            quitGame: v
          }
        }),
          k(I),
          $(c, I);
      };
    ee(P, c => {
      n(e) ? c(H, !1) : c(O);
    });
  }
  var re = U(P, 2);
  {
    var se = c => {
      const I = X(() => {
        var S, p, M;
        return u((S = n(e)) == null ? void 0 : S.player1.id, n(i))
          ? ((p = n(e).player2) == null ? void 0 : p.name) || null
          : (M = n(e)) == null
            ? void 0
            : M.player1.name;
      });
      we(c, {
        get gameHistory() {
          return n(s);
        },
        get currentPlayerName() {
          return n(o);
        },
        get opponentName() {
          return n(I);
        }
      });
    };
    ee(re, c => {
      n(s) && c(se);
    });
  }
  return k(F), $(l, F), ve({ ...ge() });
}
export { ye as component };
