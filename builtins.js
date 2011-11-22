exports.undef = "\nfunction undef(x) {\n\treturn typeof x === 'undefined';\n}\n";

exports.trycatch = "\nfunction trycatch(fn, next) {\n\ttry {\n\t\tnext(null, fn());\n\t}\n\tcatch (err) {\n\t\tnext(err);\n\t}\n}\n";

exports.extend = "\nfunction extend(super, methods) {\n\tfunction ctor(){}\n\tctor.prototype = super;\n\tvar proto = new ctor(), k;\n\tif (methods) {\n\t\tfor (k in methods) {\n\t\t\tif (methods.hasOwnProperty(k)) {\n\t\t\t\tproto[k] = methods[k];\n\t\t\t}\n\t\t}\n\t}\n\treturn proto;\n}\n";

exports.each = "\nfunction each(ar, f) {\n\tvar i;\n\tfor (i = 0; i < ar.length; i++) {\n\t\tf(ar[i], i);\n\t}\n}\n";

exports.filter = "\nfunction filter(ar, f) {\n\tvar i, j = 0, r = [];\n\tfor (i = 0; i < ar.length; i++) {\n\t\tif (f(ar[i], i)) {\n\t\t\tr[j++] = ar[i];\n\t\t}\n\t}\n\treturn r;\n}\n";

exports.once = "\nfunction once(f) {\n\tvar called = false;\n\treturn function() {\n\t\tif (!called) {\n\t\t\tcalled = true;\n\t\t\treturn f.apply(this, arguments);\n\t\t}\n\t};\n}\n";

exports.map = "\nfunction map(ar, f) {\n\tvar i, r = [];\n\tfor (i = 0; i < ar.length; i++) {\n\t\tr[i] = f(ar[i], i);\n\t}\n\treturn r;\n}\n";

exports.nada = "\nfunction nada(x) {\n\treturn x === null || typeof x === 'undefined';\n}\n";

exports.keys = "\nfunction keys(o) {\n\tvar r = [], k;\n\tfor (k in o) {\n\t\tif (o.hasOwnProperty(k)) {\n\t\t\tr.push(k);\n\t\t}\n\t}\n\treturn r;\n}\n";

