function once(f) {
	var called = false;
	return function() {
		if (!called) {
			called = true;
			return f.apply(this, arguments);
		}
	};
}
