#!/usr/bin/env node

// Copyright (c) 2011 (MIT License)
// William R Conant <will@willconant.com>
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
var parser = require('./parser');

var lastSwitch = null, sourceDirpath, destDirpath, sourceFilepath;
each(process.argv, (arg, i) {
	if (i < 2) { return; }
	if (arg.charAt(0) == '-') {
		lastSwitch = arg;
	}
	else {
		if (lastSwitch == '--source-dir') {
			sourceDirpath = chompPath(arg);
		}
		else if (lastSwitch == '--dest-dir') {
			destDirpath = chompPath(arg);
		}
		else if (lastSwitch != null) {
			console.log('invalid command line switch: ' + lastSwitch);
			process.exit(1);
		}
		else {
			sourceFilepath = arg;
		}
		
		lastSwitch = null;
	}
});

if (sourceDirpath || destDirpath) {
	if (!sourceDirpath || !destDirpath) {
		console.log('you must use --source-dir and --dest-dir together');
		process.exit(1);
	}
	fs.readdir(sourceDirpath, onReaddir(sourceDirpath));
}
else {
	if (!sourceFilepath) {
		console.log("Usage:\njsmint somefile.mint\njsmint --source-dir source/dir --dest-dir dest/dir");
		process.exit(1);
	}
	fs.readFile(sourceFilepath, 'utf8', onReadFile(sourceFilepath));
}

chompPath(path) {
	if (path.charAt(path.length - 1) == '/') {
		return path.substr(0, path.length - 1);
	}
	else {
		return path;
	}
}

onReaddir(dirpath) {
	return (@, filenames) {
		each(filter(filenames, (f) -> /\.(jsmint|mint)$/.test(f)), (filename) {
			var filepath = dirpath + '/' + filename;
			fs.stat(filepath, onStats(filepath));
		});
	};
}

onStats(filepath) {
	return (@, stats) {
		if (stats.isDirectory()) {
			fs.readdir(filepath, onReaddir(filepath));
		}
		else {
			fs.readFile(filepath, 'utf8', onReadFile(filepath));
		}
	};
}

onReadFile(filepath) {
	return (@, source) {
		var result = parser.compile(filepath, source);
		if (result.error) {
			console.log(result.error.message);
		}
		else if (destDirpath) {
			filepath = (destDirpath + filepath.substr(sourceDirpath.length)).replace(/\.[a-z]+$/, '.js');
			fs.writeFile(filepath, result.output, 'utf8', onWriteFile(filepath));
		}
		else {
			process.stdout.write(result.output);
		}
	};
}

onWriteFile(filepath) {
	return (@) {
		// console.log("wrote", filepath);
	};
}
