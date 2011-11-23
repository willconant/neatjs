exports.undef = "\nfunction undef(x) {\n\treturn typeof x === 'undefined';\n}\n";

exports.trycatch = "\nfunction trycatch(fn, next) {\n\ttry {\n\t\tnext(null, fn());\n\t}\n\tcatch (err) {\n\t\tnext(err);\n\t}\n}\n";

exports.extend = "\nfunction extend(super, methods) {\n\tfunction ctor(){}\n\tctor.prototype = super;\n\tvar proto = new ctor(), k;\n\tif (methods) {\n\t\tfor (k in methods) {\n\t\t\tif (methods.hasOwnProperty(k)) {\n\t\t\t\tproto[k] = methods[k];\n\t\t\t}\n\t\t}\n\t}\n\treturn proto;\n}\n";

exports.nothing = "\nfunction nothing(x) {\n\treturn x === null || typeof x === 'undefined';\n}\n";

exports.each = "\nfunction each() {\n\tvar __ = Array.prototype.forEach;\n\tif (__) {\n\t\teach = function(ar, f) {\n\t\t\t__.call(ar, f);\n\t\t};\n\t}\n\telse {\n\t\teach = function(ar, f) {\n\t\t\tvar i;\n\t\t\tfor (i = 0; i < ar.length; i++) {\n\t\t\t\tf(ar[i], i, ar);\n\t\t\t}\n\t\t};\n\t}\n\treturn each.apply(this, arguments);\n}\n";

exports.filter = "\nfunction filter() {\n\tvar __ = Array.prototype.filter;\n\tif (__) {\n\t\tfilter = function(ar, f) {\n\t\t\t__.call(ar, f);\n\t\t};\n\t}\n\telse {\n\t\tfilter = function(ar, f) {\n\t\t\tvar i, j = 0, r = [];\n\t\t\tfor (i = 0; i < ar.length; i++) {\n\t\t\t\tif (f(ar[i], i, ar)) {\n\t\t\t\t\tr[j++] = ar[i];\n\t\t\t\t}\n\t\t\t}\n\t\t\treturn r;\n\t\t};\n\t}\n\treturn filter.apply(this, arguments);\n}\n";

exports.once = "\nfunction once(f) {\n\tvar called = false;\n\treturn function() {\n\t\tif (!called) {\n\t\t\tcalled = true;\n\t\t\treturn f.apply(this, arguments);\n\t\t}\n\t};\n}\n";

exports.map = "\nfunction map() {\n\tvar __ = Array.prototype.map;\n\tif (__) {\n\t\tmap = function(ar, f) {\n\t\t\t__.call(ar, f);\n\t\t};\n\t}\n\telse {\n\t\tmap = function(ar, f) {\n\t\t\tvar i, r = [];\n\t\t\tfor (i = 0; i < ar.length; i++) {\n\t\t\t\tr[i] = f(ar[i], i, ar);\n\t\t\t}\n\t\t\treturn r;\n\t\t};\n\t}\n\treturn map.apply(this, arguments);\n}\n";

exports.keys = "\nfunction keys() {\n\tif (Object.keys) {\n\t\tkeys = Object.keys;\n\t}\n\telse {\n\t\tkeys = function(o) {\n\t\t\tvar r = [], k;\n\t\t\tfor (k in o) {\n\t\t\t\tif (o.hasOwnProperty(k)) {\n\t\t\t\t\tr.push(k);\n\t\t\t\t}\n\t\t\t}\n\t\t\treturn r;\n\t\t};\n\t}\n\treturn keys.apply(this, arguments);\n}\n";

