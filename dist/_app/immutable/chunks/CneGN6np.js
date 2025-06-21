import {
  ak as d,
  a5 as u,
  ab as f,
  al as h,
  am as E,
  an as y,
  h as i,
  e as o,
  B as T,
  I as g,
  ao as w,
  F as m,
  k as x,
  ap as M
} from './B1kvZUbr.js';
function N(e) {
  var n = document.createElement('template');
  return (n.innerHTML = e.replaceAll('<!>', '<!---->')), n.content;
}
function a(e, n) {
  var t = u;
  t.nodes_start === null && ((t.nodes_start = e), (t.nodes_end = n));
}
function I(e, n) {
  var t = (n & E) !== 0,
    c = (n & y) !== 0,
    r,
    l = !e.startsWith('<!>');
  return () => {
    if (i) return a(o, null), o;
    r === void 0 && ((r = N(l ? e : '<!>' + e)), t || (r = f(r)));
    var s = c || h ? document.importNode(r, !0) : r.cloneNode(!0);
    if (t) {
      var p = f(s),
        v = s.lastChild;
      a(p, v);
    } else a(s, s);
    return s;
  };
}
function L(e = '') {
  if (!i) {
    var n = d(e + '');
    return a(n, n), n;
  }
  var t = o;
  return t.nodeType !== 3 && (t.before((t = d())), g(t)), a(t, t), t;
}
function b() {
  if (i) return a(o, null), o;
  var e = document.createDocumentFragment(),
    n = document.createComment(''),
    t = d();
  return e.append(n, t), a(n, t), e;
}
function F(e, n) {
  if (i) {
    (u.nodes_end = o), T();
    return;
  }
  e !== null && e.before(n);
}
function P(e) {
  e && w(e[m] ?? 'a component', e.name);
}
function k() {
  var t;
  const e = (t = x) == null ? void 0 : t.function;
  function n(c) {
    M(c, e[m]);
  }
  return { $destroy: () => n('$destroy()'), $on: () => n('$on(...)'), $set: () => n('$set(...)') };
}
const $ = '5';
var _;
typeof window < 'u' && ((_ = window.__svelte ?? (window.__svelte = {})).v ?? (_.v = new Set())).add($);
export { b as a, F as b, P as c, a as d, N as e, I as f, k as l, L as t };
