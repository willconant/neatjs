var fs = require('fs');
var compile = require('./compiler').compile;

require.extensions['.neat'] = function(module, filename) {
	var source = fs.readFileSync(filename, 'utf8');
	var result = compile(filename, source);
	if (result.ok) {
		module._compile(result.output, filename);
	}
	else {
		throw result.error;
	}
};

exports.compile = compile;
