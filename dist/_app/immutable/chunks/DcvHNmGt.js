var nt = e => {
  throw TypeError(e);
};
var Vt = (e, t, n) => t.has(e) || nt('Cannot ' + n);
var S = (e, t, n) => (Vt(e, t, 'read from private field'), n ? n.call(e) : t.get(e)),
  x = (e, t, n) =>
    t.has(e) ? nt('Cannot add the same private member more than once') : t instanceof WeakSet ? t.add(e) : t.set(e, n);
import { n as Te, aT as Mt, ax as rt, av as L, aw as O, q as j, T as C, ay as Gt } from './B1kvZUbr.js';
const G = [];
function Fe(e, t = Te) {
  let n = null;
  const r = new Set();
  function a(o) {
    if (Mt(e, o) && ((e = o), n)) {
      const c = !G.length;
      for (const l of r) l[1](), G.push(l, e);
      if (c) {
        for (let l = 0; l < G.length; l += 2) G[l][0](G[l + 1]);
        G.length = 0;
      }
    }
  }
  function s(o) {
    a(o(e));
  }
  function i(o, c = Te) {
    const l = [o, c];
    return (
      r.add(l),
      r.size === 1 && (n = t(a, s) || Te),
      o(e),
      () => {
        r.delete(l), r.size === 0 && n && (n(), (n = null));
      }
    );
  }
  return { set: a, update: s, subscribe: i };
}
new URL('sveltekit-internal://');
function Ht(e, t) {
  return e === '/' || t === 'ignore'
    ? e
    : t === 'never'
      ? e.endsWith('/')
        ? e.slice(0, -1)
        : e
      : t === 'always' && !e.endsWith('/')
        ? e + '/'
        : e;
}
function Kt(e) {
  return e.split('%25').map(decodeURI).join('%25');
}
function Wt(e) {
  for (const t in e) e[t] = decodeURIComponent(e[t]);
  return e;
}
function Ue({ href: e }) {
  return e.split('#')[0];
}
function zt(e, t, n, r = !1) {
  const a = new URL(e);
  Object.defineProperty(a, 'searchParams', {
    value: new Proxy(a.searchParams, {
      get(i, o) {
        if (o === 'get' || o === 'getAll' || o === 'has') return l => (n(l), i[o](l));
        t();
        const c = Reflect.get(i, o);
        return typeof c == 'function' ? c.bind(i) : c;
      }
    }),
    enumerable: !0,
    configurable: !0
  });
  const s = ['href', 'pathname', 'search', 'toString', 'toJSON'];
  r && s.push('hash');
  for (const i of s)
    Object.defineProperty(a, i, {
      get() {
        return t(), e[i];
      },
      enumerable: !0,
      configurable: !0
    });
  return r || Yt(a), a;
}
function Yt(e) {
  Object.defineProperty(e, 'hash', {
    get() {
      throw new Error('Cannot access event.url.hash. Consider using `page.url.hash` inside a component instead');
    }
  });
}
function Jt(...e) {
  let t = 5381;
  for (const n of e)
    if (typeof n == 'string') {
      let r = n.length;
      for (; r; ) t = (t * 33) ^ n.charCodeAt(--r);
    } else if (ArrayBuffer.isView(n)) {
      const r = new Uint8Array(n.buffer, n.byteOffset, n.byteLength);
      let a = r.length;
      for (; a; ) t = (t * 33) ^ r[--a];
    } else throw new TypeError('value must be a string or TypedArray');
  return (t >>> 0).toString(36);
}
function Xt(e) {
  const t = atob(e),
    n = new Uint8Array(t.length);
  for (let r = 0; r < t.length; r++) n[r] = t.charCodeAt(r);
  return n.buffer;
}
let Be = 0;
const Zt = window.fetch;
function Qt() {
  Be += 1;
}
function en() {
  Be -= 1;
}
{
  let e = !1;
  (async () => {
    e = new Error().stack.includes('check_stack_trace');
  })(),
    (window.fetch = (n, r) => {
      const a = n instanceof Request ? n.url : n.toString(),
        s = new Error().stack.split(`
`),
        i = s.findIndex(u => u.includes('load@') || u.includes('at load')),
        o = s.slice(0, i + 2).join(`
`),
        c = e ? o.includes('src/runtime/client/client.js') : Be,
        l = r == null ? void 0 : r.__sveltekit_fetch__;
      return (
        c &&
          !l &&
          console.warn(
            `Loading ${a} using \`window.fetch\`. For best results, use the \`fetch\` that is passed to your \`load\` function: https://svelte.dev/docs/kit/load#making-fetch-requests`
          ),
        (n instanceof Request ? n.method : (r == null ? void 0 : r.method) || 'GET') !== 'GET' && Y.delete(Me(n)),
        Zt(n, r)
      );
    });
}
const Y = new Map();
function tn(e, t) {
  const n = Me(e, t),
    r = document.querySelector(n);
  if (r != null && r.textContent) {
    let { body: a, ...s } = JSON.parse(r.textContent);
    const i = r.getAttribute('data-ttl');
    return (
      i && Y.set(n, { body: a, init: s, ttl: 1e3 * Number(i) }),
      r.getAttribute('data-b64') !== null && (a = Xt(a)),
      Promise.resolve(new Response(a, s))
    );
  }
  return Ve(e, t);
}
function nn(e, t, n) {
  if (Y.size > 0) {
    const r = Me(e, n),
      a = Y.get(r);
    if (a) {
      if (
        performance.now() < a.ttl &&
        ['default', 'force-cache', 'only-if-cached', void 0].includes(n == null ? void 0 : n.cache)
      )
        return new Response(a.body, a.init);
      Y.delete(r);
    }
  }
  return Ve(t, n);
}
function Ve(e, t) {
  const n = { ...t };
  return (
    Object.defineProperty(n, '__sveltekit_fetch__', { value: !0, writable: !0, configurable: !0 }), window.fetch(e, n)
  );
}
function Me(e, t) {
  let r = `script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request ? e.url : e)}]`;
  if ((t != null && t.headers) || (t != null && t.body)) {
    const a = [];
    t.headers && a.push([...new Headers(t.headers)].join(',')),
      t.body && (typeof t.body == 'string' || ArrayBuffer.isView(t.body)) && a.push(t.body),
      (r += `[data-hash="${Jt(...a)}"]`);
  }
  return r;
}
const rn = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;
function an(e) {
  const t = [];
  return {
    pattern:
      e === '/'
        ? /^\/$/
        : new RegExp(
            `^${sn(e)
              .map(r => {
                const a = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(r);
                if (a) return t.push({ name: a[1], matcher: a[2], optional: !1, rest: !0, chained: !0 }), '(?:/(.*))?';
                const s = /^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(r);
                if (s)
                  return t.push({ name: s[1], matcher: s[2], optional: !0, rest: !1, chained: !0 }), '(?:/([^/]+))?';
                if (!r) return;
                const i = r.split(/\[(.+?)\](?!\])/);
                return (
                  '/' +
                  i
                    .map((c, l) => {
                      if (l % 2) {
                        if (c.startsWith('x+')) return xe(String.fromCharCode(parseInt(c.slice(2), 16)));
                        if (c.startsWith('u+'))
                          return xe(
                            String.fromCharCode(
                              ...c
                                .slice(2)
                                .split('-')
                                .map(p => parseInt(p, 16))
                            )
                          );
                        const h = rn.exec(c),
                          [, u, m, f, _] = h;
                        return (
                          t.push({
                            name: f,
                            matcher: _,
                            optional: !!u,
                            rest: !!m,
                            chained: m ? l === 1 && i[0] === '' : !1
                          }),
                          m ? '(.*?)' : u ? '([^/]*)?' : '([^/]+?)'
                        );
                      }
                      return xe(c);
                    })
                    .join('')
                );
              })
              .join('')}/?$`
          ),
    params: t
  };
}
function on(e) {
  return !/^\([^)]+\)$/.test(e);
}
function sn(e) {
  return e.slice(1).split('/').filter(on);
}
function cn(e, t, n) {
  const r = {},
    a = e.slice(1),
    s = a.filter(o => o !== void 0);
  let i = 0;
  for (let o = 0; o < t.length; o += 1) {
    const c = t[o];
    let l = a[o - i];
    if (
      (c.chained &&
        c.rest &&
        i &&
        ((l = a
          .slice(o - i, o + 1)
          .filter(h => h)
          .join('/')),
        (i = 0)),
      l === void 0)
    ) {
      c.rest && (r[c.name] = '');
      continue;
    }
    if (!c.matcher || n[c.matcher](l)) {
      r[c.name] = l;
      const h = t[o + 1],
        u = a[o + 1];
      h && !h.rest && h.optional && u && c.chained && (i = 0),
        !h && !u && Object.keys(r).length === s.length && (i = 0);
      continue;
    }
    if (c.optional && c.chained) {
      i++;
      continue;
    }
    return;
  }
  if (!i) return r;
}
function xe(e) {
  return e
    .normalize()
    .replace(/[[\]]/g, '\\$&')
    .replace(/%/g, '%25')
    .replace(/\//g, '%2[Ff]')
    .replace(/\?/g, '%3[Ff]')
    .replace(/#/g, '%23')
    .replace(/[.*+?^${}()|\\]/g, '\\$&');
}
function ln({ nodes: e, server_loads: t, dictionary: n, matchers: r }) {
  const a = new Set(t);
  return Object.entries(n).map(([o, [c, l, h]]) => {
    const { pattern: u, params: m } = an(o),
      f = {
        id: o,
        exec: _ => {
          const p = u.exec(_);
          if (p) return cn(p, m, r);
        },
        errors: [1, ...(h || [])].map(_ => e[_]),
        layouts: [0, ...(l || [])].map(i),
        leaf: s(c)
      };
    return (f.errors.length = f.layouts.length = Math.max(f.errors.length, f.layouts.length)), f;
  });
  function s(o) {
    const c = o < 0;
    return c && (o = ~o), [c, e[o]];
  }
  function i(o) {
    return o === void 0 ? o : [a.has(o), e[o]];
  }
}
function yt(e, t = JSON.parse) {
  try {
    return t(sessionStorage[e]);
  } catch {}
}
function at(e, t, n = JSON.stringify) {
  const r = n(t);
  try {
    sessionStorage[e] = r;
  } catch {}
}
var gt;
const U = ((gt = globalThis.__sveltekit_11sdvy6) == null ? void 0 : gt.base) ?? '';
var _t;
(_t = globalThis.__sveltekit_11sdvy6) == null || _t.assets;
const vt = 'sveltekit:snapshot',
  bt = 'sveltekit:scroll',
  kt = 'sveltekit:states',
  fn = 'sveltekit:pageurl',
  K = 'sveltekit:history',
  Q = 'sveltekit:navigation',
  F = { tap: 1, hover: 2, viewport: 3, eager: 4, off: -1, false: -1 },
  ke = location.origin;
function St(e) {
  if (e instanceof URL) return e;
  let t = document.baseURI;
  if (!t) {
    const n = document.getElementsByTagName('base');
    t = n.length ? n[0].href : document.URL;
  }
  return new URL(e, t);
}
function Se() {
  return { x: pageXOffset, y: pageYOffset };
}
const ot = new WeakSet(),
  st = {
    'preload-code': ['', 'off', 'false', 'tap', 'hover', 'viewport', 'eager'],
    'preload-data': ['', 'off', 'false', 'tap', 'hover'],
    keepfocus: ['', 'true', 'off', 'false'],
    noscroll: ['', 'true', 'off', 'false'],
    reload: ['', 'true', 'off', 'false'],
    replacestate: ['', 'true', 'off', 'false']
  };
function H(e, t) {
  const n = e.getAttribute(`data-sveltekit-${t}`);
  return un(e, t, n), n;
}
function un(e, t, n) {
  n !== null &&
    !ot.has(e) &&
    !st[t].includes(n) &&
    (console.error(`Unexpected value for ${t} — should be one of ${st[t].map(r => JSON.stringify(r)).join(', ')}`, e),
    ot.add(e));
}
const it = { ...F, '': F.hover };
function Et(e) {
  let t = e.assignedSlot ?? e.parentNode;
  return (t == null ? void 0 : t.nodeType) === 11 && (t = t.host), t;
}
function At(e, t) {
  for (; e && e !== t; ) {
    if (e.nodeName.toUpperCase() === 'A' && e.hasAttribute('href')) return e;
    e = Et(e);
  }
}
function je(e, t, n) {
  let r;
  try {
    if (
      ((r = new URL(e instanceof SVGAElement ? e.href.baseVal : e.href, document.baseURI)), n && r.hash.match(/^#[^/]/))
    ) {
      const o = location.hash.split('#')[1] || '/';
      r.hash = `#${o}${r.hash}`;
    }
  } catch {}
  const a = e instanceof SVGAElement ? e.target.baseVal : e.target,
    s = !r || !!a || Ee(r, t, n) || (e.getAttribute('rel') || '').split(/\s+/).includes('external'),
    i = (r == null ? void 0 : r.origin) === ke && e.hasAttribute('download');
  return { url: r, external: s, target: a, download: i };
}
function he(e) {
  let t = null,
    n = null,
    r = null,
    a = null,
    s = null,
    i = null,
    o = e;
  for (; o && o !== document.documentElement; )
    r === null && (r = H(o, 'preload-code')),
      a === null && (a = H(o, 'preload-data')),
      t === null && (t = H(o, 'keepfocus')),
      n === null && (n = H(o, 'noscroll')),
      s === null && (s = H(o, 'reload')),
      i === null && (i = H(o, 'replacestate')),
      (o = Et(o));
  function c(l) {
    switch (l) {
      case '':
      case 'true':
        return !0;
      case 'off':
      case 'false':
        return !1;
      default:
        return;
    }
  }
  return {
    preload_code: it[r ?? 'off'],
    preload_data: it[a ?? 'off'],
    keepfocus: c(t),
    noscroll: c(n),
    reload: c(s),
    replace_state: c(i)
  };
}
function ct(e) {
  const t = Fe(e);
  let n = !0;
  function r() {
    (n = !0), t.update(i => i);
  }
  function a(i) {
    (n = !1), t.set(i);
  }
  function s(i) {
    let o;
    return t.subscribe(c => {
      (o === void 0 || (n && c !== o)) && i((o = c));
    });
  }
  return { notify: r, set: a, subscribe: s };
}
function dn() {
  const { set: e, subscribe: t } = Fe(!1);
  return { subscribe: t, check: async () => !1 };
}
function Ee(e, t, n) {
  return e.origin !== ke || !e.pathname.startsWith(t)
    ? !0
    : n
      ? !(
          e.pathname === t + '/' ||
          e.pathname === t + '/index.html' ||
          (e.protocol === 'file:' && e.pathname.replace(/\/[^/]+\.html?$/, '') === t)
        )
      : !1;
}
function Qn(e) {}
function lt(e) {
  const t = pn(e),
    n = new ArrayBuffer(t.length),
    r = new DataView(n);
  for (let a = 0; a < n.byteLength; a++) r.setUint8(a, t.charCodeAt(a));
  return n;
}
const hn = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function pn(e) {
  e.length % 4 === 0 && (e = e.replace(/==?$/, ''));
  let t = '',
    n = 0,
    r = 0;
  for (let a = 0; a < e.length; a++)
    (n <<= 6),
      (n |= hn.indexOf(e[a])),
      (r += 6),
      r === 24 &&
        ((t += String.fromCharCode((n & 16711680) >> 16)),
        (t += String.fromCharCode((n & 65280) >> 8)),
        (t += String.fromCharCode(n & 255)),
        (n = r = 0));
  return (
    r === 12
      ? ((n >>= 4), (t += String.fromCharCode(n)))
      : r === 18 && ((n >>= 2), (t += String.fromCharCode((n & 65280) >> 8)), (t += String.fromCharCode(n & 255))),
    t
  );
}
const gn = -1,
  _n = -2,
  mn = -3,
  wn = -4,
  yn = -5,
  vn = -6;
function bn(e, t) {
  if (typeof e == 'number') return a(e, !0);
  if (!Array.isArray(e) || e.length === 0) throw new Error('Invalid input');
  const n = e,
    r = Array(n.length);
  function a(s, i = !1) {
    if (s === gn) return;
    if (s === mn) return NaN;
    if (s === wn) return 1 / 0;
    if (s === yn) return -1 / 0;
    if (s === vn) return -0;
    if (i) throw new Error('Invalid input');
    if (s in r) return r[s];
    const o = n[s];
    if (!o || typeof o != 'object') r[s] = o;
    else if (Array.isArray(o))
      if (typeof o[0] == 'string') {
        const c = o[0],
          l = t == null ? void 0 : t[c];
        if (l) return (r[s] = l(a(o[1])));
        switch (c) {
          case 'Date':
            r[s] = new Date(o[1]);
            break;
          case 'Set':
            const h = new Set();
            r[s] = h;
            for (let f = 1; f < o.length; f += 1) h.add(a(o[f]));
            break;
          case 'Map':
            const u = new Map();
            r[s] = u;
            for (let f = 1; f < o.length; f += 2) u.set(a(o[f]), a(o[f + 1]));
            break;
          case 'RegExp':
            r[s] = new RegExp(o[1], o[2]);
            break;
          case 'Object':
            r[s] = Object(o[1]);
            break;
          case 'BigInt':
            r[s] = BigInt(o[1]);
            break;
          case 'null':
            const m = Object.create(null);
            r[s] = m;
            for (let f = 1; f < o.length; f += 2) m[o[f]] = a(o[f + 1]);
            break;
          case 'Int8Array':
          case 'Uint8Array':
          case 'Uint8ClampedArray':
          case 'Int16Array':
          case 'Uint16Array':
          case 'Int32Array':
          case 'Uint32Array':
          case 'Float32Array':
          case 'Float64Array':
          case 'BigInt64Array':
          case 'BigUint64Array': {
            const f = globalThis[c],
              _ = o[1],
              p = lt(_),
              d = new f(p);
            r[s] = d;
            break;
          }
          case 'ArrayBuffer': {
            const f = o[1],
              _ = lt(f);
            r[s] = _;
            break;
          }
          default:
            throw new Error(`Unknown type ${c}`);
        }
      } else {
        const c = new Array(o.length);
        r[s] = c;
        for (let l = 0; l < o.length; l += 1) {
          const h = o[l];
          h !== _n && (c[l] = a(h));
        }
      }
    else {
      const c = {};
      r[s] = c;
      for (const l in o) {
        const h = o[l];
        c[l] = a(h);
      }
    }
    return r[s];
  }
  return a(0);
}
function kn(e) {
  function t(n, r) {
    if (n)
      for (const a in n) {
        if (a[0] === '_' || e.has(a)) continue;
        const s = [...e.values()],
          i =
            Sn(a, r == null ? void 0 : r.slice(r.lastIndexOf('.'))) ??
            `valid exports are ${s.join(', ')}, or anything with a '_' prefix`;
        throw new Error(`Invalid export '${a}'${r ? ` in ${r}` : ''} (${i})`);
      }
  }
  return t;
}
function Sn(e, t = '.js') {
  const n = [];
  if (
    (Ge.has(e) && n.push(`+layout${t}`),
    Rt.has(e) && n.push(`+page${t}`),
    It.has(e) && n.push(`+layout.server${t}`),
    En.has(e) && n.push(`+page.server${t}`),
    An.has(e) && n.push(`+server${t}`),
    n.length > 0)
  )
    return `'${e}' is a valid export in ${n.slice(0, -1).join(', ')}${n.length > 1 ? ' or ' : ''}${n.at(-1)}`;
}
const Ge = new Set(['load', 'prerender', 'csr', 'ssr', 'trailingSlash', 'config']),
  Rt = new Set([...Ge, 'entries']),
  It = new Set([...Ge]),
  En = new Set([...It, 'actions', 'entries']),
  An = new Set([
    'GET',
    'POST',
    'PATCH',
    'PUT',
    'DELETE',
    'OPTIONS',
    'HEAD',
    'fallback',
    'prerender',
    'trailingSlash',
    'config',
    'entries'
  ]),
  Rn = kn(Rt);
function In(e) {
  return e.filter(t => t != null);
}
class Ae {
  constructor(t, n) {
    (this.status = t),
      typeof n == 'string'
        ? (this.body = { message: n })
        : n
          ? (this.body = n)
          : (this.body = { message: `Error: ${t}` });
  }
  toString() {
    return JSON.stringify(this.body);
  }
}
class He {
  constructor(t, n) {
    (this.status = t), (this.location = n);
  }
}
class pe extends Error {
  constructor(t, n, r) {
    super(r), (this.status = t), (this.text = n);
  }
}
function Pn(e, t) {
  const n = /^(moz-icon|view-source|jar):/.exec(t);
  n &&
    console.warn(
      `${e}: Calling \`depends('${t}')\` will throw an error in Firefox because \`${n[1]}\` is a special URI scheme`
    );
}
const Le = 'x-sveltekit-invalidated',
  $n = 'x-sveltekit-trailing-slash';
function ge(e) {
  return e instanceof Ae || e instanceof pe ? e.status : 500;
}
function Tn(e) {
  return e instanceof pe ? e.text : 'Internal Error';
}
let P, ee;
const Un = rt.toString().includes('$$') || /function \w+\(\) \{\}/.test(rt.toString());
var re, ae, oe, se, ie, ce, le, fe, mt, ue, wt;
Un
  ? ((P = {
      data: {},
      form: null,
      error: null,
      params: {},
      route: { id: null },
      state: {},
      status: -1,
      url: new URL('https://example.com')
    }),
    (ee = { current: null }))
  : ((P = new ((mt = class {
      constructor() {
        x(this, re, L(O({}), 'Page.data'));
        x(this, ae, L(O(null), 'Page.form'));
        x(this, oe, L(O(null), 'Page.error'));
        x(this, se, L(O({}), 'Page.params'));
        x(this, ie, L(O({ id: null }), 'Page.route'));
        x(this, ce, L(O({}), 'Page.state'));
        x(this, le, L(O(-1), 'Page.status'));
        x(this, fe, L(O(new URL('https://example.com')), 'Page.url'));
      }
      get data() {
        return j(S(this, re));
      }
      set data(t) {
        C(S(this, re), t);
      }
      get form() {
        return j(S(this, ae));
      }
      set form(t) {
        C(S(this, ae), t);
      }
      get error() {
        return j(S(this, oe));
      }
      set error(t) {
        C(S(this, oe), t);
      }
      get params() {
        return j(S(this, se));
      }
      set params(t) {
        C(S(this, se), t);
      }
      get route() {
        return j(S(this, ie));
      }
      set route(t) {
        C(S(this, ie), t);
      }
      get state() {
        return j(S(this, ce));
      }
      set state(t) {
        C(S(this, ce), t);
      }
      get status() {
        return j(S(this, le));
      }
      set status(t) {
        C(S(this, le), t);
      }
      get url() {
        return j(S(this, fe));
      }
      set url(t) {
        C(S(this, fe), t);
      }
    }),
    (re = new WeakMap()),
    (ae = new WeakMap()),
    (oe = new WeakMap()),
    (se = new WeakMap()),
    (ie = new WeakMap()),
    (ce = new WeakMap()),
    (le = new WeakMap()),
    (fe = new WeakMap()),
    mt)()),
    (ee = new ((wt = class {
      constructor() {
        x(this, ue, L(O(null), 'Navigating.current'));
      }
      get current() {
        return j(S(this, ue));
      }
      set current(t) {
        C(S(this, ue), t);
      }
    }),
    (ue = new WeakMap()),
    wt)()));
function xn(e) {
  Object.assign(P, e);
}
const Ln = '/__data.json',
  On = '.html__data.json';
function jn(e) {
  return e.endsWith('.html') ? e.replace(/\.html$/, On) : e.replace(/\/$/, '') + Ln;
}
const Cn = new Set(['icon', 'shortcut icon', 'apple-touch-icon']),
  M = yt(bt) ?? {},
  te = yt(vt) ?? {};
{
  let e = !1;
  const t = import.meta.url.split('?')[0],
    n = () => {
      var i, o;
      if (e) return;
      let s =
        (i = new Error().stack) == null
          ? void 0
          : i.split(`
`);
      s &&
        (!s[0].includes('https:') && !s[0].includes('http:') && (s = s.slice(1)),
        (s = s.slice(2)),
        !((o = s[0]) != null && o.includes(t)) &&
          ((e = !0),
          console.warn(
            "Avoid using `history.pushState(...)` and `history.replaceState(...)` as these will conflict with SvelteKit's router. Use the `pushState` and `replaceState` imports from `$app/navigation` instead."
          )));
    },
    r = history.pushState;
  history.pushState = (...s) => (n(), r.apply(history, s));
  const a = history.replaceState;
  history.replaceState = (...s) => (n(), a.apply(history, s));
}
const D = { url: ct({}), page: ct({}), navigating: Fe(null), updated: dn() };
function Ke(e) {
  M[e] = Se();
}
function Nn(e, t) {
  let n = e + 1;
  for (; M[n]; ) delete M[n], (n += 1);
  for (n = t + 1; te[n]; ) delete te[n], (n += 1);
}
function W(e) {
  return (location.href = e.href), new Promise(() => {});
}
async function Pt() {
  if ('serviceWorker' in navigator) {
    const e = await navigator.serviceWorker.getRegistration(U || '/');
    e && (await e.update());
  }
}
function ft() {}
let We, Ce, _e, N, Ne, k;
const me = [],
  we = [];
let $ = null;
const de = new Map(),
  $t = new Set(),
  Dn = new Set(),
  J = new Set();
let v = { branch: [], error: null, url: null },
  ze = !1,
  ye = !1,
  ut = !0,
  ne = !1,
  z = !1,
  Tt = !1,
  Ye = !1,
  Ut,
  A,
  T,
  B;
const X = new Set();
async function nr(e, t, n) {
  var s, i, o, c;
  t === document.body &&
    console.warn(`Placing %sveltekit.body% directly inside <body> is not recommended, as your app may break for users who have certain browser extensions installed.

Consider wrapping it in an element:

<div style="display: contents">
  %sveltekit.body%
</div>`),
    document.URL !== location.href && (location.href = location.href),
    (k = e),
    await ((i = (s = e.hooks).init) == null ? void 0 : i.call(s)),
    (We = ln(e)),
    (N = document.documentElement),
    (Ne = t),
    (Ce = e.nodes[0]),
    (_e = e.nodes[1]),
    Ce(),
    _e(),
    (A = (o = history.state) == null ? void 0 : o[K]),
    (T = (c = history.state) == null ? void 0 : c[Q]),
    A || ((A = T = Date.now()), history.replaceState({ ...history.state, [K]: A, [Q]: T }, ''));
  const r = M[A];
  function a() {
    r && ((history.scrollRestoration = 'manual'), scrollTo(r.x, r.y));
  }
  n
    ? (a(), await zn(Ne, n))
    : (await Z({ type: 'enter', url: St(k.hash ? Jn(new URL(location.href)) : location.href), replace_state: !0 }),
      a()),
    Wn();
}
function qn() {
  (me.length = 0), (Ye = !1);
}
function xt(e) {
  we.some(t => (t == null ? void 0 : t.snapshot)) &&
    (te[e] = we.map(t => {
      var n;
      return (n = t == null ? void 0 : t.snapshot) == null ? void 0 : n.capture();
    }));
}
function Lt(e) {
  var t;
  (t = te[e]) == null ||
    t.forEach((n, r) => {
      var a, s;
      (s = (a = we[r]) == null ? void 0 : a.snapshot) == null || s.restore(n);
    });
}
function dt() {
  Ke(A), at(bt, M), xt(T), at(vt, te);
}
async function Ot(e, t, n, r) {
  return Z({
    type: 'goto',
    url: St(e),
    keepfocus: t.keepFocus,
    noscroll: t.noScroll,
    replace_state: t.replaceState,
    state: t.state,
    redirect_count: n,
    nav_token: r,
    accept: () => {
      t.invalidateAll && (Ye = !0), t.invalidate && t.invalidate.forEach(Kn);
    }
  });
}
async function Fn(e) {
  if (e.id !== ($ == null ? void 0 : $.id)) {
    const t = {};
    X.add(t),
      ($ = {
        id: e.id,
        token: t,
        promise: Nt({ ...e, preload: t }).then(
          n => (X.delete(t), n.type === 'loaded' && n.state.error && ($ = null), n)
        )
      });
  }
  return $.promise;
}
async function Oe(e) {
  var n;
  const t = (n = await Ie(e, !1)) == null ? void 0 : n.route;
  t && (await Promise.all([...t.layouts, t.leaf].map(r => (r == null ? void 0 : r[1]()))));
}
function jt(e, t, n) {
  var a;
  if (e.state.error && document.querySelector('vite-error-overlay')) return;
  v = e.state;
  const r = document.querySelector('style[data-sveltekit]');
  if (
    (r && r.remove(),
    Object.assign(P, e.props.page),
    (Ut = new k.root({ target: t, props: { ...e.props, stores: D, components: we }, hydrate: n, sync: !1 })),
    Lt(T),
    n)
  ) {
    const s = {
      from: null,
      to: {
        params: v.params,
        route: { id: ((a = v.route) == null ? void 0 : a.id) ?? null },
        url: new URL(location.href)
      },
      willUnload: !1,
      type: 'enter',
      complete: Promise.resolve()
    };
    J.forEach(i => i(s));
  }
  ye = !0;
}
function ve({ url: e, params: t, branch: n, status: r, error: a, route: s, form: i }) {
  let o = 'never';
  if (U && (e.pathname === U || e.pathname === U + '/')) o = 'always';
  else for (const f of n) (f == null ? void 0 : f.slash) !== void 0 && (o = f.slash);
  (e.pathname = Ht(e.pathname, o)), (e.search = e.search);
  const c = {
    type: 'loaded',
    state: { url: e, params: t, branch: n, error: a, route: s },
    props: { constructors: In(n).map(f => f.node.component), page: Qe(P) }
  };
  i !== void 0 && (c.props.form = i);
  let l = {},
    h = !P,
    u = 0;
  for (let f = 0; f < Math.max(n.length, v.branch.length); f += 1) {
    const _ = n[f],
      p = v.branch[f];
    (_ == null ? void 0 : _.data) !== (p == null ? void 0 : p.data) && (h = !0),
      _ && ((l = { ...l, ..._.data }), h && (c.props[`data_${u}`] = l), (u += 1));
  }
  return (
    (!v.url || e.href !== v.url.href || v.error !== a || (i !== void 0 && i !== P.form) || h) &&
      (c.props.page = {
        error: a,
        params: t,
        route: { id: (s == null ? void 0 : s.id) ?? null },
        state: {},
        status: r,
        url: new URL(e),
        form: i ?? null,
        data: h ? l : P.data
      }),
    c
  );
}
async function Je({ loader: e, parent: t, url: n, params: r, route: a, server_data_node: s }) {
  var h, u, m;
  let i = null,
    o = !0;
  const c = { dependencies: new Set(), params: new Set(), parent: !1, route: !1, url: !1, search_params: new Set() },
    l = await e();
  if ((Rn(l.universal), l.universal && k.hash)) {
    const f = Object.keys(l.universal).filter(_ => _ !== 'load');
    if (f.length > 0)
      throw new Error(
        `Page options are ignored when \`router.type === 'hash'\` (${a.id} has ${f
          .filter(_ => _ !== 'load')
          .map(_ => `'${_}'`)
          .join(', ')})`
      );
  }
  if ((h = l.universal) != null && h.load) {
    let f = function (...p) {
      for (const d of p) {
        Pn(a.id, d);
        const { href: w } = new URL(d, n);
        c.dependencies.add(w);
      }
    };
    const _ = {
      route: new Proxy(a, { get: (p, d) => (o && (c.route = !0), p[d]) }),
      params: new Proxy(r, { get: (p, d) => (o && c.params.add(d), p[d]) }),
      data: (s == null ? void 0 : s.data) ?? null,
      url: zt(
        n,
        () => {
          o && (c.url = !0);
        },
        p => {
          o && c.search_params.add(p);
        },
        k.hash
      ),
      async fetch(p, d) {
        p instanceof Request &&
          (d = {
            body: p.method === 'GET' || p.method === 'HEAD' ? void 0 : await p.blob(),
            cache: p.cache,
            credentials: p.credentials,
            headers: [...p.headers].length ? p.headers : void 0,
            integrity: p.integrity,
            keepalive: p.keepalive,
            method: p.method,
            mode: p.mode,
            redirect: p.redirect,
            referrer: p.referrer,
            referrerPolicy: p.referrerPolicy,
            signal: p.signal,
            ...d
          });
        const { resolved: w, promise: R } = Ct(p, d, n);
        return o && f(w.href), R;
      },
      setHeaders: () => {},
      depends: f,
      parent() {
        return o && (c.parent = !0), t();
      },
      untrack(p) {
        o = !1;
        try {
          return p();
        } finally {
          o = !0;
        }
      }
    };
    try {
      if (
        (Qt(),
        (i = (await l.universal.load.call(null, _)) ?? null),
        i != null && Object.getPrototypeOf(i) !== Object.prototype)
      )
        throw new Error(
          `a load function related to route '${a.id}' returned ${typeof i != 'object' ? `a ${typeof i}` : i instanceof Response ? 'a Response object' : Array.isArray(i) ? 'an array' : 'a non-plain object'}, but must return a plain object at the top level (i.e. \`return {...}\`)`
        );
    } finally {
      en();
    }
  }
  return {
    node: l,
    loader: e,
    server: s,
    universal: (u = l.universal) != null && u.load ? { type: 'data', data: i, uses: c } : null,
    data: i ?? (s == null ? void 0 : s.data) ?? null,
    slash: ((m = l.universal) == null ? void 0 : m.trailingSlash) ?? (s == null ? void 0 : s.slash)
  };
}
function Ct(e, t, n) {
  let r = e instanceof Request ? e.url : e;
  const a = new URL(r, n);
  a.origin === n.origin && (r = a.href.slice(n.origin.length));
  const s = ye ? nn(r, a.href, t) : tn(r, t);
  return { resolved: a, promise: s };
}
function ht(e, t, n, r, a, s) {
  if (Ye) return !0;
  if (!a) return !1;
  if ((a.parent && e) || (a.route && t) || (a.url && n)) return !0;
  for (const i of a.search_params) if (r.has(i)) return !0;
  for (const i of a.params) if (s[i] !== v.params[i]) return !0;
  for (const i of a.dependencies) if (me.some(o => o(new URL(i)))) return !0;
  return !1;
}
function Xe(e, t) {
  return (e == null ? void 0 : e.type) === 'data' ? e : (e == null ? void 0 : e.type) === 'skip' ? (t ?? null) : null;
}
function Bn(e, t) {
  if (!e) return new Set(t.searchParams.keys());
  const n = new Set([...e.searchParams.keys(), ...t.searchParams.keys()]);
  for (const r of n) {
    const a = e.searchParams.getAll(r),
      s = t.searchParams.getAll(r);
    a.every(i => s.includes(i)) && s.every(i => a.includes(i)) && n.delete(r);
  }
  return n;
}
function pt({ error: e, url: t, route: n, params: r }) {
  return {
    type: 'loaded',
    state: { error: e, url: t, route: n, params: r, branch: [] },
    props: { page: Qe(P), constructors: [] }
  };
}
async function Nt({ id: e, invalidating: t, url: n, params: r, route: a, preload: s }) {
  if (($ == null ? void 0 : $.id) === e) return X.delete($.token), $.promise;
  const { errors: i, layouts: o, leaf: c } = a,
    l = [...o, c];
  i.forEach(g => (g == null ? void 0 : g().catch(() => {}))),
    l.forEach(g => (g == null ? void 0 : g[1]().catch(() => {})));
  let h = null;
  const u = v.url ? e !== be(v.url) : !1,
    m = v.route ? a.id !== v.route.id : !1,
    f = Bn(v.url, n);
  let _ = !1;
  const p = l.map((g, y) => {
    var q;
    const b = v.branch[y],
      E =
        !!(g != null && g[0]) &&
        ((b == null ? void 0 : b.loader) !== g[1] || ht(_, m, u, f, (q = b.server) == null ? void 0 : q.uses, r));
    return E && (_ = !0), E;
  });
  if (p.some(Boolean)) {
    try {
      h = await qt(n, p);
    } catch (g) {
      const y = await V(g, { url: n, params: r, route: { id: e } });
      return X.has(s)
        ? pt({ error: y, url: n, params: r, route: a })
        : Re({ status: ge(g), error: y, url: n, route: a });
    }
    if (h.type === 'redirect') return h;
  }
  const d = h == null ? void 0 : h.nodes;
  let w = !1;
  const R = l.map(async (g, y) => {
    var Pe;
    if (!g) return;
    const b = v.branch[y],
      E = d == null ? void 0 : d[y];
    if (
      (!E || E.type === 'skip') &&
      g[1] === (b == null ? void 0 : b.loader) &&
      !ht(w, m, u, f, (Pe = b.universal) == null ? void 0 : Pe.uses, r)
    )
      return b;
    if (((w = !0), (E == null ? void 0 : E.type) === 'error')) throw E;
    return Je({
      loader: g[1],
      url: n,
      params: r,
      route: a,
      parent: async () => {
        var tt;
        const et = {};
        for (let $e = 0; $e < y; $e += 1) Object.assign(et, (tt = await R[$e]) == null ? void 0 : tt.data);
        return et;
      },
      server_data_node: Xe(
        E === void 0 && g[0] ? { type: 'skip' } : (E ?? null),
        g[0] ? (b == null ? void 0 : b.server) : void 0
      )
    });
  });
  for (const g of R) g.catch(() => {});
  const I = [];
  for (let g = 0; g < l.length; g += 1)
    if (l[g])
      try {
        I.push(await R[g]);
      } catch (y) {
        if (y instanceof He) return { type: 'redirect', location: y.location };
        if (X.has(s))
          return pt({ error: await V(y, { params: r, url: n, route: { id: a.id } }), url: n, params: r, route: a });
        let b = ge(y),
          E;
        if (d != null && d.includes(y)) (b = y.status ?? b), (E = y.error);
        else if (y instanceof Ae) E = y.body;
        else {
          if (await D.updated.check()) return await Pt(), await W(n);
          E = await V(y, { params: r, url: n, route: { id: a.id } });
        }
        const q = await Vn(g, I, i);
        return q
          ? ve({ url: n, params: r, branch: I.slice(0, q.idx).concat(q.node), status: b, error: E, route: a })
          : await De(n, { id: a.id }, E, b);
      }
    else I.push(void 0);
  return ve({ url: n, params: r, branch: I, status: 200, error: null, route: a, form: t ? void 0 : null });
}
async function Vn(e, t, n) {
  for (; e--; )
    if (n[e]) {
      let r = e;
      for (; !t[r]; ) r -= 1;
      try {
        return { idx: r + 1, node: { node: await n[e](), loader: n[e], data: {}, server: null, universal: null } };
      } catch {
        continue;
      }
    }
}
async function Re({ status: e, error: t, url: n, route: r }) {
  const a = {};
  let s = null;
  if (k.server_loads[0] === 0)
    try {
      const o = await qt(n, [!0]);
      if (o.type !== 'data' || (o.nodes[0] && o.nodes[0].type !== 'data')) throw 0;
      s = o.nodes[0] ?? null;
    } catch {
      (n.origin !== ke || n.pathname !== location.pathname || ze) && (await W(n));
    }
  try {
    const o = await Je({
        loader: Ce,
        url: n,
        params: a,
        route: r,
        parent: () => Promise.resolve({}),
        server_data_node: Xe(s)
      }),
      c = { node: await _e(), loader: _e, universal: null, server: null, data: null };
    return ve({ url: n, params: a, branch: [o, c], status: e, error: t, route: null });
  } catch (o) {
    if (o instanceof He) return Ot(new URL(o.location, location.href), {}, 0);
    throw o;
  }
}
async function Mn(e) {
  const t = e.href;
  if (de.has(t)) return de.get(t);
  let n;
  try {
    const r = (async () => {
      let a = (await k.hooks.reroute({ url: new URL(e), fetch: async (s, i) => Ct(s, i, e).promise })) ?? e;
      if (typeof a == 'string') {
        const s = new URL(e);
        k.hash ? (s.hash = a) : (s.pathname = a), (a = s);
      }
      return a;
    })();
    de.set(t, r), (n = await r);
  } catch (r) {
    de.delete(t);
    {
      console.error(r);
      debugger;
    }
    return;
  }
  return n;
}
async function Ie(e, t) {
  if (e && !Ee(e, U, k.hash)) {
    const n = await Mn(e);
    if (!n) return;
    const r = Gn(n);
    for (const a of We) {
      const s = a.exec(r);
      if (s) return { id: be(e), invalidating: t, route: a, params: Wt(s), url: e };
    }
  }
}
function Gn(e) {
  return Kt(k.hash ? e.hash.replace(/^#/, '').replace(/[?#].+/, '') : e.pathname.slice(U.length)) || '/';
}
function be(e) {
  return (k.hash ? e.hash.replace(/^#/, '') : e.pathname) + e.search;
}
function Dt({ url: e, type: t, intent: n, delta: r }) {
  let a = !1;
  const s = Ze(v, n, e, t);
  r !== void 0 && (s.navigation.delta = r);
  const i = {
    ...s.navigation,
    cancel: () => {
      (a = !0), s.reject(new Error('navigation cancelled'));
    }
  };
  return ne || $t.forEach(o => o(i)), a ? null : s;
}
async function Z({
  type: e,
  url: t,
  popped: n,
  keepfocus: r,
  noscroll: a,
  replace_state: s,
  state: i = {},
  redirect_count: o = 0,
  nav_token: c = {},
  accept: l = ft,
  block: h = ft
}) {
  const u = B;
  B = c;
  const m = await Ie(t, !1),
    f = e === 'enter' ? Ze(v, m, t, e) : Dt({ url: t, type: e, delta: n == null ? void 0 : n.delta, intent: m });
  if (!f) {
    h(), B === c && (B = u);
    return;
  }
  const _ = A,
    p = T;
  l(), (ne = !0), ye && f.navigation.type !== 'enter' && D.navigating.set((ee.current = f.navigation));
  let d = m && (await Nt(m));
  if (!d)
    if (Ee(t, U, k.hash))
      if (k.hash)
        d = await De(
          t,
          { id: null },
          await V(new pe(404, 'Not Found', `Not found: ${t.pathname} (did you forget the hash?)`), {
            url: t,
            params: {},
            route: { id: null }
          }),
          404
        );
      else return await W(t);
    else
      d = await De(
        t,
        { id: null },
        await V(new pe(404, 'Not Found', `Not found: ${t.pathname}`), { url: t, params: {}, route: { id: null } }),
        404
      );
  if (((t = (m == null ? void 0 : m.url) || t), B !== c)) return f.reject(new Error('navigation aborted')), !1;
  if (d.type === 'redirect')
    if (o >= 20)
      d = await Re({
        status: 500,
        error: await V(new Error('Redirect loop'), { url: t, params: {}, route: { id: null } }),
        url: t,
        route: { id: null }
      });
    else return await Ot(new URL(d.location, t).href, {}, o + 1, c), !1;
  else d.props.page.status >= 400 && (await D.updated.check()) && (await Pt(), await W(t));
  if (
    (qn(),
    Ke(_),
    xt(p),
    d.props.page.url.pathname !== t.pathname && (t.pathname = d.props.page.url.pathname),
    (i = n ? n.state : i),
    !n)
  ) {
    const g = s ? 0 : 1,
      y = { [K]: (A += g), [Q]: (T += g), [kt]: i };
    (s ? history.replaceState : history.pushState).call(history, y, '', t), s || Nn(A, T);
  }
  if ((($ = null), (d.props.page.state = i), ye)) {
    (v = d.state), d.props.page && (d.props.page.url = t);
    const g = (await Promise.all(Array.from(Dn, y => y(f.navigation)))).filter(y => typeof y == 'function');
    if (g.length > 0) {
      let y = function () {
        g.forEach(b => {
          J.delete(b);
        });
      };
      g.push(y),
        g.forEach(b => {
          J.add(b);
        });
    }
    Ut.$set(d.props), xn(d.props.page), (Tt = !0);
  } else jt(d, Ne, !1);
  const { activeElement: w } = document;
  await Gt();
  const R = n ? n.scroll : a ? Se() : null;
  if (ut) {
    const g = t.hash && document.getElementById(Bt(t));
    R ? scrollTo(R.x, R.y) : g ? g.scrollIntoView() : scrollTo(0, 0);
  }
  const I = document.activeElement !== w && document.activeElement !== document.body;
  !r && !I && Yn(t),
    (ut = !0),
    d.props.page && Object.assign(P, d.props.page),
    (ne = !1),
    e === 'popstate' && Lt(T),
    f.fulfil(void 0),
    J.forEach(g => g(f.navigation)),
    D.navigating.set((ee.current = null));
}
async function De(e, t, n, r) {
  if (e.origin === ke && e.pathname === location.pathname && !ze)
    return await Re({ status: r, error: n, url: e, route: t });
  if (r !== 404) {
    console.error(
      'An error occurred while loading the page. This will cause a full page reload. (This message will only appear during development.)'
    );
    debugger;
  }
  return await W(e);
}
function Hn() {
  let e, t, n;
  N.addEventListener('mousemove', o => {
    const c = o.target;
    clearTimeout(e),
      (e = setTimeout(() => {
        s(c, F.hover);
      }, 20));
  });
  function r(o) {
    o.defaultPrevented || s(o.composedPath()[0], F.tap);
  }
  N.addEventListener('mousedown', r), N.addEventListener('touchstart', r, { passive: !0 });
  const a = new IntersectionObserver(
    o => {
      for (const c of o) c.isIntersecting && (Oe(new URL(c.target.href)), a.unobserve(c.target));
    },
    { threshold: 0 }
  );
  async function s(o, c) {
    const l = At(o, N),
      h = l === t && c >= n;
    if (!l || h) return;
    const { url: u, external: m, download: f } = je(l, U, k.hash);
    if (m || f) return;
    const _ = he(l),
      p = u && be(v.url) === be(u);
    if (!(_.reload || p))
      if (c <= _.preload_data) {
        (t = l), (n = F.tap);
        const d = await Ie(u, !1);
        if (!d) return;
        Fn(d).then(w => {
          w.type === 'loaded' &&
            w.state.error &&
            console.warn(`Preloading data for ${d.url.pathname} failed with the following error: ${w.state.error.message}
If this error is transient, you can ignore it. Otherwise, consider disabling preloading for this route. This route was preloaded due to a data-sveltekit-preload-data attribute. See https://svelte.dev/docs/kit/link-options for more info`);
        });
      } else c <= _.preload_code && ((t = l), (n = c), Oe(u));
  }
  function i() {
    a.disconnect();
    for (const o of N.querySelectorAll('a')) {
      const { url: c, external: l, download: h } = je(o, U, k.hash);
      if (l || h) continue;
      const u = he(o);
      u.reload || (u.preload_code === F.viewport && a.observe(o), u.preload_code === F.eager && Oe(c));
    }
  }
  J.add(i), i();
}
function V(e, t) {
  if (e instanceof Ae) return e.body;
  console.warn('The next HMR update will cause the page to reload');
  const n = ge(e),
    r = Tn(e);
  return k.hooks.handleError({ error: e, event: t, status: n, message: r }) ?? { message: r };
}
function Kn(e) {
  if (typeof e == 'function') me.push(e);
  else {
    const { href: t } = new URL(e, location.href);
    me.push(n => n.href === t);
  }
}
function Wn() {
  var t;
  (history.scrollRestoration = 'manual'),
    addEventListener('beforeunload', n => {
      let r = !1;
      if ((dt(), !ne)) {
        const a = Ze(v, void 0, null, 'leave'),
          s = {
            ...a.navigation,
            cancel: () => {
              (r = !0), a.reject(new Error('navigation cancelled'));
            }
          };
        $t.forEach(i => i(s));
      }
      r ? (n.preventDefault(), (n.returnValue = '')) : (history.scrollRestoration = 'auto');
    }),
    addEventListener('visibilitychange', () => {
      document.visibilityState === 'hidden' && dt();
    }),
    ((t = navigator.connection) != null && t.saveData) || Hn(),
    N.addEventListener('click', async n => {
      if (n.button || n.which !== 1 || n.metaKey || n.ctrlKey || n.shiftKey || n.altKey || n.defaultPrevented) return;
      const r = At(n.composedPath()[0], N);
      if (!r) return;
      const { url: a, external: s, target: i, download: o } = je(r, U, k.hash);
      if (!a) return;
      if (i === '_parent' || i === '_top') {
        if (window.parent !== window) return;
      } else if (i && i !== '_self') return;
      const c = he(r);
      if (
        (!(r instanceof SVGAElement) &&
          a.protocol !== location.protocol &&
          !(a.protocol === 'https:' || a.protocol === 'http:')) ||
        o
      )
        return;
      const [h, u] = (k.hash ? a.hash.replace(/^#/, '') : a.href).split('#'),
        m = h === Ue(location);
      if (s || (c.reload && (!m || !u))) {
        Dt({ url: a, type: 'link' }) ? (ne = !0) : n.preventDefault();
        return;
      }
      if (u !== void 0 && m) {
        const [, f] = v.url.href.split('#');
        if (f === u) {
          if ((n.preventDefault(), u === '' || (u === 'top' && r.ownerDocument.getElementById('top') === null)))
            window.scrollTo({ top: 0 });
          else {
            const _ = r.ownerDocument.getElementById(decodeURIComponent(u));
            _ && (_.scrollIntoView(), _.focus());
          }
          return;
        }
        if (((z = !0), Ke(A), e(a), !c.replace_state)) return;
        z = !1;
      }
      n.preventDefault(),
        await new Promise(f => {
          requestAnimationFrame(() => {
            setTimeout(f, 0);
          }),
            setTimeout(f, 100);
        }),
        await Z({
          type: 'link',
          url: a,
          keepfocus: c.keepfocus,
          noscroll: c.noscroll,
          replace_state: c.replace_state ?? a.href === location.href
        });
    }),
    N.addEventListener('submit', n => {
      if (n.defaultPrevented) return;
      const r = HTMLFormElement.prototype.cloneNode.call(n.target),
        a = n.submitter;
      if (
        ((a == null ? void 0 : a.formTarget) || r.target) === '_blank' ||
        ((a == null ? void 0 : a.formMethod) || r.method) !== 'get'
      )
        return;
      const o = new URL(
        ((a == null ? void 0 : a.hasAttribute('formaction')) && (a == null ? void 0 : a.formAction)) || r.action
      );
      if (Ee(o, U, !1)) return;
      const c = n.target,
        l = he(c);
      if (l.reload) return;
      n.preventDefault(), n.stopPropagation();
      const h = new FormData(c),
        u = a == null ? void 0 : a.getAttribute('name');
      u && h.append(u, (a == null ? void 0 : a.getAttribute('value')) ?? ''),
        (o.search = new URLSearchParams(h).toString()),
        Z({
          type: 'form',
          url: o,
          keepfocus: l.keepfocus,
          noscroll: l.noscroll,
          replace_state: l.replace_state ?? o.href === location.href
        });
    }),
    addEventListener('popstate', async n => {
      var r;
      if (!qe) {
        if ((r = n.state) != null && r[K]) {
          const a = n.state[K];
          if (((B = {}), a === A)) return;
          const s = M[a],
            i = n.state[kt] ?? {},
            o = new URL(n.state[fn] ?? location.href),
            c = n.state[Q],
            l = v.url ? Ue(location) === Ue(v.url) : !1;
          if (c === T && (Tt || l)) {
            i !== P.state && (P.state = i), e(o), (M[A] = Se()), s && scrollTo(s.x, s.y), (A = a);
            return;
          }
          const u = a - A;
          await Z({
            type: 'popstate',
            url: o,
            popped: { state: i, scroll: s, delta: u },
            accept: () => {
              (A = a), (T = c);
            },
            block: () => {
              history.go(-u);
            },
            nav_token: B
          });
        } else if (!z) {
          const a = new URL(location.href);
          e(a), k.hash && location.reload();
        }
      }
    }),
    addEventListener('hashchange', () => {
      z && ((z = !1), history.replaceState({ ...history.state, [K]: ++A, [Q]: T }, '', location.href));
    });
  for (const n of document.querySelectorAll('link')) Cn.has(n.rel) && (n.href = n.href);
  addEventListener('pageshow', n => {
    n.persisted && D.navigating.set((ee.current = null));
  });
  function e(n) {
    (v.url = P.url = n), D.page.set(Qe(P)), D.page.notify();
  }
}
async function zn(
  e,
  { status: t = 200, error: n, node_ids: r, params: a, route: s, server_route: i, data: o, form: c }
) {
  ze = !0;
  const l = new URL(location.href);
  let h;
  ({ params: a = {}, route: s = { id: null } } = (await Ie(l, !1)) || {}), (h = We.find(({ id: f }) => f === s.id));
  let u,
    m = !0;
  try {
    const f = r.map(async (p, d) => {
        const w = o[d];
        return (
          w != null && w.uses && (w.uses = Ft(w.uses)),
          Je({
            loader: k.nodes[p],
            url: l,
            params: a,
            route: s,
            parent: async () => {
              const R = {};
              for (let I = 0; I < d; I += 1) Object.assign(R, (await f[I]).data);
              return R;
            },
            server_data_node: Xe(w)
          })
        );
      }),
      _ = await Promise.all(f);
    if (h) {
      const p = h.layouts;
      for (let d = 0; d < p.length; d++) p[d] || _.splice(d, 0, void 0);
    }
    u = ve({ url: l, params: a, branch: _, status: t, error: n, form: c, route: h ?? null });
  } catch (f) {
    if (f instanceof He) {
      await W(new URL(f.location, location.href));
      return;
    }
    (u = await Re({ status: ge(f), error: await V(f, { url: l, params: a, route: s }), url: l, route: s })),
      (e.textContent = ''),
      (m = !1);
  }
  u.props.page && (u.props.page.state = {}), jt(u, e, m);
}
async function qt(e, t) {
  var s;
  const n = new URL(e);
  if (
    ((n.pathname = jn(e.pathname)), e.pathname.endsWith('/') && n.searchParams.append($n, '1'), e.searchParams.has(Le))
  )
    throw new Error(`Cannot used reserved query parameter "${Le}"`);
  n.searchParams.append(Le, t.map(i => (i ? '1' : '0')).join(''));
  const a = await Ve(n.href, {});
  if (!a.ok) {
    let i;
    throw (
      ((s = a.headers.get('content-type')) != null && s.includes('application/json')
        ? (i = await a.json())
        : a.status === 404
          ? (i = 'Not Found')
          : a.status === 500 && (i = 'Internal Error'),
      new Ae(a.status, i))
    );
  }
  return new Promise(async i => {
    var m;
    const o = new Map(),
      c = a.body.getReader(),
      l = new TextDecoder();
    function h(f) {
      return bn(f, {
        ...k.decoders,
        Promise: _ =>
          new Promise((p, d) => {
            o.set(_, { fulfil: p, reject: d });
          })
      });
    }
    let u = '';
    for (;;) {
      const { done: f, value: _ } = await c.read();
      if (f && !u) break;
      for (
        u +=
          !_ && u
            ? `
`
            : l.decode(_, { stream: !0 });
        ;

      ) {
        const p = u.indexOf(`
`);
        if (p === -1) break;
        const d = JSON.parse(u.slice(0, p));
        if (((u = u.slice(p + 1)), d.type === 'redirect')) return i(d);
        if (d.type === 'data')
          (m = d.nodes) == null ||
            m.forEach(w => {
              (w == null ? void 0 : w.type) === 'data' && ((w.uses = Ft(w.uses)), (w.data = h(w.data)));
            }),
            i(d);
        else if (d.type === 'chunk') {
          const { id: w, data: R, error: I } = d,
            g = o.get(w);
          o.delete(w), I ? g.reject(h(I)) : g.fulfil(h(R));
        }
      }
    }
  });
}
function Ft(e) {
  return {
    dependencies: new Set((e == null ? void 0 : e.dependencies) ?? []),
    params: new Set((e == null ? void 0 : e.params) ?? []),
    parent: !!(e != null && e.parent),
    route: !!(e != null && e.route),
    url: !!(e != null && e.url),
    search_params: new Set((e == null ? void 0 : e.search_params) ?? [])
  };
}
let qe = !1;
function Yn(e) {
  const t = document.querySelector('[autofocus]');
  if (t) t.focus();
  else {
    const n = Bt(e);
    if (n && document.getElementById(n)) {
      const { x: a, y: s } = Se();
      setTimeout(() => {
        const i = history.state;
        (qe = !0),
          location.replace(`#${n}`),
          k.hash && location.replace(e.hash),
          history.replaceState(i, '', e.hash),
          scrollTo(a, s),
          (qe = !1);
      });
    } else {
      const a = document.body,
        s = a.getAttribute('tabindex');
      (a.tabIndex = -1),
        a.focus({ preventScroll: !0, focusVisible: !1 }),
        s !== null ? a.setAttribute('tabindex', s) : a.removeAttribute('tabindex');
    }
    const r = getSelection();
    if (r && r.type !== 'None') {
      const a = [];
      for (let s = 0; s < r.rangeCount; s += 1) a.push(r.getRangeAt(s));
      setTimeout(() => {
        if (r.rangeCount === a.length) {
          for (let s = 0; s < r.rangeCount; s += 1) {
            const i = a[s],
              o = r.getRangeAt(s);
            if (
              i.commonAncestorContainer !== o.commonAncestorContainer ||
              i.startContainer !== o.startContainer ||
              i.endContainer !== o.endContainer ||
              i.startOffset !== o.startOffset ||
              i.endOffset !== o.endOffset
            )
              return;
          }
          r.removeAllRanges();
        }
      });
    }
  }
}
function Ze(e, t, n, r) {
  var c, l;
  let a, s;
  const i = new Promise((h, u) => {
    (a = h), (s = u);
  });
  return (
    i.catch(() => {}),
    {
      navigation: {
        from: { params: e.params, route: { id: ((c = e.route) == null ? void 0 : c.id) ?? null }, url: e.url },
        to: n && {
          params: (t == null ? void 0 : t.params) ?? null,
          route: { id: ((l = t == null ? void 0 : t.route) == null ? void 0 : l.id) ?? null },
          url: n
        },
        willUnload: !t,
        type: r,
        complete: i
      },
      fulfil: a,
      reject: s
    }
  );
}
function Qe(e) {
  return {
    data: e.data,
    error: e.error,
    form: e.form,
    params: e.params,
    route: e.route,
    state: e.state,
    status: e.status,
    url: e.url
  };
}
function Jn(e) {
  const t = new URL(e);
  return (t.hash = decodeURIComponent(e.hash)), t;
}
function Bt(e) {
  let t;
  if (k.hash) {
    const [, , n] = e.hash.split('#', 3);
    t = n ?? '';
  } else t = e.hash.slice(1);
  return decodeURIComponent(t);
}
{
  const e = console.warn;
  console.warn = function (...n) {
    (n.length === 1 &&
      /<(Layout|Page|Error)(_[\w$]+)?> was created (with unknown|without expected) prop '(data|form)'/.test(n[0])) ||
      e(...n);
  };
}
export { nr as a, Qn as l, P as p, D as s };
