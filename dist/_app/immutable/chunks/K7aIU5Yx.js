import { k as d, u as g, l as c, m, r as i, o as b, q as p, t as v, v as k, w as h } from './B1kvZUbr.js';
function x(n = !1) {
  const s = d,
    e = s.l.u;
  if (!e) return;
  let f = () => v(s.s);
  if (n) {
    let o = 0,
      t = {};
    const _ = k(() => {
      let l = !1;
      const r = s.s;
      for (const a in r) r[a] !== t[a] && ((t[a] = r[a]), (l = !0));
      return l && o++, o;
    });
    f = () => p(_);
  }
  e.b.length &&
    g(() => {
      u(s, f), i(e.b);
    }),
    c(() => {
      const o = m(() => e.m.map(b));
      return () => {
        for (const t of o) typeof t == 'function' && t();
      };
    }),
    e.a.length &&
      c(() => {
        u(s, f), i(e.a);
      });
}
function u(n, s) {
  if (n.l.s) for (const e of n.l.s) p(e);
  s();
}
h();
export { x as i };
