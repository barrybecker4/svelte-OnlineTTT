import {
  b as G,
  h as O,
  B as H,
  E as Z,
  C as $,
  H as p,
  D as F,
  G as V,
  I as w,
  J as N,
  K as D,
  c as Y,
  L as q,
  U as y,
  e as z,
  M as J,
  N as K,
  O as Q,
  v as B,
  P as W,
  Q as X,
  q as b,
  R as j,
  S as k,
  T as x,
  V as ee,
  m as U,
  W as ae,
  X as re,
  Y as se,
  Z as ne,
  _ as te,
  $ as ie,
  a0 as fe
} from './B1kvZUbr.js';
function _e(a, r, [t, s] = [0, 0]) {
  O && t === 0 && H();
  var v = a,
    n = null,
    i = null,
    d = y,
    P = t > 0 ? Z : 0,
    u = !1;
  const T = (f, l = !0) => {
      (u = !0), o(l, f);
    },
    o = (f, l) => {
      if (d === (d = f)) return;
      let I = !1;
      if (O && s !== -1) {
        if (t === 0) {
          const _ = $(v);
          _ === p ? (s = 0) : _ === F ? (s = 1 / 0) : ((s = parseInt(_.substring(1))), s !== s && (s = d ? 1 / 0 : -1));
        }
        const E = s > t;
        !!d === E && ((v = V()), w(v), N(!1), (I = !0), (s = -1));
      }
      d
        ? (n ? D(n) : l && (n = Y(() => l(v))),
          i &&
            q(i, () => {
              i = null;
            }))
        : (i ? D(i) : l && (i = Y(() => l(v, [t + 1, s]))),
          n &&
            q(n, () => {
              n = null;
            })),
        I && N(!0);
    };
  G(() => {
    (u = !1), r(T), u || o(null, null);
  }, P),
    O && (v = z);
}
let R = !1;
function ue(a) {
  var r = R;
  try {
    return (R = !1), [a(), R];
  } finally {
    R = r;
  }
}
function C(a) {
  var r;
  return ((r = a.ctx) == null ? void 0 : r.d) ?? !1;
}
function ve(a, r, t, s) {
  var L;
  var v = (t & ie) !== 0,
    n = !ne || (t & te) !== 0,
    i = (t & ae) !== 0,
    d = (t & fe) !== 0,
    P = !1,
    u;
  i ? ([u, P] = ue(() => a[r])) : (u = a[r]);
  var T = re in a || se in a,
    o = (i && (((L = J(a, r)) == null ? void 0 : L.set) ?? (T && r in a && (e => (a[r] = e))))) || void 0,
    f = s,
    l = !0,
    I = !1,
    E = () => ((I = !0), l && ((l = !1), d ? (f = U(s)) : (f = s)), f);
  u === void 0 && s !== void 0 && (o && n && K(r), (u = E()), o && o(u));
  var _;
  if (n)
    _ = () => {
      var e = a[r];
      return e === void 0 ? E() : ((l = !0), (I = !1), e);
    };
  else {
    var h = (v ? B : W)(() => a[r]);
    (h.f |= Q),
      (_ = () => {
        var e = b(h);
        return e !== void 0 && (f = void 0), e === void 0 ? f : e;
      });
  }
  if ((t & X) === 0 && n) return _;
  if (o) {
    var M = a.$$legacy;
    return function (e, S) {
      return arguments.length > 0 ? ((!n || !S || M || P) && o(S ? _() : e), e) : _();
    };
  }
  var A = !1,
    m = ee(u),
    c = B(() => {
      var e = _(),
        S = b(m);
      return A ? ((A = !1), S) : (m.v = e);
    });
  return (
    i && b(c),
    v || (c.equals = j),
    function (e, S) {
      if (arguments.length > 0) {
        const g = S ? b(c) : n && i ? k(e) : e;
        if (!c.equals(g)) {
          if (((A = !0), x(m, g), I && f !== void 0 && (f = g), C(c))) return e;
          U(() => b(c));
        }
        return e;
      }
      return C(c) ? c.v : b(c);
    }
  );
}
export { _e as i, ve as p };
