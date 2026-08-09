import Vt, { app as Xe, BrowserWindow as Bl, Menu as Ms, ipcMain as te, dialog as tn, shell as Bs, clipboard as jl } from "electron";
import Ot from "fs";
import md from "constants";
import sr from "stream";
import Uo from "util";
import Hl from "assert";
import ne from "path";
import si from "child_process";
import ql from "events";
import ar from "crypto";
import Gl from "tty";
import ai from "os";
import It from "url";
import Vl from "zlib";
import gd from "http";
import { fileURLToPath as yd } from "node:url";
import $e from "node:path";
import rt from "node:fs";
import { execFile as Ed } from "node:child_process";
import wd from "webtorrent";
import _d from "node:os";
var Ie = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, Wl = {}, zt = {}, De = {};
De.fromCallback = function(e) {
  return Object.defineProperty(function(...t) {
    if (typeof t[t.length - 1] == "function") e.apply(this, t);
    else
      return new Promise((n, r) => {
        t.push((i, o) => i != null ? r(i) : n(o)), e.apply(this, t);
      });
  }, "name", { value: e.name });
};
De.fromPromise = function(e) {
  return Object.defineProperty(function(...t) {
    const n = t[t.length - 1];
    if (typeof n != "function") return e.apply(this, t);
    t.pop(), e.apply(this, t).then((r) => n(null, r), n);
  }, "name", { value: e.name });
};
var wt = md, vd = process.cwd, Vr = null, Td = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return Vr || (Vr = vd.call(process)), Vr;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var js = process.chdir;
  process.chdir = function(e) {
    Vr = null, js.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, js);
}
var Ad = Sd;
function Sd(e) {
  wt.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || n(e), e.chown = o(e.chown), e.fchown = o(e.fchown), e.lchown = o(e.lchown), e.chmod = r(e.chmod), e.fchmod = r(e.fchmod), e.lchmod = r(e.lchmod), e.chownSync = s(e.chownSync), e.fchownSync = s(e.fchownSync), e.lchownSync = s(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = a(e.stat), e.fstat = a(e.fstat), e.lstat = a(e.lstat), e.statSync = c(e.statSync), e.fstatSync = c(e.fstatSync), e.lstatSync = c(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(l, f, p) {
    p && process.nextTick(p);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(l, f, p, g) {
    g && process.nextTick(g);
  }, e.lchownSync = function() {
  }), Td === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(l) {
    function f(p, g, w) {
      var y = Date.now(), T = 0;
      l(p, g, function A(b) {
        if (b && (b.code === "EACCES" || b.code === "EPERM" || b.code === "EBUSY") && Date.now() - y < 6e4) {
          setTimeout(function() {
            e.stat(g, function(I, k) {
              I && I.code === "ENOENT" ? l(p, g, A) : w(b);
            });
          }, T), T < 100 && (T += 10);
          return;
        }
        w && w(b);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(f, l), f;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(l) {
    function f(p, g, w, y, T, A) {
      var b;
      if (A && typeof A == "function") {
        var I = 0;
        b = function(k, G, Z) {
          if (k && k.code === "EAGAIN" && I < 10)
            return I++, l.call(e, p, g, w, y, T, b);
          A.apply(this, arguments);
        };
      }
      return l.call(e, p, g, w, y, T, b);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(f, l), f;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(l) {
    return function(f, p, g, w, y) {
      for (var T = 0; ; )
        try {
          return l.call(e, f, p, g, w, y);
        } catch (A) {
          if (A.code === "EAGAIN" && T < 10) {
            T++;
            continue;
          }
          throw A;
        }
    };
  }(e.readSync);
  function t(l) {
    l.lchmod = function(f, p, g) {
      l.open(
        f,
        wt.O_WRONLY | wt.O_SYMLINK,
        p,
        function(w, y) {
          if (w) {
            g && g(w);
            return;
          }
          l.fchmod(y, p, function(T) {
            l.close(y, function(A) {
              g && g(T || A);
            });
          });
        }
      );
    }, l.lchmodSync = function(f, p) {
      var g = l.openSync(f, wt.O_WRONLY | wt.O_SYMLINK, p), w = !0, y;
      try {
        y = l.fchmodSync(g, p), w = !1;
      } finally {
        if (w)
          try {
            l.closeSync(g);
          } catch {
          }
        else
          l.closeSync(g);
      }
      return y;
    };
  }
  function n(l) {
    wt.hasOwnProperty("O_SYMLINK") && l.futimes ? (l.lutimes = function(f, p, g, w) {
      l.open(f, wt.O_SYMLINK, function(y, T) {
        if (y) {
          w && w(y);
          return;
        }
        l.futimes(T, p, g, function(A) {
          l.close(T, function(b) {
            w && w(A || b);
          });
        });
      });
    }, l.lutimesSync = function(f, p, g) {
      var w = l.openSync(f, wt.O_SYMLINK), y, T = !0;
      try {
        y = l.futimesSync(w, p, g), T = !1;
      } finally {
        if (T)
          try {
            l.closeSync(w);
          } catch {
          }
        else
          l.closeSync(w);
      }
      return y;
    }) : l.futimes && (l.lutimes = function(f, p, g, w) {
      w && process.nextTick(w);
    }, l.lutimesSync = function() {
    });
  }
  function r(l) {
    return l && function(f, p, g) {
      return l.call(e, f, p, function(w) {
        h(w) && (w = null), g && g.apply(this, arguments);
      });
    };
  }
  function i(l) {
    return l && function(f, p) {
      try {
        return l.call(e, f, p);
      } catch (g) {
        if (!h(g)) throw g;
      }
    };
  }
  function o(l) {
    return l && function(f, p, g, w) {
      return l.call(e, f, p, g, function(y) {
        h(y) && (y = null), w && w.apply(this, arguments);
      });
    };
  }
  function s(l) {
    return l && function(f, p, g) {
      try {
        return l.call(e, f, p, g);
      } catch (w) {
        if (!h(w)) throw w;
      }
    };
  }
  function a(l) {
    return l && function(f, p, g) {
      typeof p == "function" && (g = p, p = null);
      function w(y, T) {
        T && (T.uid < 0 && (T.uid += 4294967296), T.gid < 0 && (T.gid += 4294967296)), g && g.apply(this, arguments);
      }
      return p ? l.call(e, f, p, w) : l.call(e, f, w);
    };
  }
  function c(l) {
    return l && function(f, p) {
      var g = p ? l.call(e, f, p) : l.call(e, f);
      return g && (g.uid < 0 && (g.uid += 4294967296), g.gid < 0 && (g.gid += 4294967296)), g;
    };
  }
  function h(l) {
    if (!l || l.code === "ENOSYS")
      return !0;
    var f = !process.getuid || process.getuid() !== 0;
    return !!(f && (l.code === "EINVAL" || l.code === "EPERM"));
  }
}
var Hs = sr.Stream, bd = Cd;
function Cd(e) {
  return {
    ReadStream: t,
    WriteStream: n
  };
  function t(r, i) {
    if (!(this instanceof t)) return new t(r, i);
    Hs.call(this);
    var o = this;
    this.path = r, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
    for (var s = Object.keys(i), a = 0, c = s.length; a < c; a++) {
      var h = s[a];
      this[h] = i[h];
    }
    if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.end === void 0)
        this.end = 1 / 0;
      else if (typeof this.end != "number")
        throw TypeError("end must be a Number");
      if (this.start > this.end)
        throw new Error("start must be <= end");
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        o._read();
      });
      return;
    }
    e.open(this.path, this.flags, this.mode, function(l, f) {
      if (l) {
        o.emit("error", l), o.readable = !1;
        return;
      }
      o.fd = f, o.emit("open", f), o._read();
    });
  }
  function n(r, i) {
    if (!(this instanceof n)) return new n(r, i);
    Hs.call(this), this.path = r, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
    for (var o = Object.keys(i), s = 0, a = o.length; s < a; s++) {
      var c = o[s];
      this[c] = i[c];
    }
    if (this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.start < 0)
        throw new Error("start must be >= zero");
      this.pos = this.start;
    }
    this.busy = !1, this._queue = [], this.fd === null && (this._open = e.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
  }
}
var $d = Pd, Rd = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function Pd(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: Rd(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(n) {
    Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(e, n));
  }), t;
}
var se = Ot, Od = Ad, Id = bd, Nd = $d, Rr = Uo, ve, Xr;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (ve = Symbol.for("graceful-fs.queue"), Xr = Symbol.for("graceful-fs.previous")) : (ve = "___graceful-fs.queue", Xr = "___graceful-fs.previous");
function Dd() {
}
function zl(e, t) {
  Object.defineProperty(e, ve, {
    get: function() {
      return t;
    }
  });
}
var Gt = Dd;
Rr.debuglog ? Gt = Rr.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (Gt = function() {
  var e = Rr.format.apply(Rr, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!se[ve]) {
  var Fd = Ie[ve] || [];
  zl(se, Fd), se.close = function(e) {
    function t(n, r) {
      return e.call(se, n, function(i) {
        i || qs(), typeof r == "function" && r.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, Xr, {
      value: e
    }), t;
  }(se.close), se.closeSync = function(e) {
    function t(n) {
      e.apply(se, arguments), qs();
    }
    return Object.defineProperty(t, Xr, {
      value: e
    }), t;
  }(se.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    Gt(se[ve]), Hl.equal(se[ve].length, 0);
  });
}
Ie[ve] || zl(Ie, se[ve]);
var Fe = ko(Nd(se));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !se.__patched && (Fe = ko(se), se.__patched = !0);
function ko(e) {
  Od(e), e.gracefulify = ko, e.createReadStream = G, e.createWriteStream = Z;
  var t = e.readFile;
  e.readFile = n;
  function n(M, E, q) {
    return typeof E == "function" && (q = E, E = null), X(M, E, q);
    function X(re, P, R, N) {
      return t(re, P, function($) {
        $ && ($.code === "EMFILE" || $.code === "ENFILE") ? nn([X, [re, P, R], $, N || Date.now(), Date.now()]) : typeof R == "function" && R.apply(this, arguments);
      });
    }
  }
  var r = e.writeFile;
  e.writeFile = i;
  function i(M, E, q, X) {
    return typeof q == "function" && (X = q, q = null), re(M, E, q, X);
    function re(P, R, N, $, D) {
      return r(P, R, N, function(O) {
        O && (O.code === "EMFILE" || O.code === "ENFILE") ? nn([re, [P, R, N, $], O, D || Date.now(), Date.now()]) : typeof $ == "function" && $.apply(this, arguments);
      });
    }
  }
  var o = e.appendFile;
  o && (e.appendFile = s);
  function s(M, E, q, X) {
    return typeof q == "function" && (X = q, q = null), re(M, E, q, X);
    function re(P, R, N, $, D) {
      return o(P, R, N, function(O) {
        O && (O.code === "EMFILE" || O.code === "ENFILE") ? nn([re, [P, R, N, $], O, D || Date.now(), Date.now()]) : typeof $ == "function" && $.apply(this, arguments);
      });
    }
  }
  var a = e.copyFile;
  a && (e.copyFile = c);
  function c(M, E, q, X) {
    return typeof q == "function" && (X = q, q = 0), re(M, E, q, X);
    function re(P, R, N, $, D) {
      return a(P, R, N, function(O) {
        O && (O.code === "EMFILE" || O.code === "ENFILE") ? nn([re, [P, R, N, $], O, D || Date.now(), Date.now()]) : typeof $ == "function" && $.apply(this, arguments);
      });
    }
  }
  var h = e.readdir;
  e.readdir = f;
  var l = /^v[0-5]\./;
  function f(M, E, q) {
    typeof E == "function" && (q = E, E = null);
    var X = l.test(process.version) ? function(R, N, $, D) {
      return h(R, re(
        R,
        N,
        $,
        D
      ));
    } : function(R, N, $, D) {
      return h(R, N, re(
        R,
        N,
        $,
        D
      ));
    };
    return X(M, E, q);
    function re(P, R, N, $) {
      return function(D, O) {
        D && (D.code === "EMFILE" || D.code === "ENFILE") ? nn([
          X,
          [P, R, N],
          D,
          $ || Date.now(),
          Date.now()
        ]) : (O && O.sort && O.sort(), typeof N == "function" && N.call(this, D, O));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var p = Id(e);
    A = p.ReadStream, I = p.WriteStream;
  }
  var g = e.ReadStream;
  g && (A.prototype = Object.create(g.prototype), A.prototype.open = b);
  var w = e.WriteStream;
  w && (I.prototype = Object.create(w.prototype), I.prototype.open = k), Object.defineProperty(e, "ReadStream", {
    get: function() {
      return A;
    },
    set: function(M) {
      A = M;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "WriteStream", {
    get: function() {
      return I;
    },
    set: function(M) {
      I = M;
    },
    enumerable: !0,
    configurable: !0
  });
  var y = A;
  Object.defineProperty(e, "FileReadStream", {
    get: function() {
      return y;
    },
    set: function(M) {
      y = M;
    },
    enumerable: !0,
    configurable: !0
  });
  var T = I;
  Object.defineProperty(e, "FileWriteStream", {
    get: function() {
      return T;
    },
    set: function(M) {
      T = M;
    },
    enumerable: !0,
    configurable: !0
  });
  function A(M, E) {
    return this instanceof A ? (g.apply(this, arguments), this) : A.apply(Object.create(A.prototype), arguments);
  }
  function b() {
    var M = this;
    ce(M.path, M.flags, M.mode, function(E, q) {
      E ? (M.autoClose && M.destroy(), M.emit("error", E)) : (M.fd = q, M.emit("open", q), M.read());
    });
  }
  function I(M, E) {
    return this instanceof I ? (w.apply(this, arguments), this) : I.apply(Object.create(I.prototype), arguments);
  }
  function k() {
    var M = this;
    ce(M.path, M.flags, M.mode, function(E, q) {
      E ? (M.destroy(), M.emit("error", E)) : (M.fd = q, M.emit("open", q));
    });
  }
  function G(M, E) {
    return new e.ReadStream(M, E);
  }
  function Z(M, E) {
    return new e.WriteStream(M, E);
  }
  var ee = e.open;
  e.open = ce;
  function ce(M, E, q, X) {
    return typeof q == "function" && (X = q, q = null), re(M, E, q, X);
    function re(P, R, N, $, D) {
      return ee(P, R, N, function(O, B) {
        O && (O.code === "EMFILE" || O.code === "ENFILE") ? nn([re, [P, R, N, $], O, D || Date.now(), Date.now()]) : typeof $ == "function" && $.apply(this, arguments);
      });
    }
  }
  return e;
}
function nn(e) {
  Gt("ENQUEUE", e[0].name, e[1]), se[ve].push(e), Mo();
}
var Pr;
function qs() {
  for (var e = Date.now(), t = 0; t < se[ve].length; ++t)
    se[ve][t].length > 2 && (se[ve][t][3] = e, se[ve][t][4] = e);
  Mo();
}
function Mo() {
  if (clearTimeout(Pr), Pr = void 0, se[ve].length !== 0) {
    var e = se[ve].shift(), t = e[0], n = e[1], r = e[2], i = e[3], o = e[4];
    if (i === void 0)
      Gt("RETRY", t.name, n), t.apply(null, n);
    else if (Date.now() - i >= 6e4) {
      Gt("TIMEOUT", t.name, n);
      var s = n.pop();
      typeof s == "function" && s.call(null, r);
    } else {
      var a = Date.now() - o, c = Math.max(o - i, 1), h = Math.min(c * 1.2, 100);
      a >= h ? (Gt("RETRY", t.name, n), t.apply(null, n.concat([i]))) : se[ve].push(e);
    }
    Pr === void 0 && (Pr = setTimeout(Mo, 0));
  }
}
(function(e) {
  const t = De.fromCallback, n = Fe, r = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((i) => typeof n[i] == "function");
  Object.assign(e, n), r.forEach((i) => {
    e[i] = t(n[i]);
  }), e.exists = function(i, o) {
    return typeof o == "function" ? n.exists(i, o) : new Promise((s) => n.exists(i, s));
  }, e.read = function(i, o, s, a, c, h) {
    return typeof h == "function" ? n.read(i, o, s, a, c, h) : new Promise((l, f) => {
      n.read(i, o, s, a, c, (p, g, w) => {
        if (p) return f(p);
        l({ bytesRead: g, buffer: w });
      });
    });
  }, e.write = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? n.write(i, o, ...s) : new Promise((a, c) => {
      n.write(i, o, ...s, (h, l, f) => {
        if (h) return c(h);
        a({ bytesWritten: l, buffer: f });
      });
    });
  }, typeof n.writev == "function" && (e.writev = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? n.writev(i, o, ...s) : new Promise((a, c) => {
      n.writev(i, o, ...s, (h, l, f) => {
        if (h) return c(h);
        a({ bytesWritten: l, buffers: f });
      });
    });
  }), typeof n.realpath.native == "function" ? e.realpath.native = t(n.realpath.native) : process.emitWarning(
    "fs.realpath.native is not a function. Is fs being monkey-patched?",
    "Warning",
    "fs-extra-WARN0003"
  );
})(zt);
var Bo = {}, Yl = {};
const xd = ne;
Yl.checkPath = function(t) {
  if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(xd.parse(t).root, ""))) {
    const r = new Error(`Path contains invalid characters: ${t}`);
    throw r.code = "EINVAL", r;
  }
};
const Xl = zt, { checkPath: Kl } = Yl, Jl = (e) => {
  const t = { mode: 511 };
  return typeof e == "number" ? e : { ...t, ...e }.mode;
};
Bo.makeDir = async (e, t) => (Kl(e), Xl.mkdir(e, {
  mode: Jl(t),
  recursive: !0
}));
Bo.makeDirSync = (e, t) => (Kl(e), Xl.mkdirSync(e, {
  mode: Jl(t),
  recursive: !0
}));
const Ld = De.fromPromise, { makeDir: Ud, makeDirSync: ki } = Bo, Mi = Ld(Ud);
var lt = {
  mkdirs: Mi,
  mkdirsSync: ki,
  // alias
  mkdirp: Mi,
  mkdirpSync: ki,
  ensureDir: Mi,
  ensureDirSync: ki
};
const kd = De.fromPromise, Ql = zt;
function Md(e) {
  return Ql.access(e).then(() => !0).catch(() => !1);
}
var Yt = {
  pathExists: kd(Md),
  pathExistsSync: Ql.existsSync
};
const mn = Fe;
function Bd(e, t, n, r) {
  mn.open(e, "r+", (i, o) => {
    if (i) return r(i);
    mn.futimes(o, t, n, (s) => {
      mn.close(o, (a) => {
        r && r(s || a);
      });
    });
  });
}
function jd(e, t, n) {
  const r = mn.openSync(e, "r+");
  return mn.futimesSync(r, t, n), mn.closeSync(r);
}
var Zl = {
  utimesMillis: Bd,
  utimesMillisSync: jd
};
const En = zt, Ee = ne, Hd = Uo;
function qd(e, t, n) {
  const r = n.dereference ? (i) => En.stat(i, { bigint: !0 }) : (i) => En.lstat(i, { bigint: !0 });
  return Promise.all([
    r(e),
    r(t).catch((i) => {
      if (i.code === "ENOENT") return null;
      throw i;
    })
  ]).then(([i, o]) => ({ srcStat: i, destStat: o }));
}
function Gd(e, t, n) {
  let r;
  const i = n.dereference ? (s) => En.statSync(s, { bigint: !0 }) : (s) => En.lstatSync(s, { bigint: !0 }), o = i(e);
  try {
    r = i(t);
  } catch (s) {
    if (s.code === "ENOENT") return { srcStat: o, destStat: null };
    throw s;
  }
  return { srcStat: o, destStat: r };
}
function Vd(e, t, n, r, i) {
  Hd.callbackify(qd)(e, t, r, (o, s) => {
    if (o) return i(o);
    const { srcStat: a, destStat: c } = s;
    if (c) {
      if (lr(a, c)) {
        const h = Ee.basename(e), l = Ee.basename(t);
        return n === "move" && h !== l && h.toLowerCase() === l.toLowerCase() ? i(null, { srcStat: a, destStat: c, isChangingCase: !0 }) : i(new Error("Source and destination must not be the same."));
      }
      if (a.isDirectory() && !c.isDirectory())
        return i(new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`));
      if (!a.isDirectory() && c.isDirectory())
        return i(new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`));
    }
    return a.isDirectory() && jo(e, t) ? i(new Error(li(e, t, n))) : i(null, { srcStat: a, destStat: c });
  });
}
function Wd(e, t, n, r) {
  const { srcStat: i, destStat: o } = Gd(e, t, r);
  if (o) {
    if (lr(i, o)) {
      const s = Ee.basename(e), a = Ee.basename(t);
      if (n === "move" && s !== a && s.toLowerCase() === a.toLowerCase())
        return { srcStat: i, destStat: o, isChangingCase: !0 };
      throw new Error("Source and destination must not be the same.");
    }
    if (i.isDirectory() && !o.isDirectory())
      throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);
    if (!i.isDirectory() && o.isDirectory())
      throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`);
  }
  if (i.isDirectory() && jo(e, t))
    throw new Error(li(e, t, n));
  return { srcStat: i, destStat: o };
}
function ec(e, t, n, r, i) {
  const o = Ee.resolve(Ee.dirname(e)), s = Ee.resolve(Ee.dirname(n));
  if (s === o || s === Ee.parse(s).root) return i();
  En.stat(s, { bigint: !0 }, (a, c) => a ? a.code === "ENOENT" ? i() : i(a) : lr(t, c) ? i(new Error(li(e, n, r))) : ec(e, t, s, r, i));
}
function tc(e, t, n, r) {
  const i = Ee.resolve(Ee.dirname(e)), o = Ee.resolve(Ee.dirname(n));
  if (o === i || o === Ee.parse(o).root) return;
  let s;
  try {
    s = En.statSync(o, { bigint: !0 });
  } catch (a) {
    if (a.code === "ENOENT") return;
    throw a;
  }
  if (lr(t, s))
    throw new Error(li(e, n, r));
  return tc(e, t, o, r);
}
function lr(e, t) {
  return t.ino && t.dev && t.ino === e.ino && t.dev === e.dev;
}
function jo(e, t) {
  const n = Ee.resolve(e).split(Ee.sep).filter((i) => i), r = Ee.resolve(t).split(Ee.sep).filter((i) => i);
  return n.reduce((i, o, s) => i && r[s] === o, !0);
}
function li(e, t, n) {
  return `Cannot ${n} '${e}' to a subdirectory of itself, '${t}'.`;
}
var Tn = {
  checkPaths: Vd,
  checkPathsSync: Wd,
  checkParentPaths: ec,
  checkParentPathsSync: tc,
  isSrcSubdir: jo,
  areIdentical: lr
};
const Ue = Fe, Vn = ne, zd = lt.mkdirs, Yd = Yt.pathExists, Xd = Zl.utimesMillis, Wn = Tn;
function Kd(e, t, n, r) {
  typeof n == "function" && !r ? (r = n, n = {}) : typeof n == "function" && (n = { filter: n }), r = r || function() {
  }, n = n || {}, n.clobber = "clobber" in n ? !!n.clobber : !0, n.overwrite = "overwrite" in n ? !!n.overwrite : n.clobber, n.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0001"
  ), Wn.checkPaths(e, t, "copy", n, (i, o) => {
    if (i) return r(i);
    const { srcStat: s, destStat: a } = o;
    Wn.checkParentPaths(e, s, t, "copy", (c) => c ? r(c) : n.filter ? nc(Gs, a, e, t, n, r) : Gs(a, e, t, n, r));
  });
}
function Gs(e, t, n, r, i) {
  const o = Vn.dirname(n);
  Yd(o, (s, a) => {
    if (s) return i(s);
    if (a) return Kr(e, t, n, r, i);
    zd(o, (c) => c ? i(c) : Kr(e, t, n, r, i));
  });
}
function nc(e, t, n, r, i, o) {
  Promise.resolve(i.filter(n, r)).then((s) => s ? e(t, n, r, i, o) : o(), (s) => o(s));
}
function Jd(e, t, n, r, i) {
  return r.filter ? nc(Kr, e, t, n, r, i) : Kr(e, t, n, r, i);
}
function Kr(e, t, n, r, i) {
  (r.dereference ? Ue.stat : Ue.lstat)(t, (s, a) => s ? i(s) : a.isDirectory() ? ih(a, e, t, n, r, i) : a.isFile() || a.isCharacterDevice() || a.isBlockDevice() ? Qd(a, e, t, n, r, i) : a.isSymbolicLink() ? ah(e, t, n, r, i) : a.isSocket() ? i(new Error(`Cannot copy a socket file: ${t}`)) : a.isFIFO() ? i(new Error(`Cannot copy a FIFO pipe: ${t}`)) : i(new Error(`Unknown file: ${t}`)));
}
function Qd(e, t, n, r, i, o) {
  return t ? Zd(e, n, r, i, o) : rc(e, n, r, i, o);
}
function Zd(e, t, n, r, i) {
  if (r.overwrite)
    Ue.unlink(n, (o) => o ? i(o) : rc(e, t, n, r, i));
  else return r.errorOnExist ? i(new Error(`'${n}' already exists`)) : i();
}
function rc(e, t, n, r, i) {
  Ue.copyFile(t, n, (o) => o ? i(o) : r.preserveTimestamps ? eh(e.mode, t, n, i) : ci(n, e.mode, i));
}
function eh(e, t, n, r) {
  return th(e) ? nh(n, e, (i) => i ? r(i) : Vs(e, t, n, r)) : Vs(e, t, n, r);
}
function th(e) {
  return (e & 128) === 0;
}
function nh(e, t, n) {
  return ci(e, t | 128, n);
}
function Vs(e, t, n, r) {
  rh(t, n, (i) => i ? r(i) : ci(n, e, r));
}
function ci(e, t, n) {
  return Ue.chmod(e, t, n);
}
function rh(e, t, n) {
  Ue.stat(e, (r, i) => r ? n(r) : Xd(t, i.atime, i.mtime, n));
}
function ih(e, t, n, r, i, o) {
  return t ? ic(n, r, i, o) : oh(e.mode, n, r, i, o);
}
function oh(e, t, n, r, i) {
  Ue.mkdir(n, (o) => {
    if (o) return i(o);
    ic(t, n, r, (s) => s ? i(s) : ci(n, e, i));
  });
}
function ic(e, t, n, r) {
  Ue.readdir(e, (i, o) => i ? r(i) : oc(o, e, t, n, r));
}
function oc(e, t, n, r, i) {
  const o = e.pop();
  return o ? sh(e, o, t, n, r, i) : i();
}
function sh(e, t, n, r, i, o) {
  const s = Vn.join(n, t), a = Vn.join(r, t);
  Wn.checkPaths(s, a, "copy", i, (c, h) => {
    if (c) return o(c);
    const { destStat: l } = h;
    Jd(l, s, a, i, (f) => f ? o(f) : oc(e, n, r, i, o));
  });
}
function ah(e, t, n, r, i) {
  Ue.readlink(t, (o, s) => {
    if (o) return i(o);
    if (r.dereference && (s = Vn.resolve(process.cwd(), s)), e)
      Ue.readlink(n, (a, c) => a ? a.code === "EINVAL" || a.code === "UNKNOWN" ? Ue.symlink(s, n, i) : i(a) : (r.dereference && (c = Vn.resolve(process.cwd(), c)), Wn.isSrcSubdir(s, c) ? i(new Error(`Cannot copy '${s}' to a subdirectory of itself, '${c}'.`)) : e.isDirectory() && Wn.isSrcSubdir(c, s) ? i(new Error(`Cannot overwrite '${c}' with '${s}'.`)) : lh(s, n, i)));
    else
      return Ue.symlink(s, n, i);
  });
}
function lh(e, t, n) {
  Ue.unlink(t, (r) => r ? n(r) : Ue.symlink(e, t, n));
}
var ch = Kd;
const Re = Fe, zn = ne, uh = lt.mkdirsSync, fh = Zl.utimesMillisSync, Yn = Tn;
function dh(e, t, n) {
  typeof n == "function" && (n = { filter: n }), n = n || {}, n.clobber = "clobber" in n ? !!n.clobber : !0, n.overwrite = "overwrite" in n ? !!n.overwrite : n.clobber, n.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0002"
  );
  const { srcStat: r, destStat: i } = Yn.checkPathsSync(e, t, "copy", n);
  return Yn.checkParentPathsSync(e, r, t, "copy"), hh(i, e, t, n);
}
function hh(e, t, n, r) {
  if (r.filter && !r.filter(t, n)) return;
  const i = zn.dirname(n);
  return Re.existsSync(i) || uh(i), sc(e, t, n, r);
}
function ph(e, t, n, r) {
  if (!(r.filter && !r.filter(t, n)))
    return sc(e, t, n, r);
}
function sc(e, t, n, r) {
  const o = (r.dereference ? Re.statSync : Re.lstatSync)(t);
  if (o.isDirectory()) return vh(o, e, t, n, r);
  if (o.isFile() || o.isCharacterDevice() || o.isBlockDevice()) return mh(o, e, t, n, r);
  if (o.isSymbolicLink()) return Sh(e, t, n, r);
  throw o.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : o.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
}
function mh(e, t, n, r, i) {
  return t ? gh(e, n, r, i) : ac(e, n, r, i);
}
function gh(e, t, n, r) {
  if (r.overwrite)
    return Re.unlinkSync(n), ac(e, t, n, r);
  if (r.errorOnExist)
    throw new Error(`'${n}' already exists`);
}
function ac(e, t, n, r) {
  return Re.copyFileSync(t, n), r.preserveTimestamps && yh(e.mode, t, n), Ho(n, e.mode);
}
function yh(e, t, n) {
  return Eh(e) && wh(n, e), _h(t, n);
}
function Eh(e) {
  return (e & 128) === 0;
}
function wh(e, t) {
  return Ho(e, t | 128);
}
function Ho(e, t) {
  return Re.chmodSync(e, t);
}
function _h(e, t) {
  const n = Re.statSync(e);
  return fh(t, n.atime, n.mtime);
}
function vh(e, t, n, r, i) {
  return t ? lc(n, r, i) : Th(e.mode, n, r, i);
}
function Th(e, t, n, r) {
  return Re.mkdirSync(n), lc(t, n, r), Ho(n, e);
}
function lc(e, t, n) {
  Re.readdirSync(e).forEach((r) => Ah(r, e, t, n));
}
function Ah(e, t, n, r) {
  const i = zn.join(t, e), o = zn.join(n, e), { destStat: s } = Yn.checkPathsSync(i, o, "copy", r);
  return ph(s, i, o, r);
}
function Sh(e, t, n, r) {
  let i = Re.readlinkSync(t);
  if (r.dereference && (i = zn.resolve(process.cwd(), i)), e) {
    let o;
    try {
      o = Re.readlinkSync(n);
    } catch (s) {
      if (s.code === "EINVAL" || s.code === "UNKNOWN") return Re.symlinkSync(i, n);
      throw s;
    }
    if (r.dereference && (o = zn.resolve(process.cwd(), o)), Yn.isSrcSubdir(i, o))
      throw new Error(`Cannot copy '${i}' to a subdirectory of itself, '${o}'.`);
    if (Re.statSync(n).isDirectory() && Yn.isSrcSubdir(o, i))
      throw new Error(`Cannot overwrite '${o}' with '${i}'.`);
    return bh(i, n);
  } else
    return Re.symlinkSync(i, n);
}
function bh(e, t) {
  return Re.unlinkSync(t), Re.symlinkSync(e, t);
}
var Ch = dh;
const $h = De.fromCallback;
var qo = {
  copy: $h(ch),
  copySync: Ch
};
const Ws = Fe, cc = ne, J = Hl, Xn = process.platform === "win32";
function uc(e) {
  [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ].forEach((n) => {
    e[n] = e[n] || Ws[n], n = n + "Sync", e[n] = e[n] || Ws[n];
  }), e.maxBusyTries = e.maxBusyTries || 3;
}
function Go(e, t, n) {
  let r = 0;
  typeof t == "function" && (n = t, t = {}), J(e, "rimraf: missing path"), J.strictEqual(typeof e, "string", "rimraf: path should be a string"), J.strictEqual(typeof n, "function", "rimraf: callback function required"), J(t, "rimraf: invalid options argument provided"), J.strictEqual(typeof t, "object", "rimraf: options should be object"), uc(t), zs(e, t, function i(o) {
    if (o) {
      if ((o.code === "EBUSY" || o.code === "ENOTEMPTY" || o.code === "EPERM") && r < t.maxBusyTries) {
        r++;
        const s = r * 100;
        return setTimeout(() => zs(e, t, i), s);
      }
      o.code === "ENOENT" && (o = null);
    }
    n(o);
  });
}
function zs(e, t, n) {
  J(e), J(t), J(typeof n == "function"), t.lstat(e, (r, i) => {
    if (r && r.code === "ENOENT")
      return n(null);
    if (r && r.code === "EPERM" && Xn)
      return Ys(e, t, r, n);
    if (i && i.isDirectory())
      return Wr(e, t, r, n);
    t.unlink(e, (o) => {
      if (o) {
        if (o.code === "ENOENT")
          return n(null);
        if (o.code === "EPERM")
          return Xn ? Ys(e, t, o, n) : Wr(e, t, o, n);
        if (o.code === "EISDIR")
          return Wr(e, t, o, n);
      }
      return n(o);
    });
  });
}
function Ys(e, t, n, r) {
  J(e), J(t), J(typeof r == "function"), t.chmod(e, 438, (i) => {
    i ? r(i.code === "ENOENT" ? null : n) : t.stat(e, (o, s) => {
      o ? r(o.code === "ENOENT" ? null : n) : s.isDirectory() ? Wr(e, t, n, r) : t.unlink(e, r);
    });
  });
}
function Xs(e, t, n) {
  let r;
  J(e), J(t);
  try {
    t.chmodSync(e, 438);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw n;
  }
  try {
    r = t.statSync(e);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw n;
  }
  r.isDirectory() ? zr(e, t, n) : t.unlinkSync(e);
}
function Wr(e, t, n, r) {
  J(e), J(t), J(typeof r == "function"), t.rmdir(e, (i) => {
    i && (i.code === "ENOTEMPTY" || i.code === "EEXIST" || i.code === "EPERM") ? Rh(e, t, r) : i && i.code === "ENOTDIR" ? r(n) : r(i);
  });
}
function Rh(e, t, n) {
  J(e), J(t), J(typeof n == "function"), t.readdir(e, (r, i) => {
    if (r) return n(r);
    let o = i.length, s;
    if (o === 0) return t.rmdir(e, n);
    i.forEach((a) => {
      Go(cc.join(e, a), t, (c) => {
        if (!s) {
          if (c) return n(s = c);
          --o === 0 && t.rmdir(e, n);
        }
      });
    });
  });
}
function fc(e, t) {
  let n;
  t = t || {}, uc(t), J(e, "rimraf: missing path"), J.strictEqual(typeof e, "string", "rimraf: path should be a string"), J(t, "rimraf: missing options"), J.strictEqual(typeof t, "object", "rimraf: options should be object");
  try {
    n = t.lstatSync(e);
  } catch (r) {
    if (r.code === "ENOENT")
      return;
    r.code === "EPERM" && Xn && Xs(e, t, r);
  }
  try {
    n && n.isDirectory() ? zr(e, t, null) : t.unlinkSync(e);
  } catch (r) {
    if (r.code === "ENOENT")
      return;
    if (r.code === "EPERM")
      return Xn ? Xs(e, t, r) : zr(e, t, r);
    if (r.code !== "EISDIR")
      throw r;
    zr(e, t, r);
  }
}
function zr(e, t, n) {
  J(e), J(t);
  try {
    t.rmdirSync(e);
  } catch (r) {
    if (r.code === "ENOTDIR")
      throw n;
    if (r.code === "ENOTEMPTY" || r.code === "EEXIST" || r.code === "EPERM")
      Ph(e, t);
    else if (r.code !== "ENOENT")
      throw r;
  }
}
function Ph(e, t) {
  if (J(e), J(t), t.readdirSync(e).forEach((n) => fc(cc.join(e, n), t)), Xn) {
    const n = Date.now();
    do
      try {
        return t.rmdirSync(e, t);
      } catch {
      }
    while (Date.now() - n < 500);
  } else
    return t.rmdirSync(e, t);
}
var Oh = Go;
Go.sync = fc;
const Jr = Fe, Ih = De.fromCallback, dc = Oh;
function Nh(e, t) {
  if (Jr.rm) return Jr.rm(e, { recursive: !0, force: !0 }, t);
  dc(e, t);
}
function Dh(e) {
  if (Jr.rmSync) return Jr.rmSync(e, { recursive: !0, force: !0 });
  dc.sync(e);
}
var ui = {
  remove: Ih(Nh),
  removeSync: Dh
};
const Fh = De.fromPromise, hc = zt, pc = ne, mc = lt, gc = ui, Ks = Fh(async function(t) {
  let n;
  try {
    n = await hc.readdir(t);
  } catch {
    return mc.mkdirs(t);
  }
  return Promise.all(n.map((r) => gc.remove(pc.join(t, r))));
});
function Js(e) {
  let t;
  try {
    t = hc.readdirSync(e);
  } catch {
    return mc.mkdirsSync(e);
  }
  t.forEach((n) => {
    n = pc.join(e, n), gc.removeSync(n);
  });
}
var xh = {
  emptyDirSync: Js,
  emptydirSync: Js,
  emptyDir: Ks,
  emptydir: Ks
};
const Lh = De.fromCallback, yc = ne, At = Fe, Ec = lt;
function Uh(e, t) {
  function n() {
    At.writeFile(e, "", (r) => {
      if (r) return t(r);
      t();
    });
  }
  At.stat(e, (r, i) => {
    if (!r && i.isFile()) return t();
    const o = yc.dirname(e);
    At.stat(o, (s, a) => {
      if (s)
        return s.code === "ENOENT" ? Ec.mkdirs(o, (c) => {
          if (c) return t(c);
          n();
        }) : t(s);
      a.isDirectory() ? n() : At.readdir(o, (c) => {
        if (c) return t(c);
      });
    });
  });
}
function kh(e) {
  let t;
  try {
    t = At.statSync(e);
  } catch {
  }
  if (t && t.isFile()) return;
  const n = yc.dirname(e);
  try {
    At.statSync(n).isDirectory() || At.readdirSync(n);
  } catch (r) {
    if (r && r.code === "ENOENT") Ec.mkdirsSync(n);
    else throw r;
  }
  At.writeFileSync(e, "");
}
var Mh = {
  createFile: Lh(Uh),
  createFileSync: kh
};
const Bh = De.fromCallback, wc = ne, Tt = Fe, _c = lt, jh = Yt.pathExists, { areIdentical: vc } = Tn;
function Hh(e, t, n) {
  function r(i, o) {
    Tt.link(i, o, (s) => {
      if (s) return n(s);
      n(null);
    });
  }
  Tt.lstat(t, (i, o) => {
    Tt.lstat(e, (s, a) => {
      if (s)
        return s.message = s.message.replace("lstat", "ensureLink"), n(s);
      if (o && vc(a, o)) return n(null);
      const c = wc.dirname(t);
      jh(c, (h, l) => {
        if (h) return n(h);
        if (l) return r(e, t);
        _c.mkdirs(c, (f) => {
          if (f) return n(f);
          r(e, t);
        });
      });
    });
  });
}
function qh(e, t) {
  let n;
  try {
    n = Tt.lstatSync(t);
  } catch {
  }
  try {
    const o = Tt.lstatSync(e);
    if (n && vc(o, n)) return;
  } catch (o) {
    throw o.message = o.message.replace("lstat", "ensureLink"), o;
  }
  const r = wc.dirname(t);
  return Tt.existsSync(r) || _c.mkdirsSync(r), Tt.linkSync(e, t);
}
var Gh = {
  createLink: Bh(Hh),
  createLinkSync: qh
};
const St = ne, Bn = Fe, Vh = Yt.pathExists;
function Wh(e, t, n) {
  if (St.isAbsolute(e))
    return Bn.lstat(e, (r) => r ? (r.message = r.message.replace("lstat", "ensureSymlink"), n(r)) : n(null, {
      toCwd: e,
      toDst: e
    }));
  {
    const r = St.dirname(t), i = St.join(r, e);
    return Vh(i, (o, s) => o ? n(o) : s ? n(null, {
      toCwd: i,
      toDst: e
    }) : Bn.lstat(e, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), n(a)) : n(null, {
      toCwd: e,
      toDst: St.relative(r, e)
    })));
  }
}
function zh(e, t) {
  let n;
  if (St.isAbsolute(e)) {
    if (n = Bn.existsSync(e), !n) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: e,
      toDst: e
    };
  } else {
    const r = St.dirname(t), i = St.join(r, e);
    if (n = Bn.existsSync(i), n)
      return {
        toCwd: i,
        toDst: e
      };
    if (n = Bn.existsSync(e), !n) throw new Error("relative srcpath does not exist");
    return {
      toCwd: e,
      toDst: St.relative(r, e)
    };
  }
}
var Yh = {
  symlinkPaths: Wh,
  symlinkPathsSync: zh
};
const Tc = Fe;
function Xh(e, t, n) {
  if (n = typeof t == "function" ? t : n, t = typeof t == "function" ? !1 : t, t) return n(null, t);
  Tc.lstat(e, (r, i) => {
    if (r) return n(null, "file");
    t = i && i.isDirectory() ? "dir" : "file", n(null, t);
  });
}
function Kh(e, t) {
  let n;
  if (t) return t;
  try {
    n = Tc.lstatSync(e);
  } catch {
    return "file";
  }
  return n && n.isDirectory() ? "dir" : "file";
}
var Jh = {
  symlinkType: Xh,
  symlinkTypeSync: Kh
};
const Qh = De.fromCallback, Ac = ne, Ye = zt, Sc = lt, Zh = Sc.mkdirs, ep = Sc.mkdirsSync, bc = Yh, tp = bc.symlinkPaths, np = bc.symlinkPathsSync, Cc = Jh, rp = Cc.symlinkType, ip = Cc.symlinkTypeSync, op = Yt.pathExists, { areIdentical: $c } = Tn;
function sp(e, t, n, r) {
  r = typeof n == "function" ? n : r, n = typeof n == "function" ? !1 : n, Ye.lstat(t, (i, o) => {
    !i && o.isSymbolicLink() ? Promise.all([
      Ye.stat(e),
      Ye.stat(t)
    ]).then(([s, a]) => {
      if ($c(s, a)) return r(null);
      Qs(e, t, n, r);
    }) : Qs(e, t, n, r);
  });
}
function Qs(e, t, n, r) {
  tp(e, t, (i, o) => {
    if (i) return r(i);
    e = o.toDst, rp(o.toCwd, n, (s, a) => {
      if (s) return r(s);
      const c = Ac.dirname(t);
      op(c, (h, l) => {
        if (h) return r(h);
        if (l) return Ye.symlink(e, t, a, r);
        Zh(c, (f) => {
          if (f) return r(f);
          Ye.symlink(e, t, a, r);
        });
      });
    });
  });
}
function ap(e, t, n) {
  let r;
  try {
    r = Ye.lstatSync(t);
  } catch {
  }
  if (r && r.isSymbolicLink()) {
    const a = Ye.statSync(e), c = Ye.statSync(t);
    if ($c(a, c)) return;
  }
  const i = np(e, t);
  e = i.toDst, n = ip(i.toCwd, n);
  const o = Ac.dirname(t);
  return Ye.existsSync(o) || ep(o), Ye.symlinkSync(e, t, n);
}
var lp = {
  createSymlink: Qh(sp),
  createSymlinkSync: ap
};
const { createFile: Zs, createFileSync: ea } = Mh, { createLink: ta, createLinkSync: na } = Gh, { createSymlink: ra, createSymlinkSync: ia } = lp;
var cp = {
  // file
  createFile: Zs,
  createFileSync: ea,
  ensureFile: Zs,
  ensureFileSync: ea,
  // link
  createLink: ta,
  createLinkSync: na,
  ensureLink: ta,
  ensureLinkSync: na,
  // symlink
  createSymlink: ra,
  createSymlinkSync: ia,
  ensureSymlink: ra,
  ensureSymlinkSync: ia
};
function up(e, { EOL: t = `
`, finalEOL: n = !0, replacer: r = null, spaces: i } = {}) {
  const o = n ? t : "", s = JSON.stringify(e, r, i);
  if (s === void 0)
    throw new TypeError(`Converting ${typeof e} value to JSON is not supported`);
  return s.replace(/\n/g, t) + o;
}
function fp(e) {
  return Buffer.isBuffer(e) && (e = e.toString("utf8")), e.replace(/^\uFEFF/, "");
}
var Vo = { stringify: up, stripBom: fp };
let wn;
try {
  wn = Fe;
} catch {
  wn = Ot;
}
const fi = De, { stringify: Rc, stripBom: Pc } = Vo;
async function dp(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const n = t.fs || wn, r = "throws" in t ? t.throws : !0;
  let i = await fi.fromCallback(n.readFile)(e, t);
  i = Pc(i);
  let o;
  try {
    o = JSON.parse(i, t ? t.reviver : null);
  } catch (s) {
    if (r)
      throw s.message = `${e}: ${s.message}`, s;
    return null;
  }
  return o;
}
const hp = fi.fromPromise(dp);
function pp(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const n = t.fs || wn, r = "throws" in t ? t.throws : !0;
  try {
    let i = n.readFileSync(e, t);
    return i = Pc(i), JSON.parse(i, t.reviver);
  } catch (i) {
    if (r)
      throw i.message = `${e}: ${i.message}`, i;
    return null;
  }
}
async function mp(e, t, n = {}) {
  const r = n.fs || wn, i = Rc(t, n);
  await fi.fromCallback(r.writeFile)(e, i, n);
}
const gp = fi.fromPromise(mp);
function yp(e, t, n = {}) {
  const r = n.fs || wn, i = Rc(t, n);
  return r.writeFileSync(e, i, n);
}
var Ep = {
  readFile: hp,
  readFileSync: pp,
  writeFile: gp,
  writeFileSync: yp
};
const Or = Ep;
var wp = {
  // jsonfile exports
  readJson: Or.readFile,
  readJsonSync: Or.readFileSync,
  writeJson: Or.writeFile,
  writeJsonSync: Or.writeFileSync
};
const _p = De.fromCallback, jn = Fe, Oc = ne, Ic = lt, vp = Yt.pathExists;
function Tp(e, t, n, r) {
  typeof n == "function" && (r = n, n = "utf8");
  const i = Oc.dirname(e);
  vp(i, (o, s) => {
    if (o) return r(o);
    if (s) return jn.writeFile(e, t, n, r);
    Ic.mkdirs(i, (a) => {
      if (a) return r(a);
      jn.writeFile(e, t, n, r);
    });
  });
}
function Ap(e, ...t) {
  const n = Oc.dirname(e);
  if (jn.existsSync(n))
    return jn.writeFileSync(e, ...t);
  Ic.mkdirsSync(n), jn.writeFileSync(e, ...t);
}
var Wo = {
  outputFile: _p(Tp),
  outputFileSync: Ap
};
const { stringify: Sp } = Vo, { outputFile: bp } = Wo;
async function Cp(e, t, n = {}) {
  const r = Sp(t, n);
  await bp(e, r, n);
}
var $p = Cp;
const { stringify: Rp } = Vo, { outputFileSync: Pp } = Wo;
function Op(e, t, n) {
  const r = Rp(t, n);
  Pp(e, r, n);
}
var Ip = Op;
const Np = De.fromPromise, Ne = wp;
Ne.outputJson = Np($p);
Ne.outputJsonSync = Ip;
Ne.outputJSON = Ne.outputJson;
Ne.outputJSONSync = Ne.outputJsonSync;
Ne.writeJSON = Ne.writeJson;
Ne.writeJSONSync = Ne.writeJsonSync;
Ne.readJSON = Ne.readJson;
Ne.readJSONSync = Ne.readJsonSync;
var Dp = Ne;
const Fp = Fe, vo = ne, xp = qo.copy, Nc = ui.remove, Lp = lt.mkdirp, Up = Yt.pathExists, oa = Tn;
function kp(e, t, n, r) {
  typeof n == "function" && (r = n, n = {}), n = n || {};
  const i = n.overwrite || n.clobber || !1;
  oa.checkPaths(e, t, "move", n, (o, s) => {
    if (o) return r(o);
    const { srcStat: a, isChangingCase: c = !1 } = s;
    oa.checkParentPaths(e, a, t, "move", (h) => {
      if (h) return r(h);
      if (Mp(t)) return sa(e, t, i, c, r);
      Lp(vo.dirname(t), (l) => l ? r(l) : sa(e, t, i, c, r));
    });
  });
}
function Mp(e) {
  const t = vo.dirname(e);
  return vo.parse(t).root === t;
}
function sa(e, t, n, r, i) {
  if (r) return Bi(e, t, n, i);
  if (n)
    return Nc(t, (o) => o ? i(o) : Bi(e, t, n, i));
  Up(t, (o, s) => o ? i(o) : s ? i(new Error("dest already exists.")) : Bi(e, t, n, i));
}
function Bi(e, t, n, r) {
  Fp.rename(e, t, (i) => i ? i.code !== "EXDEV" ? r(i) : Bp(e, t, n, r) : r());
}
function Bp(e, t, n, r) {
  xp(e, t, {
    overwrite: n,
    errorOnExist: !0
  }, (o) => o ? r(o) : Nc(e, r));
}
var jp = kp;
const Dc = Fe, To = ne, Hp = qo.copySync, Fc = ui.removeSync, qp = lt.mkdirpSync, aa = Tn;
function Gp(e, t, n) {
  n = n || {};
  const r = n.overwrite || n.clobber || !1, { srcStat: i, isChangingCase: o = !1 } = aa.checkPathsSync(e, t, "move", n);
  return aa.checkParentPathsSync(e, i, t, "move"), Vp(t) || qp(To.dirname(t)), Wp(e, t, r, o);
}
function Vp(e) {
  const t = To.dirname(e);
  return To.parse(t).root === t;
}
function Wp(e, t, n, r) {
  if (r) return ji(e, t, n);
  if (n)
    return Fc(t), ji(e, t, n);
  if (Dc.existsSync(t)) throw new Error("dest already exists.");
  return ji(e, t, n);
}
function ji(e, t, n) {
  try {
    Dc.renameSync(e, t);
  } catch (r) {
    if (r.code !== "EXDEV") throw r;
    return zp(e, t, n);
  }
}
function zp(e, t, n) {
  return Hp(e, t, {
    overwrite: n,
    errorOnExist: !0
  }), Fc(e);
}
var Yp = Gp;
const Xp = De.fromCallback;
var Kp = {
  move: Xp(jp),
  moveSync: Yp
}, Nt = {
  // Export promiseified graceful-fs:
  ...zt,
  // Export extra methods:
  ...qo,
  ...xh,
  ...cp,
  ...Dp,
  ...lt,
  ...Kp,
  ...Wo,
  ...Yt,
  ...ui
}, Xt = {}, Ct = {}, ge = {}, $t = {};
Object.defineProperty($t, "__esModule", { value: !0 });
$t.CancellationError = $t.CancellationToken = void 0;
const Jp = ql;
class Qp extends Jp.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(t) {
    this.removeParentCancelHandler(), this._parent = t, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(t) {
    super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, t != null && (this.parent = t);
  }
  cancel() {
    this._cancelled = !0, this.emit("cancel");
  }
  onCancel(t) {
    this.cancelled ? t() : this.once("cancel", t);
  }
  createPromise(t) {
    if (this.cancelled)
      return Promise.reject(new Ao());
    const n = () => {
      if (r != null)
        try {
          this.removeListener("cancel", r), r = null;
        } catch {
        }
    };
    let r = null;
    return new Promise((i, o) => {
      let s = null;
      if (r = () => {
        try {
          s != null && (s(), s = null);
        } finally {
          o(new Ao());
        }
      }, this.cancelled) {
        r();
        return;
      }
      this.onCancel(r), t(i, o, (a) => {
        s = a;
      });
    }).then((i) => (n(), i)).catch((i) => {
      throw n(), i;
    });
  }
  removeParentCancelHandler() {
    const t = this._parent;
    t != null && this.parentCancelHandler != null && (t.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners(), this._parent = null;
    }
  }
}
$t.CancellationToken = Qp;
class Ao extends Error {
  constructor() {
    super("cancelled");
  }
}
$t.CancellationError = Ao;
var An = {};
Object.defineProperty(An, "__esModule", { value: !0 });
An.newError = Zp;
function Zp(e, t) {
  const n = new Error(e);
  return n.code = t, n;
}
var me = {}, So = { exports: {} }, Ir = { exports: {} }, Hi, la;
function em() {
  if (la) return Hi;
  la = 1;
  var e = 1e3, t = e * 60, n = t * 60, r = n * 24, i = r * 7, o = r * 365.25;
  Hi = function(l, f) {
    f = f || {};
    var p = typeof l;
    if (p === "string" && l.length > 0)
      return s(l);
    if (p === "number" && isFinite(l))
      return f.long ? c(l) : a(l);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(l)
    );
  };
  function s(l) {
    if (l = String(l), !(l.length > 100)) {
      var f = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        l
      );
      if (f) {
        var p = parseFloat(f[1]), g = (f[2] || "ms").toLowerCase();
        switch (g) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return p * o;
          case "weeks":
          case "week":
          case "w":
            return p * i;
          case "days":
          case "day":
          case "d":
            return p * r;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return p * n;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return p * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return p * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return p;
          default:
            return;
        }
      }
    }
  }
  function a(l) {
    var f = Math.abs(l);
    return f >= r ? Math.round(l / r) + "d" : f >= n ? Math.round(l / n) + "h" : f >= t ? Math.round(l / t) + "m" : f >= e ? Math.round(l / e) + "s" : l + "ms";
  }
  function c(l) {
    var f = Math.abs(l);
    return f >= r ? h(l, f, r, "day") : f >= n ? h(l, f, n, "hour") : f >= t ? h(l, f, t, "minute") : f >= e ? h(l, f, e, "second") : l + " ms";
  }
  function h(l, f, p, g) {
    var w = f >= p * 1.5;
    return Math.round(l / p) + " " + g + (w ? "s" : "");
  }
  return Hi;
}
var qi, ca;
function xc() {
  if (ca) return qi;
  ca = 1;
  function e(t) {
    r.debug = r, r.default = r, r.coerce = h, r.disable = a, r.enable = o, r.enabled = c, r.humanize = em(), r.destroy = l, Object.keys(t).forEach((f) => {
      r[f] = t[f];
    }), r.names = [], r.skips = [], r.formatters = {};
    function n(f) {
      let p = 0;
      for (let g = 0; g < f.length; g++)
        p = (p << 5) - p + f.charCodeAt(g), p |= 0;
      return r.colors[Math.abs(p) % r.colors.length];
    }
    r.selectColor = n;
    function r(f) {
      let p, g = null, w, y;
      function T(...A) {
        if (!T.enabled)
          return;
        const b = T, I = Number(/* @__PURE__ */ new Date()), k = I - (p || I);
        b.diff = k, b.prev = p, b.curr = I, p = I, A[0] = r.coerce(A[0]), typeof A[0] != "string" && A.unshift("%O");
        let G = 0;
        A[0] = A[0].replace(/%([a-zA-Z%])/g, (ee, ce) => {
          if (ee === "%%")
            return "%";
          G++;
          const M = r.formatters[ce];
          if (typeof M == "function") {
            const E = A[G];
            ee = M.call(b, E), A.splice(G, 1), G--;
          }
          return ee;
        }), r.formatArgs.call(b, A), (b.log || r.log).apply(b, A);
      }
      return T.namespace = f, T.useColors = r.useColors(), T.color = r.selectColor(f), T.extend = i, T.destroy = r.destroy, Object.defineProperty(T, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => g !== null ? g : (w !== r.namespaces && (w = r.namespaces, y = r.enabled(f)), y),
        set: (A) => {
          g = A;
        }
      }), typeof r.init == "function" && r.init(T), T;
    }
    function i(f, p) {
      const g = r(this.namespace + (typeof p > "u" ? ":" : p) + f);
      return g.log = this.log, g;
    }
    function o(f) {
      r.save(f), r.namespaces = f, r.names = [], r.skips = [];
      const p = (typeof f == "string" ? f : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const g of p)
        g[0] === "-" ? r.skips.push(g.slice(1)) : r.names.push(g);
    }
    function s(f, p) {
      let g = 0, w = 0, y = -1, T = 0;
      for (; g < f.length; )
        if (w < p.length && (p[w] === f[g] || p[w] === "*"))
          p[w] === "*" ? (y = w, T = g, w++) : (g++, w++);
        else if (y !== -1)
          w = y + 1, T++, g = T;
        else
          return !1;
      for (; w < p.length && p[w] === "*"; )
        w++;
      return w === p.length;
    }
    function a() {
      const f = [
        ...r.names,
        ...r.skips.map((p) => "-" + p)
      ].join(",");
      return r.enable(""), f;
    }
    function c(f) {
      for (const p of r.skips)
        if (s(f, p))
          return !1;
      for (const p of r.names)
        if (s(f, p))
          return !0;
      return !1;
    }
    function h(f) {
      return f instanceof Error ? f.stack || f.message : f;
    }
    function l() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return r.enable(r.load()), r;
  }
  return qi = e, qi;
}
var ua;
function tm() {
  return ua || (ua = 1, function(e, t) {
    t.formatArgs = r, t.save = i, t.load = o, t.useColors = n, t.storage = s(), t.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), t.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function n() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function r(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const h = "color: " + this.color;
      c.splice(1, 0, h, "color: inherit");
      let l = 0, f = 0;
      c[0].replace(/%[a-zA-Z%]/g, (p) => {
        p !== "%%" && (l++, p === "%c" && (f = l));
      }), c.splice(f, 0, h);
    }
    t.log = console.debug || console.log || (() => {
    });
    function i(c) {
      try {
        c ? t.storage.setItem("debug", c) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function o() {
      let c;
      try {
        c = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function s() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = xc()(t);
    const { formatters: a } = e.exports;
    a.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (h) {
        return "[UnexpectedJSONParseError]: " + h.message;
      }
    };
  }(Ir, Ir.exports)), Ir.exports;
}
var Nr = { exports: {} }, Gi, fa;
function nm() {
  return fa || (fa = 1, Gi = (e, t = process.argv) => {
    const n = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", r = t.indexOf(n + e), i = t.indexOf("--");
    return r !== -1 && (i === -1 || r < i);
  }), Gi;
}
var Vi, da;
function rm() {
  if (da) return Vi;
  da = 1;
  const e = ai, t = Gl, n = nm(), { env: r } = process;
  let i;
  n("no-color") || n("no-colors") || n("color=false") || n("color=never") ? i = 0 : (n("color") || n("colors") || n("color=true") || n("color=always")) && (i = 1), "FORCE_COLOR" in r && (r.FORCE_COLOR === "true" ? i = 1 : r.FORCE_COLOR === "false" ? i = 0 : i = r.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(r.FORCE_COLOR, 10), 3));
  function o(c) {
    return c === 0 ? !1 : {
      level: c,
      hasBasic: !0,
      has256: c >= 2,
      has16m: c >= 3
    };
  }
  function s(c, h) {
    if (i === 0)
      return 0;
    if (n("color=16m") || n("color=full") || n("color=truecolor"))
      return 3;
    if (n("color=256"))
      return 2;
    if (c && !h && i === void 0)
      return 0;
    const l = i || 0;
    if (r.TERM === "dumb")
      return l;
    if (process.platform === "win32") {
      const f = e.release().split(".");
      return Number(f[0]) >= 10 && Number(f[2]) >= 10586 ? Number(f[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in r)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((f) => f in r) || r.CI_NAME === "codeship" ? 1 : l;
    if ("TEAMCITY_VERSION" in r)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(r.TEAMCITY_VERSION) ? 1 : 0;
    if (r.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in r) {
      const f = parseInt((r.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (r.TERM_PROGRAM) {
        case "iTerm.app":
          return f >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(r.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(r.TERM) || "COLORTERM" in r ? 1 : l;
  }
  function a(c) {
    const h = s(c, c && c.isTTY);
    return o(h);
  }
  return Vi = {
    supportsColor: a,
    stdout: o(s(!0, t.isatty(1))),
    stderr: o(s(!0, t.isatty(2)))
  }, Vi;
}
var ha;
function im() {
  return ha || (ha = 1, function(e, t) {
    const n = Gl, r = Uo;
    t.init = l, t.log = a, t.formatArgs = o, t.save = c, t.load = h, t.useColors = i, t.destroy = r.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const p = rm();
      p && (p.stderr || p).level >= 2 && (t.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    t.inspectOpts = Object.keys(process.env).filter((p) => /^debug_/i.test(p)).reduce((p, g) => {
      const w = g.substring(6).toLowerCase().replace(/_([a-z])/g, (T, A) => A.toUpperCase());
      let y = process.env[g];
      return /^(yes|on|true|enabled)$/i.test(y) ? y = !0 : /^(no|off|false|disabled)$/i.test(y) ? y = !1 : y === "null" ? y = null : y = Number(y), p[w] = y, p;
    }, {});
    function i() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : n.isatty(process.stderr.fd);
    }
    function o(p) {
      const { namespace: g, useColors: w } = this;
      if (w) {
        const y = this.color, T = "\x1B[3" + (y < 8 ? y : "8;5;" + y), A = `  ${T};1m${g} \x1B[0m`;
        p[0] = A + p[0].split(`
`).join(`
` + A), p.push(T + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        p[0] = s() + g + " " + p[0];
    }
    function s() {
      return t.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function a(...p) {
      return process.stderr.write(r.formatWithOptions(t.inspectOpts, ...p) + `
`);
    }
    function c(p) {
      p ? process.env.DEBUG = p : delete process.env.DEBUG;
    }
    function h() {
      return process.env.DEBUG;
    }
    function l(p) {
      p.inspectOpts = {};
      const g = Object.keys(t.inspectOpts);
      for (let w = 0; w < g.length; w++)
        p.inspectOpts[g[w]] = t.inspectOpts[g[w]];
    }
    e.exports = xc()(t);
    const { formatters: f } = e.exports;
    f.o = function(p) {
      return this.inspectOpts.colors = this.useColors, r.inspect(p, this.inspectOpts).split(`
`).map((g) => g.trim()).join(" ");
    }, f.O = function(p) {
      return this.inspectOpts.colors = this.useColors, r.inspect(p, this.inspectOpts);
    };
  }(Nr, Nr.exports)), Nr.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? So.exports = tm() : So.exports = im();
var om = So.exports, cr = {};
Object.defineProperty(cr, "__esModule", { value: !0 });
cr.ProgressCallbackTransform = void 0;
const sm = sr;
class am extends sm.Transform {
  constructor(t, n, r) {
    super(), this.total = t, this.cancellationToken = n, this.onProgress = r, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, n, r) {
    if (this.cancellationToken.cancelled) {
      r(new Error("cancelled"), null);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.total * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), r(null, t);
  }
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, t(null);
  }
}
cr.ProgressCallbackTransform = am;
Object.defineProperty(me, "__esModule", { value: !0 });
me.DigestTransform = me.HttpExecutor = me.HttpError = void 0;
me.addSensitiveRedirectHeader = pm;
me.addSensitiveFieldPattern = mm;
me.createHttpError = Co;
me.parseJson = ym;
me.configureRequestOptionsFromUrl = Bc;
me.configureRequestUrl = Xo;
me.safeGetHeader = gn;
me.configureRequestOptions = Qr;
me.isSensitiveFieldName = jc;
me.hashSensitiveValue = Hc;
me.safeStringifyJson = un;
const Lc = ar, lm = om, cm = Ot, um = sr, bo = It, fm = $t, pa = An, dm = cr, _t = (0, lm.default)("electron-builder"), zo = (e) => e.toLowerCase().replace(/[-_]/g, ""), Uc = /* @__PURE__ */ new Set(["authorization", "proxyauthorization", "privatetoken", "xapikey", "xauthtoken", "xaccesstoken", "xgitlabtoken", "cookie", "xcsrftoken"]), kc = ["token", "password", "secret", "authorization", "credential", "apikey", "passphrase", "auth"], hm = ["key"];
function pm(e) {
  Uc.add(zo(e));
}
function mm(e) {
  kc.push(e.toLowerCase().replace(/[-_]/g, ""));
}
function Co(e, t = null) {
  return new Yo(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + un(e.headers), t);
}
const gm = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class Yo extends Error {
  constructor(t, n = `HTTP error: ${gm.get(t) || t}`, r = null) {
    super(n), this.statusCode = t, this.description = r, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
me.HttpError = Yo;
function ym(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class cn {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, n = new fm.CancellationToken(), r) {
    Qr(t);
    const i = r == null ? void 0 : JSON.stringify(r), o = i ? Buffer.from(i) : void 0;
    if (o != null) {
      _t.enabled && _t(un(r));
      const { headers: s, ...a } = t;
      t = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": o.length,
          ...s
        },
        ...a
      };
    }
    return this.doApiRequest(t, n, (s) => s.end(o));
  }
  doApiRequest(t, n, r, i = 0) {
    if (_t.enabled) {
      const { headers: o, auth: s, ...a } = t;
      _t(`Request: ${un(a)}`);
    }
    return n.createPromise((o, s, a) => {
      const c = this.createRequest(t, (h) => {
        try {
          this.handleResponse(h, t, n, o, s, i, r);
        } catch (l) {
          s(l);
        }
      });
      this.addErrorAndTimeoutHandlers(c, s, t.timeout), this.addRedirectHandlers(c, t, s, i, (h) => {
        this.doApiRequest(h, n, r, i).then(o).catch(s);
      }), r(c, s), a(() => c.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(t, n, r, i, o) {
  }
  addErrorAndTimeoutHandlers(t, n, r = 60 * 1e3) {
    this.addTimeOutHandler(t, n, r), t.on("error", n), t.on("aborted", () => {
      n(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(t, n, r, i, o, s, a) {
    var c;
    if (_t.enabled) {
      const { headers: g, auth: w, ...y } = n;
      _t(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${un(y)}`);
    }
    if (t.statusCode === 404) {
      o(Co(t, `method: ${n.method || "GET"} url: ${n.protocol || "https:"}//${n.hostname}${n.port ? `:${n.port}` : ""}${n.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      i();
      return;
    }
    const h = (c = t.statusCode) !== null && c !== void 0 ? c : 0, l = h >= 300 && h < 400, f = gn(t, "location");
    if (l && f != null) {
      if (s > this.maxRedirects) {
        o(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(cn.prepareRedirectUrlOptions(f, n), r, a, s).then(i).catch(o);
      return;
    }
    t.setEncoding("utf8");
    let p = "";
    t.on("error", o), t.on("data", (g) => p += g), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const g = gn(t, "content-type"), w = g != null && (Array.isArray(g) ? g.find((y) => y.includes("json")) != null : g.includes("json"));
          o(Co(t, `method: ${n.method || "GET"} url: ${n.protocol || "https:"}//${n.hostname}${n.port ? `:${n.port}` : ""}${n.path}

          Data:
          ${w ? un(JSON.parse(p)) : p}
          `));
        } else
          i(p.length === 0 ? null : p);
      } catch (g) {
        o(g);
      }
    });
  }
  async downloadToBuffer(t, n) {
    return await n.cancellationToken.createPromise((r, i, o) => {
      const s = [], a = {
        headers: n.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      Xo(t, a), Qr(a), this.doDownload(a, {
        destination: null,
        options: n,
        onCancel: o,
        callback: (c) => {
          c == null ? r(Buffer.concat(s)) : i(c);
        },
        responseHandler: (c, h) => {
          let l = 0;
          c.on("data", (f) => {
            if (l += f.length, l > 524288e3) {
              h(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            s.push(f);
          }), c.on("end", () => {
            h(null);
          });
        }
      }, 0);
    });
  }
  doDownload(t, n, r) {
    const i = this.createRequest(t, (o) => {
      if (o.statusCode >= 400) {
        n.callback(new Error(`Cannot download "${t.protocol || "https:"}//${t.hostname}${t.path}", status ${o.statusCode}: ${o.statusMessage}`));
        return;
      }
      o.on("error", n.callback);
      const s = gn(o, "location");
      if (s != null) {
        r < this.maxRedirects ? this.doDownload(cn.prepareRedirectUrlOptions(s, t), n, r++) : n.callback(this.createMaxRedirectError());
        return;
      }
      n.responseHandler == null ? wm(n, o) : n.responseHandler(o, n.callback);
    });
    this.addErrorAndTimeoutHandlers(i, n.callback, t.timeout), this.addRedirectHandlers(i, t, n.callback, r, (o) => {
      this.doDownload(o, n, r++);
    }), i.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(t, n, r) {
    t.on("socket", (i) => {
      i.setTimeout(r, () => {
        t.abort(), n(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(t, n) {
    const r = Bc(t, { ...n }), i = r.headers;
    if (i == null)
      return r;
    const o = cn.reconstructOriginalUrl(n), s = Mc(t, n);
    if (cn.isCrossOriginRedirect(o, s)) {
      _t.enabled && _t(`Cross-origin redirect (${o.host} → ${s.host}): stripping sensitive headers`);
      for (const a of Object.keys(i))
        Uc.has(zo(a)) && delete i[a];
    }
    return r;
  }
  static reconstructOriginalUrl(t) {
    const n = t.protocol || "https:";
    if (!t.hostname)
      throw new Error("Missing hostname in request options");
    const r = t.hostname, i = t.port ? `:${t.port}` : "", o = t.path || "/";
    return new bo.URL(`${n}//${r}${i}${o}`);
  }
  static isCrossOriginRedirect(t, n) {
    if (t.hostname.toLowerCase() !== n.hostname.toLowerCase())
      return !0;
    if (t.protocol === "http:" && // This can be replaced with `!originalUrl.port`, but for the sake of clarity.
    ["80", ""].includes(t.port) && n.protocol === "https:" && // This can be replaced with `!redirectUrl.port`, but for the sake of clarity.
    ["443", ""].includes(n.port))
      return !1;
    if (t.protocol !== n.protocol)
      return !0;
    const r = t.port, i = n.port;
    return r !== i;
  }
  static async retryOnServerError(t, n = 3) {
    for (let r = 0; ; r++)
      try {
        return await t();
      } catch (i) {
        if (r < n && (i instanceof Yo && i.isServerError() || i.code === "EPIPE")) {
          await new Promise((o) => setTimeout(o, 1e3 * (r + 1)));
          continue;
        }
        throw i;
      }
  }
}
me.HttpExecutor = cn;
function Mc(e, t) {
  try {
    return new bo.URL(e);
  } catch {
    const n = t.hostname, r = t.protocol || "https:", i = t.port ? `:${t.port}` : "", o = `${r}//${n}${i}`;
    return new bo.URL(e, o);
  }
}
function Bc(e, t) {
  const n = Qr(t), r = Mc(e, t);
  return Xo(r, n), n;
}
function Xo(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class $o extends um.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, n = "sha512", r = "base64") {
    super(), this.expected = t, this.algorithm = n, this.encoding = r, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, Lc.createHash)(n);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(t, n, r) {
    this.digester.update(t), r(null, t);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(t) {
    if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
      try {
        this.validate();
      } catch (n) {
        t(n);
        return;
      }
    t(null);
  }
  validate() {
    if (this._actual == null)
      throw (0, pa.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, pa.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
me.DigestTransform = $o;
function Em(e, t, n) {
  return e != null && t != null && e !== t ? (n(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function gn(e, t) {
  const n = e.headers[t];
  return n == null ? null : Array.isArray(n) ? n.length === 0 ? null : n[n.length - 1] : n;
}
function wm(e, t) {
  if (!Em(gn(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const n = [];
  if (e.options.onProgress != null) {
    const s = gn(t, "content-length");
    s != null && n.push(new dm.ProgressCallbackTransform(parseInt(s, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const r = e.options.sha512;
  r != null ? n.push(new $o(r, "sha512", r.length === 128 && !r.includes("+") && !r.includes("Z") && !r.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && n.push(new $o(e.options.sha2, "sha256", "hex"));
  const i = (0, cm.createWriteStream)(e.destination);
  n.push(i);
  let o = t;
  for (const s of n)
    s.on("error", (a) => {
      i.close(), e.options.cancellationToken.cancelled || e.callback(a);
    }), o = o.pipe(s);
  i.on("finish", () => {
    i.close(e.callback);
  });
}
function Qr(e, t, n) {
  n != null && (e.method = n), e.headers = { ...e.headers };
  const r = e.headers;
  return t != null && (r.authorization = t.startsWith("Basic") || t.startsWith("Bearer") ? t : `token ${t}`), r["User-Agent"] == null && (r["User-Agent"] = "electron-builder"), (n == null || n === "GET" || r["Cache-Control"] == null) && (r["Cache-Control"] = "no-cache"), e.protocol == null && process.versions.electron != null && (e.protocol = "https:"), e;
}
function jc(e) {
  const t = zo(e);
  return kc.some((n) => t.includes(n)) || hm.some((n) => t.endsWith(n));
}
function Hc(e) {
  return `${(0, Lc.createHash)("sha256").update(e).digest("hex")} (sha256 hash)`;
}
function un(e, t) {
  return JSON.stringify(e, (n, r) => jc(n) || t != null && t.has(n) ? typeof r == "string" ? Hc(r) : "<stripped sensitive data>" : r, 2);
}
var di = {};
Object.defineProperty(di, "__esModule", { value: !0 });
di.MemoLazy = void 0;
class _m {
  constructor(t, n) {
    this.selector = t, this.creator = n, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && qc(this.selected, t))
      return this._value;
    this.selected = t;
    const n = this.creator(t);
    return this.value = n, n;
  }
  set value(t) {
    this._value = t;
  }
}
di.MemoLazy = _m;
function qc(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const i = Object.keys(e), o = Object.keys(t);
    return i.length === o.length && i.every((s) => qc(e[s], t[s]));
  }
  return e === t;
}
var ur = {};
Object.defineProperty(ur, "__esModule", { value: !0 });
ur.githubUrl = vm;
ur.githubTagPrefix = Tm;
ur.getS3LikeProviderBaseUrl = Am;
function vm(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function Tm(e) {
  var t;
  return e.tagNamePrefix ? e.tagNamePrefix : !((t = e.vPrefixedTagName) !== null && t !== void 0) || t ? "v" : "";
}
function Am(e) {
  const t = e.provider;
  if (t === "s3")
    return Sm(e);
  if (t === "spaces")
    return bm(e);
  throw new Error(`Not supported provider: ${t}`);
}
function Sm(e) {
  let t;
  if (e.accelerate == !0)
    t = `https://${e.bucket}.s3-accelerate.amazonaws.com`;
  else if (e.endpoint != null)
    t = `${e.endpoint}/${e.bucket}`;
  else if (e.bucket.includes(".")) {
    if (e.region == null)
      throw new Error(`Bucket name "${e.bucket}" includes a dot, but S3 region is missing`);
    e.region === "us-east-1" ? t = `https://s3.amazonaws.com/${e.bucket}` : t = `https://s3-${e.region}.amazonaws.com/${e.bucket}`;
  } else e.region === "cn-north-1" ? t = `https://${e.bucket}.s3.${e.region}.amazonaws.com.cn` : t = `https://${e.bucket}.s3.amazonaws.com`;
  return Gc(t, e.path);
}
function Gc(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function bm(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return Gc(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var Ko = {};
Object.defineProperty(Ko, "__esModule", { value: !0 });
Ko.retry = Vc;
const Cm = $t;
async function Vc(e, t) {
  var n;
  const { retries: r, interval: i, backoff: o = 0, attempt: s = 0, shouldRetry: a, cancellationToken: c = new Cm.CancellationToken() } = t;
  try {
    return await e();
  } catch (h) {
    if (await Promise.resolve((n = a?.(h)) !== null && n !== void 0 ? n : !0) && r > 0 && !c.cancelled)
      return await new Promise((l) => setTimeout(l, i + o * s)), await Vc(e, { ...t, retries: r - 1, attempt: s + 1 });
    throw h;
  }
}
var Jo = {};
Object.defineProperty(Jo, "__esModule", { value: !0 });
Jo.parseDn = $m;
function $m(e) {
  let t = !1, n = null, r = "", i = 0;
  e = e.trim();
  const o = /* @__PURE__ */ new Map();
  for (let s = 0; s <= e.length; s++) {
    if (s === e.length) {
      n !== null && o.set(n, r);
      break;
    }
    const a = e[s];
    if (t) {
      if (a === '"') {
        t = !1;
        continue;
      }
    } else {
      if (a === '"') {
        t = !0;
        continue;
      }
      if (a === "\\") {
        s++;
        const c = parseInt(e.slice(s, s + 2), 16);
        Number.isNaN(c) ? r += e[s] : (s++, r += String.fromCharCode(c));
        continue;
      }
      if (n === null && a === "=") {
        n = r, r = "";
        continue;
      }
      if (a === "," || a === ";" || a === "+") {
        n !== null && o.set(n, r), n = null, r = "";
        continue;
      }
    }
    if (a === " " && !t) {
      if (r.length === 0)
        continue;
      if (s > i) {
        let c = s;
        for (; e[c] === " "; )
          c++;
        i = c;
      }
      if (i >= e.length || e[i] === "," || e[i] === ";" || n === null && e[i] === "=" || n !== null && e[i] === "+") {
        s = i - 1;
        continue;
      }
    }
    r += a;
  }
  return o;
}
var _n = {};
Object.defineProperty(_n, "__esModule", { value: !0 });
_n.nil = _n.UUID = void 0;
const Wc = ar, zc = An, Rm = "options.name must be either a string or a Buffer", ma = (0, Wc.randomBytes)(16);
ma[0] = ma[0] | 1;
const Yr = {}, z = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  Yr[t] = e, z[e] = t;
}
class Wt {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const n = Wt.check(t);
    if (!n)
      throw new Error("not a UUID");
    this.version = n.version, n.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, n) {
    return Pm(t, "sha1", 80, n);
  }
  toString() {
    return this.ascii == null && (this.ascii = Om(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, n = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: (Yr[t[14] + t[15]] & 240) >> 4,
        variant: ga((Yr[t[19] + t[20]] & 224) >> 5),
        format: "ascii"
      } : !1;
    if (Buffer.isBuffer(t)) {
      if (t.length < n + 16)
        return !1;
      let r = 0;
      for (; r < 16 && t[n + r] === 0; r++)
        ;
      return r === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
        version: (t[n + 6] & 240) >> 4,
        variant: ga((t[n + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, zc.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(t) {
    const n = Buffer.allocUnsafe(16);
    let r = 0;
    for (let i = 0; i < 16; i++)
      n[i] = Yr[t[r++] + t[r++]], (i === 3 || i === 5 || i === 7 || i === 9) && (r += 1);
    return n;
  }
}
_n.UUID = Wt;
Wt.OID = Wt.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function ga(e) {
  switch (e) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var Hn;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})(Hn || (Hn = {}));
function Pm(e, t, n, r, i = Hn.ASCII) {
  const o = (0, Wc.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, zc.newError)(Rm, "ERR_INVALID_UUID_NAME");
  o.update(r), o.update(e);
  const a = o.digest();
  let c;
  switch (i) {
    case Hn.BINARY:
      a[6] = a[6] & 15 | n, a[8] = a[8] & 63 | 128, c = a;
      break;
    case Hn.OBJECT:
      a[6] = a[6] & 15 | n, a[8] = a[8] & 63 | 128, c = new Wt(a);
      break;
    default:
      c = z[a[0]] + z[a[1]] + z[a[2]] + z[a[3]] + "-" + z[a[4]] + z[a[5]] + "-" + z[a[6] & 15 | n] + z[a[7]] + "-" + z[a[8] & 63 | 128] + z[a[9]] + "-" + z[a[10]] + z[a[11]] + z[a[12]] + z[a[13]] + z[a[14]] + z[a[15]];
      break;
  }
  return c;
}
function Om(e) {
  return z[e[0]] + z[e[1]] + z[e[2]] + z[e[3]] + "-" + z[e[4]] + z[e[5]] + "-" + z[e[6]] + z[e[7]] + "-" + z[e[8]] + z[e[9]] + "-" + z[e[10]] + z[e[11]] + z[e[12]] + z[e[13]] + z[e[14]] + z[e[15]];
}
_n.nil = new Wt("00000000-0000-0000-0000-000000000000");
var fr = {}, Yc = {};
(function(e) {
  (function(t) {
    t.parser = function(d, u) {
      return new r(d, u);
    }, t.SAXParser = r, t.SAXStream = f, t.createStream = h, t.MAX_BUFFER_LENGTH = 64 * 1024;
    var n = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    t.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function r(d, u) {
      if (!(this instanceof r))
        return new r(d, u);
      var S = this;
      o(S), S.q = S.c = "", S.bufferCheckPosition = t.MAX_BUFFER_LENGTH, S.encoding = null, S.opt = u || {}, S.opt.lowercase = S.opt.lowercase || S.opt.lowercasetags, S.looseCase = S.opt.lowercase ? "toLowerCase" : "toUpperCase", S.opt.maxEntityCount = S.opt.maxEntityCount || 512, S.opt.maxEntityDepth = S.opt.maxEntityDepth || 4, S.entityCount = S.entityDepth = 0, S.tags = [], S.closed = S.closedRoot = S.sawRoot = !1, S.tag = S.error = null, S.strict = !!d, S.noscript = !!(d || S.opt.noscript), S.state = E.BEGIN, S.strictEntities = S.opt.strictEntities, S.ENTITIES = S.strictEntities ? Object.create(t.XML_ENTITIES) : Object.create(t.ENTITIES), S.attribList = [], S.opt.xmlns && (S.ns = Object.create(T)), S.opt.unquotedAttributeValues === void 0 && (S.opt.unquotedAttributeValues = !d), S.trackPosition = S.opt.position !== !1, S.trackPosition && (S.position = S.line = S.column = 0), X(S, "onready");
    }
    Object.create || (Object.create = function(d) {
      function u() {
      }
      u.prototype = d;
      var S = new u();
      return S;
    }), Object.keys || (Object.keys = function(d) {
      var u = [];
      for (var S in d) d.hasOwnProperty(S) && u.push(S);
      return u;
    });
    function i(d) {
      for (var u = Math.max(t.MAX_BUFFER_LENGTH, 10), S = 0, _ = 0, Y = n.length; _ < Y; _++) {
        var ie = d[n[_]].length;
        if (ie > u)
          switch (n[_]) {
            case "textNode":
              D(d);
              break;
            case "cdata":
              $(d, "oncdata", d.cdata), d.cdata = "";
              break;
            case "script":
              $(d, "onscript", d.script), d.script = "";
              break;
            default:
              B(d, "Max buffer length exceeded: " + n[_]);
          }
        S = Math.max(S, ie);
      }
      var ue = t.MAX_BUFFER_LENGTH - S;
      d.bufferCheckPosition = ue + d.position;
    }
    function o(d) {
      for (var u = 0, S = n.length; u < S; u++)
        d[n[u]] = "";
    }
    function s(d) {
      D(d), d.cdata !== "" && ($(d, "oncdata", d.cdata), d.cdata = ""), d.script !== "" && ($(d, "onscript", d.script), d.script = "");
    }
    r.prototype = {
      end: function() {
        W(this);
      },
      write: Pn,
      resume: function() {
        return this.error = null, this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        s(this);
      }
    };
    var a;
    try {
      a = require("stream").Stream;
    } catch {
      a = function() {
      };
    }
    a || (a = function() {
    });
    var c = t.EVENTS.filter(function(d) {
      return d !== "error" && d !== "end";
    });
    function h(d, u) {
      return new f(d, u);
    }
    function l(d, u) {
      if (d.length >= 2) {
        if (d[0] === 255 && d[1] === 254)
          return "utf-16le";
        if (d[0] === 254 && d[1] === 255)
          return "utf-16be";
      }
      return d.length >= 3 && d[0] === 239 && d[1] === 187 && d[2] === 191 ? "utf8" : d.length >= 4 ? d[0] === 60 && d[1] === 0 && d[2] === 63 && d[3] === 0 ? "utf-16le" : d[0] === 0 && d[1] === 60 && d[2] === 0 && d[3] === 63 ? "utf-16be" : "utf8" : u ? "utf8" : null;
    }
    function f(d, u) {
      if (!(this instanceof f))
        return new f(d, u);
      a.apply(this), this._parser = new r(d, u), this.writable = !0, this.readable = !0;
      var S = this;
      this._parser.onend = function() {
        S.emit("end");
      }, this._parser.onerror = function(_) {
        S.emit("error", _), S._parser.error = null;
      }, this._decoder = null, this._decoderBuffer = null, c.forEach(function(_) {
        Object.defineProperty(S, "on" + _, {
          get: function() {
            return S._parser["on" + _];
          },
          set: function(Y) {
            if (!Y)
              return S.removeAllListeners(_), S._parser["on" + _] = Y, Y;
            S.on(_, Y);
          },
          enumerable: !0,
          configurable: !1
        });
      });
    }
    f.prototype = Object.create(a.prototype, {
      constructor: {
        value: f
      }
    }), f.prototype._decodeBuffer = function(d, u) {
      if (this._decoderBuffer && (d = Buffer.concat([this._decoderBuffer, d]), this._decoderBuffer = null), !this._decoder) {
        var S = l(d, u);
        if (!S)
          return this._decoderBuffer = d, "";
        this._parser.encoding = S, this._decoder = new TextDecoder(S);
      }
      return this._decoder.decode(d, { stream: !u });
    }, f.prototype.write = function(d) {
      if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(d))
        d = this._decodeBuffer(d, !1);
      else if (this._decoderBuffer) {
        var u = this._decodeBuffer(Buffer.alloc(0), !0);
        u && (this._parser.write(u), this.emit("data", u));
      }
      return this._parser.write(d.toString()), this.emit("data", d), !0;
    }, f.prototype.end = function(d) {
      if (d && d.length && this.write(d), this._decoderBuffer) {
        var u = this._decodeBuffer(Buffer.alloc(0), !0);
        u && (this._parser.write(u), this.emit("data", u));
      } else if (this._decoder) {
        var S = this._decoder.decode();
        S && (this._parser.write(S), this.emit("data", S));
      }
      return this._parser.end(), !0;
    }, f.prototype.on = function(d, u) {
      var S = this;
      return !S._parser["on" + d] && c.indexOf(d) !== -1 && (S._parser["on" + d] = function() {
        var _ = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        _.splice(0, 0, d), S.emit.apply(S, _);
      }), a.prototype.on.call(S, d, u);
    };
    var p = /^\[CDATA\[$/i, g = /^DOCTYPE$/i, w = "http://www.w3.org/XML/1998/namespace", y = "http://www.w3.org/2000/xmlns/", T = { xml: w, xmlns: y }, A = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, b = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, I = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, k = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function G(d) {
      return d === " " || d === `
` || d === "\r" || d === "	";
    }
    function Z(d) {
      return d === '"' || d === "'";
    }
    function ee(d) {
      return d === ">" || G(d);
    }
    function ce(d, u) {
      return d.test(u);
    }
    function M(d, u) {
      return !ce(d, u);
    }
    var E = 0;
    t.STATE = {
      BEGIN: E++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: E++,
      // leading whitespace
      TEXT: E++,
      // general stuff
      TEXT_ENTITY: E++,
      // &amp and such.
      OPEN_WAKA: E++,
      // <
      SGML_DECL: E++,
      // <!BLARG
      SGML_DECL_QUOTED: E++,
      // <!BLARG foo "bar
      DOCTYPE: E++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: E++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: E++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: E++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: E++,
      // <!-
      COMMENT: E++,
      // <!--
      COMMENT_ENDING: E++,
      // <!-- blah -
      COMMENT_ENDED: E++,
      // <!-- blah --
      CDATA: E++,
      // <![CDATA[ something
      CDATA_ENDING: E++,
      // ]
      CDATA_ENDING_2: E++,
      // ]]
      PROC_INST: E++,
      // <?hi
      PROC_INST_BODY: E++,
      // <?hi there
      PROC_INST_ENDING: E++,
      // <?hi "there" ?
      OPEN_TAG: E++,
      // <strong
      OPEN_TAG_SLASH: E++,
      // <strong /
      ATTRIB: E++,
      // <a
      ATTRIB_NAME: E++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: E++,
      // <a foo _
      ATTRIB_VALUE: E++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: E++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: E++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: E++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: E++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: E++,
      // <foo bar=&quot
      CLOSE_TAG: E++,
      // </a
      CLOSE_TAG_SAW_WHITE: E++,
      // </a   >
      SCRIPT: E++,
      // <script> ...
      SCRIPT_ENDING: E++
      // <script> ... <
    }, t.XML_ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    }), t.ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    }), Object.keys(t.ENTITIES).forEach(function(d) {
      var u = t.ENTITIES[d], S = typeof u == "number" ? String.fromCharCode(u) : u;
      t.ENTITIES[d] = S;
    });
    for (var q in t.STATE)
      t.STATE[t.STATE[q]] = q;
    E = t.STATE;
    function X(d, u, S) {
      d[u] && d[u](S);
    }
    function re(d) {
      var u = d && d.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
      return u ? u[2] : null;
    }
    function P(d) {
      return d ? d.toLowerCase().replace(/[^a-z0-9]/g, "") : null;
    }
    function R(d, u) {
      const S = P(d), _ = P(u);
      return !S || !_ ? !0 : _ === "utf16" ? S === "utf16le" || S === "utf16be" : S === _;
    }
    function N(d, u) {
      if (!(!d.strict || !d.encoding || !u || u.name !== "xml")) {
        var S = re(u.body);
        S && !R(d.encoding, S) && F(
          d,
          "XML declaration encoding " + S + " does not match detected stream encoding " + d.encoding.toUpperCase()
        );
      }
    }
    function $(d, u, S) {
      d.textNode && D(d), X(d, u, S);
    }
    function D(d) {
      d.textNode = O(d.opt, d.textNode), d.textNode && X(d, "ontext", d.textNode), d.textNode = "";
    }
    function O(d, u) {
      return d.trim && (u = u.trim()), d.normalize && (u = u.replace(/\s+/g, " ")), u;
    }
    function B(d, u) {
      return D(d), d.trackPosition && (u += `
Line: ` + d.line + `
Column: ` + d.column + `
Char: ` + d.c), u = new Error(u), d.error = u, X(d, "onerror", u), d;
    }
    function W(d) {
      return d.sawRoot && !d.closedRoot && F(d, "Unclosed root tag"), d.state !== E.BEGIN && d.state !== E.BEGIN_WHITESPACE && d.state !== E.TEXT && B(d, "Unexpected end"), D(d), d.c = "", d.closed = !0, X(d, "onend"), r.call(d, d.strict, d.opt), d;
    }
    function F(d, u) {
      if (typeof d != "object" || !(d instanceof r))
        throw new Error("bad call to strictFail");
      d.strict && B(d, u);
    }
    function K(d) {
      d.strict || (d.tagName = d.tagName[d.looseCase]());
      var u = d.tags[d.tags.length - 1] || d, S = d.tag = { name: d.tagName, attributes: {} };
      d.opt.xmlns && (S.ns = u.ns), d.attribList.length = 0, $(d, "onopentagstart", S);
    }
    function he(d, u) {
      var S = d.indexOf(":"), _ = S < 0 ? ["", d] : d.split(":"), Y = _[0], ie = _[1];
      return u && d === "xmlns" && (Y = "xmlns", ie = ""), { prefix: Y, local: ie };
    }
    function j(d) {
      if (d.strict || (d.attribName = d.attribName[d.looseCase]()), d.attribList.indexOf(d.attribName) !== -1 || d.tag.attributes.hasOwnProperty(d.attribName)) {
        d.attribName = d.attribValue = "";
        return;
      }
      if (d.opt.xmlns) {
        var u = he(d.attribName, !0), S = u.prefix, _ = u.local;
        if (S === "xmlns")
          if (_ === "xml" && d.attribValue !== w)
            F(
              d,
              "xml: prefix must be bound to " + w + `
Actual: ` + d.attribValue
            );
          else if (_ === "xmlns" && d.attribValue !== y)
            F(
              d,
              "xmlns: prefix must be bound to " + y + `
Actual: ` + d.attribValue
            );
          else {
            var Y = d.tag, ie = d.tags[d.tags.length - 1] || d;
            Y.ns === ie.ns && (Y.ns = Object.create(ie.ns)), Y.ns[_] = d.attribValue;
          }
        d.attribList.push([d.attribName, d.attribValue]);
      } else
        d.tag.attributes[d.attribName] = d.attribValue, $(d, "onattribute", {
          name: d.attribName,
          value: d.attribValue
        });
      d.attribName = d.attribValue = "";
    }
    function Ae(d, u) {
      if (d.opt.xmlns) {
        var S = d.tag, _ = he(d.tagName);
        S.prefix = _.prefix, S.local = _.local, S.uri = S.ns[_.prefix] || "", S.prefix && !S.uri && (F(
          d,
          "Unbound namespace prefix: " + JSON.stringify(d.tagName)
        ), S.uri = _.prefix);
        var Y = d.tags[d.tags.length - 1] || d;
        S.ns && Y.ns !== S.ns && Object.keys(S.ns).forEach(function(Zt) {
          $(d, "onopennamespace", {
            prefix: Zt,
            uri: S.ns[Zt]
          });
        });
        for (var ie = 0, ue = d.attribList.length; ie < ue; ie++) {
          var Se = d.attribList[ie], be = Se[0], Ge = Se[1], pe = he(be, !0), Ve = pe.prefix, Ii = pe.local, _r = Ve === "" ? "" : S.ns[Ve] || "", mt = {
            name: be,
            value: Ge,
            prefix: Ve,
            local: Ii,
            uri: _r
          };
          Ve && Ve !== "xmlns" && !_r && (F(
            d,
            "Unbound namespace prefix: " + JSON.stringify(Ve)
          ), mt.uri = Ve), d.tag.attributes[be] = mt, $(d, "onattribute", mt);
        }
        d.attribList.length = 0;
      }
      d.tag.isSelfClosing = !!u, d.sawRoot = !0, d.tags.push(d.tag), $(d, "onopentag", d.tag), u || (!d.noscript && d.tagName.toLowerCase() === "script" ? d.state = E.SCRIPT : d.state = E.TEXT, d.tag = null, d.tagName = ""), d.attribName = d.attribValue = "", d.attribList.length = 0;
    }
    function $n(d) {
      if (!d.tagName) {
        F(d, "Weird empty close tag."), d.textNode += "</>", d.state = E.TEXT;
        return;
      }
      if (d.script) {
        if (d.tagName !== "script") {
          d.script += "</" + d.tagName + ">", d.tagName = "", d.state = E.SCRIPT;
          return;
        }
        $(d, "onscript", d.script), d.script = "";
      }
      var u = d.tags.length, S = d.tagName;
      d.strict || (S = S[d.looseCase]());
      for (var _ = S; u--; ) {
        var Y = d.tags[u];
        if (Y.name !== _)
          F(d, "Unexpected close tag");
        else
          break;
      }
      if (u < 0) {
        F(d, "Unmatched closing tag: " + d.tagName), d.textNode += "</" + d.tagName + ">", d.state = E.TEXT;
        return;
      }
      d.tagName = S;
      for (var ie = d.tags.length; ie-- > u; ) {
        var ue = d.tag = d.tags.pop();
        d.tagName = d.tag.name, $(d, "onclosetag", d.tagName);
        var Se = {};
        for (var be in ue.ns)
          Se[be] = ue.ns[be];
        var Ge = d.tags[d.tags.length - 1] || d;
        d.opt.xmlns && ue.ns !== Ge.ns && Object.keys(ue.ns).forEach(function(pe) {
          var Ve = ue.ns[pe];
          $(d, "onclosenamespace", { prefix: pe, uri: Ve });
        });
      }
      u === 0 && (d.closedRoot = !0), d.tagName = d.attribValue = d.attribName = "", d.attribList.length = 0, d.state = E.TEXT;
    }
    function qe(d) {
      var u = d.entity, S = u.toLowerCase(), _, Y = "";
      return d.ENTITIES[u] ? d.ENTITIES[u] : d.ENTITIES[S] ? d.ENTITIES[S] : (u = S, u.charAt(0) === "#" && (u.charAt(1) === "x" ? (u = u.slice(2), _ = parseInt(u, 16), Y = _.toString(16)) : (u = u.slice(1), _ = parseInt(u, 10), Y = _.toString(10))), u = u.replace(/^0+/, ""), isNaN(_) || Y.toLowerCase() !== u || _ < 0 || _ > 1114111 || !wr(_) ? (F(d, "Invalid character entity"), "&" + d.entity + ";") : String.fromCodePoint(_));
    }
    function wr(d) {
      return d === 9 || d === 10 || d === 13 || d >= 32 && d <= 55295 || d >= 57344 && d <= 65533 || d >= 65536 && d <= 1114111;
    }
    function Rn(d, u) {
      u === "<" ? (d.state = E.OPEN_WAKA, d.startTagPosition = d.position) : G(u) || (F(d, "Non-whitespace before first tag."), d.textNode = u, d.state = E.TEXT);
    }
    function Qt(d, u) {
      var S = "";
      return u < d.length && (S = d.charAt(u)), S;
    }
    function Pn(d) {
      var u = this;
      if (this.error)
        throw this.error;
      if (u.closed)
        return B(
          u,
          "Cannot write after close. Assign an onready handler."
        );
      if (d === null)
        return W(u);
      typeof d == "object" && (d = d.toString());
      for (var S = 0, _ = ""; _ = Qt(d, S++), u.c = _, !!_; )
        switch (u.trackPosition && (u.position++, _ === `
` ? (u.line++, u.column = 0) : u.column++), u.state) {
          case E.BEGIN:
            if (u.state = E.BEGIN_WHITESPACE, _ === "\uFEFF")
              continue;
            Rn(u, _);
            continue;
          case E.BEGIN_WHITESPACE:
            Rn(u, _);
            continue;
          case E.TEXT:
            if (u.sawRoot && !u.closedRoot) {
              for (var ie = S - 1; _ && _ !== "<" && _ !== "&"; )
                _ = Qt(d, S++), _ && u.trackPosition && (u.position++, _ === `
` ? (u.line++, u.column = 0) : u.column++);
              u.textNode += d.substring(ie, S - 1);
            }
            _ === "<" && !(u.sawRoot && u.closedRoot && !u.strict) ? (u.state = E.OPEN_WAKA, u.startTagPosition = u.position) : (!G(_) && (!u.sawRoot || u.closedRoot) && F(u, "Text data outside of root node."), _ === "&" ? u.state = E.TEXT_ENTITY : u.textNode += _);
            continue;
          case E.SCRIPT:
            _ === "<" ? u.state = E.SCRIPT_ENDING : u.script += _;
            continue;
          case E.SCRIPT_ENDING:
            _ === "/" ? u.state = E.CLOSE_TAG : (u.script += "<" + _, u.state = E.SCRIPT);
            continue;
          case E.OPEN_WAKA:
            if (_ === "!")
              u.state = E.SGML_DECL, u.sgmlDecl = "";
            else if (!G(_)) if (ce(A, _))
              u.state = E.OPEN_TAG, u.tagName = _;
            else if (_ === "/")
              u.state = E.CLOSE_TAG, u.tagName = "";
            else if (_ === "?")
              u.state = E.PROC_INST, u.procInstName = u.procInstBody = "";
            else {
              if (F(u, "Unencoded <"), u.startTagPosition + 1 < u.position) {
                var Y = u.position - u.startTagPosition;
                _ = new Array(Y).join(" ") + _;
              }
              u.textNode += "<" + _, u.state = E.TEXT;
            }
            continue;
          case E.SGML_DECL:
            if (u.sgmlDecl + _ === "--") {
              u.state = E.COMMENT, u.comment = "", u.sgmlDecl = "";
              continue;
            }
            u.doctype && u.doctype !== !0 && u.sgmlDecl ? (u.state = E.DOCTYPE_DTD, u.doctype += "<!" + u.sgmlDecl + _, u.sgmlDecl = "") : p.test(u.sgmlDecl + _) ? ($(u, "onopencdata"), u.state = E.CDATA, u.sgmlDecl = "", u.cdata = "") : g.test(u.sgmlDecl + _) ? (u.state = E.DOCTYPE, (u.doctype || u.sawRoot) && F(
              u,
              "Inappropriately located doctype declaration"
            ), u.doctype = "", u.sgmlDecl = "") : _ === ">" ? ($(u, "onsgmldeclaration", u.sgmlDecl), u.sgmlDecl = "", u.state = E.TEXT) : (Z(_) && (u.state = E.SGML_DECL_QUOTED), u.sgmlDecl += _);
            continue;
          case E.SGML_DECL_QUOTED:
            _ === u.q && (u.state = E.SGML_DECL, u.q = ""), u.sgmlDecl += _;
            continue;
          case E.DOCTYPE:
            _ === ">" ? (u.state = E.TEXT, $(u, "ondoctype", u.doctype), u.doctype = !0) : (u.doctype += _, _ === "[" ? u.state = E.DOCTYPE_DTD : Z(_) && (u.state = E.DOCTYPE_QUOTED, u.q = _));
            continue;
          case E.DOCTYPE_QUOTED:
            u.doctype += _, _ === u.q && (u.q = "", u.state = E.DOCTYPE);
            continue;
          case E.DOCTYPE_DTD:
            _ === "]" ? (u.doctype += _, u.state = E.DOCTYPE) : _ === "<" ? (u.state = E.OPEN_WAKA, u.startTagPosition = u.position) : Z(_) ? (u.doctype += _, u.state = E.DOCTYPE_DTD_QUOTED, u.q = _) : u.doctype += _;
            continue;
          case E.DOCTYPE_DTD_QUOTED:
            u.doctype += _, _ === u.q && (u.state = E.DOCTYPE_DTD, u.q = "");
            continue;
          case E.COMMENT:
            _ === "-" ? u.state = E.COMMENT_ENDING : u.comment += _;
            continue;
          case E.COMMENT_ENDING:
            _ === "-" ? (u.state = E.COMMENT_ENDED, u.comment = O(u.opt, u.comment), u.comment && $(u, "oncomment", u.comment), u.comment = "") : (u.comment += "-" + _, u.state = E.COMMENT);
            continue;
          case E.COMMENT_ENDED:
            _ !== ">" ? (F(u, "Malformed comment"), u.comment += "--" + _, u.state = E.COMMENT) : u.doctype && u.doctype !== !0 ? u.state = E.DOCTYPE_DTD : u.state = E.TEXT;
            continue;
          case E.CDATA:
            for (var ie = S - 1; _ && _ !== "]"; )
              _ = Qt(d, S++), _ && u.trackPosition && (u.position++, _ === `
` ? (u.line++, u.column = 0) : u.column++);
            u.cdata += d.substring(ie, S - 1), _ === "]" && (u.state = E.CDATA_ENDING);
            continue;
          case E.CDATA_ENDING:
            _ === "]" ? u.state = E.CDATA_ENDING_2 : (u.cdata += "]" + _, u.state = E.CDATA);
            continue;
          case E.CDATA_ENDING_2:
            _ === ">" ? (u.cdata && $(u, "oncdata", u.cdata), $(u, "onclosecdata"), u.cdata = "", u.state = E.TEXT) : _ === "]" ? u.cdata += "]" : (u.cdata += "]]" + _, u.state = E.CDATA);
            continue;
          case E.PROC_INST:
            _ === "?" ? u.state = E.PROC_INST_ENDING : G(_) ? u.state = E.PROC_INST_BODY : u.procInstName += _;
            continue;
          case E.PROC_INST_BODY:
            if (!u.procInstBody && G(_))
              continue;
            _ === "?" ? u.state = E.PROC_INST_ENDING : u.procInstBody += _;
            continue;
          case E.PROC_INST_ENDING:
            if (_ === ">") {
              const Ge = {
                name: u.procInstName,
                body: u.procInstBody
              };
              N(u, Ge), $(u, "onprocessinginstruction", Ge), u.procInstName = u.procInstBody = "", u.state = E.TEXT;
            } else
              u.procInstBody += "?" + _, u.state = E.PROC_INST_BODY;
            continue;
          case E.OPEN_TAG:
            ce(b, _) ? u.tagName += _ : (K(u), _ === ">" ? Ae(u) : _ === "/" ? u.state = E.OPEN_TAG_SLASH : (G(_) || F(u, "Invalid character in tag name"), u.state = E.ATTRIB));
            continue;
          case E.OPEN_TAG_SLASH:
            _ === ">" ? (Ae(u, !0), $n(u)) : (F(
              u,
              "Forward-slash in opening tag not followed by >"
            ), u.state = E.ATTRIB);
            continue;
          case E.ATTRIB:
            if (G(_))
              continue;
            _ === ">" ? Ae(u) : _ === "/" ? u.state = E.OPEN_TAG_SLASH : ce(A, _) ? (u.attribName = _, u.attribValue = "", u.state = E.ATTRIB_NAME) : F(u, "Invalid attribute name");
            continue;
          case E.ATTRIB_NAME:
            _ === "=" ? u.state = E.ATTRIB_VALUE : _ === ">" ? (F(u, "Attribute without value"), u.attribValue = u.attribName, j(u), Ae(u)) : G(_) ? u.state = E.ATTRIB_NAME_SAW_WHITE : ce(b, _) ? u.attribName += _ : F(u, "Invalid attribute name");
            continue;
          case E.ATTRIB_NAME_SAW_WHITE:
            if (_ === "=")
              u.state = E.ATTRIB_VALUE;
            else {
              if (G(_))
                continue;
              F(u, "Attribute without value"), u.tag.attributes[u.attribName] = "", u.attribValue = "", $(u, "onattribute", {
                name: u.attribName,
                value: ""
              }), u.attribName = "", _ === ">" ? Ae(u) : ce(A, _) ? (u.attribName = _, u.state = E.ATTRIB_NAME) : (F(u, "Invalid attribute name"), u.state = E.ATTRIB);
            }
            continue;
          case E.ATTRIB_VALUE:
            if (G(_))
              continue;
            Z(_) ? (u.q = _, u.state = E.ATTRIB_VALUE_QUOTED) : (u.opt.unquotedAttributeValues || B(u, "Unquoted attribute value"), u.state = E.ATTRIB_VALUE_UNQUOTED, u.attribValue = _);
            continue;
          case E.ATTRIB_VALUE_QUOTED:
            if (_ !== u.q) {
              _ === "&" ? u.state = E.ATTRIB_VALUE_ENTITY_Q : u.attribValue += _;
              continue;
            }
            j(u), u.q = "", u.state = E.ATTRIB_VALUE_CLOSED;
            continue;
          case E.ATTRIB_VALUE_CLOSED:
            G(_) ? u.state = E.ATTRIB : _ === ">" ? Ae(u) : _ === "/" ? u.state = E.OPEN_TAG_SLASH : ce(A, _) ? (F(u, "No whitespace between attributes"), u.attribName = _, u.attribValue = "", u.state = E.ATTRIB_NAME) : F(u, "Invalid attribute name");
            continue;
          case E.ATTRIB_VALUE_UNQUOTED:
            if (!ee(_)) {
              _ === "&" ? u.state = E.ATTRIB_VALUE_ENTITY_U : u.attribValue += _;
              continue;
            }
            j(u), _ === ">" ? Ae(u) : u.state = E.ATTRIB;
            continue;
          case E.CLOSE_TAG:
            if (u.tagName)
              _ === ">" ? $n(u) : ce(b, _) ? u.tagName += _ : u.script ? (u.script += "</" + u.tagName + _, u.tagName = "", u.state = E.SCRIPT) : (G(_) || F(u, "Invalid tagname in closing tag"), u.state = E.CLOSE_TAG_SAW_WHITE);
            else {
              if (G(_))
                continue;
              M(A, _) ? u.script ? (u.script += "</" + _, u.state = E.SCRIPT) : F(u, "Invalid tagname in closing tag.") : u.tagName = _;
            }
            continue;
          case E.CLOSE_TAG_SAW_WHITE:
            if (G(_))
              continue;
            _ === ">" ? $n(u) : F(u, "Invalid characters in closing tag");
            continue;
          case E.TEXT_ENTITY:
          case E.ATTRIB_VALUE_ENTITY_Q:
          case E.ATTRIB_VALUE_ENTITY_U:
            var ue, Se;
            switch (u.state) {
              case E.TEXT_ENTITY:
                ue = E.TEXT, Se = "textNode";
                break;
              case E.ATTRIB_VALUE_ENTITY_Q:
                ue = E.ATTRIB_VALUE_QUOTED, Se = "attribValue";
                break;
              case E.ATTRIB_VALUE_ENTITY_U:
                ue = E.ATTRIB_VALUE_UNQUOTED, Se = "attribValue";
                break;
            }
            if (_ === ";") {
              var be = qe(u);
              u.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(be) ? ((u.entityCount += 1) > u.opt.maxEntityCount && B(
                u,
                "Parsed entity count exceeds max entity count"
              ), (u.entityDepth += 1) > u.opt.maxEntityDepth && B(
                u,
                "Parsed entity depth exceeds max entity depth"
              ), u.entity = "", u.state = ue, u.write(be), u.entityDepth -= 1) : (u[Se] += be, u.entity = "", u.state = ue);
            } else ce(u.entity.length ? k : I, _) ? u.entity += _ : (F(u, "Invalid character in entity name"), u[Se] += "&" + u.entity + _, u.entity = "", u.state = ue);
            continue;
          default:
            throw new Error(u, "Unknown state: " + u.state);
        }
      return u.position >= u.bufferCheckPosition && i(u), u;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var d = String.fromCharCode, u = Math.floor, S = function() {
        var _ = 16384, Y = [], ie, ue, Se = -1, be = arguments.length;
        if (!be)
          return "";
        for (var Ge = ""; ++Se < be; ) {
          var pe = Number(arguments[Se]);
          if (!isFinite(pe) || // `NaN`, `+Infinity`, or `-Infinity`
          pe < 0 || // not a valid Unicode code point
          pe > 1114111 || // not a valid Unicode code point
          u(pe) !== pe)
            throw RangeError("Invalid code point: " + pe);
          pe <= 65535 ? Y.push(pe) : (pe -= 65536, ie = (pe >> 10) + 55296, ue = pe % 1024 + 56320, Y.push(ie, ue)), (Se + 1 === be || Y.length > _) && (Ge += d.apply(null, Y), Y.length = 0);
        }
        return Ge;
      };
      Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
        value: S,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = S;
    }();
  })(e);
})(Yc);
Object.defineProperty(fr, "__esModule", { value: !0 });
fr.XElement = void 0;
fr.parseXml = Fm;
const Im = Yc, Dr = An;
class Xc {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, Dr.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!Dm(t))
      throw (0, Dr.newError)(`Invalid element name: ${t}`, "ERR_XML_ELEMENT_INVALID_NAME");
  }
  attribute(t) {
    const n = this.attributes === null ? null : this.attributes[t];
    if (n == null)
      throw (0, Dr.newError)(`No attribute "${t}"`, "ERR_XML_MISSED_ATTRIBUTE");
    return n;
  }
  removeAttribute(t) {
    this.attributes !== null && delete this.attributes[t];
  }
  element(t, n = !1, r = null) {
    const i = this.elementOrNull(t, n);
    if (i === null)
      throw (0, Dr.newError)(r || `No element "${t}"`, "ERR_XML_MISSED_ELEMENT");
    return i;
  }
  elementOrNull(t, n = !1) {
    if (this.elements === null)
      return null;
    for (const r of this.elements)
      if (ya(r, t, n))
        return r;
    return null;
  }
  getElements(t, n = !1) {
    return this.elements === null ? [] : this.elements.filter((r) => ya(r, t, n));
  }
  elementValueOrEmpty(t, n = !1) {
    const r = this.elementOrNull(t, n);
    return r === null ? "" : r.value;
  }
}
fr.XElement = Xc;
const Nm = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function Dm(e) {
  return Nm.test(e);
}
function ya(e, t, n) {
  const r = e.name;
  return r === t || n === !0 && r.length === t.length && r.toLowerCase() === t.toLowerCase();
}
function Fm(e) {
  let t = null;
  const n = Im.parser(!0, {}), r = [];
  return n.onopentag = (i) => {
    const o = new Xc(i.name);
    if (o.attributes = i.attributes, t === null)
      t = o;
    else {
      const s = r[r.length - 1];
      s.elements == null && (s.elements = []), s.elements.push(o);
    }
    r.push(o);
  }, n.onclosetag = () => {
    r.pop();
  }, n.ontext = (i) => {
    r.length > 0 && (r[r.length - 1].value = i);
  }, n.oncdata = (i) => {
    const o = r[r.length - 1];
    o.value = i, o.isCData = !0;
  }, n.onerror = (i) => {
    throw i;
  }, n.write(e), t;
}
var Kt = {};
Object.defineProperty(Kt, "__esModule", { value: !0 });
Kt.mapToObject = Kc;
Kt.isValidKey = hi;
Kt.asArray = xm;
Kt.deepAssign = Um;
Kt.objectToArgs = Bm;
function Kc(e) {
  const t = {};
  for (const [n, r] of e)
    hi(n) && (r instanceof Map ? t[n] = Kc(r) : t[n] = r);
  return t;
}
function hi(e) {
  return ["__proto__", "prototype", "constructor"].includes(e) ? !1 : ["string", "number", "symbol", "boolean"].includes(typeof e) || e === null;
}
function xm(e) {
  return e == null ? [] : Array.isArray(e) ? e : [e];
}
function Ea(e) {
  if (Array.isArray(e))
    return !1;
  const t = typeof e;
  return t === "object" || t === "function";
}
function Lm(e, t, n) {
  const r = t[n];
  if (r === void 0)
    return;
  const i = e[n];
  i == null || r == null || !Ea(i) || !Ea(r) ? Array.isArray(i) && Array.isArray(r) ? e[n] = Array.from(new Set(i.concat(r))) : e[n] = r : e[n] = Jc(i, r);
}
function Jc(e, t) {
  if (e !== t)
    for (const n of Object.getOwnPropertyNames(t))
      hi(n) && Lm(e, t, n);
  return e;
}
function Um(e, ...t) {
  for (const n of t)
    n != null && Jc(e, n);
  return e;
}
const km = /^[a-zA-Z][a-zA-Z0-9-]*$/, Mm = /[\0\r\n]/;
function Bm(e) {
  const t = Object.entries(e).reduce((n, [r, i]) => {
    if (!hi(r) || i == null)
      return n;
    if (!km.test(r))
      throw new Error(`objectToArgs: unsafe flag name rejected: ${JSON.stringify(r)}`);
    if (Mm.test(i))
      throw new Error(`objectToArgs: value for --${r} contains a null byte or newline`);
    return n.concat([`--${r}`, i]);
  }, []);
  return Object.freeze(t);
}
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.objectToArgs = e.deepAssign = e.asArray = e.mapToObject = e.isValidKey = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubTagPrefix = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.isSensitiveFieldName = e.HttpExecutor = e.hashSensitiveValue = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0;
  var t = $t;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var n = An;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return n.newError;
  } });
  var r = me;
  Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
    return r.configureRequestOptions;
  } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
    return r.configureRequestOptionsFromUrl;
  } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
    return r.configureRequestUrl;
  } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
    return r.createHttpError;
  } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
    return r.DigestTransform;
  } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
    return r.HttpError;
  } }), Object.defineProperty(e, "hashSensitiveValue", { enumerable: !0, get: function() {
    return r.hashSensitiveValue;
  } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
    return r.HttpExecutor;
  } }), Object.defineProperty(e, "isSensitiveFieldName", { enumerable: !0, get: function() {
    return r.isSensitiveFieldName;
  } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
    return r.parseJson;
  } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
    return r.safeGetHeader;
  } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
    return r.safeStringifyJson;
  } });
  var i = di;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return i.MemoLazy;
  } });
  var o = cr;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return o.ProgressCallbackTransform;
  } });
  var s = ur;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return s.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return s.githubUrl;
  } }), Object.defineProperty(e, "githubTagPrefix", { enumerable: !0, get: function() {
    return s.githubTagPrefix;
  } });
  var a = Ko;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return a.retry;
  } });
  var c = Jo;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return c.parseDn;
  } });
  var h = _n;
  Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
    return h.UUID;
  } });
  var l = fr;
  Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
    return l.parseXml;
  } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
    return l.XElement;
  } });
  var f = Kt;
  Object.defineProperty(e, "isValidKey", { enumerable: !0, get: function() {
    return f.isValidKey;
  } }), Object.defineProperty(e, "mapToObject", { enumerable: !0, get: function() {
    return f.mapToObject;
  } }), Object.defineProperty(e, "asArray", { enumerable: !0, get: function() {
    return f.asArray;
  } }), Object.defineProperty(e, "deepAssign", { enumerable: !0, get: function() {
    return f.deepAssign;
  } }), Object.defineProperty(e, "objectToArgs", { enumerable: !0, get: function() {
    return f.objectToArgs;
  } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
})(ge);
var Te = {}, Qo = {}, Je = {};
function Qc(e) {
  return typeof e > "u" || e === null;
}
function jm(e) {
  return typeof e == "object" && e !== null;
}
function Hm(e) {
  return Array.isArray(e) ? e : Qc(e) ? [] : [e];
}
function qm(e, t) {
  if (t) {
    const n = Object.keys(t);
    for (let r = 0, i = n.length; r < i; r += 1) {
      const o = n[r];
      e[o] = t[o];
    }
  }
  return e;
}
function Gm(e, t) {
  let n = "";
  for (let r = 0; r < t; r += 1)
    n += e;
  return n;
}
function Vm(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
Je.isNothing = Qc;
Je.isObject = jm;
Je.toArray = Hm;
Je.repeat = Gm;
Je.isNegativeZero = Vm;
Je.extend = qm;
function Zc(e, t) {
  let n = "";
  const r = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (n += 'in "' + e.mark.name + '" '), n += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (n += `

` + e.mark.snippet), r + " " + n) : r;
}
function Kn(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = Zc(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
Kn.prototype = Object.create(Error.prototype);
Kn.prototype.constructor = Kn;
Kn.prototype.toString = function(t) {
  return this.name + ": " + Zc(this, t);
};
var dr = Kn;
const Un = Je;
function Wi(e, t, n, r, i) {
  let o = "", s = "";
  const a = Math.floor(i / 2) - 1;
  return r - t > a && (o = " ... ", t = r - a + o.length), n - r > a && (s = " ...", n = r + a - s.length), {
    str: o + e.slice(t, n).replace(/\t/g, "→") + s,
    pos: r - t + o.length
    // relative position
  };
}
function zi(e, t) {
  return Un.repeat(" ", t - e.length) + e;
}
function Wm(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  const n = /\r?\n|\r|\0/g, r = [0], i = [];
  let o, s = -1;
  for (; o = n.exec(e.buffer); )
    i.push(o.index), r.push(o.index + o[0].length), e.position <= o.index && s < 0 && (s = r.length - 2);
  s < 0 && (s = r.length - 1);
  let a = "";
  const c = Math.min(e.line + t.linesAfter, i.length).toString().length, h = t.maxLength - (t.indent + c + 3);
  for (let f = 1; f <= t.linesBefore && !(s - f < 0); f++) {
    const p = Wi(
      e.buffer,
      r[s - f],
      i[s - f],
      e.position - (r[s] - r[s - f]),
      h
    );
    a = Un.repeat(" ", t.indent) + zi((e.line - f + 1).toString(), c) + " | " + p.str + `
` + a;
  }
  const l = Wi(e.buffer, r[s], i[s], e.position, h);
  a += Un.repeat(" ", t.indent) + zi((e.line + 1).toString(), c) + " | " + l.str + `
`, a += Un.repeat("-", t.indent + c + 3 + l.pos) + `^
`;
  for (let f = 1; f <= t.linesAfter && !(s + f >= i.length); f++) {
    const p = Wi(
      e.buffer,
      r[s + f],
      i[s + f],
      e.position - (r[s] - r[s + f]),
      h
    );
    a += Un.repeat(" ", t.indent) + zi((e.line + f + 1).toString(), c) + " | " + p.str + `
`;
  }
  return a.replace(/\n$/, "");
}
var zm = Wm;
const wa = dr, Ym = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], Xm = [
  "scalar",
  "sequence",
  "mapping"
];
function Km(e) {
  const t = {};
  return e !== null && Object.keys(e).forEach(function(n) {
    e[n].forEach(function(r) {
      t[String(r)] = n;
    });
  }), t;
}
function Jm(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(n) {
    if (Ym.indexOf(n) === -1)
      throw new wa('Unknown option "' + n + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(n) {
    return n;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = Km(t.styleAliases || null), Xm.indexOf(this.kind) === -1)
    throw new wa('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var xe = Jm;
const Fn = dr, Yi = xe;
function _a(e, t) {
  const n = [];
  return e[t].forEach(function(r) {
    let i = n.length;
    n.forEach(function(o, s) {
      o.tag === r.tag && o.kind === r.kind && o.multi === r.multi && (i = s);
    }), n[i] = r;
  }), n;
}
function Qm() {
  const e = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  };
  function t(n) {
    n.multi ? (e.multi[n.kind].push(n), e.multi.fallback.push(n)) : e[n.kind][n.tag] = e.fallback[n.tag] = n;
  }
  for (let n = 0, r = arguments.length; n < r; n += 1)
    arguments[n].forEach(t);
  return e;
}
function Ro(e) {
  return this.extend(e);
}
Ro.prototype.extend = function(t) {
  let n = [], r = [];
  if (t instanceof Yi)
    r.push(t);
  else if (Array.isArray(t))
    r = r.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (n = n.concat(t.implicit)), t.explicit && (r = r.concat(t.explicit));
  else
    throw new Fn("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  n.forEach(function(o) {
    if (!(o instanceof Yi))
      throw new Fn("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (o.loadKind && o.loadKind !== "scalar")
      throw new Fn("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (o.multi)
      throw new Fn("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), r.forEach(function(o) {
    if (!(o instanceof Yi))
      throw new Fn("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  const i = Object.create(Ro.prototype);
  return i.implicit = (this.implicit || []).concat(n), i.explicit = (this.explicit || []).concat(r), i.compiledImplicit = _a(i, "implicit"), i.compiledExplicit = _a(i, "explicit"), i.compiledTypeMap = Qm(i.compiledImplicit, i.compiledExplicit), i;
};
var eu = Ro;
const Zm = xe;
var tu = new Zm("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
});
const eg = xe;
var nu = new eg("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
});
const tg = xe;
var ru = new tg("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
});
const ng = eu;
var iu = new ng({
  explicit: [
    tu,
    nu,
    ru
  ]
});
const rg = xe;
function ig(e) {
  if (e === null) return !0;
  const t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function og() {
  return null;
}
function sg(e) {
  return e === null;
}
var ou = new rg("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: ig,
  construct: og,
  predicate: sg,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
const ag = xe;
function lg(e) {
  if (e === null) return !1;
  const t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function cg(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function ug(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var su = new ag("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: lg,
  construct: cg,
  predicate: ug,
  represent: {
    lowercase: function(e) {
      return e ? "true" : "false";
    },
    uppercase: function(e) {
      return e ? "TRUE" : "FALSE";
    },
    camelcase: function(e) {
      return e ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
const fg = Je, dg = xe;
function hg(e) {
  return e >= 48 && e <= 57 || e >= 65 && e <= 70 || e >= 97 && e <= 102;
}
function pg(e) {
  return e >= 48 && e <= 55;
}
function mg(e) {
  return e >= 48 && e <= 57;
}
function gg(e) {
  if (e === null) return !1;
  const t = e.length;
  let n = 0, r = !1;
  if (!t) return !1;
  let i = e[n];
  if ((i === "-" || i === "+") && (i = e[++n]), i === "0") {
    if (n + 1 === t) return !0;
    if (i = e[++n], i === "b") {
      for (n++; n < t; n++) {
        if (i = e[n], i !== "0" && i !== "1") return !1;
        r = !0;
      }
      return r && isFinite(kn(e));
    }
    if (i === "x") {
      for (n++; n < t; n++) {
        if (!hg(e.charCodeAt(n))) return !1;
        r = !0;
      }
      return r && isFinite(kn(e));
    }
    if (i === "o") {
      for (n++; n < t; n++) {
        if (!pg(e.charCodeAt(n))) return !1;
        r = !0;
      }
      return r && isFinite(kn(e));
    }
  }
  for (; n < t; n++) {
    if (!mg(e.charCodeAt(n)))
      return !1;
    r = !0;
  }
  return r ? isFinite(kn(e)) : !1;
}
function kn(e) {
  let t = e, n = 1, r = t[0];
  if ((r === "-" || r === "+") && (r === "-" && (n = -1), t = t.slice(1), r = t[0]), t === "0") return 0;
  if (r === "0") {
    if (t[1] === "b") return n * parseInt(t.slice(2), 2);
    if (t[1] === "x") return n * parseInt(t.slice(2), 16);
    if (t[1] === "o") return n * parseInt(t.slice(2), 8);
  }
  return n * parseInt(t, 10);
}
function yg(e) {
  return kn(e);
}
function Eg(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !fg.isNegativeZero(e);
}
var au = new dg("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: gg,
  construct: yg,
  predicate: Eg,
  represent: {
    binary: function(e) {
      return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
    },
    octal: function(e) {
      return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
    },
    decimal: function(e) {
      return e.toString(10);
    },
    hexadecimal: function(e) {
      return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
const lu = Je, wg = xe, _g = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
), vg = new RegExp(
  "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function Tg(e) {
  return e === null || !_g.test(e) ? !1 : isFinite(parseFloat(e, 10)) ? !0 : vg.test(e);
}
function Ag(e) {
  let t = e.toLowerCase();
  const n = t[0] === "-" ? -1 : 1;
  return "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? n === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : n * parseFloat(t, 10);
}
const Sg = /^[-+]?[0-9]+e/;
function bg(e, t) {
  if (isNaN(e))
    switch (t) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (lu.isNegativeZero(e))
    return "-0.0";
  const n = e.toString(10);
  return Sg.test(n) ? n.replace("e", ".e") : n;
}
function Cg(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || lu.isNegativeZero(e));
}
var cu = new wg("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: Tg,
  construct: Ag,
  predicate: Cg,
  represent: bg,
  defaultStyle: "lowercase"
}), uu = iu.extend({
  implicit: [
    ou,
    su,
    au,
    cu
  ]
}), fu = uu;
const $g = xe, du = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), hu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function Rg(e) {
  return e === null ? !1 : du.exec(e) !== null || hu.exec(e) !== null;
}
function Pg(e) {
  let t = 0, n = null, r = du.exec(e);
  if (r === null && (r = hu.exec(e)), r === null) throw new Error("Date resolve error");
  const i = +r[1], o = +r[2] - 1, s = +r[3];
  if (!r[4])
    return new Date(Date.UTC(i, o, s));
  const a = +r[4], c = +r[5], h = +r[6];
  if (r[7]) {
    for (t = r[7].slice(0, 3); t.length < 3; )
      t += "0";
    t = +t;
  }
  if (r[9]) {
    const f = +r[10], p = +(r[11] || 0);
    n = (f * 60 + p) * 6e4, r[9] === "-" && (n = -n);
  }
  const l = new Date(Date.UTC(i, o, s, a, c, h, t));
  return n && l.setTime(l.getTime() - n), l;
}
function Og(e) {
  return e.toISOString();
}
var pu = new $g("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: Rg,
  construct: Pg,
  instanceOf: Date,
  represent: Og
});
const Ig = xe;
function Ng(e) {
  return e === "<<" || e === null;
}
var mu = new Ig("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: Ng
});
const Dg = xe, Zo = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function Fg(e) {
  if (e === null) return !1;
  let t = 0;
  const n = e.length, r = Zo;
  for (let i = 0; i < n; i++) {
    const o = r.indexOf(e.charAt(i));
    if (!(o > 64)) {
      if (o < 0) return !1;
      t += 6;
    }
  }
  return t % 8 === 0;
}
function xg(e) {
  const t = e.replace(/[\r\n=]/g, ""), n = t.length, r = Zo;
  let i = 0;
  const o = [];
  for (let a = 0; a < n; a++)
    a % 4 === 0 && a && (o.push(i >> 16 & 255), o.push(i >> 8 & 255), o.push(i & 255)), i = i << 6 | r.indexOf(t.charAt(a));
  const s = n % 4 * 6;
  return s === 0 ? (o.push(i >> 16 & 255), o.push(i >> 8 & 255), o.push(i & 255)) : s === 18 ? (o.push(i >> 10 & 255), o.push(i >> 2 & 255)) : s === 12 && o.push(i >> 4 & 255), new Uint8Array(o);
}
function Lg(e) {
  let t = "", n = 0;
  const r = e.length, i = Zo;
  for (let s = 0; s < r; s++)
    s % 3 === 0 && s && (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]), n = (n << 8) + e[s];
  const o = r % 3;
  return o === 0 ? (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]) : o === 2 ? (t += i[n >> 10 & 63], t += i[n >> 4 & 63], t += i[n << 2 & 63], t += i[64]) : o === 1 && (t += i[n >> 2 & 63], t += i[n << 4 & 63], t += i[64], t += i[64]), t;
}
function Ug(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var gu = new Dg("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: Fg,
  construct: xg,
  predicate: Ug,
  represent: Lg
});
const kg = xe, va = Object.prototype.hasOwnProperty, Mg = Object.prototype.toString;
function Bg(e) {
  if (e === null) return !0;
  const t = {}, n = e;
  for (let r = 0, i = n.length; r < i; r += 1) {
    const o = n[r];
    let s = !1;
    if (Mg.call(o) !== "[object Object]") return !1;
    let a;
    for (a in o)
      if (va.call(o, a))
        if (!s) s = !0;
        else return !1;
    if (!s || va.call(t, a)) return !1;
    Object.defineProperty(t, a, { value: !0 });
  }
  return !0;
}
function jg(e) {
  return e !== null ? e : [];
}
var yu = new kg("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: Bg,
  construct: jg
});
const Hg = xe, qg = Object.prototype.toString;
function Gg(e) {
  if (e === null) return !0;
  const t = e, n = new Array(t.length);
  for (let r = 0, i = t.length; r < i; r += 1) {
    const o = t[r];
    if (qg.call(o) !== "[object Object]") return !1;
    const s = Object.keys(o);
    if (s.length !== 1) return !1;
    n[r] = [s[0], o[s[0]]];
  }
  return !0;
}
function Vg(e) {
  if (e === null) return [];
  const t = e, n = new Array(t.length);
  for (let r = 0, i = t.length; r < i; r += 1) {
    const o = t[r], s = Object.keys(o);
    n[r] = [s[0], o[s[0]]];
  }
  return n;
}
var Eu = new Hg("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: Gg,
  construct: Vg
});
const Wg = xe, zg = Object.prototype.hasOwnProperty;
function Yg(e) {
  if (e === null) return !0;
  const t = e;
  for (const n in t)
    if (zg.call(t, n) && t[n] !== null)
      return !1;
  return !0;
}
function Xg(e) {
  return e !== null ? e : {};
}
var wu = new Wg("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: Yg,
  construct: Xg
}), es = fu.extend({
  implicit: [
    pu,
    mu
  ],
  explicit: [
    gu,
    yu,
    Eu,
    wu
  ]
});
const jt = Je, _u = dr, Kg = zm, Jg = es, Ke = Object.prototype.hasOwnProperty, Zr = 1, vu = 2, Tu = 3, ei = 4, Xi = 1, Qg = 2, Ta = 3, Zg = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, e0 = /[\x85\u2028\u2029]/, t0 = /[,\[\]{}]/, Au = /^(?:!|!!|![0-9A-Za-z-]+!)$/, Su = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
function Aa(e) {
  return Object.prototype.toString.call(e);
}
function at(e) {
  return e === 10 || e === 13;
}
function ht(e) {
  return e === 9 || e === 32;
}
function ke(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function fn(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function n0(e) {
  if (e >= 48 && e <= 57)
    return e - 48;
  const t = e | 32;
  return t >= 97 && t <= 102 ? t - 97 + 10 : -1;
}
function r0(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function i0(e) {
  return e >= 48 && e <= 57 ? e - 48 : -1;
}
function Sa(e) {
  switch (e) {
    case 48:
      return "\0";
    case 97:
      return "\x07";
    case 98:
      return "\b";
    case 116:
      return "	";
    case 9:
      return "	";
    case 110:
      return `
`;
    case 118:
      return "\v";
    case 102:
      return "\f";
    case 114:
      return "\r";
    case 101:
      return "\x1B";
    case 32:
      return " ";
    case 34:
      return '"';
    case 47:
      return "/";
    case 92:
      return "\\";
    case 78:
      return "";
    case 95:
      return " ";
    case 76:
      return "\u2028";
    case 80:
      return "\u2029";
    default:
      return "";
  }
}
function o0(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
function bu(e, t, n) {
  t === "__proto__" ? Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !0,
    writable: !0,
    value: n
  }) : e[t] = n;
}
const Cu = new Array(256), $u = new Array(256);
for (let e = 0; e < 256; e++)
  Cu[e] = Sa(e) ? 1 : 0, $u[e] = Sa(e);
function s0(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || Jg, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.maxDepth = typeof t.maxDepth == "number" ? t.maxDepth : 100, this.maxTotalMergeKeys = typeof t.maxTotalMergeKeys == "number" ? t.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
}
function Ru(e, t) {
  const n = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return n.snippet = Kg(n), new _u(t, n);
}
function U(e, t) {
  throw Ru(e, t);
}
function ti(e, t) {
  e.onWarning && e.onWarning.call(null, Ru(e, t));
}
function Ht(e, t, n) {
  const r = e.anchorMapTransactions;
  if (r.length !== 0) {
    const i = r[r.length - 1];
    Ke.call(i, t) || (i[t] = {
      existed: Ke.call(e.anchorMap, t),
      value: e.anchorMap[t]
    });
  }
  e.anchorMap[t] = n;
}
function a0(e) {
  e.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
}
function l0(e) {
  const t = e.anchorMapTransactions.pop(), n = e.anchorMapTransactions;
  if (n.length === 0) return;
  const r = n[n.length - 1], i = Object.keys(t);
  for (let o = 0, s = i.length; o < s; o += 1) {
    const a = i[o];
    Ke.call(r, a) || (r[a] = t[a]);
  }
}
function c0(e) {
  const t = e.anchorMapTransactions.pop(), n = Object.keys(t);
  for (let r = n.length - 1; r >= 0; r -= 1) {
    const i = t[n[r]];
    i.existed ? e.anchorMap[n[r]] = i.value : delete e.anchorMap[n[r]];
  }
}
function Pu(e) {
  return {
    position: e.position,
    line: e.line,
    lineStart: e.lineStart,
    lineIndent: e.lineIndent,
    firstTabInLine: e.firstTabInLine,
    tag: e.tag,
    anchor: e.anchor,
    kind: e.kind,
    result: e.result
  };
}
function ba(e, t) {
  e.position = t.position, e.line = t.line, e.lineStart = t.lineStart, e.lineIndent = t.lineIndent, e.firstTabInLine = t.firstTabInLine, e.tag = t.tag, e.anchor = t.anchor, e.kind = t.kind, e.result = t.result;
}
const Ca = {
  YAML: function(t, n, r) {
    t.version !== null && U(t, "duplication of %YAML directive"), r.length !== 1 && U(t, "YAML directive accepts exactly one argument");
    const i = /^([0-9]+)\.([0-9]+)$/.exec(r[0]);
    i === null && U(t, "ill-formed argument of the YAML directive");
    const o = parseInt(i[1], 10), s = parseInt(i[2], 10);
    o !== 1 && U(t, "unacceptable YAML version of the document"), t.version = r[0], t.checkLineBreaks = s < 2, s !== 1 && s !== 2 && ti(t, "unsupported YAML version of the document");
  },
  TAG: function(t, n, r) {
    let i;
    r.length !== 2 && U(t, "TAG directive accepts exactly two arguments");
    const o = r[0];
    i = r[1], Au.test(o) || U(t, "ill-formed tag handle (first argument) of the TAG directive"), Ke.call(t.tagMap, o) && U(t, 'there is a previously declared suffix for "' + o + '" tag handle'), Su.test(i) || U(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      i = decodeURIComponent(i);
    } catch {
      U(t, "tag prefix is malformed: " + i);
    }
    t.tagMap[o] = i;
  }
};
function bt(e, t, n, r) {
  if (t < n) {
    const i = e.input.slice(t, n);
    if (r)
      for (let o = 0, s = i.length; o < s; o += 1) {
        const a = i.charCodeAt(o);
        a === 9 || a >= 32 && a <= 1114111 || U(e, "expected valid JSON character");
      }
    else Zg.test(i) && U(e, "the stream contains non-printable characters");
    e.result += i;
  }
}
function $a(e, t, n, r) {
  jt.isObject(n) || U(e, "cannot merge mappings; the provided source object is unacceptable");
  const i = Object.keys(n);
  for (let o = 0, s = i.length; o < s; o += 1) {
    const a = i[o];
    e.maxTotalMergeKeys !== -1 && ++e.totalMergeKeys > e.maxTotalMergeKeys && U(e, "merge keys exceeded maxTotalMergeKeys (" + e.maxTotalMergeKeys + ")"), Ke.call(t, a) || (bu(t, a, n[a]), r[a] = !0);
  }
}
function dn(e, t, n, r, i, o, s, a, c) {
  if (Array.isArray(i)) {
    i = Array.prototype.slice.call(i);
    for (let h = 0, l = i.length; h < l; h += 1)
      Array.isArray(i[h]) && U(e, "nested arrays are not supported inside keys"), typeof i == "object" && Aa(i[h]) === "[object Object]" && (i[h] = "[object Object]");
  }
  if (typeof i == "object" && Aa(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), r === "tag:yaml.org,2002:merge")
    if (Array.isArray(o))
      for (let h = 0, l = o.length; h < l; h += 1)
        $a(e, t, o[h], n);
    else
      $a(e, t, o, n);
  else
    !e.json && !Ke.call(n, i) && Ke.call(t, i) && (e.line = s || e.line, e.lineStart = a || e.lineStart, e.position = c || e.position, U(e, "duplicated mapping key")), bu(t, i, o), delete n[i];
  return t;
}
function ts(e) {
  const t = e.input.charCodeAt(e.position);
  t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : U(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function fe(e, t, n) {
  let r = 0, i = e.input.charCodeAt(e.position);
  for (; i !== 0; ) {
    for (; ht(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (t && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (at(i))
      for (ts(e), i = e.input.charCodeAt(e.position), r++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return n !== -1 && r !== 0 && e.lineIndent < n && ti(e, "deficient indentation"), r;
}
function pi(e) {
  let t = e.position, n = e.input.charCodeAt(t);
  return !!((n === 45 || n === 46) && n === e.input.charCodeAt(t + 1) && n === e.input.charCodeAt(t + 2) && (t += 3, n = e.input.charCodeAt(t), n === 0 || ke(n)));
}
function ns(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += jt.repeat(`
`, t - 1));
}
function u0(e, t, n) {
  let r, i, o, s, a, c;
  const h = e.kind, l = e.result;
  let f = e.input.charCodeAt(e.position);
  if (ke(f) || fn(f) || f === 35 || f === 38 || f === 42 || f === 33 || f === 124 || f === 62 || f === 39 || f === 34 || f === 37 || f === 64 || f === 96)
    return !1;
  if (f === 63 || f === 45) {
    const p = e.input.charCodeAt(e.position + 1);
    if (ke(p) || n && fn(p))
      return !1;
  }
  for (e.kind = "scalar", e.result = "", r = i = e.position, o = !1; f !== 0; ) {
    if (f === 58) {
      const p = e.input.charCodeAt(e.position + 1);
      if (ke(p) || n && fn(p))
        break;
    } else if (f === 35) {
      const p = e.input.charCodeAt(e.position - 1);
      if (ke(p))
        break;
    } else {
      if (e.position === e.lineStart && pi(e) || n && fn(f))
        break;
      if (at(f))
        if (s = e.line, a = e.lineStart, c = e.lineIndent, fe(e, !1, -1), e.lineIndent >= t) {
          o = !0, f = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = i, e.line = s, e.lineStart = a, e.lineIndent = c;
          break;
        }
    }
    o && (bt(e, r, i, !1), ns(e, e.line - s), r = i = e.position, o = !1), ht(f) || (i = e.position + 1), f = e.input.charCodeAt(++e.position);
  }
  return bt(e, r, i, !1), e.result ? !0 : (e.kind = h, e.result = l, !1);
}
function f0(e, t) {
  let n, r, i = e.input.charCodeAt(e.position);
  if (i !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (i = e.input.charCodeAt(e.position)) !== 0; )
    if (i === 39)
      if (bt(e, n, e.position, !0), i = e.input.charCodeAt(++e.position), i === 39)
        n = e.position, e.position++, r = e.position;
      else
        return !0;
    else at(i) ? (bt(e, n, r, !0), ns(e, fe(e, !1, t)), n = r = e.position) : e.position === e.lineStart && pi(e) ? U(e, "unexpected end of the document within a single quoted scalar") : (e.position++, ht(i) || (r = e.position));
  U(e, "unexpected end of the stream within a single quoted scalar");
}
function d0(e, t) {
  let n, r, i, o = e.input.charCodeAt(e.position);
  if (o !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (o = e.input.charCodeAt(e.position)) !== 0; ) {
    if (o === 34)
      return bt(e, n, e.position, !0), e.position++, !0;
    if (o === 92) {
      if (bt(e, n, e.position, !0), o = e.input.charCodeAt(++e.position), at(o))
        fe(e, !1, t);
      else if (o < 256 && Cu[o])
        e.result += $u[o], e.position++;
      else if ((i = r0(o)) > 0) {
        let s = i, a = 0;
        for (; s > 0; s--)
          o = e.input.charCodeAt(++e.position), (i = n0(o)) >= 0 ? a = (a << 4) + i : U(e, "expected hexadecimal character");
        e.result += o0(a), e.position++;
      } else
        U(e, "unknown escape sequence");
      n = r = e.position;
    } else at(o) ? (bt(e, n, r, !0), ns(e, fe(e, !1, t)), n = r = e.position) : e.position === e.lineStart && pi(e) ? U(e, "unexpected end of the document within a double quoted scalar") : (e.position++, ht(o) || (r = e.position));
  }
  U(e, "unexpected end of the stream within a double quoted scalar");
}
function h0(e, t) {
  let n = !0, r, i, o;
  const s = e.tag;
  let a;
  const c = e.anchor;
  let h, l, f, p;
  const g = /* @__PURE__ */ Object.create(null);
  let w, y, T, A = e.input.charCodeAt(e.position);
  if (A === 91)
    h = 93, p = !1, a = [];
  else if (A === 123)
    h = 125, p = !0, a = {};
  else
    return !1;
  for (e.anchor !== null && Ht(e, e.anchor, a), A = e.input.charCodeAt(++e.position); A !== 0; ) {
    if (fe(e, !0, t), A = e.input.charCodeAt(e.position), A === h)
      return e.position++, e.tag = s, e.anchor = c, e.kind = p ? "mapping" : "sequence", e.result = a, !0;
    if (n ? A === 44 && U(e, "expected the node content, but found ','") : U(e, "missed comma between flow collection entries"), y = w = T = null, l = f = !1, A === 63) {
      const b = e.input.charCodeAt(e.position + 1);
      ke(b) && (l = f = !0, e.position++, fe(e, !0, t));
    }
    r = e.line, i = e.lineStart, o = e.position, vn(e, t, Zr, !1, !0), y = e.tag, w = e.result, fe(e, !0, t), A = e.input.charCodeAt(e.position), (f || e.line === r) && A === 58 && (l = !0, A = e.input.charCodeAt(++e.position), fe(e, !0, t), vn(e, t, Zr, !1, !0), T = e.result), p ? dn(e, a, g, y, w, T, r, i, o) : l ? a.push(dn(e, null, g, y, w, T, r, i, o)) : a.push(w), fe(e, !0, t), A = e.input.charCodeAt(e.position), A === 44 ? (n = !0, A = e.input.charCodeAt(++e.position)) : n = !1;
  }
  U(e, "unexpected end of the stream within a flow collection");
}
function p0(e, t) {
  let n, r = Xi, i = !1, o = !1, s = t, a = 0, c = !1, h, l = e.input.charCodeAt(e.position);
  if (l === 124)
    n = !1;
  else if (l === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; l !== 0; )
    if (l = e.input.charCodeAt(++e.position), l === 43 || l === 45)
      Xi === r ? r = l === 43 ? Ta : Qg : U(e, "repeat of a chomping mode identifier");
    else if ((h = i0(l)) >= 0)
      h === 0 ? U(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : o ? U(e, "repeat of an indentation width identifier") : (s = t + h - 1, o = !0);
    else
      break;
  if (ht(l)) {
    do
      l = e.input.charCodeAt(++e.position);
    while (ht(l));
    if (l === 35)
      do
        l = e.input.charCodeAt(++e.position);
      while (!at(l) && l !== 0);
  }
  for (; l !== 0; ) {
    for (ts(e), e.lineIndent = 0, l = e.input.charCodeAt(e.position); (!o || e.lineIndent < s) && l === 32; )
      e.lineIndent++, l = e.input.charCodeAt(++e.position);
    if (!o && e.lineIndent > s && (s = e.lineIndent), at(l)) {
      a++;
      continue;
    }
    if (!o && s === 0 && U(e, "missing indentation for block scalar"), e.lineIndent < s) {
      r === Ta ? e.result += jt.repeat(`
`, i ? 1 + a : a) : r === Xi && i && (e.result += `
`);
      break;
    }
    n ? ht(l) ? (c = !0, e.result += jt.repeat(`
`, i ? 1 + a : a)) : c ? (c = !1, e.result += jt.repeat(`
`, a + 1)) : a === 0 ? i && (e.result += " ") : e.result += jt.repeat(`
`, a) : e.result += jt.repeat(`
`, i ? 1 + a : a), i = !0, o = !0, a = 0;
    const f = e.position;
    for (; !at(l) && l !== 0; )
      l = e.input.charCodeAt(++e.position);
    bt(e, f, e.position, !1);
  }
  return !0;
}
function Ra(e, t) {
  const n = e.tag, r = e.anchor, i = [];
  let o = !1;
  if (e.firstTabInLine !== -1) return !1;
  e.anchor !== null && Ht(e, e.anchor, i);
  let s = e.input.charCodeAt(e.position);
  for (; s !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, U(e, "tab characters must not be used in indentation")), s === 45); ) {
    const a = e.input.charCodeAt(e.position + 1);
    if (!ke(a))
      break;
    if (o = !0, e.position++, fe(e, !0, -1) && e.lineIndent <= t) {
      i.push(null), s = e.input.charCodeAt(e.position);
      continue;
    }
    const c = e.line;
    if (vn(e, t, Tu, !1, !0), i.push(e.result), fe(e, !0, -1), s = e.input.charCodeAt(e.position), (e.line === c || e.lineIndent > t) && s !== 0)
      U(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return o ? (e.tag = n, e.anchor = r, e.kind = "sequence", e.result = i, !0) : !1;
}
function Ou(e, t, n) {
  let r, i, o, s;
  const a = e.tag, c = e.anchor, h = {}, l = /* @__PURE__ */ Object.create(null);
  let f = null, p = null, g = null, w = !1, y = !1;
  if (e.firstTabInLine !== -1) return !1;
  e.anchor !== null && Ht(e, e.anchor, h);
  let T = e.input.charCodeAt(e.position);
  for (; T !== 0; ) {
    !w && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, U(e, "tab characters must not be used in indentation"));
    const A = e.input.charCodeAt(e.position + 1), b = e.line;
    if ((T === 63 || T === 58) && ke(A))
      T === 63 ? (w && (dn(e, h, l, f, p, null, i, o, s), f = p = g = null), y = !0, w = !0, r = !0) : w ? (w = !1, r = !0) : U(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, T = A;
    else {
      if (i = e.line, o = e.lineStart, s = e.position, !vn(e, n, vu, !1, !0))
        break;
      if (e.line === b) {
        for (T = e.input.charCodeAt(e.position); ht(T); )
          T = e.input.charCodeAt(++e.position);
        if (T === 58)
          T = e.input.charCodeAt(++e.position), ke(T) || U(e, "a whitespace character is expected after the key-value separator within a block mapping"), w && (dn(e, h, l, f, p, null, i, o, s), f = p = g = null), y = !0, w = !1, r = !1, f = e.tag, p = e.result;
        else if (y)
          U(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = a, e.anchor = c, !0;
      } else if (y)
        U(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = a, e.anchor = c, !0;
    }
    if ((e.line === b || e.lineIndent > t) && (w && (i = e.line, o = e.lineStart, s = e.position), vn(e, t, ei, !0, r) && (w ? p = e.result : g = e.result), w || (dn(e, h, l, f, p, g, i, o, s), f = p = g = null), fe(e, !0, -1), T = e.input.charCodeAt(e.position)), (e.line === b || e.lineIndent > t) && T !== 0)
      U(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return w && dn(e, h, l, f, p, null, i, o, s), y && (e.tag = a, e.anchor = c, e.kind = "mapping", e.result = h), y;
}
function m0(e) {
  let t = !1, n = !1, r, i, o = e.input.charCodeAt(e.position);
  if (o !== 33) return !1;
  e.tag !== null && U(e, "duplication of a tag property"), o = e.input.charCodeAt(++e.position), o === 60 ? (t = !0, o = e.input.charCodeAt(++e.position)) : o === 33 ? (n = !0, r = "!!", o = e.input.charCodeAt(++e.position)) : r = "!";
  let s = e.position;
  if (t) {
    do
      o = e.input.charCodeAt(++e.position);
    while (o !== 0 && o !== 62);
    e.position < e.length ? (i = e.input.slice(s, e.position), o = e.input.charCodeAt(++e.position)) : U(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; o !== 0 && !ke(o); )
      o === 33 && (n ? U(e, "tag suffix cannot contain exclamation marks") : (r = e.input.slice(s - 1, e.position + 1), Au.test(r) || U(e, "named tag handle cannot contain such characters"), n = !0, s = e.position + 1)), o = e.input.charCodeAt(++e.position);
    i = e.input.slice(s, e.position), t0.test(i) && U(e, "tag suffix cannot contain flow indicator characters");
  }
  i && !Su.test(i) && U(e, "tag name cannot contain such characters: " + i);
  try {
    i = decodeURIComponent(i);
  } catch {
    U(e, "tag name is malformed: " + i);
  }
  return t ? e.tag = i : Ke.call(e.tagMap, r) ? e.tag = e.tagMap[r] + i : r === "!" ? e.tag = "!" + i : r === "!!" ? e.tag = "tag:yaml.org,2002:" + i : U(e, 'undeclared tag handle "' + r + '"'), !0;
}
function g0(e) {
  let t = e.input.charCodeAt(e.position);
  if (t !== 38) return !1;
  e.anchor !== null && U(e, "duplication of an anchor property"), t = e.input.charCodeAt(++e.position);
  const n = e.position;
  for (; t !== 0 && !ke(t) && !fn(t); )
    t = e.input.charCodeAt(++e.position);
  return e.position === n && U(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(n, e.position), !0;
}
function y0(e) {
  let t = e.input.charCodeAt(e.position);
  if (t !== 42) return !1;
  t = e.input.charCodeAt(++e.position);
  const n = e.position;
  for (; t !== 0 && !ke(t) && !fn(t); )
    t = e.input.charCodeAt(++e.position);
  e.position === n && U(e, "name of an alias node must contain at least one character");
  const r = e.input.slice(n, e.position);
  return Ke.call(e.anchorMap, r) || U(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], fe(e, !0, -1), !0;
}
function E0(e, t, n, r) {
  const i = Pu(e);
  return a0(e), ba(e, t), e.tag = null, e.anchor = null, e.kind = null, e.result = null, Ou(e, n, r) && e.kind === "mapping" ? (l0(e), !0) : (c0(e), ba(e, i), !1);
}
function vn(e, t, n, r, i) {
  let o, s, a = 1, c = !1, h = !1, l = null, f, p, g;
  e.depth >= e.maxDepth && U(e, "nesting exceeded maxDepth (" + e.maxDepth + ")"), e.depth += 1, e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null;
  const w = o = s = ei === n || Tu === n;
  if (r && fe(e, !0, -1) && (c = !0, e.lineIndent > t ? a = 1 : e.lineIndent === t ? a = 0 : e.lineIndent < t && (a = -1)), a === 1)
    for (; ; ) {
      const y = e.input.charCodeAt(e.position), T = Pu(e);
      if (c && (y === 33 && e.tag !== null || y === 38 && e.anchor !== null) || !m0(e) && !g0(e))
        break;
      l === null && (l = T), fe(e, !0, -1) ? (c = !0, s = w, e.lineIndent > t ? a = 1 : e.lineIndent === t ? a = 0 : e.lineIndent < t && (a = -1)) : s = !1;
    }
  if (s && (s = c || i), a === 1 || ei === n)
    if (Zr === n || vu === n ? p = t : p = t + 1, g = e.position - e.lineStart, a === 1)
      if (s && (Ra(e, g) || Ou(e, g, p)) || h0(e, p))
        h = !0;
      else {
        const y = e.input.charCodeAt(e.position);
        l !== null && w && !s && y !== 124 && y !== 62 && E0(
          e,
          l,
          l.position - l.lineStart,
          p
        ) || o && p0(e, p) || f0(e, p) || d0(e, p) ? h = !0 : y0(e) ? (h = !0, (e.tag !== null || e.anchor !== null) && U(e, "alias node should not have any properties")) : u0(e, p, Zr === n) && (h = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && Ht(e, e.anchor, e.result);
      }
    else a === 0 && (h = s && Ra(e, g));
  if (e.tag === null)
    e.anchor !== null && Ht(e, e.anchor, e.result);
  else if (e.tag === "?") {
    e.result !== null && e.kind !== "scalar" && U(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"');
    for (let y = 0, T = e.implicitTypes.length; y < T; y += 1)
      if (f = e.implicitTypes[y], f.resolve(e.result)) {
        e.result = f.construct(e.result), e.tag = f.tag, e.anchor !== null && Ht(e, e.anchor, e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (Ke.call(e.typeMap[e.kind || "fallback"], e.tag))
      f = e.typeMap[e.kind || "fallback"][e.tag];
    else {
      f = null;
      const y = e.typeMap.multi[e.kind || "fallback"];
      for (let T = 0, A = y.length; T < A; T += 1)
        if (e.tag.slice(0, y[T].tag.length) === y[T].tag) {
          f = y[T];
          break;
        }
    }
    f || U(e, "unknown tag !<" + e.tag + ">"), e.result !== null && f.kind !== e.kind && U(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + f.kind + '", not "' + e.kind + '"'), f.resolve(e.result, e.tag) ? (e.result = f.construct(e.result, e.tag), e.anchor !== null && Ht(e, e.anchor, e.result)) : U(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.depth -= 1, e.tag !== null || e.anchor !== null || h;
}
function w0(e) {
  const t = e.position;
  let n = !1, r;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (r = e.input.charCodeAt(e.position)) !== 0 && (fe(e, !0, -1), r = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || r !== 37)); ) {
    n = !0, r = e.input.charCodeAt(++e.position);
    let i = e.position;
    for (; r !== 0 && !ke(r); )
      r = e.input.charCodeAt(++e.position);
    const o = e.input.slice(i, e.position), s = [];
    for (o.length < 1 && U(e, "directive name must not be less than one character in length"); r !== 0; ) {
      for (; ht(r); )
        r = e.input.charCodeAt(++e.position);
      if (r === 35) {
        do
          r = e.input.charCodeAt(++e.position);
        while (r !== 0 && !at(r));
        break;
      }
      if (at(r)) break;
      for (i = e.position; r !== 0 && !ke(r); )
        r = e.input.charCodeAt(++e.position);
      s.push(e.input.slice(i, e.position));
    }
    r !== 0 && ts(e), Ke.call(Ca, o) ? Ca[o](e, o, s) : ti(e, 'unknown document directive "' + o + '"');
  }
  if (fe(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, fe(e, !0, -1)) : n && U(e, "directives end mark is expected"), vn(e, e.lineIndent - 1, ei, !1, !0), fe(e, !0, -1), e.checkLineBreaks && e0.test(e.input.slice(t, e.position)) && ti(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && pi(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, fe(e, !0, -1));
    return;
  }
  e.position < e.length - 1 && U(e, "end of the stream or a document separator is expected");
}
function Iu(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  const n = new s0(e, t), r = e.indexOf("\0");
  for (r !== -1 && (n.position = r, U(n, "null byte is not allowed in input")), n.input += "\0"; n.input.charCodeAt(n.position) === 32; )
    n.lineIndent += 1, n.position += 1;
  for (; n.position < n.length - 1; )
    w0(n);
  return n.documents;
}
function _0(e, t, n) {
  t !== null && typeof t == "object" && typeof n > "u" && (n = t, t = null);
  const r = Iu(e, n);
  if (typeof t != "function")
    return r;
  for (let i = 0, o = r.length; i < o; i += 1)
    t(r[i]);
}
function v0(e, t) {
  const n = Iu(e, t);
  if (n.length !== 0) {
    if (n.length === 1)
      return n[0];
    throw new _u("expected a single document in the stream, but found more");
  }
}
Qo.loadAll = _0;
Qo.load = v0;
var Nu = {};
const mi = Je, hr = dr, T0 = es, Du = Object.prototype.toString, Fu = Object.prototype.hasOwnProperty, rs = 65279, A0 = 9, Jn = 10, S0 = 13, b0 = 32, C0 = 33, $0 = 34, Po = 35, R0 = 37, P0 = 38, O0 = 39, I0 = 42, xu = 44, N0 = 45, ni = 58, D0 = 61, F0 = 62, x0 = 63, L0 = 64, Lu = 91, Uu = 93, U0 = 96, ku = 123, k0 = 124, Mu = 125, Pe = {};
Pe[0] = "\\0";
Pe[7] = "\\a";
Pe[8] = "\\b";
Pe[9] = "\\t";
Pe[10] = "\\n";
Pe[11] = "\\v";
Pe[12] = "\\f";
Pe[13] = "\\r";
Pe[27] = "\\e";
Pe[34] = '\\"';
Pe[92] = "\\\\";
Pe[133] = "\\N";
Pe[160] = "\\_";
Pe[8232] = "\\L";
Pe[8233] = "\\P";
const M0 = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
], B0 = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function j0(e, t) {
  if (t === null) return {};
  const n = {}, r = Object.keys(t);
  for (let i = 0, o = r.length; i < o; i += 1) {
    let s = r[i], a = String(t[s]);
    s.slice(0, 2) === "!!" && (s = "tag:yaml.org,2002:" + s.slice(2));
    const c = e.compiledTypeMap.fallback[s];
    c && Fu.call(c.styleAliases, a) && (a = c.styleAliases[a]), n[s] = a;
  }
  return n;
}
function H0(e) {
  let t, n;
  const r = e.toString(16).toUpperCase();
  if (e <= 255)
    t = "x", n = 2;
  else if (e <= 65535)
    t = "u", n = 4;
  else if (e <= 4294967295)
    t = "U", n = 8;
  else
    throw new hr("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + t + mi.repeat("0", n - r.length) + r;
}
const q0 = 1, Qn = 2;
function G0(e) {
  this.schema = e.schema || T0, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = mi.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = j0(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? Qn : q0, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function Pa(e, t) {
  const n = mi.repeat(" ", t);
  let r = 0, i = "";
  const o = e.length;
  for (; r < o; ) {
    let s;
    const a = e.indexOf(`
`, r);
    a === -1 ? (s = e.slice(r), r = o) : (s = e.slice(r, a + 1), r = a + 1), s.length && s !== `
` && (i += n), i += s;
  }
  return i;
}
function Oo(e, t) {
  return `
` + mi.repeat(" ", e.indent * t);
}
function V0(e, t) {
  for (let n = 0, r = e.implicitTypes.length; n < r; n += 1)
    if (e.implicitTypes[n].resolve(t))
      return !0;
  return !1;
}
function ri(e) {
  return e === b0 || e === A0;
}
function Zn(e) {
  return e >= 32 && e <= 126 || e >= 161 && e <= 55295 && e !== 8232 && e !== 8233 || e >= 57344 && e <= 65533 && e !== rs || e >= 65536 && e <= 1114111;
}
function Oa(e) {
  return Zn(e) && e !== rs && // - b-char
  e !== S0 && e !== Jn;
}
function Ia(e, t, n) {
  const r = Oa(e), i = r && !ri(e);
  return (
    // ns-plain-safe
    (n ? r : r && // - c-flow-indicator
    e !== xu && e !== Lu && e !== Uu && e !== ku && e !== Mu) && // ns-plain-char
    e !== Po && // false on '#'
    !(t === ni && !i) || // false on ': '
    Oa(t) && !ri(t) && e === Po || // change to true on '[^ ]#'
    t === ni && i
  );
}
function W0(e) {
  return Zn(e) && e !== rs && !ri(e) && // - s-white
  // - (c-indicator ::=
  // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
  e !== N0 && e !== x0 && e !== ni && e !== xu && e !== Lu && e !== Uu && e !== ku && e !== Mu && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
  e !== Po && e !== P0 && e !== I0 && e !== C0 && e !== k0 && e !== D0 && e !== F0 && e !== O0 && e !== $0 && // | “%” | “@” | “`”)
  e !== R0 && e !== L0 && e !== U0;
}
function z0(e) {
  return !ri(e) && e !== ni;
}
function Mn(e, t) {
  const n = e.charCodeAt(t);
  let r;
  return n >= 55296 && n <= 56319 && t + 1 < e.length && (r = e.charCodeAt(t + 1), r >= 56320 && r <= 57343) ? (n - 55296) * 1024 + r - 56320 + 65536 : n;
}
function Bu(e) {
  return /^\n* /.test(e);
}
const ju = 1, Io = 2, Hu = 3, qu = 4, ln = 5;
function Y0(e, t, n, r, i, o, s, a) {
  let c, h = 0, l = null, f = !1, p = !1;
  const g = r !== -1;
  let w = -1, y = W0(Mn(e, 0)) && z0(Mn(e, e.length - 1));
  if (t || s)
    for (c = 0; c < e.length; h >= 65536 ? c += 2 : c++) {
      if (h = Mn(e, c), !Zn(h))
        return ln;
      y = y && Ia(h, l, a), l = h;
    }
  else {
    for (c = 0; c < e.length; h >= 65536 ? c += 2 : c++) {
      if (h = Mn(e, c), h === Jn)
        f = !0, g && (p = p || // Foldable line = too long, and not more-indented.
        c - w - 1 > r && e[w + 1] !== " ", w = c);
      else if (!Zn(h))
        return ln;
      y = y && Ia(h, l, a), l = h;
    }
    p = p || g && c - w - 1 > r && e[w + 1] !== " ";
  }
  return !f && !p ? y && !s && !i(e) ? ju : o === Qn ? ln : Io : n > 9 && Bu(e) ? ln : s ? o === Qn ? ln : Io : p ? qu : Hu;
}
function X0(e, t, n, r, i) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === Qn ? '""' : "''";
    if (!e.noCompatMode && (M0.indexOf(t) !== -1 || B0.test(t)))
      return e.quotingType === Qn ? '"' + t + '"' : "'" + t + "'";
    const o = e.indent * Math.max(1, n), s = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - o), a = r || // No block styles in flow mode.
    e.flowLevel > -1 && n >= e.flowLevel;
    function c(h) {
      return V0(e, h);
    }
    switch (Y0(
      t,
      a,
      e.indent,
      s,
      c,
      e.quotingType,
      e.forceQuotes && !r,
      i
    )) {
      case ju:
        return t;
      case Io:
        return "'" + t.replace(/'/g, "''") + "'";
      case Hu:
        return "|" + Na(t, e.indent) + Da(Pa(t, o));
      case qu:
        return ">" + Na(t, e.indent) + Da(Pa(K0(t, s), o));
      case ln:
        return '"' + J0(t) + '"';
      default:
        throw new hr("impossible error: invalid scalar style");
    }
  }();
}
function Na(e, t) {
  const n = Bu(e) ? String(t) : "", r = e[e.length - 1] === `
`, o = r && (e[e.length - 2] === `
` || e === `
`) ? "+" : r ? "" : "-";
  return n + o + `
`;
}
function Da(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function K0(e, t) {
  const n = /(\n+)([^\n]*)/g;
  let r = function() {
    let a = e.indexOf(`
`);
    return a = a !== -1 ? a : e.length, n.lastIndex = a, Fa(e.slice(0, a), t);
  }(), i = e[0] === `
` || e[0] === " ", o, s;
  for (; s = n.exec(e); ) {
    const a = s[1], c = s[2];
    o = c[0] === " ", r += a + (!i && !o && c !== "" ? `
` : "") + Fa(c, t), i = o;
  }
  return r;
}
function Fa(e, t) {
  if (e === "" || e[0] === " ") return e;
  const n = / [^ ]/g;
  let r, i = 0, o, s = 0, a = 0, c = "";
  for (; r = n.exec(e); )
    a = r.index, a - i > t && (o = s > i ? s : a, c += `
` + e.slice(i, o), i = o + 1), s = a;
  return c += `
`, e.length - i > t && s > i ? c += e.slice(i, s) + `
` + e.slice(s + 1) : c += e.slice(i), c.slice(1);
}
function J0(e) {
  let t = "", n = 0;
  for (let r = 0; r < e.length; n >= 65536 ? r += 2 : r++) {
    n = Mn(e, r);
    const i = Pe[n];
    !i && Zn(n) ? (t += e[r], n >= 65536 && (t += e[r + 1])) : t += i || H0(n);
  }
  return t;
}
function Q0(e, t, n) {
  let r = "";
  const i = e.tag;
  for (let o = 0, s = n.length; o < s; o += 1) {
    let a = n[o];
    e.replacer && (a = e.replacer.call(n, String(o), a)), (pt(e, t, a, !1, !1) || typeof a > "u" && pt(e, t, null, !1, !1)) && (r !== "" && (r += "," + (e.condenseFlow ? "" : " ")), r += e.dump);
  }
  e.tag = i, e.dump = "[" + r + "]";
}
function xa(e, t, n, r) {
  let i = "";
  const o = e.tag;
  for (let s = 0, a = n.length; s < a; s += 1) {
    let c = n[s];
    e.replacer && (c = e.replacer.call(n, String(s), c)), (pt(e, t + 1, c, !0, !0, !1, !0) || typeof c > "u" && pt(e, t + 1, null, !0, !0, !1, !0)) && ((!r || i !== "") && (i += Oo(e, t)), e.dump && Jn === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  }
  e.tag = o, e.dump = i || "[]";
}
function Z0(e, t, n) {
  let r = "";
  const i = e.tag, o = Object.keys(n);
  for (let s = 0, a = o.length; s < a; s += 1) {
    let c = "";
    r !== "" && (c += ", "), e.condenseFlow && (c += '"');
    const h = o[s];
    let l = n[h];
    e.replacer && (l = e.replacer.call(n, h, l)), pt(e, t, h, !1, !1) && (e.dump.length > 1024 && (c += "? "), c += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), pt(e, t, l, !1, !1) && (c += e.dump, r += c));
  }
  e.tag = i, e.dump = "{" + r + "}";
}
function ey(e, t, n, r) {
  let i = "";
  const o = e.tag, s = Object.keys(n);
  if (e.sortKeys === !0)
    s.sort();
  else if (typeof e.sortKeys == "function")
    s.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new hr("sortKeys must be a boolean or a function");
  for (let a = 0, c = s.length; a < c; a += 1) {
    let h = "";
    (!r || i !== "") && (h += Oo(e, t));
    const l = s[a];
    let f = n[l];
    if (e.replacer && (f = e.replacer.call(n, l, f)), !pt(e, t + 1, l, !0, !0, !0))
      continue;
    const p = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024;
    p && (e.dump && Jn === e.dump.charCodeAt(0) ? h += "?" : h += "? "), h += e.dump, p && (h += Oo(e, t)), pt(e, t + 1, f, !0, p) && (e.dump && Jn === e.dump.charCodeAt(0) ? h += ":" : h += ": ", h += e.dump, i += h);
  }
  e.tag = o, e.dump = i || "{}";
}
function La(e, t, n) {
  const r = n ? e.explicitTypes : e.implicitTypes;
  for (let i = 0, o = r.length; i < o; i += 1) {
    const s = r[i];
    if ((s.instanceOf || s.predicate) && (!s.instanceOf || typeof t == "object" && t instanceof s.instanceOf) && (!s.predicate || s.predicate(t))) {
      if (n ? s.multi && s.representName ? e.tag = s.representName(t) : e.tag = s.tag : e.tag = "?", s.represent) {
        const a = e.styleMap[s.tag] || s.defaultStyle;
        let c;
        if (Du.call(s.represent) === "[object Function]")
          c = s.represent(t, a);
        else if (Fu.call(s.represent, a))
          c = s.represent[a](t, a);
        else
          throw new hr("!<" + s.tag + '> tag resolver accepts not "' + a + '" style');
        e.dump = c;
      }
      return !0;
    }
  }
  return !1;
}
function pt(e, t, n, r, i, o, s) {
  e.tag = null, e.dump = n, La(e, n, !1) || La(e, n, !0);
  const a = Du.call(e.dump), c = r;
  r && (r = e.flowLevel < 0 || e.flowLevel > t);
  const h = a === "[object Object]" || a === "[object Array]";
  let l, f;
  if (h && (l = e.duplicates.indexOf(n), f = l !== -1), (e.tag !== null && e.tag !== "?" || f || e.indent !== 2 && t > 0) && (i = !1), f && e.usedDuplicates[l])
    e.dump = "*ref_" + l;
  else {
    if (h && f && !e.usedDuplicates[l] && (e.usedDuplicates[l] = !0), a === "[object Object]")
      r && Object.keys(e.dump).length !== 0 ? (ey(e, t, e.dump, i), f && (e.dump = "&ref_" + l + e.dump)) : (Z0(e, t, e.dump), f && (e.dump = "&ref_" + l + " " + e.dump));
    else if (a === "[object Array]")
      r && e.dump.length !== 0 ? (e.noArrayIndent && !s && t > 0 ? xa(e, t - 1, e.dump, i) : xa(e, t, e.dump, i), f && (e.dump = "&ref_" + l + e.dump)) : (Q0(e, t, e.dump), f && (e.dump = "&ref_" + l + " " + e.dump));
    else if (a === "[object String]")
      e.tag !== "?" && X0(e, e.dump, t, o, c);
    else {
      if (a === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new hr("unacceptable kind of an object to dump " + a);
    }
    if (e.tag !== null && e.tag !== "?") {
      let p = encodeURI(
        e.tag[0] === "!" ? e.tag.slice(1) : e.tag
      ).replace(/!/g, "%21");
      e.tag[0] === "!" ? p = "!" + p : p.slice(0, 18) === "tag:yaml.org,2002:" ? p = "!!" + p.slice(18) : p = "!<" + p + ">", e.dump = p + " " + e.dump;
    }
  }
  return !0;
}
function ty(e, t) {
  const n = [], r = [];
  No(e, n, r);
  const i = r.length;
  for (let o = 0; o < i; o += 1)
    t.duplicates.push(n[r[o]]);
  t.usedDuplicates = new Array(i);
}
function No(e, t, n) {
  if (e !== null && typeof e == "object") {
    const r = t.indexOf(e);
    if (r !== -1)
      n.indexOf(r) === -1 && n.push(r);
    else if (t.push(e), Array.isArray(e))
      for (let i = 0, o = e.length; i < o; i += 1)
        No(e[i], t, n);
    else {
      const i = Object.keys(e);
      for (let o = 0, s = i.length; o < s; o += 1)
        No(e[i[o]], t, n);
    }
  }
}
function ny(e, t) {
  t = t || {};
  const n = new G0(t);
  n.noRefs || ty(e, n);
  let r = e;
  return n.replacer && (r = n.replacer.call({ "": r }, "", r)), pt(n, 0, r, !0, !0) ? n.dump + `
` : "";
}
Nu.dump = ny;
const Gu = Qo, ry = Nu;
function is(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
Te.Type = xe;
Te.Schema = eu;
Te.FAILSAFE_SCHEMA = iu;
Te.JSON_SCHEMA = uu;
Te.CORE_SCHEMA = fu;
Te.DEFAULT_SCHEMA = es;
Te.load = Gu.load;
Te.loadAll = Gu.loadAll;
Te.dump = ry.dump;
Te.YAMLException = dr;
Te.types = {
  binary: gu,
  float: cu,
  map: ru,
  null: ou,
  pairs: Eu,
  set: wu,
  timestamp: pu,
  bool: su,
  int: au,
  merge: mu,
  omap: yu,
  seq: nu,
  str: tu
};
Te.safeLoad = is("safeLoad", "load");
Te.safeLoadAll = is("safeLoadAll", "loadAll");
Te.safeDump = is("safeDump", "dump");
var gi = {};
Object.defineProperty(gi, "__esModule", { value: !0 });
gi.Lazy = void 0;
class iy {
  constructor(t) {
    this._value = null, this.creator = t;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null)
      return this._value;
    const t = this.creator();
    return this.value = t, t;
  }
  set value(t) {
    this._value = t, this.creator = null;
  }
}
gi.Lazy = iy;
var Do = { exports: {} };
const oy = "2.0.0", Vu = 256, sy = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, ay = 16, ly = Vu - 6, cy = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var yi = {
  MAX_LENGTH: Vu,
  MAX_SAFE_COMPONENT_LENGTH: ay,
  MAX_SAFE_BUILD_LENGTH: ly,
  MAX_SAFE_INTEGER: sy,
  RELEASE_TYPES: cy,
  SEMVER_SPEC_VERSION: oy,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const uy = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var Ei = uy;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: n,
    MAX_SAFE_BUILD_LENGTH: r,
    MAX_LENGTH: i
  } = yi, o = Ei;
  t = e.exports = {};
  const s = t.re = [], a = t.safeRe = [], c = t.src = [], h = t.safeSrc = [], l = t.t = {};
  let f = 0;
  const p = "[a-zA-Z0-9-]", g = [
    ["\\s", 1],
    ["\\d", i],
    [p, r]
  ], w = (T) => {
    for (const [A, b] of g)
      T = T.split(`${A}*`).join(`${A}{0,${b}}`).split(`${A}+`).join(`${A}{1,${b}}`);
    return T;
  }, y = (T, A, b) => {
    const I = w(A), k = f++;
    o(T, k, A), l[T] = k, c[k] = A, h[k] = I, s[k] = new RegExp(A, b ? "g" : void 0), a[k] = new RegExp(I, b ? "g" : void 0);
  };
  y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${p}*`), y("MAINVERSION", `(${c[l.NUMERICIDENTIFIER]})\\.(${c[l.NUMERICIDENTIFIER]})\\.(${c[l.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${c[l.NUMERICIDENTIFIERLOOSE]})\\.(${c[l.NUMERICIDENTIFIERLOOSE]})\\.(${c[l.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${c[l.NONNUMERICIDENTIFIER]}|${c[l.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${c[l.NONNUMERICIDENTIFIER]}|${c[l.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${c[l.PRERELEASEIDENTIFIER]}(?:\\.${c[l.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${c[l.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${c[l.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${p}+`), y("BUILD", `(?:\\+(${c[l.BUILDIDENTIFIER]}(?:\\.${c[l.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${c[l.MAINVERSION]}${c[l.PRERELEASE]}?${c[l.BUILD]}?`), y("FULL", `^${c[l.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${c[l.MAINVERSIONLOOSE]}${c[l.PRERELEASELOOSE]}?${c[l.BUILD]}?`), y("LOOSE", `^${c[l.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${c[l.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${c[l.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${c[l.XRANGEIDENTIFIER]})(?:\\.(${c[l.XRANGEIDENTIFIER]})(?:\\.(${c[l.XRANGEIDENTIFIER]})(?:${c[l.PRERELEASE]})?${c[l.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${c[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[l.XRANGEIDENTIFIERLOOSE]})(?:${c[l.PRERELEASELOOSE]})?${c[l.BUILD]}?)?)?`), y("XRANGE", `^${c[l.GTLT]}\\s*${c[l.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${c[l.GTLT]}\\s*${c[l.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${n}})(?:\\.(\\d{1,${n}}))?(?:\\.(\\d{1,${n}}))?`), y("COERCE", `${c[l.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", c[l.COERCEPLAIN] + `(?:${c[l.PRERELEASE]})?(?:${c[l.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", c[l.COERCE], !0), y("COERCERTLFULL", c[l.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${c[l.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", y("TILDE", `^${c[l.LONETILDE]}${c[l.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${c[l.LONETILDE]}${c[l.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${c[l.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", y("CARET", `^${c[l.LONECARET]}${c[l.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${c[l.LONECARET]}${c[l.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${c[l.GTLT]}\\s*(${c[l.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${c[l.GTLT]}\\s*(${c[l.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${c[l.GTLT]}\\s*(${c[l.LOOSEPLAIN]}|${c[l.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${c[l.XRANGEPLAIN]})\\s+-\\s+(${c[l.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${c[l.XRANGEPLAINLOOSE]})\\s+-\\s+(${c[l.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(Do, Do.exports);
var pr = Do.exports;
const fy = Object.freeze({ loose: !0 }), dy = Object.freeze({}), hy = (e) => e ? typeof e != "object" ? fy : e : dy;
var os = hy;
const Ua = /^[0-9]+$/, Wu = (e, t) => {
  if (typeof e == "number" && typeof t == "number")
    return e === t ? 0 : e < t ? -1 : 1;
  const n = Ua.test(e), r = Ua.test(t);
  return n && r && (e = +e, t = +t), e === t ? 0 : n && !r ? -1 : r && !n ? 1 : e < t ? -1 : 1;
}, py = (e, t) => Wu(t, e);
var zu = {
  compareIdentifiers: Wu,
  rcompareIdentifiers: py
};
const Fr = Ei, { MAX_LENGTH: ka, MAX_SAFE_INTEGER: xr } = yi, { safeRe: Lr, t: Ur } = pr, my = os, { compareIdentifiers: Ki } = zu;
let gy = class nt {
  constructor(t, n) {
    if (n = my(n), t instanceof nt) {
      if (t.loose === !!n.loose && t.includePrerelease === !!n.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > ka)
      throw new TypeError(
        `version is longer than ${ka} characters`
      );
    Fr("SemVer", t, n), this.options = n, this.loose = !!n.loose, this.includePrerelease = !!n.includePrerelease;
    const r = t.trim().match(n.loose ? Lr[Ur.LOOSE] : Lr[Ur.FULL]);
    if (!r)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +r[1], this.minor = +r[2], this.patch = +r[3], this.major > xr || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > xr || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > xr || this.patch < 0)
      throw new TypeError("Invalid patch version");
    r[4] ? this.prerelease = r[4].split(".").map((i) => {
      if (/^[0-9]+$/.test(i)) {
        const o = +i;
        if (o >= 0 && o < xr)
          return o;
      }
      return i;
    }) : this.prerelease = [], this.build = r[5] ? r[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (Fr("SemVer.compare", this.version, this.options, t), !(t instanceof nt)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new nt(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof nt || (t = new nt(t, this.options)), this.major < t.major ? -1 : this.major > t.major ? 1 : this.minor < t.minor ? -1 : this.minor > t.minor ? 1 : this.patch < t.patch ? -1 : this.patch > t.patch ? 1 : 0;
  }
  comparePre(t) {
    if (t instanceof nt || (t = new nt(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let n = 0;
    do {
      const r = this.prerelease[n], i = t.prerelease[n];
      if (Fr("prerelease compare", n, r, i), r === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (r === void 0)
        return -1;
      if (r === i)
        continue;
      return Ki(r, i);
    } while (++n);
  }
  compareBuild(t) {
    t instanceof nt || (t = new nt(t, this.options));
    let n = 0;
    do {
      const r = this.build[n], i = t.build[n];
      if (Fr("build compare", n, r, i), r === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (r === void 0)
        return -1;
      if (r === i)
        continue;
      return Ki(r, i);
    } while (++n);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, n, r) {
    if (t.startsWith("pre")) {
      if (!n && r === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (n) {
        const i = `-${n}`.match(this.options.loose ? Lr[Ur.PRERELEASELOOSE] : Lr[Ur.PRERELEASE]);
        if (!i || i[1] !== n)
          throw new Error(`invalid identifier: ${n}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", n, r);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", n, r);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", n, r), this.inc("pre", n, r);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", n, r), this.inc("pre", n, r);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const i = Number(r) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [i];
        else {
          let o = this.prerelease.length;
          for (; --o >= 0; )
            typeof this.prerelease[o] == "number" && (this.prerelease[o]++, o = -2);
          if (o === -1) {
            if (n === this.prerelease.join(".") && r === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(i);
          }
        }
        if (n) {
          let o = [n, i];
          r === !1 && (o = [n]), Ki(this.prerelease[0], n) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = o) : this.prerelease = o;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var Le = gy;
const Ma = Le, yy = (e, t, n = !1) => {
  if (e instanceof Ma)
    return e;
  try {
    return new Ma(e, t);
  } catch (r) {
    if (!n)
      return null;
    throw r;
  }
};
var Sn = yy;
const Ey = Sn, wy = (e, t) => {
  const n = Ey(e, t);
  return n ? n.version : null;
};
var _y = wy;
const vy = Sn, Ty = (e, t) => {
  const n = vy(e.trim().replace(/^[=v]+/, ""), t);
  return n ? n.version : null;
};
var Ay = Ty;
const Ba = Le, Sy = (e, t, n, r, i) => {
  typeof n == "string" && (i = r, r = n, n = void 0);
  try {
    return new Ba(
      e instanceof Ba ? e.version : e,
      n
    ).inc(t, r, i).version;
  } catch {
    return null;
  }
};
var by = Sy;
const ja = Sn, Cy = (e, t) => {
  const n = ja(e, null, !0), r = ja(t, null, !0), i = n.compare(r);
  if (i === 0)
    return null;
  const o = i > 0, s = o ? n : r, a = o ? r : n, c = !!s.prerelease.length;
  if (!!a.prerelease.length && !c) {
    if (!a.patch && !a.minor)
      return "major";
    if (a.compareMain(s) === 0)
      return a.minor && !a.patch ? "minor" : "patch";
  }
  const l = c ? "pre" : "";
  return n.major !== r.major ? l + "major" : n.minor !== r.minor ? l + "minor" : n.patch !== r.patch ? l + "patch" : "prerelease";
};
var $y = Cy;
const Ry = Le, Py = (e, t) => new Ry(e, t).major;
var Oy = Py;
const Iy = Le, Ny = (e, t) => new Iy(e, t).minor;
var Dy = Ny;
const Fy = Le, xy = (e, t) => new Fy(e, t).patch;
var Ly = xy;
const Uy = Sn, ky = (e, t) => {
  const n = Uy(e, t);
  return n && n.prerelease.length ? n.prerelease : null;
};
var My = ky;
const Ha = Le, By = (e, t, n) => new Ha(e, n).compare(new Ha(t, n));
var Qe = By;
const jy = Qe, Hy = (e, t, n) => jy(t, e, n);
var qy = Hy;
const Gy = Qe, Vy = (e, t) => Gy(e, t, !0);
var Wy = Vy;
const qa = Le, zy = (e, t, n) => {
  const r = new qa(e, n), i = new qa(t, n);
  return r.compare(i) || r.compareBuild(i);
};
var ss = zy;
const Yy = ss, Xy = (e, t) => e.sort((n, r) => Yy(n, r, t));
var Ky = Xy;
const Jy = ss, Qy = (e, t) => e.sort((n, r) => Jy(r, n, t));
var Zy = Qy;
const eE = Qe, tE = (e, t, n) => eE(e, t, n) > 0;
var wi = tE;
const nE = Qe, rE = (e, t, n) => nE(e, t, n) < 0;
var as = rE;
const iE = Qe, oE = (e, t, n) => iE(e, t, n) === 0;
var Yu = oE;
const sE = Qe, aE = (e, t, n) => sE(e, t, n) !== 0;
var Xu = aE;
const lE = Qe, cE = (e, t, n) => lE(e, t, n) >= 0;
var ls = cE;
const uE = Qe, fE = (e, t, n) => uE(e, t, n) <= 0;
var cs = fE;
const dE = Yu, hE = Xu, pE = wi, mE = ls, gE = as, yE = cs, EE = (e, t, n, r) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof n == "object" && (n = n.version), e === n;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof n == "object" && (n = n.version), e !== n;
    case "":
    case "=":
    case "==":
      return dE(e, n, r);
    case "!=":
      return hE(e, n, r);
    case ">":
      return pE(e, n, r);
    case ">=":
      return mE(e, n, r);
    case "<":
      return gE(e, n, r);
    case "<=":
      return yE(e, n, r);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var Ku = EE;
const wE = Le, _E = Sn, { safeRe: kr, t: Mr } = pr, vE = (e, t) => {
  if (e instanceof wE)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let n = null;
  if (!t.rtl)
    n = e.match(t.includePrerelease ? kr[Mr.COERCEFULL] : kr[Mr.COERCE]);
  else {
    const c = t.includePrerelease ? kr[Mr.COERCERTLFULL] : kr[Mr.COERCERTL];
    let h;
    for (; (h = c.exec(e)) && (!n || n.index + n[0].length !== e.length); )
      (!n || h.index + h[0].length !== n.index + n[0].length) && (n = h), c.lastIndex = h.index + h[1].length + h[2].length;
    c.lastIndex = -1;
  }
  if (n === null)
    return null;
  const r = n[2], i = n[3] || "0", o = n[4] || "0", s = t.includePrerelease && n[5] ? `-${n[5]}` : "", a = t.includePrerelease && n[6] ? `+${n[6]}` : "";
  return _E(`${r}.${i}.${o}${s}${a}`, t);
};
var TE = vE;
class AE {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const n = this.map.get(t);
    if (n !== void 0)
      return this.map.delete(t), this.map.set(t, n), n;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, n) {
    if (!this.delete(t) && n !== void 0) {
      if (this.map.size >= this.max) {
        const i = this.map.keys().next().value;
        this.delete(i);
      }
      this.map.set(t, n);
    }
    return this;
  }
}
var SE = AE, Ji, Ga;
function Ze() {
  if (Ga) return Ji;
  Ga = 1;
  const e = /\s+/g;
  class t {
    constructor(R, N) {
      if (N = i(N), R instanceof t)
        return R.loose === !!N.loose && R.includePrerelease === !!N.includePrerelease ? R : new t(R.raw, N);
      if (R instanceof o)
        return this.raw = R.value, this.set = [[R]], this.formatted = void 0, this;
      if (this.options = N, this.loose = !!N.loose, this.includePrerelease = !!N.includePrerelease, this.raw = R.trim().replace(e, " "), this.set = this.raw.split("||").map(($) => this.parseRange($.trim())).filter(($) => $.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const $ = this.set[0];
        if (this.set = this.set.filter((D) => !y(D[0])), this.set.length === 0)
          this.set = [$];
        else if (this.set.length > 1) {
          for (const D of this.set)
            if (D.length === 1 && T(D[0])) {
              this.set = [D];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let R = 0; R < this.set.length; R++) {
          R > 0 && (this.formatted += "||");
          const N = this.set[R];
          for (let $ = 0; $ < N.length; $++)
            $ > 0 && (this.formatted += " "), this.formatted += N[$].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(R) {
      const $ = ((this.options.includePrerelease && g) | (this.options.loose && w)) + ":" + R, D = r.get($);
      if (D)
        return D;
      const O = this.options.loose, B = O ? c[h.HYPHENRANGELOOSE] : c[h.HYPHENRANGE];
      R = R.replace(B, X(this.options.includePrerelease)), s("hyphen replace", R), R = R.replace(c[h.COMPARATORTRIM], l), s("comparator trim", R), R = R.replace(c[h.TILDETRIM], f), s("tilde trim", R), R = R.replace(c[h.CARETTRIM], p), s("caret trim", R);
      let W = R.split(" ").map((j) => b(j, this.options)).join(" ").split(/\s+/).map((j) => q(j, this.options));
      O && (W = W.filter((j) => (s("loose invalid filter", j, this.options), !!j.match(c[h.COMPARATORLOOSE])))), s("range list", W);
      const F = /* @__PURE__ */ new Map(), K = W.map((j) => new o(j, this.options));
      for (const j of K) {
        if (y(j))
          return [j];
        F.set(j.value, j);
      }
      F.size > 1 && F.has("") && F.delete("");
      const he = [...F.values()];
      return r.set($, he), he;
    }
    intersects(R, N) {
      if (!(R instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some(($) => A($, N) && R.set.some((D) => A(D, N) && $.every((O) => D.every((B) => O.intersects(B, N)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(R) {
      if (!R)
        return !1;
      if (typeof R == "string")
        try {
          R = new a(R, this.options);
        } catch {
          return !1;
        }
      for (let N = 0; N < this.set.length; N++)
        if (re(this.set[N], R, this.options))
          return !0;
      return !1;
    }
  }
  Ji = t;
  const n = SE, r = new n(), i = os, o = _i(), s = Ei, a = Le, {
    safeRe: c,
    t: h,
    comparatorTrimReplace: l,
    tildeTrimReplace: f,
    caretTrimReplace: p
  } = pr, { FLAG_INCLUDE_PRERELEASE: g, FLAG_LOOSE: w } = yi, y = (P) => P.value === "<0.0.0-0", T = (P) => P.value === "", A = (P, R) => {
    let N = !0;
    const $ = P.slice();
    let D = $.pop();
    for (; N && $.length; )
      N = $.every((O) => D.intersects(O, R)), D = $.pop();
    return N;
  }, b = (P, R) => (P = P.replace(c[h.BUILD], ""), s("comp", P, R), P = Z(P, R), s("caret", P), P = k(P, R), s("tildes", P), P = ce(P, R), s("xrange", P), P = E(P, R), s("stars", P), P), I = (P) => !P || P.toLowerCase() === "x" || P === "*", k = (P, R) => P.trim().split(/\s+/).map((N) => G(N, R)).join(" "), G = (P, R) => {
    const N = R.loose ? c[h.TILDELOOSE] : c[h.TILDE];
    return P.replace(N, ($, D, O, B, W) => {
      s("tilde", P, $, D, O, B, W);
      let F;
      return I(D) ? F = "" : I(O) ? F = `>=${D}.0.0 <${+D + 1}.0.0-0` : I(B) ? F = `>=${D}.${O}.0 <${D}.${+O + 1}.0-0` : W ? (s("replaceTilde pr", W), F = `>=${D}.${O}.${B}-${W} <${D}.${+O + 1}.0-0`) : F = `>=${D}.${O}.${B} <${D}.${+O + 1}.0-0`, s("tilde return", F), F;
    });
  }, Z = (P, R) => P.trim().split(/\s+/).map((N) => ee(N, R)).join(" "), ee = (P, R) => {
    s("caret", P, R);
    const N = R.loose ? c[h.CARETLOOSE] : c[h.CARET], $ = R.includePrerelease ? "-0" : "";
    return P.replace(N, (D, O, B, W, F) => {
      s("caret", P, D, O, B, W, F);
      let K;
      return I(O) ? K = "" : I(B) ? K = `>=${O}.0.0${$} <${+O + 1}.0.0-0` : I(W) ? O === "0" ? K = `>=${O}.${B}.0${$} <${O}.${+B + 1}.0-0` : K = `>=${O}.${B}.0${$} <${+O + 1}.0.0-0` : F ? (s("replaceCaret pr", F), O === "0" ? B === "0" ? K = `>=${O}.${B}.${W}-${F} <${O}.${B}.${+W + 1}-0` : K = `>=${O}.${B}.${W}-${F} <${O}.${+B + 1}.0-0` : K = `>=${O}.${B}.${W}-${F} <${+O + 1}.0.0-0`) : (s("no pr"), O === "0" ? B === "0" ? K = `>=${O}.${B}.${W}${$} <${O}.${B}.${+W + 1}-0` : K = `>=${O}.${B}.${W}${$} <${O}.${+B + 1}.0-0` : K = `>=${O}.${B}.${W} <${+O + 1}.0.0-0`), s("caret return", K), K;
    });
  }, ce = (P, R) => (s("replaceXRanges", P, R), P.split(/\s+/).map((N) => M(N, R)).join(" ")), M = (P, R) => {
    P = P.trim();
    const N = R.loose ? c[h.XRANGELOOSE] : c[h.XRANGE];
    return P.replace(N, ($, D, O, B, W, F) => {
      s("xRange", P, $, D, O, B, W, F);
      const K = I(O), he = K || I(B), j = he || I(W), Ae = j;
      return D === "=" && Ae && (D = ""), F = R.includePrerelease ? "-0" : "", K ? D === ">" || D === "<" ? $ = "<0.0.0-0" : $ = "*" : D && Ae ? (he && (B = 0), W = 0, D === ">" ? (D = ">=", he ? (O = +O + 1, B = 0, W = 0) : (B = +B + 1, W = 0)) : D === "<=" && (D = "<", he ? O = +O + 1 : B = +B + 1), D === "<" && (F = "-0"), $ = `${D + O}.${B}.${W}${F}`) : he ? $ = `>=${O}.0.0${F} <${+O + 1}.0.0-0` : j && ($ = `>=${O}.${B}.0${F} <${O}.${+B + 1}.0-0`), s("xRange return", $), $;
    });
  }, E = (P, R) => (s("replaceStars", P, R), P.trim().replace(c[h.STAR], "")), q = (P, R) => (s("replaceGTE0", P, R), P.trim().replace(c[R.includePrerelease ? h.GTE0PRE : h.GTE0], "")), X = (P) => (R, N, $, D, O, B, W, F, K, he, j, Ae) => (I($) ? N = "" : I(D) ? N = `>=${$}.0.0${P ? "-0" : ""}` : I(O) ? N = `>=${$}.${D}.0${P ? "-0" : ""}` : B ? N = `>=${N}` : N = `>=${N}${P ? "-0" : ""}`, I(K) ? F = "" : I(he) ? F = `<${+K + 1}.0.0-0` : I(j) ? F = `<${K}.${+he + 1}.0-0` : Ae ? F = `<=${K}.${he}.${j}-${Ae}` : P ? F = `<${K}.${he}.${+j + 1}-0` : F = `<=${F}`, `${N} ${F}`.trim()), re = (P, R, N) => {
    for (let $ = 0; $ < P.length; $++)
      if (!P[$].test(R))
        return !1;
    if (R.prerelease.length && !N.includePrerelease) {
      for (let $ = 0; $ < P.length; $++)
        if (s(P[$].semver), P[$].semver !== o.ANY && P[$].semver.prerelease.length > 0) {
          const D = P[$].semver;
          if (D.major === R.major && D.minor === R.minor && D.patch === R.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Ji;
}
var Qi, Va;
function _i() {
  if (Va) return Qi;
  Va = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(l, f) {
      if (f = n(f), l instanceof t) {
        if (l.loose === !!f.loose)
          return l;
        l = l.value;
      }
      l = l.trim().split(/\s+/).join(" "), s("comparator", l, f), this.options = f, this.loose = !!f.loose, this.parse(l), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, s("comp", this);
    }
    parse(l) {
      const f = this.options.loose ? r[i.COMPARATORLOOSE] : r[i.COMPARATOR], p = l.match(f);
      if (!p)
        throw new TypeError(`Invalid comparator: ${l}`);
      this.operator = p[1] !== void 0 ? p[1] : "", this.operator === "=" && (this.operator = ""), p[2] ? this.semver = new a(p[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(l) {
      if (s("Comparator.test", l, this.options.loose), this.semver === e || l === e)
        return !0;
      if (typeof l == "string")
        try {
          l = new a(l, this.options);
        } catch {
          return !1;
        }
      return o(l, this.operator, this.semver, this.options);
    }
    intersects(l, f) {
      if (!(l instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new c(l.value, f).test(this.value) : l.operator === "" ? l.value === "" ? !0 : new c(this.value, f).test(l.semver) : (f = n(f), f.includePrerelease && (this.value === "<0.0.0-0" || l.value === "<0.0.0-0") || !f.includePrerelease && (this.value.startsWith("<0.0.0") || l.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && l.operator.startsWith(">") || this.operator.startsWith("<") && l.operator.startsWith("<") || this.semver.version === l.semver.version && this.operator.includes("=") && l.operator.includes("=") || o(this.semver, "<", l.semver, f) && this.operator.startsWith(">") && l.operator.startsWith("<") || o(this.semver, ">", l.semver, f) && this.operator.startsWith("<") && l.operator.startsWith(">")));
    }
  }
  Qi = t;
  const n = os, { safeRe: r, t: i } = pr, o = Ku, s = Ei, a = Le, c = Ze();
  return Qi;
}
const bE = Ze(), CE = (e, t, n) => {
  try {
    t = new bE(t, n);
  } catch {
    return !1;
  }
  return t.test(e);
};
var vi = CE;
const $E = Ze(), RE = (e, t) => new $E(e, t).set.map((n) => n.map((r) => r.value).join(" ").trim().split(" "));
var PE = RE;
const OE = Le, IE = Ze(), NE = (e, t, n) => {
  let r = null, i = null, o = null;
  try {
    o = new IE(t, n);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!r || i.compare(s) === -1) && (r = s, i = new OE(r, n));
  }), r;
};
var DE = NE;
const FE = Le, xE = Ze(), LE = (e, t, n) => {
  let r = null, i = null, o = null;
  try {
    o = new xE(t, n);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!r || i.compare(s) === 1) && (r = s, i = new FE(r, n));
  }), r;
};
var UE = LE;
const Zi = Le, kE = Ze(), Wa = wi, ME = (e, t) => {
  e = new kE(e, t);
  let n = new Zi("0.0.0");
  if (e.test(n) || (n = new Zi("0.0.0-0"), e.test(n)))
    return n;
  n = null;
  for (let r = 0; r < e.set.length; ++r) {
    const i = e.set[r];
    let o = null;
    i.forEach((s) => {
      const a = new Zi(s.semver.version);
      switch (s.operator) {
        case ">":
          a.prerelease.length === 0 ? a.patch++ : a.prerelease.push(0), a.raw = a.format();
        case "":
        case ">=":
          (!o || Wa(a, o)) && (o = a);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${s.operator}`);
      }
    }), o && (!n || Wa(n, o)) && (n = o);
  }
  return n && e.test(n) ? n : null;
};
var BE = ME;
const jE = Ze(), HE = (e, t) => {
  try {
    return new jE(e, t).range || "*";
  } catch {
    return null;
  }
};
var qE = HE;
const GE = Le, Ju = _i(), { ANY: VE } = Ju, WE = Ze(), zE = vi, za = wi, Ya = as, YE = cs, XE = ls, KE = (e, t, n, r) => {
  e = new GE(e, r), t = new WE(t, r);
  let i, o, s, a, c;
  switch (n) {
    case ">":
      i = za, o = YE, s = Ya, a = ">", c = ">=";
      break;
    case "<":
      i = Ya, o = XE, s = za, a = "<", c = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (zE(e, t, r))
    return !1;
  for (let h = 0; h < t.set.length; ++h) {
    const l = t.set[h];
    let f = null, p = null;
    if (l.forEach((g) => {
      g.semver === VE && (g = new Ju(">=0.0.0")), f = f || g, p = p || g, i(g.semver, f.semver, r) ? f = g : s(g.semver, p.semver, r) && (p = g);
    }), f.operator === a || f.operator === c || (!p.operator || p.operator === a) && o(e, p.semver))
      return !1;
    if (p.operator === c && s(e, p.semver))
      return !1;
  }
  return !0;
};
var us = KE;
const JE = us, QE = (e, t, n) => JE(e, t, ">", n);
var ZE = QE;
const ew = us, tw = (e, t, n) => ew(e, t, "<", n);
var nw = tw;
const Xa = Ze(), rw = (e, t, n) => (e = new Xa(e, n), t = new Xa(t, n), e.intersects(t, n));
var iw = rw;
const ow = vi, sw = Qe;
var aw = (e, t, n) => {
  const r = [];
  let i = null, o = null;
  const s = e.sort((l, f) => sw(l, f, n));
  for (const l of s)
    ow(l, t, n) ? (o = l, i || (i = l)) : (o && r.push([i, o]), o = null, i = null);
  i && r.push([i, null]);
  const a = [];
  for (const [l, f] of r)
    l === f ? a.push(l) : !f && l === s[0] ? a.push("*") : f ? l === s[0] ? a.push(`<=${f}`) : a.push(`${l} - ${f}`) : a.push(`>=${l}`);
  const c = a.join(" || "), h = typeof t.raw == "string" ? t.raw : String(t);
  return c.length < h.length ? c : t;
};
const Ka = Ze(), fs = _i(), { ANY: eo } = fs, xn = vi, ds = Qe, lw = (e, t, n = {}) => {
  if (e === t)
    return !0;
  e = new Ka(e, n), t = new Ka(t, n);
  let r = !1;
  e: for (const i of e.set) {
    for (const o of t.set) {
      const s = uw(i, o, n);
      if (r = r || s !== null, s)
        continue e;
    }
    if (r)
      return !1;
  }
  return !0;
}, cw = [new fs(">=0.0.0-0")], Ja = [new fs(">=0.0.0")], uw = (e, t, n) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === eo) {
    if (t.length === 1 && t[0].semver === eo)
      return !0;
    n.includePrerelease ? e = cw : e = Ja;
  }
  if (t.length === 1 && t[0].semver === eo) {
    if (n.includePrerelease)
      return !0;
    t = Ja;
  }
  const r = /* @__PURE__ */ new Set();
  let i, o;
  for (const g of e)
    g.operator === ">" || g.operator === ">=" ? i = Qa(i, g, n) : g.operator === "<" || g.operator === "<=" ? o = Za(o, g, n) : r.add(g.semver);
  if (r.size > 1)
    return null;
  let s;
  if (i && o) {
    if (s = ds(i.semver, o.semver, n), s > 0)
      return null;
    if (s === 0 && (i.operator !== ">=" || o.operator !== "<="))
      return null;
  }
  for (const g of r) {
    if (i && !xn(g, String(i), n) || o && !xn(g, String(o), n))
      return null;
    for (const w of t)
      if (!xn(g, String(w), n))
        return !1;
    return !0;
  }
  let a, c, h, l, f = o && !n.includePrerelease && o.semver.prerelease.length ? o.semver : !1, p = i && !n.includePrerelease && i.semver.prerelease.length ? i.semver : !1;
  f && f.prerelease.length === 1 && o.operator === "<" && f.prerelease[0] === 0 && (f = !1);
  for (const g of t) {
    if (l = l || g.operator === ">" || g.operator === ">=", h = h || g.operator === "<" || g.operator === "<=", i) {
      if (p && g.semver.prerelease && g.semver.prerelease.length && g.semver.major === p.major && g.semver.minor === p.minor && g.semver.patch === p.patch && (p = !1), g.operator === ">" || g.operator === ">=") {
        if (a = Qa(i, g, n), a === g && a !== i)
          return !1;
      } else if (i.operator === ">=" && !xn(i.semver, String(g), n))
        return !1;
    }
    if (o) {
      if (f && g.semver.prerelease && g.semver.prerelease.length && g.semver.major === f.major && g.semver.minor === f.minor && g.semver.patch === f.patch && (f = !1), g.operator === "<" || g.operator === "<=") {
        if (c = Za(o, g, n), c === g && c !== o)
          return !1;
      } else if (o.operator === "<=" && !xn(o.semver, String(g), n))
        return !1;
    }
    if (!g.operator && (o || i) && s !== 0)
      return !1;
  }
  return !(i && h && !o && s !== 0 || o && l && !i && s !== 0 || p || f);
}, Qa = (e, t, n) => {
  if (!e)
    return t;
  const r = ds(e.semver, t.semver, n);
  return r > 0 ? e : r < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, Za = (e, t, n) => {
  if (!e)
    return t;
  const r = ds(e.semver, t.semver, n);
  return r < 0 ? e : r > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var fw = lw;
const to = pr, el = yi, dw = Le, tl = zu, hw = Sn, pw = _y, mw = Ay, gw = by, yw = $y, Ew = Oy, ww = Dy, _w = Ly, vw = My, Tw = Qe, Aw = qy, Sw = Wy, bw = ss, Cw = Ky, $w = Zy, Rw = wi, Pw = as, Ow = Yu, Iw = Xu, Nw = ls, Dw = cs, Fw = Ku, xw = TE, Lw = _i(), Uw = Ze(), kw = vi, Mw = PE, Bw = DE, jw = UE, Hw = BE, qw = qE, Gw = us, Vw = ZE, Ww = nw, zw = iw, Yw = aw, Xw = fw;
var Qu = {
  parse: hw,
  valid: pw,
  clean: mw,
  inc: gw,
  diff: yw,
  major: Ew,
  minor: ww,
  patch: _w,
  prerelease: vw,
  compare: Tw,
  rcompare: Aw,
  compareLoose: Sw,
  compareBuild: bw,
  sort: Cw,
  rsort: $w,
  gt: Rw,
  lt: Pw,
  eq: Ow,
  neq: Iw,
  gte: Nw,
  lte: Dw,
  cmp: Fw,
  coerce: xw,
  Comparator: Lw,
  Range: Uw,
  satisfies: kw,
  toComparators: Mw,
  maxSatisfying: Bw,
  minSatisfying: jw,
  minVersion: Hw,
  validRange: qw,
  outside: Gw,
  gtr: Vw,
  ltr: Ww,
  intersects: zw,
  simplifyRange: Yw,
  subset: Xw,
  SemVer: dw,
  re: to.re,
  src: to.src,
  tokens: to.t,
  SEMVER_SPEC_VERSION: el.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: el.RELEASE_TYPES,
  compareIdentifiers: tl.compareIdentifiers,
  rcompareIdentifiers: tl.rcompareIdentifiers
}, mr = {}, ii = { exports: {} };
ii.exports;
(function(e, t) {
  var n = 200, r = "__lodash_hash_undefined__", i = 1, o = 2, s = 9007199254740991, a = "[object Arguments]", c = "[object Array]", h = "[object AsyncFunction]", l = "[object Boolean]", f = "[object Date]", p = "[object Error]", g = "[object Function]", w = "[object GeneratorFunction]", y = "[object Map]", T = "[object Number]", A = "[object Null]", b = "[object Object]", I = "[object Promise]", k = "[object Proxy]", G = "[object RegExp]", Z = "[object Set]", ee = "[object String]", ce = "[object Symbol]", M = "[object Undefined]", E = "[object WeakMap]", q = "[object ArrayBuffer]", X = "[object DataView]", re = "[object Float32Array]", P = "[object Float64Array]", R = "[object Int8Array]", N = "[object Int16Array]", $ = "[object Int32Array]", D = "[object Uint8Array]", O = "[object Uint8ClampedArray]", B = "[object Uint16Array]", W = "[object Uint32Array]", F = /[\\^$.*+?()[\]{}|]/g, K = /^\[object .+?Constructor\]$/, he = /^(?:0|[1-9]\d*)$/, j = {};
  j[re] = j[P] = j[R] = j[N] = j[$] = j[D] = j[O] = j[B] = j[W] = !0, j[a] = j[c] = j[q] = j[l] = j[X] = j[f] = j[p] = j[g] = j[y] = j[T] = j[b] = j[G] = j[Z] = j[ee] = j[E] = !1;
  var Ae = typeof Ie == "object" && Ie && Ie.Object === Object && Ie, $n = typeof self == "object" && self && self.Object === Object && self, qe = Ae || $n || Function("return this")(), wr = t && !t.nodeType && t, Rn = wr && !0 && e && !e.nodeType && e, Qt = Rn && Rn.exports === wr, Pn = Qt && Ae.process, d = function() {
    try {
      return Pn && Pn.binding && Pn.binding("util");
    } catch {
    }
  }(), u = d && d.isTypedArray;
  function S(m, v) {
    for (var C = -1, x = m == null ? 0 : m.length, Q = 0, H = []; ++C < x; ) {
      var le = m[C];
      v(le, C, m) && (H[Q++] = le);
    }
    return H;
  }
  function _(m, v) {
    for (var C = -1, x = v.length, Q = m.length; ++C < x; )
      m[Q + C] = v[C];
    return m;
  }
  function Y(m, v) {
    for (var C = -1, x = m == null ? 0 : m.length; ++C < x; )
      if (v(m[C], C, m))
        return !0;
    return !1;
  }
  function ie(m, v) {
    for (var C = -1, x = Array(m); ++C < m; )
      x[C] = v(C);
    return x;
  }
  function ue(m) {
    return function(v) {
      return m(v);
    };
  }
  function Se(m, v) {
    return m.has(v);
  }
  function be(m, v) {
    return m?.[v];
  }
  function Ge(m) {
    var v = -1, C = Array(m.size);
    return m.forEach(function(x, Q) {
      C[++v] = [Q, x];
    }), C;
  }
  function pe(m, v) {
    return function(C) {
      return m(v(C));
    };
  }
  function Ve(m) {
    var v = -1, C = Array(m.size);
    return m.forEach(function(x) {
      C[++v] = x;
    }), C;
  }
  var Ii = Array.prototype, _r = Function.prototype, mt = Object.prototype, Zt = qe["__core-js_shared__"], vs = _r.toString, tt = mt.hasOwnProperty, Ts = function() {
    var m = /[^.]+$/.exec(Zt && Zt.keys && Zt.keys.IE_PROTO || "");
    return m ? "Symbol(src)_1." + m : "";
  }(), As = mt.toString, yf = RegExp(
    "^" + vs.call(tt).replace(F, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), Ss = Qt ? qe.Buffer : void 0, vr = qe.Symbol, bs = qe.Uint8Array, Cs = mt.propertyIsEnumerable, Ef = Ii.splice, Ft = vr ? vr.toStringTag : void 0, $s = Object.getOwnPropertySymbols, wf = Ss ? Ss.isBuffer : void 0, _f = pe(Object.keys, Object), Ni = en(qe, "DataView"), On = en(qe, "Map"), Di = en(qe, "Promise"), Fi = en(qe, "Set"), xi = en(qe, "WeakMap"), In = en(Object, "create"), vf = Ut(Ni), Tf = Ut(On), Af = Ut(Di), Sf = Ut(Fi), bf = Ut(xi), Rs = vr ? vr.prototype : void 0, Li = Rs ? Rs.valueOf : void 0;
  function xt(m) {
    var v = -1, C = m == null ? 0 : m.length;
    for (this.clear(); ++v < C; ) {
      var x = m[v];
      this.set(x[0], x[1]);
    }
  }
  function Cf() {
    this.__data__ = In ? In(null) : {}, this.size = 0;
  }
  function $f(m) {
    var v = this.has(m) && delete this.__data__[m];
    return this.size -= v ? 1 : 0, v;
  }
  function Rf(m) {
    var v = this.__data__;
    if (In) {
      var C = v[m];
      return C === r ? void 0 : C;
    }
    return tt.call(v, m) ? v[m] : void 0;
  }
  function Pf(m) {
    var v = this.__data__;
    return In ? v[m] !== void 0 : tt.call(v, m);
  }
  function Of(m, v) {
    var C = this.__data__;
    return this.size += this.has(m) ? 0 : 1, C[m] = In && v === void 0 ? r : v, this;
  }
  xt.prototype.clear = Cf, xt.prototype.delete = $f, xt.prototype.get = Rf, xt.prototype.has = Pf, xt.prototype.set = Of;
  function ct(m) {
    var v = -1, C = m == null ? 0 : m.length;
    for (this.clear(); ++v < C; ) {
      var x = m[v];
      this.set(x[0], x[1]);
    }
  }
  function If() {
    this.__data__ = [], this.size = 0;
  }
  function Nf(m) {
    var v = this.__data__, C = Ar(v, m);
    if (C < 0)
      return !1;
    var x = v.length - 1;
    return C == x ? v.pop() : Ef.call(v, C, 1), --this.size, !0;
  }
  function Df(m) {
    var v = this.__data__, C = Ar(v, m);
    return C < 0 ? void 0 : v[C][1];
  }
  function Ff(m) {
    return Ar(this.__data__, m) > -1;
  }
  function xf(m, v) {
    var C = this.__data__, x = Ar(C, m);
    return x < 0 ? (++this.size, C.push([m, v])) : C[x][1] = v, this;
  }
  ct.prototype.clear = If, ct.prototype.delete = Nf, ct.prototype.get = Df, ct.prototype.has = Ff, ct.prototype.set = xf;
  function Lt(m) {
    var v = -1, C = m == null ? 0 : m.length;
    for (this.clear(); ++v < C; ) {
      var x = m[v];
      this.set(x[0], x[1]);
    }
  }
  function Lf() {
    this.size = 0, this.__data__ = {
      hash: new xt(),
      map: new (On || ct)(),
      string: new xt()
    };
  }
  function Uf(m) {
    var v = Sr(this, m).delete(m);
    return this.size -= v ? 1 : 0, v;
  }
  function kf(m) {
    return Sr(this, m).get(m);
  }
  function Mf(m) {
    return Sr(this, m).has(m);
  }
  function Bf(m, v) {
    var C = Sr(this, m), x = C.size;
    return C.set(m, v), this.size += C.size == x ? 0 : 1, this;
  }
  Lt.prototype.clear = Lf, Lt.prototype.delete = Uf, Lt.prototype.get = kf, Lt.prototype.has = Mf, Lt.prototype.set = Bf;
  function Tr(m) {
    var v = -1, C = m == null ? 0 : m.length;
    for (this.__data__ = new Lt(); ++v < C; )
      this.add(m[v]);
  }
  function jf(m) {
    return this.__data__.set(m, r), this;
  }
  function Hf(m) {
    return this.__data__.has(m);
  }
  Tr.prototype.add = Tr.prototype.push = jf, Tr.prototype.has = Hf;
  function gt(m) {
    var v = this.__data__ = new ct(m);
    this.size = v.size;
  }
  function qf() {
    this.__data__ = new ct(), this.size = 0;
  }
  function Gf(m) {
    var v = this.__data__, C = v.delete(m);
    return this.size = v.size, C;
  }
  function Vf(m) {
    return this.__data__.get(m);
  }
  function Wf(m) {
    return this.__data__.has(m);
  }
  function zf(m, v) {
    var C = this.__data__;
    if (C instanceof ct) {
      var x = C.__data__;
      if (!On || x.length < n - 1)
        return x.push([m, v]), this.size = ++C.size, this;
      C = this.__data__ = new Lt(x);
    }
    return C.set(m, v), this.size = C.size, this;
  }
  gt.prototype.clear = qf, gt.prototype.delete = Gf, gt.prototype.get = Vf, gt.prototype.has = Wf, gt.prototype.set = zf;
  function Yf(m, v) {
    var C = br(m), x = !C && cd(m), Q = !C && !x && Ui(m), H = !C && !x && !Q && Us(m), le = C || x || Q || H, ye = le ? ie(m.length, String) : [], we = ye.length;
    for (var oe in m)
      tt.call(m, oe) && !(le && // Safari 9 has enumerable `arguments.length` in strict mode.
      (oe == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      Q && (oe == "offset" || oe == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      H && (oe == "buffer" || oe == "byteLength" || oe == "byteOffset") || // Skip index properties.
      id(oe, we))) && ye.push(oe);
    return ye;
  }
  function Ar(m, v) {
    for (var C = m.length; C--; )
      if (Ds(m[C][0], v))
        return C;
    return -1;
  }
  function Xf(m, v, C) {
    var x = v(m);
    return br(m) ? x : _(x, C(m));
  }
  function Nn(m) {
    return m == null ? m === void 0 ? M : A : Ft && Ft in Object(m) ? nd(m) : ld(m);
  }
  function Ps(m) {
    return Dn(m) && Nn(m) == a;
  }
  function Os(m, v, C, x, Q) {
    return m === v ? !0 : m == null || v == null || !Dn(m) && !Dn(v) ? m !== m && v !== v : Kf(m, v, C, x, Os, Q);
  }
  function Kf(m, v, C, x, Q, H) {
    var le = br(m), ye = br(v), we = le ? c : yt(m), oe = ye ? c : yt(v);
    we = we == a ? b : we, oe = oe == a ? b : oe;
    var Me = we == b, We = oe == b, Ce = we == oe;
    if (Ce && Ui(m)) {
      if (!Ui(v))
        return !1;
      le = !0, Me = !1;
    }
    if (Ce && !Me)
      return H || (H = new gt()), le || Us(m) ? Is(m, v, C, x, Q, H) : ed(m, v, we, C, x, Q, H);
    if (!(C & i)) {
      var Be = Me && tt.call(m, "__wrapped__"), je = We && tt.call(v, "__wrapped__");
      if (Be || je) {
        var Et = Be ? m.value() : m, ut = je ? v.value() : v;
        return H || (H = new gt()), Q(Et, ut, C, x, H);
      }
    }
    return Ce ? (H || (H = new gt()), td(m, v, C, x, Q, H)) : !1;
  }
  function Jf(m) {
    if (!Ls(m) || sd(m))
      return !1;
    var v = Fs(m) ? yf : K;
    return v.test(Ut(m));
  }
  function Qf(m) {
    return Dn(m) && xs(m.length) && !!j[Nn(m)];
  }
  function Zf(m) {
    if (!ad(m))
      return _f(m);
    var v = [];
    for (var C in Object(m))
      tt.call(m, C) && C != "constructor" && v.push(C);
    return v;
  }
  function Is(m, v, C, x, Q, H) {
    var le = C & i, ye = m.length, we = v.length;
    if (ye != we && !(le && we > ye))
      return !1;
    var oe = H.get(m);
    if (oe && H.get(v))
      return oe == v;
    var Me = -1, We = !0, Ce = C & o ? new Tr() : void 0;
    for (H.set(m, v), H.set(v, m); ++Me < ye; ) {
      var Be = m[Me], je = v[Me];
      if (x)
        var Et = le ? x(je, Be, Me, v, m, H) : x(Be, je, Me, m, v, H);
      if (Et !== void 0) {
        if (Et)
          continue;
        We = !1;
        break;
      }
      if (Ce) {
        if (!Y(v, function(ut, kt) {
          if (!Se(Ce, kt) && (Be === ut || Q(Be, ut, C, x, H)))
            return Ce.push(kt);
        })) {
          We = !1;
          break;
        }
      } else if (!(Be === je || Q(Be, je, C, x, H))) {
        We = !1;
        break;
      }
    }
    return H.delete(m), H.delete(v), We;
  }
  function ed(m, v, C, x, Q, H, le) {
    switch (C) {
      case X:
        if (m.byteLength != v.byteLength || m.byteOffset != v.byteOffset)
          return !1;
        m = m.buffer, v = v.buffer;
      case q:
        return !(m.byteLength != v.byteLength || !H(new bs(m), new bs(v)));
      case l:
      case f:
      case T:
        return Ds(+m, +v);
      case p:
        return m.name == v.name && m.message == v.message;
      case G:
      case ee:
        return m == v + "";
      case y:
        var ye = Ge;
      case Z:
        var we = x & i;
        if (ye || (ye = Ve), m.size != v.size && !we)
          return !1;
        var oe = le.get(m);
        if (oe)
          return oe == v;
        x |= o, le.set(m, v);
        var Me = Is(ye(m), ye(v), x, Q, H, le);
        return le.delete(m), Me;
      case ce:
        if (Li)
          return Li.call(m) == Li.call(v);
    }
    return !1;
  }
  function td(m, v, C, x, Q, H) {
    var le = C & i, ye = Ns(m), we = ye.length, oe = Ns(v), Me = oe.length;
    if (we != Me && !le)
      return !1;
    for (var We = we; We--; ) {
      var Ce = ye[We];
      if (!(le ? Ce in v : tt.call(v, Ce)))
        return !1;
    }
    var Be = H.get(m);
    if (Be && H.get(v))
      return Be == v;
    var je = !0;
    H.set(m, v), H.set(v, m);
    for (var Et = le; ++We < we; ) {
      Ce = ye[We];
      var ut = m[Ce], kt = v[Ce];
      if (x)
        var ks = le ? x(kt, ut, Ce, v, m, H) : x(ut, kt, Ce, m, v, H);
      if (!(ks === void 0 ? ut === kt || Q(ut, kt, C, x, H) : ks)) {
        je = !1;
        break;
      }
      Et || (Et = Ce == "constructor");
    }
    if (je && !Et) {
      var Cr = m.constructor, $r = v.constructor;
      Cr != $r && "constructor" in m && "constructor" in v && !(typeof Cr == "function" && Cr instanceof Cr && typeof $r == "function" && $r instanceof $r) && (je = !1);
    }
    return H.delete(m), H.delete(v), je;
  }
  function Ns(m) {
    return Xf(m, dd, rd);
  }
  function Sr(m, v) {
    var C = m.__data__;
    return od(v) ? C[typeof v == "string" ? "string" : "hash"] : C.map;
  }
  function en(m, v) {
    var C = be(m, v);
    return Jf(C) ? C : void 0;
  }
  function nd(m) {
    var v = tt.call(m, Ft), C = m[Ft];
    try {
      m[Ft] = void 0;
      var x = !0;
    } catch {
    }
    var Q = As.call(m);
    return x && (v ? m[Ft] = C : delete m[Ft]), Q;
  }
  var rd = $s ? function(m) {
    return m == null ? [] : (m = Object(m), S($s(m), function(v) {
      return Cs.call(m, v);
    }));
  } : hd, yt = Nn;
  (Ni && yt(new Ni(new ArrayBuffer(1))) != X || On && yt(new On()) != y || Di && yt(Di.resolve()) != I || Fi && yt(new Fi()) != Z || xi && yt(new xi()) != E) && (yt = function(m) {
    var v = Nn(m), C = v == b ? m.constructor : void 0, x = C ? Ut(C) : "";
    if (x)
      switch (x) {
        case vf:
          return X;
        case Tf:
          return y;
        case Af:
          return I;
        case Sf:
          return Z;
        case bf:
          return E;
      }
    return v;
  });
  function id(m, v) {
    return v = v ?? s, !!v && (typeof m == "number" || he.test(m)) && m > -1 && m % 1 == 0 && m < v;
  }
  function od(m) {
    var v = typeof m;
    return v == "string" || v == "number" || v == "symbol" || v == "boolean" ? m !== "__proto__" : m === null;
  }
  function sd(m) {
    return !!Ts && Ts in m;
  }
  function ad(m) {
    var v = m && m.constructor, C = typeof v == "function" && v.prototype || mt;
    return m === C;
  }
  function ld(m) {
    return As.call(m);
  }
  function Ut(m) {
    if (m != null) {
      try {
        return vs.call(m);
      } catch {
      }
      try {
        return m + "";
      } catch {
      }
    }
    return "";
  }
  function Ds(m, v) {
    return m === v || m !== m && v !== v;
  }
  var cd = Ps(/* @__PURE__ */ function() {
    return arguments;
  }()) ? Ps : function(m) {
    return Dn(m) && tt.call(m, "callee") && !Cs.call(m, "callee");
  }, br = Array.isArray;
  function ud(m) {
    return m != null && xs(m.length) && !Fs(m);
  }
  var Ui = wf || pd;
  function fd(m, v) {
    return Os(m, v);
  }
  function Fs(m) {
    if (!Ls(m))
      return !1;
    var v = Nn(m);
    return v == g || v == w || v == h || v == k;
  }
  function xs(m) {
    return typeof m == "number" && m > -1 && m % 1 == 0 && m <= s;
  }
  function Ls(m) {
    var v = typeof m;
    return m != null && (v == "object" || v == "function");
  }
  function Dn(m) {
    return m != null && typeof m == "object";
  }
  var Us = u ? ue(u) : Qf;
  function dd(m) {
    return ud(m) ? Yf(m) : Zf(m);
  }
  function hd() {
    return [];
  }
  function pd() {
    return !1;
  }
  e.exports = fd;
})(ii, ii.exports);
var Kw = ii.exports;
Object.defineProperty(mr, "__esModule", { value: !0 });
mr.DownloadedUpdateHelper = void 0;
mr.createTempUpdateFile = t_;
const Jw = ar, Qw = Ot, nl = Kw, Mt = Nt, qn = ne;
class Zw {
  constructor(t) {
    this.cacheDir = t, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return qn.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(t, n, r, i) {
    if (this.versionInfo != null && this.file === t && this.fileInfo != null)
      return nl(this.versionInfo, n) && nl(this.fileInfo.info, r.info) && await (0, Mt.pathExists)(t) ? t : null;
    const o = await this.getValidCachedUpdateFile(r, i);
    return o === null ? null : (i.info(`Update has already been downloaded to ${t}).`), this._file = o, o);
  }
  async setDownloadedFile(t, n, r, i, o, s) {
    this._file = t, this._packageFile = n, this.versionInfo = r, this.fileInfo = i, this._downloadedFileInfo = {
      fileName: o,
      sha512: i.info.sha512,
      isAdminRightsRequired: i.info.isAdminRightsRequired === !0
    }, s && await (0, Mt.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
  }
  async clear() {
    this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, Mt.emptyDir)(this.cacheDirForPendingUpdate);
    } catch {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(t, n) {
    const r = this.getUpdateInfoFile();
    if (!await (0, Mt.pathExists)(r))
      return null;
    let o;
    try {
      o = await (0, Mt.readJson)(r);
    } catch (h) {
      let l = "No cached update info available";
      return h.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), l += ` (error on read: ${h.message})`), n.info(l), null;
    }
    if (!(o?.fileName !== null))
      return n.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== o.sha512)
      return n.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${o.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const a = qn.join(this.cacheDirForPendingUpdate, o.fileName);
    if (!await (0, Mt.pathExists)(a))
      return n.info("Cached update file doesn't exist"), null;
    const c = await e_(a);
    return t.info.sha512 !== c ? (n.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${c}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = o, a);
  }
  getUpdateInfoFile() {
    return qn.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
mr.DownloadedUpdateHelper = Zw;
function e_(e, t = "sha512", n = "base64", r) {
  return new Promise((i, o) => {
    const s = (0, Jw.createHash)(t);
    s.on("error", o).setEncoding(n), (0, Qw.createReadStream)(e, {
      ...r,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", o).on("end", () => {
      s.end(), i(s.read());
    }).pipe(s, { end: !1 });
  });
}
async function t_(e, t, n) {
  let r = 0, i = qn.join(t, e);
  for (let o = 0; o < 3; o++)
    try {
      return await (0, Mt.unlink)(i), i;
    } catch (s) {
      if (s.code === "ENOENT")
        return i;
      n.warn(`Error on remove temp update file: ${s}`), i = qn.join(t, `${r++}-${e}`);
    }
  return i;
}
var Ti = {}, hs = {};
Object.defineProperty(hs, "__esModule", { value: !0 });
hs.getAppCacheDir = r_;
const no = ne, n_ = ai;
function r_() {
  const e = (0, n_.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || no.join(e, "AppData", "Local") : process.platform === "darwin" ? t = no.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || no.join(e, ".cache"), t;
}
Object.defineProperty(Ti, "__esModule", { value: !0 });
Ti.ElectronAppAdapter = void 0;
const rl = ne, i_ = hs;
class o_ {
  constructor(t = Vt.app) {
    this.app = t;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === !0;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? rl.join(process.resourcesPath, "app-update.yml") : rl.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, i_.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(t) {
    this.app.once("quit", (n, r) => t(r));
  }
}
Ti.ElectronAppAdapter = o_;
var Zu = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = n;
  const t = ge;
  e.NET_SESSION_NAME = "electron-updater";
  function n() {
    return Vt.session.fromPartition(e.NET_SESSION_NAME, {
      cache: !1
    });
  }
  class r extends t.HttpExecutor {
    constructor(o) {
      super(), this.proxyLoginCallback = o, this.cachedSession = null;
    }
    async download(o, s, a) {
      return await a.cancellationToken.createPromise((c, h, l) => {
        const f = {
          headers: a.headers || void 0,
          redirect: "manual"
        };
        (0, t.configureRequestUrl)(o, f), (0, t.configureRequestOptions)(f), this.doDownload(f, {
          destination: s,
          options: a,
          onCancel: l,
          callback: (p) => {
            p == null ? c(s) : h(p);
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(o, s) {
      o.headers && o.headers.Host && (o.host = o.headers.Host, delete o.headers.Host), this.cachedSession == null && (this.cachedSession = n());
      const a = Vt.net.request({
        ...o,
        session: this.cachedSession
      });
      return a.on("response", s), this.proxyLoginCallback != null && a.on("login", this.proxyLoginCallback), a;
    }
    addRedirectHandlers(o, s, a, c, h) {
      o.on("redirect", (l, f, p) => {
        o.abort(), c > this.maxRedirects ? a(this.createMaxRedirectError()) : h(t.HttpExecutor.prepareRedirectUrlOptions(p, s));
      });
    }
  }
  e.ElectronHttpExecutor = r;
})(Zu);
var gr = {}, et = {};
Object.defineProperty(et, "__esModule", { value: !0 });
et.newBaseUrl = s_;
et.newUrlFromBase = a_;
et.getChannelFilename = l_;
const ef = It;
function s_(e) {
  const t = new ef.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function a_(e, t, n = !1) {
  const r = new ef.URL(e, t), i = t.search;
  return i != null && i.length !== 0 ? r.search = i : n && (r.search = `noCache=${Date.now().toString(32)}`), r;
}
function l_(e) {
  return `${e}.yml`;
}
var de = {}, c_ = "[object Symbol]", tf = /[\\^$.*+?()[\]{}|]/g, u_ = RegExp(tf.source), f_ = typeof Ie == "object" && Ie && Ie.Object === Object && Ie, d_ = typeof self == "object" && self && self.Object === Object && self, h_ = f_ || d_ || Function("return this")(), p_ = Object.prototype, m_ = p_.toString, il = h_.Symbol, ol = il ? il.prototype : void 0, sl = ol ? ol.toString : void 0;
function g_(e) {
  if (typeof e == "string")
    return e;
  if (E_(e))
    return sl ? sl.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function y_(e) {
  return !!e && typeof e == "object";
}
function E_(e) {
  return typeof e == "symbol" || y_(e) && m_.call(e) == c_;
}
function w_(e) {
  return e == null ? "" : g_(e);
}
function __(e) {
  return e = w_(e), e && u_.test(e) ? e.replace(tf, "\\$&") : e;
}
var nf = __;
Object.defineProperty(de, "__esModule", { value: !0 });
de.Provider = void 0;
de.findFile = b_;
de.parseUpdateInfo = C_;
de.getFileList = rf;
de.resolveFiles = $_;
const Rt = ge, v_ = Te, T_ = It, oi = et, A_ = nf;
class S_ {
  constructor(t) {
    this.runtimeOptions = t, this.requestHeaders = null, this.executor = t.executor;
  }
  // By default, the blockmap file is in the same directory as the main file
  // But some providers may have a different blockmap file, so we need to override this method
  getBlockMapFiles(t, n, r, i = null) {
    const o = (0, oi.newUrlFromBase)(`${t.pathname}.blockmap`, t);
    return [(0, oi.newUrlFromBase)(`${t.pathname.replace(new RegExp(A_(r), "g"), n)}.blockmap`, i ? new T_.URL(i) : t), o];
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const t = process.env.TEST_UPDATER_ARCH || process.arch;
      return "-linux" + (t === "x64" ? "" : `-${t}`);
    } else
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(t) {
    return `${t}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(t) {
    this.requestHeaders = t;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(t, n, r) {
    return this.executor.request(this.createRequestOptions(t, n), r);
  }
  createRequestOptions(t, n) {
    const r = {};
    return this.requestHeaders == null ? n != null && (r.headers = n) : r.headers = n == null ? this.requestHeaders : { ...this.requestHeaders, ...n }, (0, Rt.configureRequestUrl)(t, r), r;
  }
}
de.Provider = S_;
function b_(e, t, n) {
  var r;
  if (e.length === 0)
    throw (0, Rt.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const i = e.filter((s) => s.url.pathname.toLowerCase().endsWith(`.${t.toLowerCase()}`)), o = (r = i.find((s) => [s.url.pathname, s.info.url].some((a) => a.includes(process.arch)))) !== null && r !== void 0 ? r : i.shift();
  return o || (n == null ? e[0] : e.find((s) => !n.some((a) => s.url.pathname.toLowerCase().endsWith(`.${a.toLowerCase()}`))));
}
function C_(e, t, n) {
  if (e == null)
    throw (0, Rt.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${n}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let r;
  try {
    r = (0, v_.load)(e);
  } catch (i) {
    throw (0, Rt.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${n}): ${i.stack || i.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return r;
}
function rf(e) {
  const t = e.files;
  if (t != null && t.length > 0)
    return t;
  if (e.path != null)
    return [
      {
        url: e.path,
        sha2: e.sha2,
        sha512: e.sha512
      }
    ];
  throw (0, Rt.newError)(`No files provided: ${(0, Rt.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
}
function $_(e, t, n = (r) => r) {
  const i = rf(e).map((a) => {
    if (a.sha2 == null && a.sha512 == null)
      throw (0, Rt.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, Rt.safeStringifyJson)(a)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, oi.newUrlFromBase)(n(a.url), t),
      info: a
    };
  }), o = e.packages, s = o == null ? null : o[process.arch] || o.ia32;
  return s != null && (i[0].packageInfo = {
    ...s,
    path: (0, oi.newUrlFromBase)(n(s.path), t).href
  }), i;
}
Object.defineProperty(gr, "__esModule", { value: !0 });
gr.GenericProvider = void 0;
const al = ge, ro = et, io = de;
class R_ extends io.Provider {
  constructor(t, n, r) {
    super(r), this.configuration = t, this.updater = n, this.baseUrl = (0, ro.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, ro.getChannelFilename)(this.channel), n = (0, ro.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let r = 0; ; r++)
      try {
        return (0, io.parseUpdateInfo)(await this.httpRequest(n), t, n);
      } catch (i) {
        if (i instanceof al.HttpError && i.statusCode === 404)
          throw (0, al.newError)(`Cannot find channel "${t}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        if (i.code === "ECONNREFUSED" && r < 3) {
          await new Promise((o, s) => {
            try {
              setTimeout(o, 1e3 * r);
            } catch (a) {
              s(a);
            }
          });
          continue;
        }
        throw i;
      }
  }
  resolveFiles(t) {
    return (0, io.resolveFiles)(t, this.baseUrl);
  }
}
gr.GenericProvider = R_;
var Ai = {}, Si = {};
Object.defineProperty(Si, "__esModule", { value: !0 });
Si.BitbucketProvider = void 0;
const ll = ge, oo = et, so = de;
class P_ extends so.Provider {
  constructor(t, n, r) {
    super({
      ...r,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = n;
    const { owner: i, slug: o } = t;
    this.baseUrl = (0, oo.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${o}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new ll.CancellationToken(), n = (0, oo.getChannelFilename)(this.getCustomChannelName(this.channel)), r = (0, oo.newUrlFromBase)(n, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(r, void 0, t);
      return (0, so.parseUpdateInfo)(i, n, r);
    } catch (i) {
      throw (0, ll.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, so.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: n } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${n}, channel: ${this.channel})`;
  }
}
Si.BitbucketProvider = P_;
var Pt = {};
Object.defineProperty(Pt, "__esModule", { value: !0 });
Pt.GitHubProvider = Pt.BaseGitHubProvider = void 0;
Pt.computeReleaseNotes = sf;
const ft = ge, st = Qu, O_ = It, hn = et, Fo = de, ao = /\/tag\/(v?[^/]+)$/;
class of extends Fo.Provider {
  constructor(t, n, r) {
    super({
      ...r,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, hn.newBaseUrl)((0, ft.githubUrl)(t, n));
    const i = n === "github.com" ? "api.github.com" : n;
    this.baseApiUrl = (0, hn.newBaseUrl)((0, ft.githubUrl)(t, i));
  }
  computeGithubBasePath(t) {
    const n = this.options.host;
    return n && !["github.com", "api.github.com"].includes(n) ? `/api/v3${t}` : t;
  }
}
Pt.BaseGitHubProvider = of;
class I_ extends of {
  constructor(t, n, r) {
    super(t, "github.com", r), this.options = t, this.updater = n;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, n, r, i, o;
    const s = new ft.CancellationToken(), a = await this.httpRequest((0, hn.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, s), c = (0, ft.parseXml)(a);
    let h = c.element("entry", !1, "No published versions on GitHub"), l = null;
    try {
      if (this.updater.allowPrerelease) {
        const T = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((n = st.prerelease(this.updater.currentVersion)) === null || n === void 0 ? void 0 : n[0]) || null;
        if (T === null)
          l = ao.exec(h.element("link").attribute("href"))[1];
        else
          for (const A of c.getElements("entry")) {
            const b = ao.exec(A.element("link").attribute("href"));
            if (b === null)
              continue;
            const I = b[1];
            if (!st.valid(I))
              continue;
            const k = ((r = st.prerelease(I)) === null || r === void 0 ? void 0 : r[0]) || null, G = !T || ["alpha", "beta"].includes(T), Z = k !== null && !["alpha", "beta"].includes(String(k));
            if (G && !Z && !(T === "beta" && k === "alpha")) {
              l = I, h = A;
              break;
            }
            if (k && k === T) {
              l = I, h = A;
              break;
            }
          }
      } else {
        l = await this.getLatestTagName(s);
        for (const T of c.getElements("entry")) {
          const A = ao.exec(T.element("link").attribute("href"));
          if (A != null && A[1] === l) {
            h = T;
            break;
          }
        }
      }
    } catch (T) {
      throw (0, ft.newError)(`Cannot parse releases feed: ${T.stack || T.message},
XML:
${a}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (l == null)
      throw (0, ft.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let f, p = "", g = "";
    const w = async (T) => {
      p = (0, hn.getChannelFilename)(T), g = (0, hn.newUrlFromBase)(this.getBaseDownloadPath(String(l), p), this.baseUrl);
      const A = this.createRequestOptions(g);
      try {
        return await this.executor.request(A, s);
      } catch (b) {
        throw b instanceof ft.HttpError && b.statusCode === 404 ? (0, ft.newError)(`Cannot find ${p} in the latest release artifacts (${g}): ${b.stack || b.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : b;
      }
    };
    try {
      let T = this.channel;
      this.updater.allowPrerelease && (!((i = st.prerelease(l)) === null || i === void 0) && i[0]) && (T = this.getCustomChannelName(String((o = st.prerelease(l)) === null || o === void 0 ? void 0 : o[0]))), f = await w(T);
    } catch (T) {
      if (this.updater.allowPrerelease)
        f = await w(this.getDefaultChannelName());
      else
        throw T;
    }
    const y = (0, Fo.parseUpdateInfo)(f, p, g);
    return y.releaseName == null && (y.releaseName = h.elementValueOrEmpty("title")), y.releaseNotes == null && (y.releaseNotes = sf(this.updater.currentVersion, this.updater.fullChangelog, c, h)), {
      tag: l,
      ...y
    };
  }
  async getLatestTagName(t) {
    const n = this.options, r = n.host == null || n.host === "github.com" ? (0, hn.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new O_.URL(`${this.computeGithubBasePath(`/repos/${n.owner}/${n.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const i = await this.httpRequest(r, { Accept: "application/json" }, t);
      return i == null ? null : JSON.parse(i).tag_name;
    } catch (i) {
      throw (0, ft.newError)(`Unable to find latest version on GitHub (${r}), please ensure a production release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(t) {
    return (0, Fo.resolveFiles)(t, this.baseUrl, (n) => this.getBaseDownloadPath(t.tag, n.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, n) {
    return `${this.basePath}/download/${t}/${n}`;
  }
}
Pt.GitHubProvider = I_;
function cl(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function sf(e, t, n, r) {
  if (!t)
    return cl(r);
  const i = /\/tag\/v?([^/]+)$/;
  let o;
  try {
    o = i.exec(r.element("link").attribute("href"))[1], o = st.valid(o) ? o : void 0;
  } catch {
  }
  if (o == null)
    return null;
  const s = [];
  for (const a of n.getElements("entry")) {
    let c;
    try {
      const f = i.exec(a.element("link").attribute("href"));
      if (!f)
        continue;
      c = f[1];
    } catch {
      continue;
    }
    if (!st.valid(c))
      continue;
    const h = st.gt(c, e.raw), l = st.lte(c, o);
    h && l && s.push({
      version: c,
      note: cl(a)
    });
  }
  return s.sort((a, c) => st.rcompare(a.version, c.version));
}
var bi = {};
Object.defineProperty(bi, "__esModule", { value: !0 });
bi.GitLabProvider = void 0;
const _e = ge, lo = It, N_ = nf, Br = et, co = de;
class D_ extends co.Provider {
  /**
   * Normalizes filenames by replacing spaces and underscores with dashes.
   *
   * This is a workaround to handle filename formatting differences between tools:
   * - electron-builder formats filenames like "test file.txt" as "test-file.txt"
   * - GitLab may provide asset URLs using underscores, such as "test_file.txt"
   *
   * Because of this mismatch, we can't reliably extract the correct filename from
   * the asset path without normalization. This function ensures consistent matching
   * across different filename formats by converting all spaces and underscores to dashes.
   *
   * @param filename The filename to normalize
   * @returns The normalized filename with spaces and underscores replaced by dashes
   */
  normalizeFilename(t) {
    return t.replace(/ |_/g, "-");
  }
  constructor(t, n, r) {
    super({
      ...r,
      // GitLab might not support multiple range requests efficiently
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.updater = n, this.cachedLatestVersion = null;
    const o = t.host || "gitlab.com";
    this.baseApiUrl = (0, Br.newBaseUrl)(`https://${o}/api/v4`);
  }
  createRequestOptions(t, n) {
    const r = super.createRequestOptions(t, n);
    return r.redirect = "manual", r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = new _e.CancellationToken(), n = (0, Br.newUrlFromBase)(`projects/${this.options.projectId}/releases/permalink/latest`, this.baseApiUrl), r = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) };
    let i;
    try {
      i = await this.httpRequest(n, r, t);
    } catch (g) {
      throw (0, _e.newError)(`Unable to find latest release on GitLab (${n}): ${g.stack || g.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    if (!i)
      throw (0, _e.newError)("No published releases on GitLab", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let o;
    try {
      o = JSON.parse(i);
    } catch (g) {
      throw (0, _e.newError)(`Unable to parse latest release response from GitLab (${n}): response was not valid JSON: ${g.stack || g.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    if (o.upcoming_release)
      throw (0, _e.newError)("Latest GitLab release is scheduled but not yet published", "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    const s = o.tag_name;
    let a = null, c = "", h = null;
    const l = async (g) => {
      c = (0, Br.getChannelFilename)(g);
      const w = o.assets.links.find((A) => A.name === c);
      if (!w)
        throw (0, _e.newError)(`Cannot find ${c} in the latest release assets`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      h = new lo.URL(w.direct_asset_url);
      const y = this.setAuthHeaderForToken(this.options.token || null), T = Object.keys(y).length ? y : void 0;
      try {
        const A = await this.httpRequest(h, T, t);
        if (!A)
          throw (0, _e.newError)(`Empty response from ${h}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        return A;
      } catch (A) {
        throw A instanceof _e.HttpError && A.statusCode === 404 ? (0, _e.newError)(`Cannot find ${c} in the latest release artifacts (${h}): ${A.stack || A.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : A;
      }
    };
    try {
      a = await l(this.channel);
    } catch (g) {
      if (this.channel !== this.getDefaultChannelName())
        a = await l(this.getDefaultChannelName());
      else
        throw g;
    }
    if (!a)
      throw (0, _e.newError)(`Unable to parse channel data from ${c}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    const f = (0, co.parseUpdateInfo)(a, c, h);
    f.releaseName == null && (f.releaseName = o.name), f.releaseNotes == null && (f.releaseNotes = o.description || null);
    const p = {
      tag: s,
      assets: this.convertAssetsToMap(o.assets),
      ...f
    };
    return this.cachedLatestVersion = p, p;
  }
  /**
   * Utility function to convert GitlabReleaseAsset to Map<string, string>
   * Maps asset names to their download URLs
   */
  convertAssetsToMap(t) {
    const n = /* @__PURE__ */ new Map();
    for (const r of t.links)
      n.set(this.normalizeFilename(r.name), r.direct_asset_url);
    return n;
  }
  /**
   * Find blockmap file URL in assets map for a specific filename
   */
  findBlockMapInAssets(t, n) {
    const r = [`${n}.blockmap`, `${this.normalizeFilename(n)}.blockmap`];
    for (const i of r) {
      const o = t.get(i);
      if (o)
        return new lo.URL(o);
    }
    return null;
  }
  async fetchReleaseInfoByVersion(t) {
    const n = new _e.CancellationToken(), r = [`v${t}`, t];
    for (const i of r) {
      const o = (0, Br.newUrlFromBase)(`projects/${this.options.projectId}/releases/${encodeURIComponent(i)}`, this.baseApiUrl);
      try {
        const s = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) }, a = await this.httpRequest(o, s, n);
        if (a)
          return JSON.parse(a);
      } catch (s) {
        if (s instanceof _e.HttpError && s.statusCode === 404)
          continue;
        throw (0, _e.newError)(`Unable to find release ${i} on GitLab (${o}): ${s.stack || s.message}`, "ERR_UPDATER_RELEASE_NOT_FOUND");
      }
    }
    throw (0, _e.newError)(`Unable to find release with version ${t} (tried: ${r.join(", ")}) on GitLab`, "ERR_UPDATER_RELEASE_NOT_FOUND");
  }
  setAuthHeaderForToken(t) {
    const n = {};
    return t != null && (t.startsWith("Bearer") ? n.authorization = t : n["PRIVATE-TOKEN"] = t), n;
  }
  /**
   * Get version info for blockmap files, using cache when possible
   */
  async getVersionInfoForBlockMap(t) {
    if (this.cachedLatestVersion && this.cachedLatestVersion.version === t)
      return this.cachedLatestVersion.assets;
    const n = await this.fetchReleaseInfoByVersion(t);
    return n && n.assets ? this.convertAssetsToMap(n.assets) : null;
  }
  /**
   * Find blockmap URLs from version assets
   */
  async findBlockMapUrlsFromAssets(t, n, r) {
    let i = null, o = null;
    const s = await this.getVersionInfoForBlockMap(n);
    s && (i = this.findBlockMapInAssets(s, r));
    const a = await this.getVersionInfoForBlockMap(t);
    if (a) {
      const c = r.replace(new RegExp(N_(n), "g"), t);
      o = this.findBlockMapInAssets(a, c);
    }
    return [o, i];
  }
  async getBlockMapFiles(t, n, r, i = null) {
    if (this.options.uploadTarget === "project_upload") {
      const o = t.pathname.split("/").pop() || "", [s, a] = await this.findBlockMapUrlsFromAssets(n, r, o);
      if (!a)
        throw (0, _e.newError)(`Cannot find blockmap file for ${r} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      if (!s)
        throw (0, _e.newError)(`Cannot find blockmap file for ${n} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      return [s, a];
    } else
      return super.getBlockMapFiles(t, n, r, i);
  }
  resolveFiles(t) {
    return (0, co.getFileList)(t).map((n) => {
      const i = [
        n.url,
        // Original filename
        this.normalizeFilename(n.url)
        // Normalized filename (spaces/underscores → dashes)
      ].find((s) => t.assets.has(s)), o = i ? t.assets.get(i) : void 0;
      if (!o)
        throw (0, _e.newError)(`Cannot find asset "${n.url}" in GitLab release assets. Available assets: ${Array.from(t.assets.keys()).join(", ")}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new lo.URL(o),
        info: n
      };
    });
  }
  toString() {
    return `GitLab (projectId: ${this.options.projectId}, channel: ${this.channel})`;
  }
}
bi.GitLabProvider = D_;
var Ci = {};
Object.defineProperty(Ci, "__esModule", { value: !0 });
Ci.KeygenProvider = void 0;
const ul = ge, uo = et, fo = de;
class F_ extends fo.Provider {
  constructor(t, n, r) {
    super({
      ...r,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = n, this.defaultHostname = "api.keygen.sh";
    const i = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, uo.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new ul.CancellationToken(), n = (0, uo.getChannelFilename)(this.getCustomChannelName(this.channel)), r = (0, uo.newUrlFromBase)(n, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(r, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, fo.parseUpdateInfo)(i, n, r);
    } catch (i) {
      throw (0, ul.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, fo.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: n, platform: r } = this.configuration;
    return `Keygen (account: ${t}, product: ${n}, platform: ${r}, channel: ${this.channel})`;
  }
}
Ci.KeygenProvider = F_;
var $i = {};
Object.defineProperty($i, "__esModule", { value: !0 });
$i.PrivateGitHubProvider = void 0;
const rn = ge, x_ = Te, L_ = ne, fl = It, dl = et, U_ = Pt, k_ = de;
class M_ extends U_.BaseGitHubProvider {
  constructor(t, n, r, i) {
    super(t, "api.github.com", i), this.updater = n, this.token = r;
  }
  createRequestOptions(t, n) {
    const r = super.createRequestOptions(t, n);
    return r.redirect = "manual", r;
  }
  async getLatestVersion() {
    const t = new rn.CancellationToken(), n = (0, dl.getChannelFilename)(this.getDefaultChannelName()), r = await this.getLatestVersionInfo(t), i = r.assets.find((a) => a.name === n);
    if (i == null)
      throw (0, rn.newError)(`Cannot find ${n} in the release ${r.html_url || r.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const o = new fl.URL(i.url);
    let s;
    try {
      s = (0, x_.load)(await this.httpRequest(o, this.configureHeaders("application/octet-stream"), t));
    } catch (a) {
      throw a instanceof rn.HttpError && a.statusCode === 404 ? (0, rn.newError)(`Cannot find ${n} in the latest release artifacts (${o}): ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : a;
    }
    return s.assets = r.assets, s;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(t) {
    return {
      accept: t,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(t) {
    const n = this.updater.allowPrerelease;
    let r = this.basePath;
    n || (r = `${r}/latest`);
    const i = (0, dl.newUrlFromBase)(r, this.baseUrl);
    try {
      const o = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), t));
      if (n) {
        const s = o.filter((a) => !a.draft);
        return s.find((a) => a.prerelease) || s[0];
      } else
        return o;
    } catch (o) {
      throw (0, rn.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${o.stack || o.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, k_.getFileList)(t).map((n) => {
      const r = L_.posix.basename(n.url).replace(/ /g, "-"), i = t.assets.find((o) => o != null && o.name === r);
      if (i == null)
        throw (0, rn.newError)(`Cannot find asset "${r}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new fl.URL(i.url),
        info: n
      };
    });
  }
}
$i.PrivateGitHubProvider = M_;
Object.defineProperty(Ai, "__esModule", { value: !0 });
Ai.isUrlProbablySupportMultiRangeRequests = af;
Ai.createClient = V_;
const jr = ge, B_ = Si, hl = gr, j_ = Pt, H_ = bi, q_ = Ci, G_ = $i;
function af(e) {
  return !e.includes("s3.amazonaws.com");
}
function V_(e, t, n) {
  if (typeof e == "string")
    throw (0, jr.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const r = e.provider;
  switch (r) {
    case "github": {
      const i = e, o = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
      return o == null ? new j_.GitHubProvider(i, t, n) : new G_.PrivateGitHubProvider(i, t, o, n);
    }
    case "bitbucket":
      return new B_.BitbucketProvider(e, t, n);
    case "gitlab":
      return new H_.GitLabProvider(e, t, n);
    case "keygen":
      return new q_.KeygenProvider(e, t, n);
    case "s3":
    case "spaces":
      return new hl.GenericProvider({
        provider: "generic",
        url: (0, jr.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...n,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const i = e;
      return new hl.GenericProvider(i, t, {
        ...n,
        isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && af(i.url)
      });
    }
    case "custom": {
      const i = e, o = i.updateProvider;
      if (!o)
        throw (0, jr.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new o(i, t, n);
    }
    default:
      throw (0, jr.newError)(`Unsupported provider: ${r}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var Ri = {}, yr = {}, bn = {}, Jt = {};
Object.defineProperty(Jt, "__esModule", { value: !0 });
Jt.OperationKind = void 0;
Jt.computeOperations = W_;
var qt;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(qt || (Jt.OperationKind = qt = {}));
function W_(e, t, n) {
  const r = ml(e.files), i = ml(t.files);
  let o = null;
  const s = t.files[0], a = [], c = s.name, h = r.get(c);
  if (h == null)
    throw new Error(`no file ${c} in old blockmap`);
  const l = i.get(c);
  let f = 0;
  const { checksumToOffset: p, checksumToOldSize: g } = Y_(r.get(c), h.offset, n);
  let w = s.offset;
  for (let y = 0; y < l.checksums.length; w += l.sizes[y], y++) {
    const T = l.sizes[y], A = l.checksums[y];
    let b = p.get(A);
    b != null && g.get(A) !== T && (n.warn(`Checksum ("${A}") matches, but size differs (old: ${g.get(A)}, new: ${T})`), b = void 0), b === void 0 ? (f++, o != null && o.kind === qt.DOWNLOAD && o.end === w ? o.end += T : (o = {
      kind: qt.DOWNLOAD,
      start: w,
      end: w + T
      // oldBlocks: null,
    }, pl(o, a, A, y))) : o != null && o.kind === qt.COPY && o.end === b ? o.end += T : (o = {
      kind: qt.COPY,
      start: b,
      end: b + T
      // oldBlocks: [checksum]
    }, pl(o, a, A, y));
  }
  return f > 0 && n.info(`File${s.name === "file" ? "" : " " + s.name} has ${f} changed blocks`), a;
}
const z_ = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function pl(e, t, n, r) {
  if (z_ && t.length !== 0) {
    const i = t[t.length - 1];
    if (i.kind === e.kind && e.start < i.end && e.start > i.start) {
      const o = [i.start, i.end, e.start, e.end].reduce((s, a) => s < a ? s : a);
      throw new Error(`operation (block index: ${r}, checksum: ${n}, kind: ${qt[e.kind]}) overlaps previous operation (checksum: ${n}):
abs: ${i.start} until ${i.end} and ${e.start} until ${e.end}
rel: ${i.start - o} until ${i.end - o} and ${e.start - o} until ${e.end - o}`);
    }
  }
  t.push(e);
}
function Y_(e, t, n) {
  const r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let o = t;
  for (let s = 0; s < e.checksums.length; s++) {
    const a = e.checksums[s], c = e.sizes[s], h = i.get(a);
    if (h === void 0)
      r.set(a, o), i.set(a, c);
    else if (n.debug != null) {
      const l = h === c ? "(same size)" : `(size: ${h}, this size: ${c})`;
      n.debug(`${a} duplicated in blockmap ${l}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    o += c;
  }
  return { checksumToOffset: r, checksumToOldSize: i };
}
function ml(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    t.set(n.name, n);
  return t;
}
Object.defineProperty(bn, "__esModule", { value: !0 });
bn.DataSplitter = void 0;
bn.copyData = lf;
const Hr = ge, X_ = Ot, K_ = sr, J_ = Jt, gl = Buffer.from(`\r
\r
`);
var vt;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(vt || (vt = {}));
function lf(e, t, n, r, i) {
  const o = (0, X_.createReadStream)("", {
    fd: n,
    autoClose: !1,
    start: e.start,
    // end is inclusive
    end: e.end - 1
  });
  o.on("error", r), o.once("end", i), o.pipe(t, {
    end: !1
  });
}
class Q_ extends K_.Writable {
  constructor(t, n, r, i, o, s, a, c) {
    super(), this.out = t, this.options = n, this.partIndexToTaskIndex = r, this.partIndexToLength = o, this.finishHandler = s, this.grandTotalBytes = a, this.onProgress = c, this.start = Date.now(), this.nextUpdate = this.start + 1e3, this.transferred = 0, this.delta = 0, this.partIndex = -1, this.headerListBuffer = null, this.readState = vt.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(t, n, r) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${t.length} bytes`);
      return;
    }
    this.handleData(t).then(() => {
      if (this.onProgress) {
        const i = Date.now();
        (i >= this.nextUpdate || this.transferred === this.grandTotalBytes) && this.grandTotalBytes && (i - this.start) / 1e3 && (this.nextUpdate = i + 1e3, this.onProgress({
          total: this.grandTotalBytes,
          delta: this.delta,
          transferred: this.transferred,
          percent: this.transferred / this.grandTotalBytes * 100,
          bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
        }), this.delta = 0);
      }
      r();
    }).catch(r);
  }
  async handleData(t) {
    let n = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
      throw (0, Hr.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    if (this.ignoreByteCount > 0) {
      const r = Math.min(this.ignoreByteCount, t.length);
      this.ignoreByteCount -= r, n = r;
    } else if (this.remainingPartDataCount > 0) {
      const r = Math.min(this.remainingPartDataCount, t.length);
      this.remainingPartDataCount -= r, await this.processPartData(t, 0, r), n = r;
    }
    if (n !== t.length) {
      if (this.readState === vt.HEADER) {
        const r = this.searchHeaderListEnd(t, n);
        if (r === -1)
          return;
        n = r, this.readState = vt.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === vt.BODY)
          this.readState = vt.INIT;
        else {
          this.partIndex++;
          let s = this.partIndexToTaskIndex.get(this.partIndex);
          if (s == null)
            if (this.isFinished)
              s = this.options.end;
            else
              throw (0, Hr.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          const a = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
          if (a < s)
            await this.copyExistingData(a, s);
          else if (a > s)
            throw (0, Hr.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
          if (this.isFinished) {
            this.onPartEnd(), this.finishHandler();
            return;
          }
          if (n = this.searchHeaderListEnd(t, n), n === -1) {
            this.readState = vt.HEADER;
            return;
          }
        }
        const r = this.partIndexToLength[this.partIndex], i = n + r, o = Math.min(i, t.length);
        if (await this.processPartStarted(t, n, o), this.remainingPartDataCount = r - (o - n), this.remainingPartDataCount > 0)
          return;
        if (n = i + this.boundaryLength, n >= t.length) {
          this.ignoreByteCount = this.boundaryLength - (t.length - i);
          return;
        }
      }
    }
  }
  copyExistingData(t, n) {
    return new Promise((r, i) => {
      const o = () => {
        if (t === n) {
          r();
          return;
        }
        const s = this.options.tasks[t];
        if (s.kind !== J_.OperationKind.COPY) {
          i(new Error("Task kind must be COPY"));
          return;
        }
        lf(s, this.out, this.options.oldFileFd, i, () => {
          t++, o();
        });
      };
      o();
    });
  }
  searchHeaderListEnd(t, n) {
    const r = t.indexOf(gl, n);
    if (r !== -1)
      return r + gl.length;
    const i = n === 0 ? t : t.slice(n);
    return this.headerListBuffer == null ? this.headerListBuffer = i : this.headerListBuffer = Buffer.concat([this.headerListBuffer, i]), -1;
  }
  onPartEnd() {
    const t = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== t)
      throw (0, Hr.newError)(`Expected length: ${t} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    this.actualPartLength = 0;
  }
  processPartStarted(t, n, r) {
    return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(t, n, r);
  }
  processPartData(t, n, r) {
    this.actualPartLength += r - n, this.transferred += r - n, this.delta += r - n;
    const i = this.out;
    return i.write(n === 0 && t.length === r ? t : t.slice(n, r)) ? Promise.resolve() : new Promise((o, s) => {
      i.on("error", s), i.once("drain", () => {
        i.removeListener("error", s), o();
      });
    });
  }
}
bn.DataSplitter = Q_;
var Pi = {};
Object.defineProperty(Pi, "__esModule", { value: !0 });
Pi.executeTasksUsingMultipleRangeRequests = Z_;
Pi.checkIsRangesSupported = Lo;
const xo = ge, yl = bn, El = Jt;
function Z_(e, t, n, r, i) {
  const o = (s) => {
    if (s >= t.length) {
      e.fileMetadataBuffer != null && n.write(e.fileMetadataBuffer), n.end();
      return;
    }
    const a = s + 1e3;
    ev(e, {
      tasks: t,
      start: s,
      end: Math.min(t.length, a),
      oldFileFd: r
    }, n, () => o(a), i);
  };
  return o;
}
function ev(e, t, n, r, i) {
  let o = "bytes=", s = 0, a = 0;
  const c = /* @__PURE__ */ new Map(), h = [];
  for (let p = t.start; p < t.end; p++) {
    const g = t.tasks[p];
    g.kind === El.OperationKind.DOWNLOAD && (o += `${g.start}-${g.end - 1}, `, c.set(s, p), s++, h.push(g.end - g.start), a += g.end - g.start);
  }
  if (s <= 1) {
    const p = (g) => {
      if (g >= t.end) {
        r();
        return;
      }
      const w = t.tasks[g++];
      if (w.kind === El.OperationKind.COPY)
        (0, yl.copyData)(w, n, t.oldFileFd, i, () => p(g));
      else {
        const y = e.createRequestOptions();
        y.headers.Range = `bytes=${w.start}-${w.end - 1}`;
        const T = e.httpExecutor.createRequest(y, (A) => {
          A.on("error", i), Lo(A, i) && (A.pipe(n, {
            end: !1
          }), A.once("end", () => p(g)));
        });
        e.httpExecutor.addErrorAndTimeoutHandlers(T, i), T.end();
      }
    };
    p(t.start);
    return;
  }
  const l = e.createRequestOptions();
  l.headers.Range = o.substring(0, o.length - 2);
  const f = e.httpExecutor.createRequest(l, (p) => {
    if (!Lo(p, i))
      return;
    const g = (0, xo.safeGetHeader)(p, "content-type"), w = /^multipart\/.+?\s*;\s*boundary=(?:"([^"]+)"|([^\s";]+))\s*$/i.exec(g);
    if (w == null) {
      i(new Error(`Content-Type "multipart/byteranges" is expected, but got "${g}"`));
      return;
    }
    const y = new yl.DataSplitter(n, t, c, w[1] || w[2], h, r, a, e.options.onProgress);
    y.on("error", i), p.pipe(y), p.on("end", () => {
      setTimeout(() => {
        f.abort(), i(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(f, i), f.end();
}
function Lo(e, t) {
  if (e.statusCode >= 400)
    return t((0, xo.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const n = (0, xo.safeGetHeader)(e, "accept-ranges");
    if (n == null || n === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var Oi = {};
Object.defineProperty(Oi, "__esModule", { value: !0 });
Oi.ProgressDifferentialDownloadCallbackTransform = void 0;
const tv = sr;
var pn;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(pn || (pn = {}));
class nv extends tv.Transform {
  constructor(t, n, r) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = n, this.onProgress = r, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = pn.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, n, r) {
    if (this.cancellationToken.cancelled) {
      r(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == pn.COPY) {
      r(null, t);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), r(null, t);
  }
  beginFileCopy() {
    this.operationType = pn.COPY;
  }
  beginRangeDownload() {
    this.operationType = pn.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
  }
  // Called when we are 100% done with the connection/download
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, this.transferred = 0, t(null);
  }
}
Oi.ProgressDifferentialDownloadCallbackTransform = nv;
Object.defineProperty(yr, "__esModule", { value: !0 });
yr.DifferentialDownloader = void 0;
const Ln = ge, ho = Nt, rv = Ot, iv = bn, ov = It, qr = Jt, wl = Pi, sv = Oi;
class av {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(t, n, r) {
    this.blockAwareFileInfo = t, this.httpExecutor = n, this.options = r, this.fileMetadataBuffer = null, this.logger = r.logger;
  }
  createRequestOptions() {
    const t = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    return (0, Ln.configureRequestUrl)(this.options.newUrl, t), (0, Ln.configureRequestOptions)(t), t;
  }
  doDownload(t, n) {
    if (t.version !== n.version)
      throw new Error(`version is different (${t.version} - ${n.version}), full download is required`);
    const r = this.logger, i = (0, qr.computeOperations)(t, n, r);
    r.debug != null && r.debug(JSON.stringify(i, null, 2));
    let o = 0, s = 0;
    for (const c of i) {
      const h = c.end - c.start;
      c.kind === qr.OperationKind.DOWNLOAD ? o += h : s += h;
    }
    const a = this.blockAwareFileInfo.size;
    if (o + s + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== a)
      throw new Error(`Internal error, size mismatch: downloadSize: ${o}, copySize: ${s}, newSize: ${a}`);
    return r.info(`Full: ${_l(a)}, To download: ${_l(o)} (${Math.round(o / (a / 100))}%)`), this.downloadFile(i);
  }
  downloadFile(t) {
    const n = [], r = () => Promise.all(n.map((i) => (0, ho.close)(i.descriptor).catch((o) => {
      this.logger.error(`cannot close file "${i.path}": ${o}`);
    })));
    return this.doDownloadFile(t, n).then(r).catch((i) => r().catch((o) => {
      try {
        this.logger.error(`cannot close files: ${o}`);
      } catch (s) {
        try {
          console.error(s);
        } catch {
        }
      }
      throw i;
    }).then(() => {
      throw i;
    }));
  }
  async doDownloadFile(t, n) {
    const r = await (0, ho.open)(this.options.oldFile, "r");
    n.push({ descriptor: r, path: this.options.oldFile });
    const i = await (0, ho.open)(this.options.newFile, "w");
    n.push({ descriptor: i, path: this.options.newFile });
    const o = (0, rv.createWriteStream)(this.options.newFile, { fd: i });
    await new Promise((s, a) => {
      const c = [];
      let h;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const A = [];
        let b = 0;
        for (const k of t)
          k.kind === qr.OperationKind.DOWNLOAD && (A.push(k.end - k.start), b += k.end - k.start);
        const I = {
          expectedByteCounts: A,
          grandTotal: b
        };
        h = new sv.ProgressDifferentialDownloadCallbackTransform(I, this.options.cancellationToken, this.options.onProgress), c.push(h);
      }
      const l = new Ln.DigestTransform(this.blockAwareFileInfo.sha512);
      l.isValidateOnEnd = !1, c.push(l), o.on("finish", () => {
        o.close(() => {
          n.splice(1, 1);
          try {
            l.validate();
          } catch (A) {
            a(A);
            return;
          }
          s(void 0);
        });
      }), c.push(o);
      let f = null;
      for (const A of c)
        A.on("error", a), f == null ? f = A : f = f.pipe(A);
      const p = c[0];
      let g;
      if (this.options.isUseMultipleRangeRequest) {
        g = (0, wl.executeTasksUsingMultipleRangeRequests)(this, t, p, r, a), g(0);
        return;
      }
      let w = 0, y = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const T = this.createRequestOptions();
      T.redirect = "manual", g = (A) => {
        var b, I;
        if (A >= t.length) {
          this.fileMetadataBuffer != null && p.write(this.fileMetadataBuffer), p.end();
          return;
        }
        const k = t[A++];
        if (k.kind === qr.OperationKind.COPY) {
          h && h.beginFileCopy(), (0, iv.copyData)(k, p, r, a, () => g(A));
          return;
        }
        const G = `bytes=${k.start}-${k.end - 1}`;
        T.headers.range = G, (I = (b = this.logger) === null || b === void 0 ? void 0 : b.debug) === null || I === void 0 || I.call(b, `download range: ${G}`), h && h.beginRangeDownload();
        const Z = this.httpExecutor.createRequest(T, (ee) => {
          ee.on("error", a), ee.on("aborted", () => {
            a(new Error("response has been aborted by the server"));
          }), ee.statusCode >= 400 && a((0, Ln.createHttpError)(ee)), ee.pipe(p, {
            end: !1
          }), ee.once("end", () => {
            h && h.endRangeDownload(), ++w === 100 ? (w = 0, setTimeout(() => g(A), 1e3)) : g(A);
          });
        });
        Z.on("redirect", (ee, ce, M) => {
          this.logger.info(`Redirect to ${lv(M)}`), y = M, (0, Ln.configureRequestUrl)(new ov.URL(y), T), Z.followRedirect();
        }), this.httpExecutor.addErrorAndTimeoutHandlers(Z, a), Z.end();
      }, g(0);
    });
  }
  async readRemoteBytes(t, n) {
    const r = Buffer.allocUnsafe(n + 1 - t), i = this.createRequestOptions();
    i.headers.range = `bytes=${t}-${n}`;
    let o = 0;
    if (await this.request(i, (s) => {
      s.copy(r, o), o += s.length;
    }), o !== r.length)
      throw new Error(`Received data length ${o} is not equal to expected ${r.length}`);
    return r;
  }
  request(t, n) {
    return new Promise((r, i) => {
      const o = this.httpExecutor.createRequest(t, (s) => {
        (0, wl.checkIsRangesSupported)(s, i) && (s.on("error", i), s.on("aborted", () => {
          i(new Error("response has been aborted by the server"));
        }), s.on("data", n), s.on("end", () => r()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(o, i), o.end();
    });
  }
}
yr.DifferentialDownloader = av;
function _l(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function lv(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(Ri, "__esModule", { value: !0 });
Ri.GenericDifferentialDownloader = void 0;
const cv = yr;
class uv extends cv.DifferentialDownloader {
  download(t, n) {
    return this.doDownload(t, n);
  }
}
Ri.GenericDifferentialDownloader = uv;
var Dt = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = r;
  const t = ge;
  Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
  class n {
    constructor(o) {
      this.emitter = o;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(o) {
      r(this.emitter, "login", o);
    }
    progress(o) {
      r(this.emitter, e.DOWNLOAD_PROGRESS, o);
    }
    updateDownloaded(o) {
      r(this.emitter, e.UPDATE_DOWNLOADED, o);
    }
    updateCancelled(o) {
      r(this.emitter, "update-cancelled", o);
    }
  }
  e.UpdaterSignal = n;
  function r(i, o, s) {
    i.on(o, s);
  }
})(Dt);
Object.defineProperty(Ct, "__esModule", { value: !0 });
Ct.NoOpLogger = Ct.AppUpdater = void 0;
const Oe = ge, fv = ar, dv = ai, hv = ql, ze = Nt, pv = Te, po = gi, He = ne, Bt = Qu, vl = mr, mv = Ti, Tl = Zu, gv = gr, mo = Ai, go = Vl, yv = Ri, on = Dt;
class ps extends hv.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(t) {
    if (this._channel != null) {
      if (typeof t != "string")
        throw (0, Oe.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, Oe.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
    }
    this._channel = t, this.allowDowngrade = !0;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(t) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: t
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, Tl.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new cf();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new po.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(t) {
    t && (this._isUpdateSupported = t);
  }
  /**
   * Allows developer to override default logic for determining if the user is below the rollout threshold.
   * The default logic compares the staging percentage with numerical representation of user ID.
   * An override can define custom logic, or bypass it if needed.
   */
  get isUserWithinRollout() {
    return this._isUserWithinRollout;
  }
  set isUserWithinRollout(t) {
    t && (this._isUserWithinRollout = t);
  }
  constructor(t, n) {
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this.previousBlockmapBaseUrlOverride = null, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new on.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (o) => this.checkIfUpdateSupported(o), this._isUserWithinRollout = (o) => this.isStagingMatch(o), this.clientPromise = null, this.stagingUserIdPromise = new po.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new po.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (o) => {
      this._logger.error(`Error: ${o.stack || o.message}`);
    }), n == null ? (this.app = new mv.ElectronAppAdapter(), this.httpExecutor = new Tl.ElectronHttpExecutor((o, s) => this.emit("login", o, s))) : (this.app = n, this.httpExecutor = null);
    const r = this.app.version, i = (0, Bt.parse)(r);
    if (i == null)
      throw (0, Oe.newError)(`App version is not a valid semver version: "${r}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = i, this.allowPrerelease = Ev(i), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](https://www.electron.build/publish#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(t) {
    const n = this.createProviderRuntimeOptions();
    let r;
    typeof t == "string" ? r = new gv.GenericProvider({ provider: "generic", url: t }, this, {
      ...n,
      isUseMultipleRangeRequest: (0, mo.isUrlProbablySupportMultiRangeRequests)(t)
    }) : r = (0, mo.createClient)(t, this, n), this.clientPromise = Promise.resolve(r);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive())
      return Promise.resolve(null);
    let t = this.checkForUpdatesPromise;
    if (t != null)
      return this._logger.info("Checking for update (already in progress)"), t;
    const n = () => this.checkForUpdatesPromise = null;
    return this._logger.info("Checking for update"), t = this.doCheckForUpdates().then((r) => (n(), r)).catch((r) => {
      throw n(), this.emit("error", r, `Cannot check for updates: ${(r.stack || r).toString()}`), r;
    }), this.checkForUpdatesPromise = t, t;
  }
  isUpdaterActive() {
    return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(t) {
    return this.checkForUpdates().then((n) => n?.downloadPromise ? (n.downloadPromise.then(() => {
      const r = ps.formatDownloadNotification(n.updateInfo.version, this.app.name, t);
      new Vt.Notification(r).show();
    }), n) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), n));
  }
  static formatDownloadNotification(t, n, r) {
    return r == null && (r = {
      title: "A new update is ready to install",
      body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
    }), r = {
      title: r.title.replace("{appName}", n).replace("{version}", t),
      body: r.body.replace("{appName}", n).replace("{version}", t)
    }, r;
  }
  async isStagingMatch(t) {
    const n = t.stagingPercentage;
    let r = n;
    if (r == null)
      return !0;
    if (r = parseInt(r, 10), isNaN(r))
      return this._logger.warn(`Staging percentage is NaN: ${n}`), !0;
    r = r / 100;
    const i = await this.stagingUserIdPromise.value, s = Oe.UUID.parse(i).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${r}, percentage: ${s}, user id: ${i}`), s < r;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const n = (0, Bt.parse)(t.version);
    if (n == null)
      throw (0, Oe.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const r = this.currentVersion;
    if ((0, Bt.eq)(n, r) || !await Promise.resolve(this.isUpdateSupported(t)) || !await Promise.resolve(this.isUserWithinRollout(t)))
      return !1;
    const o = (0, Bt.gt)(n, r), s = (0, Bt.lt)(n, r);
    return o ? !0 : this.allowDowngrade && s;
  }
  checkIfUpdateSupported(t) {
    const n = t?.minimumSystemVersion, r = (0, dv.release)();
    if (n)
      try {
        if ((0, Bt.lt)(r, n))
          return this._logger.info(`Current OS version ${r} is less than the minimum OS version required ${n} for version ${r}`), !1;
      } catch (i) {
        this._logger.warn(`Failed to compare current OS version(${r}) with minimum OS version(${n}): ${(i.message || i).toString()}`);
      }
    return !0;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((r) => (0, mo.createClient)(r, this, this.createProviderRuntimeOptions())));
    const t = await this.clientPromise, n = await this.stagingUserIdPromise.value;
    return t.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": n })), {
      info: await t.getLatestVersion(),
      provider: t
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: !0,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const t = await this.getUpdateInfoAndProvider(), n = t.info;
    if (!await this.isUpdateAvailable(n))
      return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${n.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", n), {
        isUpdateAvailable: !1,
        versionInfo: n,
        updateInfo: n
      };
    this.updateInfoAndProvider = t, this.onUpdateAvailable(n);
    const r = new Oe.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: n,
      updateInfo: n,
      cancellationToken: r,
      downloadPromise: this.autoDownload ? this.downloadUpdate(r) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, Oe.asArray)(t.files).map((n) => n.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new Oe.CancellationToken()) {
    const n = this.updateInfoAndProvider;
    if (n == null) {
      const i = new Error("Please check update first");
      return this.dispatchError(i), Promise.reject(i);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, Oe.asArray)(n.info.files).map((i) => i.url).join(", ")}`);
    const r = (i) => {
      if (!(i instanceof Oe.CancellationError))
        try {
          this.dispatchError(i);
        } catch (o) {
          this._logger.warn(`Cannot dispatch error event: ${o.stack || o}`);
        }
      return i;
    };
    return this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider: n,
      requestHeaders: this.computeRequestHeaders(n.provider),
      cancellationToken: t,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((i) => {
      throw r(i);
    }).finally(() => {
      this.downloadPromise = null;
    }), this.downloadPromise;
  }
  dispatchError(t) {
    this.emit("error", t, (t.stack || t).toString());
  }
  dispatchUpdateDownloaded(t) {
    this.emit(on.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, pv.load)(await (0, ze.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(t) {
    const n = t.fileExtraDownloadHeaders;
    if (n != null) {
      const r = this.requestHeaders;
      return r == null ? n : {
        ...n,
        ...r
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const t = He.join(this.app.userDataPath, ".updaterId");
    try {
      const r = await (0, ze.readFile)(t, "utf-8");
      if (Oe.UUID.check(r))
        return r;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${r}`);
    } catch (r) {
      r.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${r}`);
    }
    const n = Oe.UUID.v5((0, fv.randomBytes)(4096), Oe.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${n}`);
    try {
      await (0, ze.outputFile)(t, n);
    } catch (r) {
      this._logger.warn(`Couldn't write out staging user ID: ${r}`);
    }
    return n;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const t = this.requestHeaders;
    if (t == null)
      return !0;
    for (const n of Object.keys(t)) {
      const r = n.toLowerCase();
      if (r === "authorization" || r === "private-token")
        return !1;
    }
    return !0;
  }
  async getOrCreateDownloadHelper() {
    let t = this.downloadedUpdateHelper;
    if (t == null) {
      const n = (await this.configOnDisk.value).updaterCacheDirName, r = this._logger;
      n == null && r.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      const i = He.join(this.app.baseCachePath, n || this.app.name);
      r.debug != null && r.debug(`updater cache dir: ${i}`), t = new vl.DownloadedUpdateHelper(i), this.downloadedUpdateHelper = t;
    }
    return t;
  }
  async executeDownload(t) {
    const n = t.fileInfo, r = {
      headers: t.downloadUpdateOptions.requestHeaders,
      cancellationToken: t.downloadUpdateOptions.cancellationToken,
      sha2: n.info.sha2,
      sha512: n.info.sha512
    };
    this.listenerCount(on.DOWNLOAD_PROGRESS) > 0 && (r.onProgress = (b) => this.emit(on.DOWNLOAD_PROGRESS, b));
    const i = t.downloadUpdateOptions.updateInfoAndProvider.info, o = i.version, s = n.packageInfo;
    function a() {
      const b = decodeURIComponent(t.fileInfo.url.pathname);
      return b.toLowerCase().endsWith(`.${t.fileExtension.toLowerCase()}`) ? He.basename(b) : He.basename(t.fileInfo.info.url);
    }
    const c = await this.getOrCreateDownloadHelper(), h = c.cacheDirForPendingUpdate;
    await (0, ze.mkdir)(h, { recursive: !0 });
    const l = a();
    let f = He.join(h, l);
    const p = s == null ? null : He.join(h, `package-${o}${He.extname(s.path) || ".7z"}`), g = async (b) => {
      await c.setDownloadedFile(f, p, i, n, l, b), await t.done({
        ...i,
        downloadedFile: f
      });
      const I = He.join(h, "current.blockmap");
      return await (0, ze.pathExists)(I) && await (0, ze.copyFile)(I, He.join(c.cacheDir, "current.blockmap")), p == null ? [f] : [f, p];
    }, w = this._logger, y = await c.validateDownloadedPath(f, i, n, w);
    if (y != null)
      return f = y, await g(!1);
    const T = async () => (await c.clear().catch(() => {
    }), await (0, ze.unlink)(f).catch(() => {
    })), A = await (0, vl.createTempUpdateFile)(`temp-${l}`, h, w);
    try {
      await t.task(A, r, p, T), await (0, Oe.retry)(() => (0, ze.rename)(A, f), {
        retries: 60,
        interval: 500,
        shouldRetry: (b) => b instanceof Error && /^EBUSY:/.test(b.message) ? !0 : (w.warn(`Cannot rename temp file to final file: ${b.message || b.stack}`), !1)
      });
    } catch (b) {
      throw await T(), b instanceof Oe.CancellationError && (w.info("cancelled"), this.emit("update-cancelled", i)), b;
    }
    return w.info(`New version ${o} has been downloaded to ${f}`), await g(!0);
  }
  async differentialDownloadInstaller(t, n, r, i, o) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const s = n.updateInfoAndProvider.provider, a = await s.getBlockMapFiles(t.url, this.app.version, n.updateInfoAndProvider.info.version, this.previousBlockmapBaseUrlOverride);
      this._logger.info(`Download block maps (old: "${a[0]}", new: ${a[1]})`);
      const c = async (w) => {
        const y = await this.httpExecutor.downloadToBuffer(w, {
          headers: n.requestHeaders,
          cancellationToken: n.cancellationToken
        });
        if (y == null || y.length === 0)
          throw new Error(`Blockmap "${w.href}" is empty`);
        try {
          return JSON.parse((0, go.gunzipSync)(y).toString());
        } catch (T) {
          throw new Error(`Cannot parse blockmap "${w.href}", error: ${T}`);
        }
      }, h = {
        newUrl: t.url,
        oldFile: He.join(this.downloadedUpdateHelper.cacheDir, o),
        logger: this._logger,
        newFile: r,
        isUseMultipleRangeRequest: s.isUseMultipleRangeRequest,
        requestHeaders: n.requestHeaders,
        cancellationToken: n.cancellationToken
      };
      this.listenerCount(on.DOWNLOAD_PROGRESS) > 0 && (h.onProgress = (w) => this.emit(on.DOWNLOAD_PROGRESS, w));
      const l = async (w, y) => {
        const T = He.join(y, "current.blockmap");
        await (0, ze.outputFile)(T, (0, go.gzipSync)(JSON.stringify(w)));
      }, f = async (w) => {
        const y = He.join(w, "current.blockmap");
        try {
          if (await (0, ze.pathExists)(y))
            return JSON.parse((0, go.gunzipSync)(await (0, ze.readFile)(y)).toString());
        } catch (T) {
          this._logger.warn(`Cannot parse blockmap "${y}", error: ${T}`);
        }
        return null;
      }, p = await c(a[1]);
      await l(p, this.downloadedUpdateHelper.cacheDirForPendingUpdate);
      let g = await f(this.downloadedUpdateHelper.cacheDir);
      return g == null && (g = await c(a[0])), await new yv.GenericDifferentialDownloader(t.info, this.httpExecutor, h).download(g, p), !1;
    } catch (s) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), this._testOnlyOptions != null)
        throw s;
      return !0;
    }
  }
}
Ct.AppUpdater = ps;
function Ev(e) {
  const t = (0, Bt.prerelease)(e);
  return t != null && t.length > 0;
}
class cf {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(t) {
  }
}
Ct.NoOpLogger = cf;
Object.defineProperty(Xt, "__esModule", { value: !0 });
Xt.BaseUpdater = void 0;
const Al = si, yo = ne, wv = Ct;
class _v extends wv.AppUpdater {
  constructor(t, n) {
    super(t, n), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, n = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? n : this.autoRunAppAfterInstall) ? setImmediate(() => {
      Vt.autoUpdater.emit("before-quit-for-update"), this.app.quit();
    }) : this.quitAndInstallCalled = !1;
  }
  executeDownload(t) {
    return super.executeDownload({
      ...t,
      done: (n) => (this.dispatchUpdateDownloaded(n), this.addQuitHandler(), Promise.resolve())
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(t = !1, n = !1) {
    if (this.quitAndInstallCalled)
      return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
    const r = this.downloadedUpdateHelper, i = this.installerPath, o = r == null ? null : r.downloadedFileInfo;
    if (i == null || o == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    this.quitAndInstallCalled = !0;
    try {
      return this._logger.info(`Install: isSilent: ${t}, isForceRunAfter: ${n}`), this.doInstall({
        isSilent: t,
        isForceRunAfter: n,
        isAdminRightsRequired: o.isAdminRightsRequired
      });
    } catch (s) {
      return this.dispatchError(s), !1;
    }
  }
  addQuitHandler() {
    this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((t) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (t !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${t}`);
        return;
      }
      this._logger.info("Auto install update on quit"), this.install(!0, !1);
    }));
  }
  /**
   * Strips relative-path entries from a PATH string.
   * Prevents PATH-poisoning where a writable directory earlier in PATH shadows
   * a trusted package manager binary.
   */
  sanitizeEnvPath(t) {
    return t.split(yo.delimiter).filter((n) => yo.isAbsolute(n)).join(yo.delimiter);
  }
  spawnSyncLog(t, n = [], r = {}) {
    var i;
    this._logger.info(`Executing: ${t} with args: ${n}`);
    const o = { ...process.env, ...r }, s = (0, Al.spawnSync)(t, n, {
      env: { ...o, PATH: this.sanitizeEnvPath((i = o.PATH) !== null && i !== void 0 ? i : "") },
      encoding: "utf-8",
      shell: !0
    }), { error: a, status: c, stdout: h, stderr: l } = s;
    if (a != null)
      throw this._logger.error(l), a;
    if (c != null && c !== 0)
      throw this._logger.error(l), new Error(`Command ${t} exited with code ${c}`);
    return h.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(t, n = [], r = void 0, i = "ignore") {
    return this._logger.info(`Executing: ${t} with args: ${n}`), new Promise((o, s) => {
      try {
        const a = { stdio: i, env: r, detached: !0 }, c = (0, Al.spawn)(t, n, a);
        c.on("error", (h) => {
          s(h);
        }), c.unref(), c.pid !== void 0 && o(!0);
      } catch (a) {
        s(a);
      }
    });
  }
}
Xt.BaseUpdater = _v;
var er = {}, Er = {};
Object.defineProperty(Er, "__esModule", { value: !0 });
Er.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const sn = Nt, vv = yr, Tv = Vl;
class Av extends vv.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, n = t.size, r = n - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(r, n - 1);
    const i = uf(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await Sv(this.options.oldFile), i);
  }
}
Er.FileWithEmbeddedBlockMapDifferentialDownloader = Av;
function uf(e) {
  return JSON.parse((0, Tv.inflateRawSync)(e).toString());
}
async function Sv(e) {
  const t = await (0, sn.open)(e, "r");
  try {
    const n = (await (0, sn.fstat)(t)).size, r = Buffer.allocUnsafe(4);
    await (0, sn.read)(t, r, 0, r.length, n - r.length);
    const i = Buffer.allocUnsafe(r.readUInt32BE(0));
    return await (0, sn.read)(t, i, 0, i.length, n - r.length - i.length), await (0, sn.close)(t), uf(i);
  } catch (n) {
    throw await (0, sn.close)(t), n;
  }
}
Object.defineProperty(er, "__esModule", { value: !0 });
er.AppImageUpdater = void 0;
const Eo = ge, Sl = si, bv = Nt, Cv = Ot, an = ne, $v = Xt, Rv = Er, Pv = de, bl = Dt;
class Ov extends $v.BaseUpdater {
  constructor(t, n) {
    super(t, n);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null && !this.forceDevUpdateConfig ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, Pv.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        const s = process.env.APPIMAGE;
        if (s == null)
          throw (0, Eo.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(r, s, i, n, t)) && await this.httpExecutor.download(r.url, i, o), await (0, bv.chmod)(i, 493);
      }
    });
  }
  async downloadDifferential(t, n, r, i, o) {
    try {
      const s = {
        newUrl: t.url,
        oldFile: n,
        logger: this._logger,
        newFile: r,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: o.requestHeaders,
        cancellationToken: o.cancellationToken
      };
      return this.listenerCount(bl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(bl.DOWNLOAD_PROGRESS, a)), await new Rv.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, s).download(), !1;
    } catch (s) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const n = process.env.APPIMAGE;
    if (n == null)
      throw (0, Eo.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    if (!an.isAbsolute(n) || n.includes("\0"))
      throw (0, Eo.newError)(`APPIMAGE env is not a valid absolute path: "${n}"`, "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, Cv.unlinkSync)(n);
    let r;
    const i = an.basename(n), o = this.installerPath;
    if (o == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    an.basename(o) === i || !/\d+\.\d+\.\d+/.test(i) ? r = n : r = an.join(an.dirname(n), an.basename(o)), (0, Sl.execFileSync)("mv", ["-f", o, r]), r !== n && this.emit("appimage-filename-updated", r);
    const s = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(r, [], s) : (s.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, Sl.execFileSync)(r, [], { env: s })), !0;
  }
}
er.AppImageUpdater = Ov;
var tr = {}, Cn = {};
Object.defineProperty(Cn, "__esModule", { value: !0 });
Cn.LinuxUpdater = void 0;
const Iv = Xt, Nv = /^[a-zA-Z0-9_-]+$/;
class Dv extends Iv.BaseUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /**
   * Returns true if the current process is running as root.
   */
  isRunningAsRoot() {
    var t;
    return ((t = process.getuid) === null || t === void 0 ? void 0 : t.call(process)) === 0;
  }
  /**
   * Sanitizes the installer path for use with shell:true spawn calls.
   * Backslash-escapes metacharacters that have special meaning in POSIX shell.
   * Note: paths containing single-quotes (') are not supported.
   */
  get installerPath() {
    const t = super.installerPath;
    return t == null ? null : t.replace(/\\/g, "\\\\").replace(/([`$!" ;|&()<>])/g, "\\$1").replace(/[\n\r]/g, "");
  }
  runCommandWithSudoIfNeeded(t) {
    if (this.isRunningAsRoot())
      return this._logger.info("Running as root, no need to use sudo"), this.spawnSyncLog(t[0], t.slice(1));
    const { name: n } = this.app, i = `"${n.replace(/["`$\\!\n\r;|&<>(){}*?[\]#~]/g, "")} would like to update"`, o = this.sudoWithArgs(i);
    this._logger.info(`Running as non-root user, using sudo to install: ${o}`);
    let s = '"';
    return (/pkexec/i.test(o[0]) || o[0] === "sudo") && (s = ""), this.spawnSyncLog(o[0], [...o.length > 1 ? o.slice(1) : [], `${s}/bin/bash`, "-c", `'${t.join(" ")}'${s}`]);
  }
  sudoWithArgs(t) {
    const n = this.determineSudoCommand(), r = [n];
    return /kdesudo/i.test(n) ? (r.push("--comment", t), r.push("-c")) : /gksudo/i.test(n) ? r.push("--message", t) : /pkexec/i.test(n) && r.push("--disable-internal-agent"), r;
  }
  hasCommand(t) {
    try {
      return this.spawnSyncLog("command", ["-v", t]), !0;
    } catch {
      return !1;
    }
  }
  determineSudoCommand() {
    const t = ["gksudo", "kdesudo", "pkexec", "beesu"];
    for (const n of t)
      if (this.hasCommand(n))
        return n;
    return "sudo";
  }
  /**
   * Detects the package manager to use based on the available commands.
   * Allows overriding the default behavior by setting the ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER environment variable.
   * If the environment variable is set, it will be used directly. (This is useful for testing each package manager logic path.)
   * Otherwise, it checks for the presence of the specified package manager commands in the order provided.
   * @param pms - An array of package manager commands to check for, in priority order.
   * @returns The detected package manager command or "unknown" if none are found.
   */
  detectPackageManager(t) {
    var n;
    let r = t;
    const i = (n = process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER) === null || n === void 0 ? void 0 : n.trim();
    i && (Nv.test(i) ? r = [i] : this._logger.warn(`ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER "${i}" contains unsafe characters. Ignoring override.`));
    for (const a of r)
      if (this.hasCommand(a))
        return a;
    const o = i ? `ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER override "${i}", ` : "", s = t[0];
    return this._logger.warn(`No package manager found in the list: ${o}${t.join(", ")}. Utilizing default: ${s}`), s;
  }
}
Cn.LinuxUpdater = Dv;
Object.defineProperty(tr, "__esModule", { value: !0 });
tr.DebUpdater = void 0;
const Fv = de, Cl = Dt, xv = Cn;
class ms extends xv.LinuxUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, Fv.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Cl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Cl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(r.url, i, o);
      }
    });
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    if (!this.hasCommand("dpkg") && !this.hasCommand("apt"))
      return this.dispatchError(new Error("Neither dpkg nor apt command found. Cannot install .deb package.")), !1;
    const r = ["dpkg", "apt"], i = this.detectPackageManager(r);
    try {
      ms.installWithCommandRunner(i, n, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (o) {
      return this.dispatchError(o), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, n, r, i) {
    var o;
    if (t === "dpkg")
      try {
        r(["dpkg", "-i", n]);
      } catch (s) {
        i.warn((o = s.message) !== null && o !== void 0 ? o : s), i.warn("dpkg installation failed, trying to fix broken dependencies with apt-get"), r(["apt-get", "install", "-f", "-y"]);
      }
    else if (t === "apt")
      i.warn("Using apt to install a local .deb. This may fail for unsigned packages unless properly configured."), r([
        "apt",
        "install",
        "-y",
        "--allow-unauthenticated",
        // needed for unsigned .debs
        "--allow-downgrades",
        // allow lower version installs
        "--allow-change-held-packages",
        n
      ]);
    else
      throw new Error(`Package manager ${t} not supported`);
  }
}
tr.DebUpdater = ms;
var nr = {};
Object.defineProperty(nr, "__esModule", { value: !0 });
nr.PacmanUpdater = void 0;
const $l = Dt, Lv = de, Uv = Cn;
class gs extends Uv.LinuxUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, Lv.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount($l.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit($l.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(r.url, i, o);
      }
    });
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    try {
      gs.installWithCommandRunner(n, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (r) {
      return this.dispatchError(r), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, n, r) {
    var i;
    try {
      n(["pacman", "-U", "--noconfirm", t]);
    } catch (o) {
      r.warn((i = o.message) !== null && i !== void 0 ? i : o), r.warn("pacman installation failed, attempting to update package database and retry");
      try {
        n(["pacman", "-Sy", "--noconfirm"]), n(["pacman", "-U", "--noconfirm", t]);
      } catch (s) {
        throw r.error("Retry after pacman -Sy failed"), s;
      }
    }
  }
}
nr.PacmanUpdater = gs;
var rr = {};
Object.defineProperty(rr, "__esModule", { value: !0 });
rr.RpmUpdater = void 0;
const Rl = Dt, kv = de, Mv = Cn;
class ys extends Mv.LinuxUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, kv.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Rl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Rl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(r.url, i, o);
      }
    });
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const r = ["zypper", "dnf", "yum", "rpm"], i = this.detectPackageManager(r);
    try {
      ys.installWithCommandRunner(i, n, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (o) {
      return this.dispatchError(o), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, n, r, i) {
    if (t === "zypper")
      return r(["zypper", "--non-interactive", "--no-refresh", "install", "--allow-unsigned-rpm", "-f", n]);
    if (t === "dnf")
      return r(["dnf", "install", "--nogpgcheck", "-y", n]);
    if (t === "yum")
      return r(["yum", "install", "--nogpgcheck", "-y", n]);
    if (t === "rpm")
      return i.warn("Installing with rpm only (no dependency resolution)."), r(["rpm", "-Uvh", "--replacepkgs", "--replacefiles", "--nodeps", n]);
    throw new Error(`Package manager ${t} not supported`);
  }
}
rr.RpmUpdater = ys;
var ir = {};
Object.defineProperty(ir, "__esModule", { value: !0 });
ir.MacUpdater = void 0;
const Pl = ge, wo = Nt, Bv = Ot, Ol = ne, jv = gd, Hv = Ct, qv = de, Il = si, Nl = ar;
class Es extends Hv.AppUpdater {
  constructor(t, n) {
    super(t, n), this.nativeUpdater = Vt.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (r) => {
      this._logger.warn(r), this.emit("error", r);
    }), this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
    });
  }
  /** Filters update files to the appropriate architecture.
   * On arm64 Macs (including Rosetta), arm64 files are preferred when available.
   * On x64 Macs, arm64 files are excluded. */
  static filterFilesForArch(t, n) {
    const r = (i) => {
      var o;
      return i.url.pathname.includes("arm64") || ((o = i.info.url) === null || o === void 0 ? void 0 : o.includes("arm64"));
    };
    return n && t.some(r) ? t.filter((i) => n === r(i)) : t.filter((i) => !r(i));
  }
  debug(t) {
    this._logger.debug != null && this._logger.debug(t);
  }
  closeServerIfExists() {
    this.server && (this.debug("Closing proxy server"), this.server.close((t) => {
      t && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
    }));
  }
  async doDownloadUpdate(t) {
    let n = t.updateInfoAndProvider.provider.resolveFiles(t.updateInfoAndProvider.info);
    const r = this._logger, i = "sysctl.proc_translated";
    let o = !1;
    try {
      this.debug("Checking for macOS Rosetta environment"), o = (0, Il.execFileSync)("sysctl", [i], { encoding: "utf8" }).includes(`${i}: 1`), r.info(`Checked for macOS Rosetta environment (isRosetta=${o})`);
    } catch (l) {
      r.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${l}`);
    }
    let s = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const f = (0, Il.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
      r.info(`Checked 'uname -a': arm64=${f}`), s = s || f;
    } catch (l) {
      r.warn(`uname shell command to check for arm64 failed: ${l}`);
    }
    s = s || process.arch === "arm64" || o, n = Es.filterFilesForArch(n, s);
    const a = (0, qv.findFile)(n, "zip", ["pkg", "dmg"]);
    if (a == null)
      throw (0, Pl.newError)(`ZIP file not provided: ${(0, Pl.safeStringifyJson)(n)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const c = t.updateInfoAndProvider.provider, h = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: a,
      downloadUpdateOptions: t,
      task: async (l, f) => {
        const p = Ol.join(this.downloadedUpdateHelper.cacheDir, h), g = () => (0, wo.pathExistsSync)(p) ? !t.disableDifferentialDownload : (r.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let w = !0;
        g() && (w = await this.differentialDownloadInstaller(a, t, l, c, h)), w && await this.httpExecutor.download(a.url, l, f);
      },
      done: async (l) => {
        if (!t.disableDifferentialDownload)
          try {
            const f = Ol.join(this.downloadedUpdateHelper.cacheDir, h);
            await (0, wo.copyFile)(l.downloadedFile, f);
          } catch (f) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${f.message}`);
          }
        return this.updateDownloaded(a, l);
      }
    });
  }
  async updateDownloaded(t, n) {
    var r;
    const i = n.downloadedFile, o = (r = t.info.size) !== null && r !== void 0 ? r : (await (0, wo.stat)(i)).size, s = this._logger, a = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${a})`), this.server = (0, jv.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${a})`), this.server.on("close", () => {
      s.info(`Proxy server for native Squirrel.Mac is closed (${a})`);
    });
    const c = (h) => {
      const l = h.address();
      return typeof l == "string" ? l : `http://127.0.0.1:${l?.port}`;
    };
    return await new Promise((h, l) => {
      const f = (0, Nl.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), p = Buffer.from(`autoupdater:${f}`, "ascii"), g = `/${(0, Nl.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (w, y) => {
        const T = w.url;
        if (s.info(`${T} requested`), T === "/") {
          if (!w.headers.authorization || w.headers.authorization.indexOf("Basic ") === -1) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), s.warn("No authenthication info");
            return;
          }
          const I = w.headers.authorization.split(" ")[1], k = Buffer.from(I, "base64").toString("ascii"), [G, Z] = k.split(":");
          if (G !== "autoupdater" || Z !== f) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), s.warn("Invalid authenthication credentials");
            return;
          }
          const ee = Buffer.from(`{ "url": "${c(this.server)}${g}" }`);
          y.writeHead(200, { "Content-Type": "application/json", "Content-Length": ee.length }), y.end(ee);
          return;
        }
        if (!T.startsWith(g)) {
          s.warn(`${T} requested, but not supported`), y.writeHead(404), y.end();
          return;
        }
        s.info(`${g} requested by Squirrel.Mac, pipe ${i}`);
        let A = !1;
        y.on("finish", () => {
          A || (this.nativeUpdater.removeListener("error", l), h([]));
        });
        const b = (0, Bv.createReadStream)(i);
        b.on("error", (I) => {
          try {
            y.end();
          } catch (k) {
            s.warn(`cannot end response: ${k}`);
          }
          A = !0, this.nativeUpdater.removeListener("error", l), l(new Error(`Cannot pipe "${i}": ${I}`));
        }), y.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": o
        }), b.pipe(y);
      }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${a})`), this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${c(this.server)}, ${a})`), this.nativeUpdater.setFeedURL({
          url: c(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${p.toString("base64")}`
          }
        }), this.dispatchUpdateDownloaded(n), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", l), this.nativeUpdater.checkForUpdates()) : h([]);
      });
    });
  }
  handleUpdateDownloaded() {
    this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
  }
  quitAndInstall() {
    this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
  }
}
ir.MacUpdater = Es;
var or = {}, ws = {};
Object.defineProperty(ws, "__esModule", { value: !0 });
ws.verifySignature = Vv;
const Dl = ge, ff = si, Gv = ai, Fl = ne;
function df(e, t) {
  return ['set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", e], {
    shell: !0,
    timeout: t
  }];
}
function Vv(e, t, n) {
  return new Promise((r, i) => {
    const o = t.replace(/'/g, "''");
    n.info(`Verifying signature ${o}`), (0, ff.execFile)(...df(`"Get-AuthenticodeSignature -LiteralPath '${o}' | ConvertTo-Json -Compress"`, 20 * 1e3), (s, a, c) => {
      var h;
      try {
        if (s != null || c) {
          _o(n, s, c, i), r(null);
          return;
        }
        const l = Wv(a);
        if (l.Status === 0) {
          try {
            const w = Fl.normalize(l.Path), y = Fl.normalize(t);
            if (n.info(`LiteralPath: ${w}. Update Path: ${y}`), w !== y) {
              _o(n, new Error(`LiteralPath of ${w} is different than ${y}`), c, i), r(null);
              return;
            }
          } catch (w) {
            n.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(h = w.message) !== null && h !== void 0 ? h : w.stack}`);
          }
          const p = (0, Dl.parseDn)(l.SignerCertificate.Subject);
          let g = !1;
          for (const w of e) {
            const y = (0, Dl.parseDn)(w);
            if (y.size ? g = Array.from(y.keys()).every((A) => y.get(A) === p.get(A)) : w === p.get("CN") && (n.warn(`Signature validated using only CN ${w}. Please add your full Distinguished Name (DN) to publisherNames configuration`), g = !0), g) {
              r(null);
              return;
            }
          }
        }
        const f = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(l, (p, g) => p === "RawData" ? void 0 : g, 2);
        n.warn(`Sign verification failed, installer signed with incorrect certificate: ${f}`), r(f);
      } catch (l) {
        _o(n, l, null, i), r(null);
        return;
      }
    });
  });
}
function Wv(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const n = t.SignerCertificate;
  return n != null && (delete n.Archived, delete n.Extensions, delete n.Handle, delete n.HasPrivateKey, delete n.SubjectName), t;
}
function _o(e, t, n, r) {
  if (zv()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || n}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, ff.execFileSync)(...df("ConvertTo-Json test", 10 * 1e3));
  } catch (i) {
    e.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && r(t), n && r(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${n}. Failing signature validation due to unknown stderr.`));
}
function zv() {
  const e = Gv.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(or, "__esModule", { value: !0 });
or.NsisUpdater = void 0;
const Gr = ge, xl = ne, Yv = Xt, Xv = Er, Ll = Dt, Kv = de, Jv = Nt, Qv = ws, Ul = It;
class Zv extends Yv.BaseUpdater {
  constructor(t, n) {
    super(t, n), this._verifyUpdateCodeSignature = (r, i) => (0, Qv.verifySignature)(r, i, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(t) {
    t && (this._verifyUpdateCodeSignature = t);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, Kv.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: r,
      task: async (i, o, s, a) => {
        const c = r.packageInfo, h = c != null && s != null;
        if (h && t.disableWebInstaller)
          throw (0, Gr.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !h && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (h || t.disableDifferentialDownload || await this.differentialDownloadInstaller(r, t, i, n, Gr.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(r.url, i, o);
        const l = await this.verifySignature(i);
        if (l != null)
          throw await a(), (0, Gr.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${l}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (h && await this.differentialDownloadWebPackage(t, c, s, n))
          try {
            await this.httpExecutor.download(new Ul.URL(c.path), s, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: c.sha512
            });
          } catch (f) {
            try {
              await (0, Jv.unlink)(s);
            } catch {
            }
            throw f;
          }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(t) {
    let n;
    try {
      if (n = (await this.configOnDisk.value).publisherName, n == null)
        return null;
    } catch (r) {
      if (r.code === "ENOENT")
        return null;
      throw r;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(n) ? n : [n], t);
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const r = ["--updated"];
    t.isSilent && r.push("/S"), t.isForceRunAfter && r.push("--force-run"), this.installDirectory && r.push(`/D=${this.installDirectory}`);
    const i = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    i != null && r.push(`--package-file=${i}`);
    const o = () => {
      this.spawnLog(xl.join(process.resourcesPath, "elevate.exe"), [n].concat(r)).catch((s) => this.dispatchError(s));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), o(), !0) : (this.spawnLog(n, r).catch((s) => {
      const a = s.code;
      this._logger.info(`Cannot run installer: error code: ${a}, error message: "${s.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), a === "UNKNOWN" || a === "EACCES" ? o() : a === "ENOENT" ? Vt.shell.openPath(n).catch((c) => this.dispatchError(c)) : this.dispatchError(s);
    }), !0);
  }
  async differentialDownloadWebPackage(t, n, r, i) {
    if (n.blockMapSize == null)
      return !0;
    try {
      const o = {
        newUrl: new Ul.URL(n.path),
        oldFile: xl.join(this.downloadedUpdateHelper.cacheDir, Gr.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: r,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(Ll.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Ll.DOWNLOAD_PROGRESS, s)), await new Xv.FileWithEmbeddedBlockMapDifferentialDownloader(n, this.httpExecutor, o).download();
    } catch (o) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${o.stack || o}`), process.platform === "win32";
    }
    return !1;
  }
}
or.NsisUpdater = Zv;
(function(e) {
  var t = Ie && Ie.__createBinding || (Object.create ? function(T, A, b, I) {
    I === void 0 && (I = b);
    var k = Object.getOwnPropertyDescriptor(A, b);
    (!k || ("get" in k ? !A.__esModule : k.writable || k.configurable)) && (k = { enumerable: !0, get: function() {
      return A[b];
    } }), Object.defineProperty(T, I, k);
  } : function(T, A, b, I) {
    I === void 0 && (I = b), T[I] = A[b];
  }), n = Ie && Ie.__exportStar || function(T, A) {
    for (var b in T) b !== "default" && !Object.prototype.hasOwnProperty.call(A, b) && t(A, T, b);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const r = Nt, i = ne;
  var o = Xt;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return o.BaseUpdater;
  } });
  var s = Ct;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return s.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return s.NoOpLogger;
  } });
  var a = de;
  Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
    return a.Provider;
  } });
  var c = er;
  Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
    return c.AppImageUpdater;
  } });
  var h = tr;
  Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
    return h.DebUpdater;
  } });
  var l = nr;
  Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
    return l.PacmanUpdater;
  } });
  var f = rr;
  Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
    return f.RpmUpdater;
  } });
  var p = ir;
  Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
    return p.MacUpdater;
  } });
  var g = or;
  Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
    return g.NsisUpdater;
  } }), n(Dt, e);
  let w;
  function y() {
    if (process.platform === "win32")
      w = new or.NsisUpdater();
    else if (process.platform === "darwin")
      w = new ir.MacUpdater();
    else {
      w = new er.AppImageUpdater();
      try {
        const T = i.join(process.resourcesPath, "package-type");
        if (!(0, r.existsSync)(T))
          return w;
        switch ((0, r.readFileSync)(T).toString().trim()) {
          case "deb":
            w = new tr.DebUpdater();
            break;
          case "rpm":
            w = new rr.RpmUpdater();
            break;
          case "pacman":
            w = new nr.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (T) {
        console.warn("Unable to detect 'package-type' for autoUpdater (rpm/deb/pacman support). If you'd like to expand support, please consider contributing to electron-builder", T.message);
      }
    }
    return w;
  }
  Object.defineProperty(e, "autoUpdater", {
    enumerable: !0,
    get: () => w || y()
  });
})(Wl);
class eT {
  _settings = null;
  _state = null;
  writeQueue = Promise.resolve();
  get settingsPath() {
    return $e.join(Xe.getPath("userData"), "settings.json");
  }
  get statePath() {
    return $e.join(Xe.getPath("userData"), "state.json");
  }
  get settings() {
    return this._settings || (this._settings = this.loadSettings()), this._settings;
  }
  get state() {
    return this._state || (this._state = this.loadState()), this._state;
  }
  loadSettings() {
    const t = {
      downloadPath: $e.join(_d.homedir(), "Downloads"),
      downloadLimit: 0,
      uploadLimit: 0,
      startOnBoot: !1,
      mediaPlayerPath: "",
      rssFeeds: [],
      rssRules: []
    };
    try {
      if (rt.existsSync(this.settingsPath)) {
        const n = JSON.parse(rt.readFileSync(this.settingsPath, "utf-8"));
        return { ...t, ...n };
      }
    } catch (n) {
      console.error("Failed to load settings:", n);
    }
    return t;
  }
  loadState() {
    const t = {
      activeTorrents: [],
      pausedTorrents: [],
      skippedFiles: {},
      torrentPaths: {},
      processedRssLinks: [],
      completedTorrents: []
    };
    try {
      if (rt.existsSync(this.statePath)) {
        const n = JSON.parse(rt.readFileSync(this.statePath, "utf-8"));
        return { ...t, ...n };
      }
    } catch (n) {
      console.error("Failed to load state:", n);
    }
    return t;
  }
  saveSettings(t) {
    this._settings = { ...this.settings, ...t }, this._settings.rssFeeds || (this._settings.rssFeeds = []), this._settings.rssRules || (this._settings.rssRules = []);
    const n = JSON.stringify(this._settings, null, 2), r = this.settingsPath + ".tmp";
    this.writeQueue = this.writeQueue.then(() => rt.promises.writeFile(r, n, "utf-8").then(() => rt.promises.rename(r, this.settingsPath)).catch((i) => console.error("Failed to save settings:", i)));
  }
  saveState(t, n, r = {}, i = {}, o = [], s = []) {
    this._state = { activeTorrents: t, pausedTorrents: n, skippedFiles: r, torrentPaths: i, processedRssLinks: o, completedTorrents: s };
    const a = JSON.stringify(this._state, null, 2), c = this.statePath + ".tmp";
    this.writeQueue = this.writeQueue.then(() => rt.promises.writeFile(c, a, "utf-8").then(() => rt.promises.rename(c, this.statePath)).catch((h) => console.error("Failed to save state:", h)));
  }
}
const L = new eT(), hf = $e.dirname(yd(import.meta.url));
process.env.APP_ROOT = $e.join(hf, "..");
const Gn = process.env.VITE_DEV_SERVER_URL, TT = $e.join(process.env.APP_ROOT, "dist-electron"), pf = $e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Gn ? $e.join(process.env.APP_ROOT, "public") : pf;
let ae, yn = null, kl = "";
const V = new wd({
  maxConns: 200,
  // Safely balanced to prevent EMFILE (max file descriptor) crashes on macOS while retaining high performance
  dht: !0,
  utp: !0,
  lsd: !0,
  webSeeds: !0,
  tracker: {
    announce: [
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://open.tracker.cl:1337/announce",
      "udp://tracker.openbittorrent.com:6969/announce",
      "udp://exodus.desync.com:6969/announce",
      "udp://tracker.torrent.eu.org:451/announce",
      "udp://open.stealth.si:80/announce",
      "udp://tracker.dler.org:6969/announce",
      "udp://tracker.moeking.me:6969/announce",
      "udp://explodie.org:6969/announce",
      "udp://tracker.altrosky.nl:6969/announce",
      "wss://tracker.openwebtorrent.com",
      "wss://tracker.btorrent.xyz",
      "wss://tracker.fastcast.nz"
    ]
  }
});
L.settings.downloadLimit > 0 && typeof V.throttleDownload == "function" && V.throttleDownload(L.settings.downloadLimit);
L.settings.uploadLimit > 0 && typeof V.throttleUpload == "function" && V.throttleUpload(L.settings.uploadLimit);
const dt = /* @__PURE__ */ new Map();
let it = null;
V.on("torrent", (e) => {
  e.on("done", () => {
    e.infoHash && (L.state.completedTorrents || (L.state.completedTorrents = []), L.state.completedTorrents.includes(e.infoHash) || (L.state.completedTorrents.push(e.infoHash), ot()));
  });
});
function ot() {
  const e = V.torrents.map((r) => r.infoHash && dt.has(r.infoHash) ? dt.get(r.infoHash) : r.magnetURI ? r.magnetURI : r.infoHash ? `magnet:?xt=urn:btih:${r.infoHash}` : null).filter(Boolean), t = V.torrents.filter((r) => r.paused && r.infoHash).map((r) => r.infoHash), n = {};
  V.torrents.forEach((r) => {
    r.infoHash && r.path && (n[r.infoHash] = r.path);
  }), L.saveState(e, t, L.state.skippedFiles || {}, n, L.state.processedRssLinks || [], L.state.completedTorrents || []);
}
function Ml() {
  yn || (yn = setInterval(() => {
    try {
      const e = jl.readText().trim();
      e.startsWith("magnet:?") && e !== kl && (kl = e, ae?.webContents.send("clipboard-magnet-detected", e));
    } catch {
    }
  }, 2e3));
}
function mf() {
  yn && (clearInterval(yn), yn = null);
}
function gf() {
  ae = new Bl({
    width: 1e3,
    height: 700,
    titleBarStyle: "hiddenInset",
    icon: $e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: $e.join(hf, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), Gn && ae.webContents.on("console-message", (e, t, n, r, i) => {
    console.log(`[Renderer] ${n} (at ${i}:${r})`);
  }), ae.webContents.on("did-finish-load", () => {
    ae?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), ae.on("closed", () => {
    ae = null;
  }), Gn ? ae.loadURL(Gn) : ae.loadFile($e.join(pf, "index.html"));
}
Xe.on("window-all-closed", () => {
  if (mf(), process.platform !== "darwin") {
    if (it)
      try {
        it.close();
      } catch {
      }
    V.destroy(() => {
      Xe.quit();
    }), ae = null;
  }
});
Xe.on("open-url", async (e, t) => {
  if (e.preventDefault(), t.startsWith("magnet:"))
    try {
      const n = t.match(/btih:([a-fA-F0-9]{40})/i) || t.match(/btih:([A-Z2-7]{32})/i), r = n ? n[1].toLowerCase() : null;
      if (!(r ? await V.get(r) : null)) {
        const o = V.add(t, { path: L.settings.downloadPath });
        o.on("infoHash", () => {
          dt.set(o.infoHash, t), ot();
        }), o.on("error", (s) => {
          console.error("Protocol handler torrent error:", s);
        });
      }
    } catch (n) {
      console.error("Failed to add magnet from protocol handler:", n);
    }
});
Xe.on("second-instance", async (e, t) => {
  const n = t.find((r) => r.startsWith("magnet:"));
  if (n)
    try {
      const r = n.match(/btih:([a-fA-F0-9]{40})/i) || n.match(/btih:([A-Z2-7]{32})/i), i = r ? r[1].toLowerCase() : null;
      if (!(i ? await V.get(i) : null)) {
        const s = V.add(n, { path: L.settings.downloadPath });
        s.on("infoHash", () => {
          dt.set(s.infoHash, n), ot();
        }), s.on("error", (a) => {
          console.error("Second instance torrent error:", a);
        });
      }
    } catch (r) {
      console.error("Failed to add magnet from protocol handler:", r);
    }
  ae && (ae.isMinimized() && ae.restore(), ae.focus());
});
Xe.on("activate", () => {
  Bl.getAllWindows().length === 0 && gf();
});
Xe.whenReady().then(() => {
  Wl.autoUpdater.checkForUpdatesAndNotify(), gf();
  const e = [
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...process.platform === "darwin" ? [
          { type: "separator" },
          { role: "front" },
          { type: "separator" },
          { role: "window" }
        ] : [
          { role: "close" }
        ]
      ]
    }
  ];
  process.platform === "darwin" && e.unshift({
    label: Xe.name,
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" }
    ]
  });
  const t = Ms.buildFromTemplate(e);
  Ms.setApplicationMenu(t), Gn && setInterval(() => {
    console.log(`[Status] Active torrents: ${V.torrents.length}`), V.torrents.forEach((i) => {
      console.log(`[Status] Torrent ${i.name}: progress=${i.progress}, downSpeed=${i.downloadSpeed}, upSpeed=${i.uploadSpeed}, peers=${i.numPeers}`);
    });
  }, 5e3), process.defaultApp ? process.argv.length >= 2 && Xe.setAsDefaultProtocolClient("magnet", process.execPath, [$e.resolve(process.argv[1])]) : Xe.setAsDefaultProtocolClient("magnet"), Ml();
  const n = L.state.torrentPaths || {}, r = [];
  L.state.activeTorrents && L.state.activeTorrents.length > 0 && L.state.activeTorrents.forEach((i) => {
    try {
      console.log(`Restoring torrent: ${i}`);
      const o = i.match(/btih:([a-fA-F0-9]{40})/i)?.[1]?.toLowerCase(), s = o && n[o] || L.settings.downloadPath, a = V.add(i, { path: s });
      a.on("ready", () => {
        const c = L.state.skippedFiles || {};
        c[a.infoHash] && c[a.infoHash].forEach((h) => {
          a.files[h] && a.files[h].deselect();
        }), a.infoHash && L.state.pausedTorrents?.includes(a.infoHash) && (a.pause(), a.wires && a.wires.forEach((h) => h.destroy()));
      }), a.on("infoHash", () => {
        dt.set(a.infoHash, i), ot();
      }), a.on("error", (c) => {
        console.error("Restored torrent error:", c), r.push(i);
      });
    } catch (o) {
      console.error("Failed to restore torrent:", o), r.push(i);
    }
  }), r.length > 0 && setTimeout(() => {
    const i = L.state.activeTorrents || [], o = i.filter((s) => !r.includes(s));
    o.length !== i.length && L.saveState(o, L.state.pausedTorrents || [], L.state.skippedFiles || {}, L.state.torrentPaths || {}, L.state.processedRssLinks || [], L.state.completedTorrents || []);
  }, 1e4), te.handle("add-torrent", async (i, o) => {
    try {
      let s = o;
      if (typeof o == "string" && o.startsWith("magnet:")) {
        const c = o.match(/btih:([a-fA-F0-9]{40})/i) || o.match(/btih:([A-Z2-7]{32})/i);
        c && (s = c[1].toLowerCase());
      }
      const a = await V.get(s);
      return a ? { infoHash: a.infoHash } : new Promise((c, h) => {
        let l;
        try {
          console.log(`Adding torrent: ${o}`), l = V.add(o, { path: L.settings.downloadPath });
        } catch (p) {
          return console.error("Failed to add torrent:", p), h(p.message || String(p));
        }
        let f = !1;
        l.on("infoHash", () => {
          console.log(`Torrent infoHash ready: ${l.infoHash}`), (o.startsWith("magnet:") || o.startsWith("http")) && dt.set(l.infoHash, o), f || (f = !0, ot(), c({ infoHash: l.infoHash }));
        }), l.on("metadata", () => {
          console.log(`Torrent metadata ready: ${l.name}`);
        }), l.on("error", (p) => {
          console.error("Torrent error:", p), f || (f = !0, h(p.message));
        }), l.infoHash && !f && (console.log(`Torrent already has infoHash: ${l.infoHash}`), f = !0, (o.startsWith("magnet:") || o.startsWith("http")) && dt.set(l.infoHash, o), ot(), c({ infoHash: l.infoHash }));
      });
    } catch (s) {
      throw console.error("Error adding torrent:", s), s;
    }
  }), te.handle("get-torrents-status", (i, o) => V.torrents.map((s) => ({
    infoHash: s.infoHash,
    name: s.name || "Fetching metadata...",
    progress: s.progress || 0,
    downloadSpeed: s.downloadSpeed || 0,
    uploadSpeed: s.uploadSpeed || 0,
    numPeers: s.numPeers || 0,
    timeRemaining: s.timeRemaining || 0,
    paused: !!s.paused,
    done: !!s.done || !!(L.state.completedTorrents && L.state.completedTorrents.includes(s.infoHash)),
    path: s.path,
    magnetURI: s.magnetURI,
    uploaded: s.uploaded || 0,
    downloaded: s.downloaded || 0,
    ratio: s.ratio || 0,
    length: s.length || 0,
    announce: s.announce || [],
    created: s.created || null,
    createdBy: s.createdBy || "",
    comment: s.comment || "",
    files: s.infoHash === o ? (s.files || []).map((a, c) => {
      const h = [];
      if (s.bitfield && s.pieceLength) {
        const l = Math.floor(a.offset / s.pieceLength), f = Math.floor((a.offset + a.length - 1) / s.pieceLength), p = f - l + 1;
        if (p > 0) {
          const w = Math.ceil(p / 100);
          for (let y = 0; y < 100; y++) {
            const T = l + y * w;
            if (T > f) break;
            const A = Math.min(f, T + w - 1);
            let b = 0, I = 0;
            for (let k = T; k <= A; k++)
              s.bitfield.get(k) && b++, I++;
            h.push(I > 0 ? b / I : 0);
          }
        }
      }
      return {
        name: a.name,
        path: a.path,
        length: a.length,
        downloaded: a.downloaded,
        progress: a.progress,
        skipped: L.state.skippedFiles?.[s.infoHash]?.includes(c) || !1,
        pieceMap: h
      };
    }) : []
  }))), te.handle("remove-torrent", async (i, o) => {
    L.state.completedTorrents && (L.state.completedTorrents = L.state.completedTorrents.filter((s) => s !== o)), V.remove(o, {}, () => {
      const s = L.state.skippedFiles || {};
      delete s[o];
      const a = L.state.torrentPaths || {};
      delete a[o], dt.delete(o), ot();
    });
  }), te.handle("pause-torrent", async (i, o) => {
    try {
      const s = await V.get(o);
      s && !s.paused && (s.pause(), s.wires && s.wires.forEach((a) => a.destroy()), ot());
    } catch (s) {
      console.error("Failed to pause torrent:", s);
    }
  }), te.handle("resume-torrent", async (i, o) => {
    try {
      const s = await V.get(o);
      s && s.paused && (s.resume(), ot());
    } catch (s) {
      console.error("Failed to resume torrent:", s);
    }
  }), te.handle("open-folder", (i, o) => {
    const s = o ? $e.resolve(o) : "", a = [
      $e.resolve(L.settings.downloadPath),
      ...Object.values(L.state.torrentPaths || {}).map((h) => $e.resolve(h))
    ];
    if (!(s && a.some((h) => s.startsWith(h)))) {
      tn.showErrorBox("Security Error", "Cannot open folder outside of download directories.");
      return;
    }
    if (rt.existsSync(s))
      Bs.showItemInFolder(s);
    else {
      const h = $e.dirname(s);
      rt.existsSync(h) ? Bs.showItemInFolder(h) : tn.showErrorBox("File Not Found", "The file has not been downloaded yet.");
    }
  }), te.handle("get-settings", () => L.settings), te.handle("save-settings", (i, o) => {
    const s = {};
    typeof o.downloadPath == "string" && (s.downloadPath = o.downloadPath), typeof o.downloadLimit == "number" && (s.downloadLimit = o.downloadLimit), typeof o.uploadLimit == "number" && (s.uploadLimit = o.uploadLimit), typeof o.startOnBoot == "boolean" && (s.startOnBoot = o.startOnBoot), typeof o.mediaPlayerPath == "string" && (s.mediaPlayerPath = o.mediaPlayerPath), Array.isArray(o.rssFeeds) && (s.rssFeeds = o.rssFeeds), Array.isArray(o.rssRules) && (s.rssRules = o.rssRules), L.saveSettings(s);
    const a = s.downloadLimit > 0 ? s.downloadLimit : 0, c = s.uploadLimit > 0 ? s.uploadLimit : 0;
    return typeof V.throttleDownload == "function" && V.throttleDownload(a), typeof V.throttleUpload == "function" && V.throttleUpload(c), _s(), L.settings;
  }), te.handle("show-confirm-dialog", async (i, o, s) => {
    if (!ae) return !1;
    const { response: a } = await tn.showMessageBox(ae, {
      type: "question",
      buttons: ["Cancel", "Yes"],
      defaultId: 1,
      cancelId: 0,
      title: o,
      message: s
    });
    return a === 1;
  }), te.handle("select-folder", async () => {
    if (!ae) return null;
    const i = await tn.showOpenDialog(ae, {
      properties: ["openDirectory"]
    });
    return !i.canceled && i.filePaths.length > 0 ? i.filePaths[0] : null;
  }), te.handle("toggle-devtools", () => {
    ae?.webContents.toggleDevTools();
  }), te.handle("set-clipboard-watch", (i, o) => (o ? Ml() : mf(), o)), te.handle("get-clipboard-watch", () => !!yn), te.handle("start-stream", async (i, o, s) => {
    const a = await V.get(o);
    if (!a) throw new Error("Torrent not found");
    it || (it = V.createServer(), await new Promise((l) => {
      it.listen(0, () => {
        l();
      });
    }));
    const c = a.files[s];
    if (!c) throw new Error("File not found");
    return `http://localhost:${it.address().port}${c.streamURL}`;
  }), te.handle("play-external", async (i, o, s) => {
    try {
      const a = await (async () => {
        const h = await V.get(o);
        if (!h || !h.files[s]) throw new Error("Torrent or file not found");
        return it || (it = V.createServer(), await new Promise((l) => {
          it.listen(0, () => {
            l();
          });
        })), `http://localhost:${it.address().port}${h.files[s].streamURL}`;
      })();
      let c = L.settings.mediaPlayerPath;
      if (!c) {
        if (process.platform === "darwin")
          return new Promise((l, f) => {
            Ed("open", ["-a", "VLC", a], (p) => {
              p ? (console.error("Failed to open VLC natively:", p), f(new Error("VLC is not installed or failed to launch. Please select a media player in Settings."))) : l(!0);
            });
          });
        if (!ae) throw new Error("No window available to prompt for player");
        const h = await tn.showOpenDialog(ae, {
          title: "Select Media Player (e.g. VLC)",
          properties: ["openFile"],
          filters: [{ name: "Applications", extensions: ["app", "exe"] }]
        });
        if (!h.canceled && h.filePaths.length > 0)
          c = h.filePaths[0], L.saveSettings({ mediaPlayerPath: c });
        else
          return !1;
      }
      return new Promise((h, l) => {
        const { execFile: f } = require("child_process");
        process.platform === "darwin" ? f("open", ["-a", c, a], (p) => {
          p ? (console.error("Failed to open external app:", p), f("open", [a], (g) => {
            g ? l(p) : h(!0);
          })) : h(!0);
        }) : f(c, [a], (p) => {
          p ? l(p) : h(!0);
        });
      });
    } catch (a) {
      throw console.error("Error launching external player:", a), a;
    }
  }), te.handle("copy-to-clipboard", (i, o) => {
    jl.writeText(o);
  }), te.handle("clear-media-player", () => {
    L.saveSettings({ mediaPlayerPath: "" });
  }), te.handle("stop-stream", async (i, o) => {
  }), te.handle("prioritize-file", async (i, o, s) => {
    try {
      console.log(`Prioritizing file ${s} for torrent ${o}`);
      const a = await V.get(o);
      if (a && a.files[s]) {
        console.log("File found, selecting..."), a.files[s].select();
        const c = L.state.skippedFiles || {};
        c[o] && (c[o] = c[o].filter((h) => h !== s), c[o].length === 0 && delete c[o], L.saveState(L.state.activeTorrents, L.state.pausedTorrents, c, L.state.torrentPaths || {}, L.state.processedRssLinks || [])), console.log("Removed from skippedFiles");
      } else
        console.log("Torrent or file not found!");
    } catch (a) {
      console.error("Failed to prioritize file:", a);
    }
  }), te.handle("skip-file", async (i, o, s) => {
    try {
      console.log(`Skipping file ${s} for torrent ${o}`);
      const a = await V.get(o);
      if (a && a.files[s]) {
        console.log("File found, deselecting..."), a.files[s].deselect();
        const c = L.state.skippedFiles || {};
        c[o] || (c[o] = []), c[o].includes(s) || c[o].push(s), L.saveState(L.state.activeTorrents, L.state.pausedTorrents, c, L.state.torrentPaths || {}, L.state.processedRssLinks || []), console.log("Added to skippedFiles");
      } else
        console.log("Torrent or file not found!");
    } catch (a) {
      console.error("Failed to skip file:", a);
    }
  }), te.handle("open-torrent-dialog", async () => {
    if (!ae) return null;
    const i = await tn.showOpenDialog(ae, {
      title: "Select .torrent file",
      properties: ["openFile"],
      filters: [{ name: "Torrents", extensions: ["torrent"] }]
    });
    return !i.canceled && i.filePaths.length > 0 ? i.filePaths[0] : null;
  }), te.handle("set-sequential", async (i, o, s) => {
    try {
      await V.get(o) && console.log(`Sequential downloading set to ${s} for ${o}`);
    } catch (a) {
      console.error("Failed to set sequential:", a);
    }
  }), te.handle("search-torrents", async (i, o) => {
    try {
      const s = await fetch(`https://apibay.org/q.php?q=${encodeURIComponent(o)}`);
      if (!s.ok) throw new Error(`HTTP ${s.status}`);
      const a = await s.json();
      if (a.length === 1 && a[0].id === "0") return [];
      const h = [
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://open.tracker.cl:1337/announce",
        "udp://tracker.openbittorrent.com:6969/announce",
        "udp://exodus.desync.com:6969/announce",
        "udp://tracker.torrent.eu.org:451/announce",
        "wss://tracker.openwebtorrent.com",
        "wss://tracker.btorrent.xyz",
        "wss://tracker.fastcast.nz"
      ].map((l) => `&tr=${encodeURIComponent(l)}`).join("");
      return a.filter((l) => l.info_hash && l.info_hash !== "0000000000000000000000000000000000000000").map((l) => ({
        name: l.name,
        infoHash: l.info_hash,
        seeders: parseInt(l.seeders),
        leechers: parseInt(l.leechers),
        size: parseInt(l.size),
        magnet: `magnet:?xt=urn:btih:${l.info_hash}&dn=${encodeURIComponent(l.name)}${h}`
      }));
    } catch (s) {
      return console.error("Search failed:", s), { error: s.message };
    }
  }), te.handle("fetch-rss", async (i, o) => {
    try {
      const s = await fetch(o);
      if (!s.ok) throw new Error(`HTTP ${s.status}`);
      return await s.text();
    } catch (s) {
      return console.error("RSS fetch failed:", s), { error: s.message };
    }
  });
});
async function _s() {
  const { rssFeeds: e, rssRules: t } = L.settings;
  if (!e || !e.length || !t || !t.length) return;
  console.log("[RSS] Checking feeds for auto-download...");
  const n = L.state.processedRssLinks || [];
  let r = !1;
  for (const i of e)
    try {
      const o = new AbortController(), s = setTimeout(() => o.abort(), 15e3), a = await fetch(i, { signal: o.signal });
      if (clearTimeout(s), !a.ok) continue;
      const c = await a.text(), h = /<item>([\s\S]*?)<\/item>/gi;
      let l;
      for (; (l = h.exec(c)) !== null; ) {
        const f = l[1], p = f.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || f.match(/<title>(.*?)<\/title>/), g = f.match(/<link>(.*?)<\/link>/) || f.match(/<enclosure[^>]+url="([^"]+)"/);
        if (p && g) {
          const w = p[1], y = g[1];
          for (const T of t)
            try {
              if (new RegExp(T, "i").test(w)) {
                if (!n.includes(y)) {
                  let b = y;
                  if (y.startsWith("magnet:")) {
                    const k = y.match(/btih:([a-fA-F0-9]{40})/i);
                    k && (b = k[1].toLowerCase());
                  }
                  if (!await V.get(b)) {
                    console.log(`[RSS] Auto-adding ${w} (matched rule: ${T})`);
                    const k = V.add(y, { path: L.settings.downloadPath });
                    k.on("infoHash", () => {
                      dt.set(k.infoHash, y), ot();
                    });
                  }
                  n.push(y), r = !0;
                }
                break;
              }
            } catch (A) {
              console.error(`[RSS] Invalid regex rule: ${T}`, A);
            }
        }
      }
    } catch (o) {
      console.error(`[RSS] Failed to check feed ${i}:`, o);
    }
  r && L.saveState(L.state.activeTorrents, L.state.pausedTorrents, L.state.skippedFiles || {}, L.state.torrentPaths || {}, n);
}
setInterval(_s, 15 * 60 * 1e3);
setTimeout(_s, 5e3);
export {
  TT as MAIN_DIST,
  pf as RENDERER_DIST,
  Gn as VITE_DEV_SERVER_URL
};
