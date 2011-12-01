function each() {
	var __ = Array.prototype.forEach;
	if (__) {
		each = function(ar, f) {
			return __.call(ar, f);
		};
	}
	else {
		each = function(ar, f) {
			var i;
			for (i = 0; i < ar.length; i++) {
				f(ar[i], i, ar);
			}
		};
	}
	return each.apply(this, arguments);
}
