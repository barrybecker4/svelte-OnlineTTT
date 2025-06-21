var Qe = Array.isArray,
  Pt = Array.prototype.indexOf,
  Sn = Array.from,
  B = Object.defineProperty,
  K = Object.getOwnPropertyDescriptor,
  Ct = Object.getOwnPropertyDescriptors,
  Nt = Object.prototype,
  Ft = Array.prototype,
  et = Object.getPrototypeOf,
  Ge = Object.isExtensible;
const An = () => {};
function kn(e) {
  return e();
}
function tt(e) {
  for (var t = 0; t < e.length; t++) e[t]();
}
const k = 2,
  nt = 4,
  be = 8,
  Ce = 16,
  C = 32,
  X = 64,
  Ne = 128,
  x = 256,
  we = 512,
  m = 1024,
  I = 2048,
  D = 4096,
  W = 8192,
  Fe = 16384,
  rt = 32768,
  at = 65536,
  On = 1 << 17,
  it = 1 << 18,
  Mt = 1 << 19,
  st = 1 << 20,
  Oe = 1 << 21,
  L = Symbol('$state'),
  Rn = Symbol('legacy props'),
  lt = Symbol('proxy path');
function ot(e) {
  return e === this.v;
}
function jt(e, t) {
  return e != e ? t == t : e !== t || (e !== null && typeof e == 'object') || typeof e == 'function';
}
function ft(e) {
  return !jt(e, this.v);
}
function In(e, t) {
  {
    const n = new Error(`component_api_changed
Calling \`${e}\` on a component instance (of ${t}) is no longer valid in Svelte 5
https://svelte.dev/e/component_api_changed`);
    throw ((n.name = 'Svelte error'), n);
  }
}
function Dn(e, t) {
  {
    const n = new Error(`component_api_invalid_new
Attempted to instantiate ${e} with \`new ${t}\`, which is no longer valid in Svelte 5. If this component is not under your control, set the \`compatibility.componentApi\` compiler option to \`4\` to keep it working.
https://svelte.dev/e/component_api_invalid_new`);
    throw ((n.name = 'Svelte error'), n);
  }
}
function qt() {
  {
    const e = new Error(`derived_references_self
A derived value cannot reference itself recursively
https://svelte.dev/e/derived_references_self`);
    throw ((e.name = 'Svelte error'), e);
  }
}
function Lt(e) {
  {
    const t = new Error(`effect_in_teardown
\`${e}\` cannot be used inside an effect cleanup function
https://svelte.dev/e/effect_in_teardown`);
    throw ((t.name = 'Svelte error'), t);
  }
}
function Yt() {
  {
    const e = new Error(
      'effect_in_unowned_derived\nEffect cannot be created inside a `$derived` value that was not itself created inside an effect\nhttps://svelte.dev/e/effect_in_unowned_derived'
    );
    throw ((e.name = 'Svelte error'), e);
  }
}
function Bt(e) {
  {
    const t = new Error(`effect_orphan
\`${e}\` can only be used inside an effect (e.g. during component initialisation)
https://svelte.dev/e/effect_orphan`);
    throw ((t.name = 'Svelte error'), t);
  }
}
function Ht() {
  {
    const e = new Error(`effect_update_depth_exceeded
Maximum update depth exceeded. This can happen when a reactive block or effect repeatedly sets a new value. Svelte limits the number of nested updates to prevent infinite loops
https://svelte.dev/e/effect_update_depth_exceeded`);
    throw ((e.name = 'Svelte error'), e);
  }
}
function Pn() {
  {
    const e = new Error(`hydration_failed
Failed to hydrate the application
https://svelte.dev/e/hydration_failed`);
    throw ((e.name = 'Svelte error'), e);
  }
}
function Cn() {
  {
    const e = new Error(
      'invalid_snippet\nCould not `{@render}` snippet due to the expression being `null` or `undefined`. Consider using optional chaining `{@render snippet?.()}`\nhttps://svelte.dev/e/invalid_snippet'
    );
    throw ((e.name = 'Svelte error'), e);
  }
}
function Nn(e) {
  {
    const t = new Error(`props_invalid_value
Cannot do \`bind:${e}={undefined}\` when \`${e}\` has a fallback value
https://svelte.dev/e/props_invalid_value`);
    throw ((t.name = 'Svelte error'), t);
  }
}
function Ut(e) {
  {
    const t = new Error(`rune_outside_svelte
The \`${e}\` rune is only available inside \`.svelte\` and \`.svelte.js/ts\` files
https://svelte.dev/e/rune_outside_svelte`);
    throw ((t.name = 'Svelte error'), t);
  }
}
function Gt() {
  {
    const e = new Error(
      'state_descriptors_fixed\nProperty descriptors defined on `$state` objects must contain `value` and always be `enumerable`, `configurable` and `writable`.\nhttps://svelte.dev/e/state_descriptors_fixed'
    );
    throw ((e.name = 'Svelte error'), e);
  }
}
function Kt() {
  {
    const e = new Error(
      'state_prototype_fixed\nCannot set prototype of `$state` object\nhttps://svelte.dev/e/state_prototype_fixed'
    );
    throw ((e.name = 'Svelte error'), e);
  }
}
function Vt() {
  {
    const e = new Error(
      'state_unsafe_mutation\nUpdating state inside a derived or a template expression is forbidden. If the value should not be reactive, declare it without `$state`\nhttps://svelte.dev/e/state_unsafe_mutation'
    );
    throw ((e.name = 'Svelte error'), e);
  }
}
let ce = !1,
  Wt = !1;
function Fn() {
  ce = !0;
}
const Mn = 1,
  jn = 2,
  qn = 16,
  Ln = 1,
  Yn = 2,
  Bn = 4,
  Hn = 8,
  Un = 16,
  Gn = 1,
  Kn = 2,
  zt = '[',
  Zt = '[!',
  Xt = ']',
  Me = {},
  b = Symbol(),
  Jt = Symbol('filename');
function N(e, t) {
  return (e.label = t), ut(e.v, t), e;
}
function ut(e, t) {
  var n;
  return (n = e == null ? void 0 : e[lt]) == null || n.call(e, t), e;
}
function je(e) {
  {
    const t = new Error(`lifecycle_outside_component
\`${e}(...)\` can only be used during component initialisation
https://svelte.dev/e/lifecycle_outside_component`);
    throw ((t.name = 'Svelte error'), t);
  }
}
function Vn() {
  {
    const e = new Error(
      'snippet_without_render_tag\nAttempted to render a snippet without a `{@render}` block. This would cause the snippet code to be stringified instead of its content being rendered to the DOM. To fix this, change `{snippet}` to `{@render snippet()}`.\nhttps://svelte.dev/e/snippet_without_render_tag'
    );
    throw ((e.name = 'Svelte error'), e);
  }
}
let v = null;
function Ke(e) {
  v = e;
}
let _e = null;
function Ve(e) {
  _e = e;
}
function Wn(e, t = !1, n) {
  var r = (v = { p: v, c: null, d: !1, e: null, m: !1, s: e, x: null, l: null });
  ce && !t && (v.l = { s: null, u: null, r1: [], r2: Le(!1) }),
    an(() => {
      r.d = !0;
    }),
    (v.function = n),
    (_e = n);
}
function zn(e) {
  var l;
  const t = v;
  if (t !== null) {
    e !== void 0 && (t.x = e);
    const f = t.e;
    if (f !== null) {
      var n = h,
        r = d;
      t.e = null;
      try {
        for (var a = 0; a < f.length; a++) {
          var i = f[a];
          ye(i.effect), Z(i.reaction), mt(i.fn);
        }
      } finally {
        ye(n), Z(r);
      }
    }
    (v = t.p), (_e = ((l = t.p) == null ? void 0 : l.function) ?? null), (t.m = !0);
  }
  return e || {};
}
function Ee() {
  return !ce || (v !== null && v.l === null);
}
const Qt = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function ne(e) {
  if (typeof e != 'object' || e === null || L in e) return e;
  const t = et(e);
  if (t !== Nt && t !== Ft) return e;
  var n = new Map(),
    r = Qe(e),
    a = F(0),
    i = d,
    l = c => {
      var s = d;
      Z(i);
      var o = c();
      return Z(s), o;
    };
  r && n.set('length', F(e.length));
  var f = '';
  function p(c) {
    (f = c), N(a, `${f} version`);
    for (const [s, o] of n) N(o, q(f, s));
  }
  return new Proxy(e, {
    defineProperty(c, s, o) {
      return (
        (!('value' in o) || o.configurable === !1 || o.enumerable === !1 || o.writable === !1) && Gt(),
        l(() => {
          var u = n.get(s);
          u === void 0 ? ((u = F(o.value)), n.set(s, u), typeof s == 'string' && N(u, q(f, s))) : A(u, o.value, !0);
        }),
        !0
      );
    },
    deleteProperty(c, s) {
      var o = n.get(s);
      if (o === void 0) {
        if (s in c) {
          const w = l(() => F(b));
          n.set(s, w), Ae(a), N(w, q(f, s));
        }
      } else {
        if (r && typeof s == 'string') {
          var u = n.get('length'),
            _ = Number(s);
          Number.isInteger(_) && _ < u.v && A(u, _);
        }
        A(o, b), Ae(a);
      }
      return !0;
    },
    get(c, s, o) {
      var S;
      if (s === L) return e;
      if (s === lt) return p;
      var u = n.get(s),
        _ = s in c;
      if (
        (u === void 0 &&
          (!_ || ((S = K(c, s)) != null && S.writable)) &&
          ((u = l(() => {
            var O = ne(_ ? c[s] : b),
              de = F(O);
            return N(de, q(f, s)), de;
          })),
          n.set(s, u)),
        u !== void 0)
      ) {
        var w = j(u);
        return w === b ? void 0 : w;
      }
      return Reflect.get(c, s, o);
    },
    getOwnPropertyDescriptor(c, s) {
      var o = Reflect.getOwnPropertyDescriptor(c, s);
      if (o && 'value' in o) {
        var u = n.get(s);
        u && (o.value = j(u));
      } else if (o === void 0) {
        var _ = n.get(s),
          w = _ == null ? void 0 : _.v;
        if (_ !== void 0 && w !== b) return { enumerable: !0, configurable: !0, value: w, writable: !0 };
      }
      return o;
    },
    has(c, s) {
      var w;
      if (s === L) return !0;
      var o = n.get(s),
        u = (o !== void 0 && o.v !== b) || Reflect.has(c, s);
      if (o !== void 0 || (h !== null && (!u || ((w = K(c, s)) != null && w.writable)))) {
        o === void 0 &&
          ((o = l(() => {
            var S = u ? ne(c[s]) : b,
              O = F(S);
            return N(O, q(f, s)), O;
          })),
          n.set(s, o));
        var _ = j(o);
        if (_ === b) return !1;
      }
      return u;
    },
    set(c, s, o, u) {
      var He;
      var _ = n.get(s),
        w = s in c;
      if (r && s === 'length')
        for (var S = o; S < _.v; S += 1) {
          var O = n.get(S + '');
          O !== void 0 ? A(O, b) : S in c && ((O = l(() => F(b))), n.set(S + '', O), N(O, q(f, S)));
        }
      if (_ === void 0)
        (!w || ((He = K(c, s)) != null && He.writable)) &&
          ((_ = l(() => {
            var Ue = F(void 0);
            return A(Ue, ne(o)), Ue;
          })),
          n.set(s, _),
          N(_, q(f, s)));
      else {
        w = _.v !== b;
        var de = l(() => ne(o));
        A(_, de);
      }
      var pe = Reflect.getOwnPropertyDescriptor(c, s);
      if ((pe != null && pe.set && pe.set.call(u, o), !w)) {
        if (r && typeof s == 'string') {
          var Be = n.get('length'),
            Se = Number(s);
          Number.isInteger(Se) && Se >= Be.v && A(Be, Se + 1);
        }
        Ae(a);
      }
      return !0;
    },
    ownKeys(c) {
      j(a);
      var s = Reflect.ownKeys(c).filter(_ => {
        var w = n.get(_);
        return w === void 0 || w.v !== b;
      });
      for (var [o, u] of n) u.v !== b && !(o in c) && s.push(o);
      return s;
    },
    setPrototypeOf() {
      Kt();
    }
  });
}
function q(e, t) {
  return typeof t == 'symbol'
    ? `${e}[Symbol(${t.description ?? ''})]`
    : Qt.test(t)
      ? `${e}.${t}`
      : /^\d+$/.test(t)
        ? `${e}[${t}]`
        : `${e}['${t}']`;
}
function Ae(e, t = 1) {
  A(e, e.v + t);
}
function re(e) {
  try {
    if (e !== null && typeof e == 'object' && L in e) return e[L];
  } catch {}
  return e;
}
function qe(e) {
  var t = k | I,
    n = d !== null && (d.f & k) !== 0 ? d : null;
  return (
    h === null || (n !== null && (n.f & x) !== 0) ? (t |= x) : (h.f |= st),
    {
      ctx: v,
      deps: null,
      effects: null,
      equals: ot,
      f: t,
      fn: e,
      reactions: null,
      rv: 0,
      v: null,
      wv: 0,
      parent: n ?? h
    }
  );
}
function Zn(e) {
  const t = qe(e);
  return At(t), t;
}
function Xn(e) {
  const t = qe(e);
  return (t.equals = ft), t;
}
function ct(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1) H(t[n]);
  }
}
let ke = [];
function en(e) {
  for (var t = e.parent; t !== null; ) {
    if ((t.f & k) === 0) return t;
    t = t.parent;
  }
  return null;
}
function _t(e) {
  var t,
    n = h;
  ye(en(e));
  {
    let r = V;
    We(new Set());
    try {
      ke.includes(e) && qt(), ke.push(e), ct(e), (t = It(e));
    } finally {
      ye(n), We(r), ke.pop();
    }
  }
  return t;
}
function vt(e) {
  var t = _t(e);
  if ((e.equals(t) || ((e.v = t), (e.wv = Ot())), !ee)) {
    var n = (M || (e.f & x) !== 0) && e.deps !== null ? D : m;
    T(e, n);
  }
}
let V = new Set();
const ie = new Map();
function We(e) {
  V = e;
}
function Le(e, t) {
  var n = { f: 0, v: e, reactions: null, equals: ot, rv: 0, wv: 0 };
  return n;
}
function F(e, t) {
  const n = Le(e);
  return At(n), n;
}
function Jn(e, t = !1, n = !0) {
  var a;
  const r = Le(e);
  return t || (r.equals = ft), ce && n && v !== null && v.l !== null && ((a = v.l).s ?? (a.s = [])).push(r), r;
}
function Qn(e, t) {
  return (
    A(
      e,
      $e(() => j(e))
    ),
    t
  );
}
function A(e, t, n = !1) {
  d !== null && !R && Ee() && (d.f & (k | Ce)) !== 0 && !(g != null && g.includes(e)) && Vt();
  let r = n ? ne(t) : t;
  return ut(r, e.label), tn(e, r);
}
function tn(e, t) {
  if (!e.equals(t)) {
    var n = e.v;
    if (
      (ee ? ie.set(e, t) : ie.set(e, n),
      (e.v = t),
      (e.f & k) !== 0 && ((e.f & I) !== 0 && _t(e), T(e, (e.f & x) === 0 ? m : D)),
      (e.wv = Ot()),
      dt(e, I),
      Ee() && h !== null && (h.f & m) !== 0 && (h.f & (C | X)) === 0 && ($ === null ? hn([e]) : $.push(e)),
      V.size > 0)
    ) {
      const r = Array.from(V);
      for (const a of r) (a.f & m) !== 0 && T(a, D), te(a) && ve(a);
      V.clear();
    }
  }
  return t;
}
function er(e, t = 1) {
  var n = j(e),
    r = t === 1 ? n++ : n--;
  return A(e, n), r;
}
function dt(e, t) {
  var n = e.reactions;
  if (n !== null)
    for (var r = Ee(), a = n.length, i = 0; i < a; i++) {
      var l = n[i],
        f = l.f;
      if ((f & I) === 0 && !(!r && l === h)) {
        if ((f & it) !== 0) {
          V.add(l);
          continue;
        }
        T(l, t), (f & (m | x)) !== 0 && ((f & k) !== 0 ? dt(l, D) : Te(l));
      }
    }
}
var U = 'font-weight: bold',
  G = 'font-weight: normal';
function tr(e) {
  console.warn(
    `%c[svelte] console_log_state
%cYour \`console.${e}\` contained \`$state\` proxies. Consider using \`$inspect(...)\` or \`$state.snapshot(...)\` instead
https://svelte.dev/e/console_log_state`,
    U,
    G
  );
}
function nr(e) {
  console.warn(
    `%c[svelte] hydration_html_changed
%c${e ? `The value of an \`{@html ...}\` block ${e} changed between server and client renders. The client value will be ignored in favour of the server value` : 'The value of an `{@html ...}` block changed between server and client renders. The client value will be ignored in favour of the server value'}
https://svelte.dev/e/hydration_html_changed`,
    U,
    G
  );
}
function Ye(e) {
  console.warn(
    `%c[svelte] hydration_mismatch
%cHydration failed because the initial UI does not match what was rendered on the server
https://svelte.dev/e/hydration_mismatch`,
    U,
    G
  );
}
function rr() {
  console.warn(
    `%c[svelte] lifecycle_double_unmount
%cTried to unmount a component that was not mounted
https://svelte.dev/e/lifecycle_double_unmount`,
    U,
    G
  );
}
function ar(e, t, n, r) {
  console.warn(
    `%c[svelte] ownership_invalid_binding
%c${e} passed property \`${t}\` to ${n} with \`bind:\`, but its parent component ${r} did not declare \`${t}\` as a binding. Consider creating a binding between ${r} and ${e} (e.g. \`bind:${t}={...}\` instead of \`${t}={...}\`)
https://svelte.dev/e/ownership_invalid_binding`,
    U,
    G
  );
}
function ir(e, t, n, r) {
  console.warn(
    `%c[svelte] ownership_invalid_mutation
%cMutating unbound props (\`${e}\`, at ${t}) is strongly discouraged. Consider using \`bind:${n}={...}\` in ${r} (or using a callback) instead
https://svelte.dev/e/ownership_invalid_mutation`,
    U,
    G
  );
}
function he(e) {
  console.warn(
    `%c[svelte] state_proxy_equality_mismatch
%cReactive \`$state(...)\` proxies and the values they proxy have different identities. Because of this, comparisons with \`${e}\` will produce unexpected results
https://svelte.dev/e/state_proxy_equality_mismatch`,
    U,
    G
  );
}
let z = !1;
function sr(e) {
  z = e;
}
let P;
function se(e) {
  if (e === null) throw (Ye(), Me);
  return (P = e);
}
function lr() {
  return se(J(P));
}
function or(e) {
  if (z) {
    if (J(P) !== null) throw (Ye(), Me);
    P = e;
  }
}
function fr() {
  for (var e = 0, t = P; ; ) {
    if (t.nodeType === 8) {
      var n = t.data;
      if (n === Xt) {
        if (e === 0) return t;
        e -= 1;
      } else (n === zt || n === Zt) && (e += 1);
    }
    var r = J(t);
    t.remove(), (t = r);
  }
}
function ur(e) {
  if (!e || e.nodeType !== 8) throw (Ye(), Me);
  return e.data;
}
function nn() {
  const e = Array.prototype,
    t = Array.__svelte_cleanup;
  t && t();
  const { indexOf: n, lastIndexOf: r, includes: a } = e;
  (e.indexOf = function (i, l) {
    const f = n.call(this, i, l);
    if (f === -1) {
      for (let p = l ?? 0; p < this.length; p += 1)
        if (re(this[p]) === i) {
          he('array.indexOf(...)');
          break;
        }
    }
    return f;
  }),
    (e.lastIndexOf = function (i, l) {
      const f = r.call(this, i, l ?? this.length - 1);
      if (f === -1) {
        for (let p = 0; p <= (l ?? this.length - 1); p += 1)
          if (re(this[p]) === i) {
            he('array.lastIndexOf(...)');
            break;
          }
      }
      return f;
    }),
    (e.includes = function (i, l) {
      const f = a.call(this, i, l);
      if (!f) {
        for (let p = 0; p < this.length; p += 1)
          if (re(this[p]) === i) {
            he('array.includes(...)');
            break;
          }
      }
      return f;
    }),
    (Array.__svelte_cleanup = () => {
      (e.indexOf = n), (e.lastIndexOf = r), (e.includes = a);
    });
}
function cr(e, t, n = !0) {
  try {
    (e === t) != (re(e) === re(t)) && he(n ? '===' : '!==');
  } catch {}
  return (e === t) === n;
}
var ze, pt, ht, wt;
function _r() {
  if (ze === void 0) {
    (ze = window), (pt = /Firefox/.test(navigator.userAgent));
    var e = Element.prototype,
      t = Node.prototype,
      n = Text.prototype;
    (ht = K(t, 'firstChild').get),
      (wt = K(t, 'nextSibling').get),
      Ge(e) &&
        ((e.__click = void 0),
        (e.__className = void 0),
        (e.__attributes = null),
        (e.__style = void 0),
        (e.__e = void 0)),
      Ge(n) && (n.__t = void 0),
      (e.__svelte_meta = null),
      nn();
  }
}
function Re(e = '') {
  return document.createTextNode(e);
}
function Ie(e) {
  return ht.call(e);
}
function J(e) {
  return wt.call(e);
}
function vr(e, t) {
  if (!z) return Ie(e);
  var n = Ie(P);
  if (n === null) n = P.appendChild(Re());
  else if (t && n.nodeType !== 3) {
    var r = Re();
    return n == null || n.before(r), se(r), r;
  }
  return se(n), n;
}
function dr(e, t) {
  if (!z) {
    var n = Ie(e);
    return n instanceof Comment && n.data === '' ? J(n) : n;
  }
  return P;
}
function pr(e, t = 1, n = !1) {
  let r = z ? P : e;
  for (var a; t--; ) (a = r), (r = J(r));
  if (!z) return r;
  var i = r == null ? void 0 : r.nodeType;
  if (n && i !== 3) {
    var l = Re();
    return r === null ? a == null || a.after(l) : r.before(l), se(l), l;
  }
  return se(r), r;
}
function hr(e) {
  e.textContent = '';
}
function yt(e) {
  h === null && d === null && Bt(e), d !== null && (d.f & x) !== 0 && h === null && Yt(), ee && Lt(e);
}
function rn(e, t) {
  var n = t.last;
  n === null ? (t.last = t.first = e) : ((n.next = e), (e.prev = n), (t.last = e));
}
function Q(e, t, n, r = !0) {
  for (var a = h; a !== null && (a.f & it) !== 0; ) a = a.parent;
  var i = {
    ctx: v,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: e | I,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: a,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0
  };
  if (((i.component_function = _e), n))
    try {
      ve(i), (i.f |= rt);
    } catch (p) {
      throw (H(i), p);
    }
  else t !== null && Te(i);
  var l =
    n &&
    i.deps === null &&
    i.first === null &&
    i.nodes_start === null &&
    i.teardown === null &&
    (i.f & (st | Ne)) === 0;
  if (!l && r && (a !== null && rn(i, a), d !== null && (d.f & k) !== 0)) {
    var f = d;
    (f.effects ?? (f.effects = [])).push(i);
  }
  return i;
}
function an(e) {
  const t = Q(be, null, !1);
  return T(t, m), (t.teardown = e), t;
}
function sn(e) {
  yt('$effect');
  var t = h !== null && (h.f & C) !== 0 && v !== null && !v.m;
  if ((B(e, 'name', { value: '$effect' }), t)) {
    var n = v;
    (n.e ?? (n.e = [])).push({ fn: e, effect: h, reaction: d });
  } else {
    var r = mt(e);
    return r;
  }
}
function wr(e) {
  return yt('$effect.pre'), B(e, 'name', { value: '$effect.pre' }), xe(e);
}
function yr(e) {
  const t = Q(X, e, !0);
  return (n = {}) =>
    new Promise(r => {
      n.outro
        ? un(t, () => {
            H(t), r(void 0);
          })
        : (H(t), r(void 0));
    });
}
function mt(e) {
  return Q(nt, e, !1);
}
function mr(e, t) {
  var n = v,
    r = { effect: null, ran: !1 };
  n.l.r1.push(r),
    (r.effect = xe(() => {
      e(), !r.ran && ((r.ran = !0), A(n.l.r2, !0), $e(t));
    }));
}
function gr() {
  var e = v;
  xe(() => {
    if (j(e.l.r2)) {
      for (var t of e.l.r1) {
        var n = t.effect;
        (n.f & m) !== 0 && T(n, D), te(n) && ve(n), (t.ran = !1);
      }
      e.l.r2.v = !1;
    }
  });
}
function xe(e) {
  return Q(be, e, !0);
}
function br(e, t = [], n = qe) {
  return xe(() => {
    var r = h,
      a = () => e(...i.map(j));
    B(r.fn, 'name', { value: '{expression}' }), B(a, 'name', { value: '{expression}' });
    const i = t.map(n);
    ln(a);
  });
}
function ln(e, t = 0) {
  return Q(be | Ce | t, e, !0);
}
function Er(e, t = !0) {
  return Q(be | C, e, !0, t);
}
function gt(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = ee,
      r = d;
    Xe(!0), Z(null);
    try {
      t.call(null);
    } finally {
      Xe(n), Z(r);
    }
  }
}
function bt(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    var r = n.next;
    (n.f & X) !== 0 ? (n.parent = null) : H(n, t), (n = r);
  }
}
function on(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & C) === 0 && H(t), (t = n);
  }
}
function H(e, t = !0) {
  var n = !1;
  (t || (e.f & Mt) !== 0) &&
    e.nodes_start !== null &&
    e.nodes_end !== null &&
    (fn(e.nodes_start, e.nodes_end), (n = !0)),
    bt(e, t && !n),
    ge(e, 0),
    T(e, Fe);
  var r = e.transitions;
  if (r !== null) for (const i of r) i.stop();
  gt(e);
  var a = e.parent;
  a !== null && a.first !== null && Et(e),
    (e.component_function = null),
    (e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes_start = e.nodes_end = null);
}
function fn(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : J(e);
    e.remove(), (e = n);
  }
}
function Et(e) {
  var t = e.parent,
    n = e.prev,
    r = e.next;
  n !== null && (n.next = r),
    r !== null && (r.prev = n),
    t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function un(e, t) {
  var n = [];
  xt(e, n, !0),
    cn(n, () => {
      H(e), t && t();
    });
}
function cn(e, t) {
  var n = e.length;
  if (n > 0) {
    var r = () => --n || t();
    for (var a of e) a.out(r);
  } else t();
}
function xt(e, t, n) {
  if ((e.f & W) === 0) {
    if (((e.f ^= W), e.transitions !== null)) for (const l of e.transitions) (l.is_global || n) && t.push(l);
    for (var r = e.first; r !== null; ) {
      var a = r.next,
        i = (r.f & at) !== 0 || (r.f & C) !== 0;
      xt(r, t, i ? n : !1), (r = a);
    }
  }
}
function xr(e) {
  Tt(e, !0);
}
function Tt(e, t) {
  if ((e.f & W) !== 0) {
    (e.f ^= W), (e.f & m) !== 0 && (T(e, I), Te(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next,
        a = (n.f & at) !== 0 || (n.f & C) !== 0;
      Tt(n, a ? t : !1), (n = r);
    }
    if (e.transitions !== null) for (const i of e.transitions) (i.is_global || t) && i.in();
  }
}
let le = [],
  De = [];
function $t() {
  var e = le;
  (le = []), tt(e);
}
function _n() {
  var e = De;
  (De = []), tt(e);
}
function Tr(e) {
  le.length === 0 && queueMicrotask($t), le.push(e);
}
function vn() {
  le.length > 0 && $t(), De.length > 0 && _n();
}
function dn(e) {
  var t = h;
  if ((e instanceof Error && pn(e, t), (t.f & rt) === 0)) {
    if ((t.f & Ne) === 0) throw e;
    t.fn(e);
  } else St(e, t);
}
function St(e, t) {
  for (; t !== null; ) {
    if ((t.f & Ne) !== 0)
      try {
        t.fn(e);
        return;
      } catch {}
    t = t.parent;
  }
  throw e;
}
const Ze = new WeakSet();
function pn(e, t) {
  var l, f;
  if (Ze.has(e)) return;
  Ze.add(e);
  const n = K(e, 'message');
  if (!(n && !n.configurable)) {
    for (
      var r = pt ? '  ' : '	',
        a = `
${r}in ${((l = t.fn) == null ? void 0 : l.name) || '<unknown>'}`,
        i = t.ctx;
      i !== null;

    )
      (a += `
${r}in ${(f = i.function) == null ? void 0 : f[Jt].split('/').pop()}`),
        (i = i.p);
    B(e, 'message', {
      value:
        e.message +
        `
${a}
`
    }),
      e.stack &&
        B(e, 'stack', {
          value: e.stack
            .split(
              `
`
            )
            .filter(p => !p.includes('svelte/src/internal')).join(`
`)
        });
  }
}
let oe = !1,
  fe = null,
  Y = !1,
  ee = !1;
function Xe(e) {
  ee = e;
}
let ae = [],
  ue = [],
  d = null,
  R = !1;
function Z(e) {
  d = e;
}
let h = null;
function ye(e) {
  h = e;
}
let g = null;
function At(e) {
  d !== null && d.f & Oe && (g === null ? (g = [e]) : g.push(e));
}
let y = null,
  E = 0,
  $ = null;
function hn(e) {
  $ = e;
}
let kt = 1,
  me = 0,
  M = !1;
function Ot() {
  return ++kt;
}
function te(e) {
  var o;
  var t = e.f;
  if ((t & I) !== 0) return !0;
  if ((t & D) !== 0) {
    var n = e.deps,
      r = (t & x) !== 0;
    if (n !== null) {
      var a,
        i,
        l = (t & we) !== 0,
        f = r && h !== null && !M,
        p = n.length;
      if (l || f) {
        var c = e,
          s = c.parent;
        for (a = 0; a < p; a++)
          (i = n[a]),
            (l || !((o = i == null ? void 0 : i.reactions) != null && o.includes(c))) &&
              (i.reactions ?? (i.reactions = [])).push(c);
        l && (c.f ^= we), f && s !== null && (s.f & x) === 0 && (c.f ^= x);
      }
      for (a = 0; a < p; a++) if (((i = n[a]), te(i) && vt(i), i.wv > e.wv)) return !0;
    }
    (!r || (h !== null && !M)) && T(e, m);
  }
  return !1;
}
function Rt(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null)
    for (var a = 0; a < r.length; a++) {
      var i = r[a];
      (g != null && g.includes(e)) ||
        ((i.f & k) !== 0 ? Rt(i, t, !1) : t === i && (n ? T(i, I) : (i.f & m) !== 0 && T(i, D), Te(i)));
    }
}
function It(e) {
  var _;
  var t = y,
    n = E,
    r = $,
    a = d,
    i = M,
    l = g,
    f = v,
    p = R,
    c = e.f;
  (y = null),
    (E = 0),
    ($ = null),
    (M = (c & x) !== 0 && (R || !Y || d === null)),
    (d = (c & (C | X)) === 0 ? e : null),
    (g = null),
    Ke(e.ctx),
    (R = !1),
    me++,
    (e.f |= Oe);
  try {
    var s = (0, e.fn)(),
      o = e.deps;
    if (y !== null) {
      var u;
      if ((ge(e, E), o !== null && E > 0)) for (o.length = E + y.length, u = 0; u < y.length; u++) o[E + u] = y[u];
      else e.deps = o = y;
      if (!M) for (u = E; u < o.length; u++) ((_ = o[u]).reactions ?? (_.reactions = [])).push(e);
    } else o !== null && E < o.length && (ge(e, E), (o.length = E));
    if (Ee() && $ !== null && !R && o !== null && (e.f & (k | D | I)) === 0) for (u = 0; u < $.length; u++) Rt($[u], e);
    return a !== null && a !== e && (me++, $ !== null && (r === null ? (r = $) : r.push(...$))), s;
  } catch (w) {
    dn(w);
  } finally {
    (y = t), (E = n), ($ = r), (d = a), (M = i), (g = l), Ke(f), (R = p), (e.f ^= Oe);
  }
}
function wn(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = Pt.call(n, e);
    if (r !== -1) {
      var a = n.length - 1;
      a === 0 ? (n = t.reactions = null) : ((n[r] = n[a]), n.pop());
    }
  }
  n === null &&
    (t.f & k) !== 0 &&
    (y === null || !y.includes(t)) &&
    (T(t, D), (t.f & (x | we)) === 0 && (t.f ^= we), ct(t), ge(t, 0));
}
function ge(e, t) {
  var n = e.deps;
  if (n !== null) for (var r = t; r < n.length; r++) wn(e, n[r]);
}
function ve(e) {
  var t = e.f;
  if ((t & Fe) === 0) {
    T(e, m);
    var n = h,
      r = Y;
    (h = e), (Y = !0);
    {
      var a = _e;
      Ve(e.component_function);
    }
    try {
      (t & Ce) !== 0 ? on(e) : bt(e), gt(e);
      var i = It(e);
      (e.teardown = typeof i == 'function' ? i : null), (e.wv = kt);
      var l;
      Wt && (e.f & I) !== 0 && e.deps, ue.push(e);
    } finally {
      (Y = r), (h = n), Ve(a);
    }
  }
}
function Je() {
  console.error(
    'Last ten effects were: ',
    ue.slice(-10).map(e => e.fn)
  ),
    (ue = []);
}
function yn() {
  try {
    Ht();
  } catch (e) {
    if ((B(e, 'stack', { value: '' }), fe !== null))
      try {
        St(e, fe);
      } catch (t) {
        throw (Je(), t);
      }
    else throw (Je(), e);
  }
}
function Dt() {
  var e = Y;
  try {
    var t = 0;
    for (Y = !0; ae.length > 0; ) {
      t++ > 1e3 && yn();
      var n = ae,
        r = n.length;
      ae = [];
      for (var a = 0; a < r; a++) {
        var i = gn(n[a]);
        mn(i);
      }
      ie.clear();
    }
  } finally {
    (oe = !1), (Y = e), (fe = null), (ue = []);
  }
}
function mn(e) {
  var t = e.length;
  if (t !== 0)
    for (var n = 0; n < t; n++) {
      var r = e[n];
      (r.f & (Fe | W)) === 0 &&
        te(r) &&
        (ve(r),
        r.deps === null && r.first === null && r.nodes_start === null && (r.teardown === null ? Et(r) : (r.fn = null)));
    }
}
function Te(e) {
  oe || ((oe = !0), queueMicrotask(Dt));
  for (var t = (fe = e); t.parent !== null; ) {
    t = t.parent;
    var n = t.f;
    if ((n & (X | C)) !== 0) {
      if ((n & m) === 0) return;
      t.f ^= m;
    }
  }
  ae.push(t);
}
function gn(e) {
  for (var t = [], n = e; n !== null; ) {
    var r = n.f,
      a = (r & (C | X)) !== 0,
      i = a && (r & m) !== 0;
    if (!i && (r & W) === 0) {
      (r & nt) !== 0 ? t.push(n) : a ? (n.f ^= m) : te(n) && ve(n);
      var l = n.first;
      if (l !== null) {
        n = l;
        continue;
      }
    }
    var f = n.parent;
    for (n = n.next; n === null && f !== null; ) (n = f.next), (f = f.parent);
  }
  return t;
}
function bn(e) {
  for (var t; ; ) {
    if ((vn(), ae.length === 0)) return (oe = !1), (fe = null), (ue = []), t;
    (oe = !0), Dt();
  }
}
async function $r() {
  await Promise.resolve(), bn();
}
function j(e) {
  var t = e.f,
    n = (t & k) !== 0;
  if (d !== null && !R) {
    if (!(g != null && g.includes(e))) {
      var r = d.deps;
      e.rv < me &&
        ((e.rv = me),
        y === null && r !== null && r[E] === e ? E++ : y === null ? (y = [e]) : (!M || !y.includes(e)) && y.push(e));
    }
  } else if (n && e.deps === null && e.effects === null) {
    var a = e,
      i = a.parent;
    i !== null && (i.f & x) === 0 && (a.f ^= x);
  }
  return n && ((a = e), te(a) && vt(a)), ee && ie.has(e) ? ie.get(e) : e.v;
}
function $e(e) {
  var t = R;
  try {
    return (R = !0), e();
  } finally {
    R = t;
  }
}
const En = -7169;
function T(e, t) {
  e.f = (e.f & En) | t;
}
function Sr(e) {
  if (!(typeof e != 'object' || !e || e instanceof EventTarget)) {
    if (L in e) Pe(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        const n = e[t];
        typeof n == 'object' && n && L in n && Pe(n);
      }
  }
}
function Pe(e, t = new Set()) {
  if (typeof e == 'object' && e !== null && !(e instanceof EventTarget) && !t.has(e)) {
    t.add(e), e instanceof Date && e.getTime();
    for (let r in e)
      try {
        Pe(e[r], t);
      } catch {}
    const n = et(e);
    if (
      n !== Object.prototype &&
      n !== Array.prototype &&
      n !== Map.prototype &&
      n !== Set.prototype &&
      n !== Date.prototype
    ) {
      const r = Ct(n);
      for (let a in r) {
        const i = r[a].get;
        if (i)
          try {
            i.call(e);
          } catch {}
      }
    }
  }
}
{
  let e = function (t) {
    if (!(t in globalThis)) {
      let n;
      Object.defineProperty(globalThis, t, {
        configurable: !0,
        get: () => {
          if (n !== void 0) return n;
          Ut(t);
        },
        set: r => {
          n = r;
        }
      });
    }
  };
  e('$state'), e('$effect'), e('$derived'), e('$inspect'), e('$props'), e('$bindable');
}
function xn(e) {
  v === null && je('onMount'),
    ce && v.l !== null
      ? $n(v).m.push(e)
      : sn(() => {
          const t = $e(e);
          if (typeof t == 'function') return t;
        });
}
function Ar(e) {
  v === null && je('onDestroy'), xn(() => () => $e(e));
}
function Tn(e, t, { bubbles: n = !1, cancelable: r = !1 } = {}) {
  return new CustomEvent(e, { detail: t, bubbles: n, cancelable: r });
}
function kr() {
  const e = v;
  return (
    e === null && je('createEventDispatcher'),
    (t, n, r) => {
      var i;
      const a = (i = e.s.$$events) == null ? void 0 : i[t];
      if (a) {
        const l = Qe(a) ? a.slice() : [a],
          f = Tn(t, n, r);
        for (const p of l) p.call(e.x, f);
        return !f.defaultPrevented;
      }
      return !0;
    }
  );
}
function $n(e) {
  var t = e.l;
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
export {
  Ln as $,
  pr as A,
  lr as B,
  ur as C,
  Zt as D,
  at as E,
  Jt as F,
  fr as G,
  zt as H,
  se as I,
  sr as J,
  xr as K,
  un as L,
  K as M,
  Nn as N,
  On as O,
  Xn as P,
  Bn as Q,
  ft as R,
  ne as S,
  A as T,
  b as U,
  Jn as V,
  Hn as W,
  L as X,
  Rn as Y,
  ce as Z,
  Yn as _,
  zn as a,
  Un as a0,
  Xt as a1,
  Z as a2,
  ye as a3,
  d as a4,
  h as a5,
  B as a6,
  Qe as a7,
  an as a8,
  Tr as a9,
  et as aA,
  Nt as aB,
  Le as aC,
  W as aD,
  jn as aE,
  xt as aF,
  cn as aG,
  Mn as aH,
  qn as aI,
  fn as aJ,
  nr as aK,
  tr as aL,
  kr as aM,
  cr as aN,
  mr as aO,
  gr as aP,
  Ar as aQ,
  Qn as aR,
  er as aS,
  jt as aT,
  _r as aa,
  Ie as ab,
  J as ac,
  Me as ad,
  Ye as ae,
  Pn as af,
  hr as ag,
  rr as ah,
  Sn as ai,
  yr as aj,
  Re as ak,
  pt as al,
  Gn as am,
  Kn as an,
  Dn as ao,
  In as ap,
  ar as aq,
  ir as ar,
  mt as as,
  xe as at,
  bn as au,
  N as av,
  F as aw,
  xn as ax,
  $r as ay,
  Zn as az,
  ln as b,
  Er as c,
  H as d,
  P as e,
  dr as f,
  Ve as g,
  z as h,
  Cn as i,
  _e as j,
  v as k,
  sn as l,
  $e as m,
  An as n,
  kn as o,
  Wn as p,
  j as q,
  tt as r,
  Vn as s,
  Sr as t,
  wr as u,
  qe as v,
  Fn as w,
  br as x,
  vr as y,
  or as z
};
