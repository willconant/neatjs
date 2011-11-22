function trycatch(fn, next) {
	try {
		next(null, fn());
	}
	catch (err) {
		next(err);
	}
}
