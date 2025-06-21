import {
  h as y,
  H as k,
  D as B,
  a1 as H,
  a2 as b,
  a3 as E,
  a4 as I,
  a5 as N,
  a6 as P,
  a7 as W,
  a8 as j,
  a9 as q,
  aa as R,
  ab as $,
  ac as x,
  ad as L,
  J as T,
  I as D,
  B as z,
  e as p,
  ae as J,
  af as F,
  ag as G,
  ah as K,
  ai as Q,
  aj as U,
  ak as X,
  c as Z,
  p as aa,
  k as ra,
  a as ta
} from './B1kvZUbr.js';
import { d as ea } from './CneGN6np.js';
const ia = /\r/g;
function ha(a) {
  a = a.replace(ia, '');
  let r = 5381,
    e = a.length;
  for (; e--; ) r = ((r << 5) - r) ^ a.charCodeAt(e);
  return (r >>> 0).toString(36);
}
const na = ['touchstart', 'touchmove'];
function sa(a) {
  return na.includes(a);
}
function va(a) {
  return a == null ? void 0 : a.replace(/\//g, '/​');
}
function pa(a, r, e) {
  return (...n) => {
    const i = a(...n);
    var t = y ? i : i.nodeType === 11 ? i.firstChild : i;
    return C(t, r, e), i;
  };
}
function ua(a, r, e) {
  (a.__svelte_meta = { loc: { file: r, line: e[0], column: e[1] } }), e[2] && C(a.firstChild, r, e[2]);
}
function C(a, r, e) {
  for (var n = 0, i = 0; a && n < e.length; ) {
    if (y && a.nodeType === 8) {
      var t = a;
      t.data === k || t.data === B ? (i += 1) : t.data[0] === H && (i -= 1);
    }
    i === 0 && a.nodeType === 1 && ua(a, r, e[n++]), (a = a.nextSibling);
  }
}
function oa(a) {
  var r = I,
    e = N;
  b(null), E(null);
  try {
    return a();
  } finally {
    b(r), E(e);
  }
}
const fa = new Set(),
  O = new Set();
function ca(a, r, e, n = {}) {
  function i(t) {
    if ((n.capture || g.call(r, t), !t.cancelBubble)) return oa(() => (e == null ? void 0 : e.call(this, t)));
  }
  return (
    a.startsWith('pointer') || a.startsWith('touch') || a === 'wheel'
      ? q(() => {
          r.addEventListener(a, i, n);
        })
      : r.addEventListener(a, i, n),
    i
  );
}
function ga(a, r, e, n, i) {
  var t = { capture: n, passive: i },
    o = ca(a, r, e, t);
  (r === document.body || r === window || r === document || r instanceof HTMLMediaElement) &&
    j(() => {
      r.removeEventListener(a, o, t);
    });
}
function g(a) {
  var m;
  var r = this,
    e = r.ownerDocument,
    n = a.type,
    i = ((m = a.composedPath) == null ? void 0 : m.call(a)) || [],
    t = i[0] || a.target,
    o = 0,
    _ = a.__root;
  if (_) {
    var l = i.indexOf(_);
    if (l !== -1 && (r === document || r === window)) {
      a.__root = r;
      return;
    }
    var h = i.indexOf(r);
    if (h === -1) return;
    l <= h && (o = l);
  }
  if (((t = i[o] || a.target), t !== r)) {
    P(a, 'currentTarget', {
      configurable: !0,
      get() {
        return t || e;
      }
    });
    var S = I,
      f = N;
    b(null), E(null);
    try {
      for (var s, u = []; t !== null; ) {
        var c = t.assignedSlot || t.parentNode || t.host || null;
        try {
          var d = t['__' + n];
          if (d != null && (!t.disabled || a.target === t))
            if (W(d)) {
              var [V, ...Y] = d;
              V.apply(t, [a, ...Y]);
            } else d.call(t, a);
        } catch (w) {
          s ? u.push(w) : (s = w);
        }
        if (a.cancelBubble || c === r || c === null) break;
        t = c;
      }
      if (s) {
        for (let w of u)
          queueMicrotask(() => {
            throw w;
          });
        throw s;
      }
    } finally {
      (a.__root = r), delete a.currentTarget, b(S), E(f);
    }
  }
}
function ya(a, r) {
  var e = r == null ? '' : typeof r == 'object' ? r + '' : r;
  e !== (a.__t ?? (a.__t = a.nodeValue)) && ((a.__t = e), (a.nodeValue = e + ''));
}
function la(a, r) {
  return M(a, r);
}
function wa(a, r) {
  R(), (r.intro = r.intro ?? !1);
  const e = r.target,
    n = y,
    i = p;
  try {
    for (var t = $(e); t && (t.nodeType !== 8 || t.data !== k); ) t = x(t);
    if (!t) throw L;
    T(!0), D(t), z();
    const o = M(a, { ...r, anchor: t });
    if (p === null || p.nodeType !== 8 || p.data !== H) throw (J(), L);
    return T(!1), o;
  } catch (o) {
    if (o === L) return r.recover === !1 && F(), R(), G(e), T(!1), la(a, r);
    throw o;
  } finally {
    T(n), D(i);
  }
}
const v = new Map();
function M(a, { target: r, anchor: e, props: n = {}, events: i, context: t, intro: o = !0 }) {
  R();
  var _ = new Set(),
    l = f => {
      for (var s = 0; s < f.length; s++) {
        var u = f[s];
        if (!_.has(u)) {
          _.add(u);
          var c = sa(u);
          r.addEventListener(u, g, { passive: c });
          var d = v.get(u);
          d === void 0 ? (document.addEventListener(u, g, { passive: c }), v.set(u, 1)) : v.set(u, d + 1);
        }
      }
    };
  l(Q(fa)), O.add(l);
  var h = void 0,
    S = U(() => {
      var f = e ?? r.appendChild(X());
      return (
        Z(() => {
          if (t) {
            aa({});
            var s = ra;
            s.c = t;
          }
          i && (n.$$events = i), y && ea(f, null), (h = a(f, n) || {}), y && (N.nodes_end = p), t && ta();
        }),
        () => {
          var c;
          for (var s of _) {
            r.removeEventListener(s, g);
            var u = v.get(s);
            --u === 0 ? (document.removeEventListener(s, g), v.delete(s)) : v.set(s, u);
          }
          O.delete(l), f !== e && ((c = f.parentNode) == null || c.removeChild(f));
        }
      );
    });
  return A.set(h, S), h;
}
let A = new WeakMap();
function Ta(a, r) {
  const e = A.get(a);
  return e ? (A.delete(a), e(r)) : (K(), Promise.resolve());
}
export { pa as a, va as b, ha as c, ga as e, wa as h, la as m, ya as s, Ta as u };
