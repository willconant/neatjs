function extend(super, methods) {
	function ctor(){}
	ctor.prototype = super;
	var proto = new ctor(), k;
	if (methods) {
		for (k in methods) {
			if (methods.hasOwnProperty(k)) {
				proto[k] = methods[k];
			}
		}
	}
	return proto;
}
