function each(ar, f) {
	var i;
	for (i = 0; i < ar.length; i++) {
		f(ar[i], i);
	}
}
