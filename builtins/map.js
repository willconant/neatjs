function map(ar, f) {
	var i, r = [];
	for (i = 0; i < ar.length; i++) {
		r[i] = f(ar[i], i);
	}
	return r;
}
