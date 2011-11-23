function keys() {
	if (Object.keys) {
		keys = Object.keys;
	}
	else {
		keys = function(o) {
			var r = [], k;
			for (k in o) {
				if (o.hasOwnProperty(k)) {
					r.push(k);
				}
			}
			return r;
		};
	}
	return keys.apply(this, arguments);
}
