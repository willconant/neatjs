function map() {
	var __ = Array.prototype.map;
	if (__) {
		map = function(ar, f) {
			return __.call(ar, f);
		};
	}
	else {
		map = function(ar, f) {
			var i, r = [];
			for (i = 0; i < ar.length; i++) {
				r[i] = f(ar[i], i, ar);
			}
			return r;
		};
	}
	return map.apply(this, arguments);
}
