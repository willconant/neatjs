function keys(o) {
	var r = [], k;
	for (k in o) {
		if (o.hasOwnProperty(k)) {
			r.push(k);
		}
	}
	return r;
}
