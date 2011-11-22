function filter(ar, f) {
	var i, j = 0, r = [];
	for (i = 0; i < ar.length; i++) {
		if (f(ar[i], i)) {
			r[j++] = ar[i];
		}
	}
	return r;
}
