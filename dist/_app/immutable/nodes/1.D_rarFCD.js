import { c as h, b as d, l as v, f as _ } from '../chunks/CneGN6np.js';
import { i as x } from '../chunks/K7aIU5Yx.js';
import { p as k, f as E, x as $, a as b, F as i, y as o, z as p, A as y } from '../chunks/B1kvZUbr.js';
import { a as A, s as m } from '../chunks/CjSb9ldB.js';
import { s as F, p as n } from '../chunks/DcvHNmGt.js';
const j = {
  get error() {
    return n.error;
  },
  get status() {
    return n.status;
  }
};
F.updated.check;
const c = j;
e[i] = 'node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte';
var w = A(_('<h1> </h1> <p> </p>', 1), e[i], [
  [5, 0],
  [6, 0]
]);
function e(f, l) {
  h(new.target), k(l, !1, e), x();
  var r = w(),
    t = E(r),
    u = o(t, !0);
  p(t);
  var s = y(t, 2),
    g = o(s, !0);
  return (
    p(s),
    $(() => {
      var a;
      m(u, c.status), m(g, (a = c.error) == null ? void 0 : a.message);
    }),
    d(f, r),
    b({ ...v() })
  );
}
export { e as component };
