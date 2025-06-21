import { s as o, b as p, E as _, i as c, c as u, n as f, d, h as v, e as l, g as a, j as h } from './B1kvZUbr.js';
function g(n) {
  return (n.toString = () => (o(), '')), n;
}
function y(n, s, ...r) {
  var i = n,
    t = f,
    e;
  p(() => {
    t !== (t = s()) && (e && (d(e), (e = null)), t == null && c(), (e = u(() => t(i, ...r))));
  }, _),
    v && (i = l);
}
function E(n, s) {
  const r = (i, ...t) => {
    var e = h;
    a(n);
    try {
      return s(i, ...t);
    } finally {
      a(e);
    }
  };
  return g(r), r;
}
export { y as s, E as w };
