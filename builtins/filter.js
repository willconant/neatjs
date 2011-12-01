function filter() {
	var __ = Array.prototype.filter;
	if (__) {
		filter = function(ar, f) {
			return __.call(ar, f);
		};
	}
	else {
		filter = function(ar, f) {
			var i, j = 0, r = [];
			for (i = 0; i < ar.length; i++) {
				if (f(ar[i], i, ar)) {
					r[j++] = ar[i];
				}
			}
			return r;
		};
	}
	return filter.apply(this, arguments);
}
