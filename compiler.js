// Copyright (c) 2011 (MIT License)
// Will Conant <will.conant@gmail.com>
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var fs = require('fs');
var Parser = require('./parser');

function compile(filename, text) {
	var program;
	try {
		program = (new Parser(filename, text)).parse();
	}
	catch (err) {
		return {error: err};
	}
	return {ok: true, output: program.render()};
};

exports.compile = compile;

exports.compileDir = function(sourceDirpath, destDirpath, _next) {
	sourceDirPath = chompPath(sourceDirPath);
	destDirPath = chompPath(destDirPath);

	var next = function() {
		if (_next) {
			_next.apply(this, arguments);
			_next = null;
		}
	};
	
	var errors = [];
	var waiting = 0;
	
	fs.readdir(sourceDirpath, onReaddir(sourceDirpath));
	
	function check() {
		waiting -= 1;
		if (waiting === 0) {
			if (errors.length > 0) {
				next(new Error(errors.sort().join("\n")));
			}
			else {
				next();
			}
		}
	}
	
	function onReaddir(dirpath) {
		waiting += 1;
		return function(err, filenames) {
			if (err) { next(err); return; }
			filenames.each(function(filename) {
				var filepath = dirpath + '/' + filename;
				fs.stat(filepath, onStats(filepath));
			});
			check();
		};
	}
	
	function onStats(filepath) {
		waiting += 1;
		return function(err, stats) {
			if (err) { next(err); return; }
			if (stats.isDirectory()) {
				fs.readdir(filepath, onReaddir(filepath));
			}
			else if (/\.neat$/.test(filepath)) {
				fs.readFile(filepath, 'utf8', onReadFile(filepath));
			}
			check();
		};
	}
	
	function onReadFile(filepath) {
		waiting += 1;
		return function(err, source) {
			if (err) { next(err); return; }
			var result = compile(filepath, source);
			if (result.error) {
				errors.push(result.error.message);
			}
			else {
				filepath = (destDirpath + filepath.substr(sourceDirpath.length)).replace(/\.neat$/, '.js');
				fs.writeFile(filepath, result.output, 'utf8', onWriteFile(filepath));
			}
			check();
		};
	}
	
	function onWriteFile(filepath) {
		waiting += 1;
		return function(err) {
			if (err) { next(err); return; }
			check();
		};
	}
};

function chompPath(path) {
	if (path.charAt(path.length - 1) === '/') {
		return path.substr(0, path.length - 1);
	}
	else {
		return path;
	}
}

