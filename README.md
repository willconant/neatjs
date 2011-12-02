# NeatJS #

NeatJS is a strict dialect of JavaScript with a few carefully chosen tweaks. It compiles into standard JavaScript without dropping your comments or changing any line numbers.

The guiding principle behind the design of NeatJS is restraint. JavaScript is an adequate language with plenty of features. However, it has a few glaring irritations that are easily remedied. NeatJS attepts to remedy those problems without redesigning the entire language or changing the semmatics. At the same time, it fills the role of traditional code validators like JSHint or JSLint, making sure you don't pollute the global namespace, miss semi-colons, forget to break switch cases, etc.


## Features ##

### Improved Function Definitions ###

#### The `function` Keyword Has Been Dropped ####

This:

	add(a, b) {
		return a + b;
	}

Compiles to:
	
	function add(a, b) {
		return a + b;
	}

This:
	
	var bark = () {
		console.log("woof!");
	};

Compiles to:
	
	var bark = function () {
		console.log("woof!");
	};


#### The `this` Keyword Has Been Banned ####

Instead, you explicitly choose a name for the this-value in function declarations.

This:

	Dog(name):dog {
		dog.name = name;
	}
	
Compiles to:

	function Dog(name) { var dog = this;
		dog.name = name;
	}

This:

	Dog.prototype.careForPuppies = ():dog {
		dog.puppies.forEach((puppy) {
			// the value of dog in this context is clear
			dog.clean(puppy);
		});
	};

Compiles to:

	Dog.prototype.careForPuppies = function () { var dog = this;
		dog.puppies.forEach(function (puppy) {
			// the value of dog in this context is clear
			dog.clean(puppy);
		});
	};


#### Single Expression Functions ####

For simple functions that return a single value, there is a shorter syntax.

This:

	var adder = (a, b) -> a + b;
	
Compiles to:

	var adder = function (a, b) { return a + b; }
	
Arrow functions without a parameter list always take a single parameter named `_`.
	
This:

	var add3 = -> _ + 3;

Compiles to:

	var add3 = function (_) { return _ + 3; }


#### Better Async Error Handling ####

For asynchronous programming in environments like Node.js, there is a better syntax for error handling.

This:

	fs.readFile('filename', onReadFile);
	onReadFile(@, text) {
		console.log(text);
	}

Compiles to:

	fs.readFile('filename', onReadFile);
	function onReadFile(__err, text) { if (__err) { throw __err; }
		console.log(text);
	}
	
This:
	
	readFileOrDir(filename, callback) {
		fs.stat(filename, onStat);
		
		onStat(@callback, stats) {
			if (stats.isDirectory()) {
				fs.readdir(filename, onReaddir);
			}
			else {
				fs.readFile(filename, onReadFile);
			}
		}
		
		onReaddir(@callback, filenames) {
			callback(null, 'directory', filenames);
		}
		
		onReadFile(@callback, buffer) {
			callback(null, 'file', buffer);
		}
	}

Compiles to:

	function readFileOrDir(filename, callback) {
		fs.stat(filename, onStat);
		
		function onStat(__err, stats) { if (__err) { callback(__err); return; }
			if (stats.isDirectory()) {
				fs.readdir(filename, onReaddir);
			}
			else {
				fs.readFile(filename, onReadFile);
			}
		}
		
		function onReaddir(__err, filenames) { if (__err) { callback(__err); return; }
			callback(null, 'directory', filenames);
		}
		
		function onReadFile(__err, buffer) { if (__err) { callback(__err); return; }
			callback(null, 'file', buffer);
		}
	}


### Abbreviated Prototype Access ###

This:

	Dog::name = "Fido";

Compiles to:

	Dog.prototype.name = "Fido";

This:

	Dog:: = foo;

Compiles to:

	Dog.prototype = foo;


### Better Equality Operators ###

NeatJS transforms `==` into `===` and `!=` into `!==` for the obvious reasons.


### Trailing Commas in Array and Object Literals ###

Hooray!


### Try/Catch Simplification ###

In async environments, try/catch seldom works the way people expect. NeatJS removes the try/catch construct in favor of a simple trycatch() function that normalizes thrown errors to look like other errors in Node.js:

	trycatch(-> JSON.parse(input), onParsed);
	
	onParsed(err, json) {
		// if JSON.parse fails, err will be set
		// otherwise, err will be null, and json will contain the result of JSON.parse
	}

See below for more info on NeatJS's built-in functions.


### Variable Name Checking ###

In NeatJS, all variables and functions must be declared. This can be done in the following ways:

- with the `var` keyword
- with a function declaration
- with the `#declare` pragma
- with the `#include` pragma

The `var` keyword and function declarations work just as expected, but NeatJS is strict about where they can occur. Both may only occur at the top level of the program or at the top level of a function. You cannot declare a variable or function within a loop or branch.

The `#declare` pragma can be used at the top level of your program to specify global variables you intend to use:

	#declare process, Buffer;
	process.stdout.write(new Buffer("testing"));

The `#include` pragma can be used to statically include built-in functions. (More on this below)


### Stricter Syntax ###

Other than that, NeatJS is just JavaScript with stricter syntax rules:

- no implied semicolons
- if statements and while statements always require curly-braces
- switch cases must break or return
- bitwise operators are not allowed


### Built-in Functions ###

Some versions of JavaScript are missing a few very critical features, and not all JS environments provide a convenient module system. To remedy this, NeatJS proivdes some built-in functions and a pragma for statically including them at the end of your script. For instance:

	#include map;
	var ages = map(people, -> _.age);

In this case, NeatJS will append a `map` function to the end of your script.

You may include more than one function at a time:

	#include map, filter;
	var agesOfAdults = filter(map(people, -> _.age), -> _ >= 18);

All of NeatJS's built-in functions are also avaiable in an NPM module:

	var trycatch = require('neatjs/builtins').trycatch;
	

#### each(array, func) ####

Iterate over an array-like object (like Array.prototoype.forEach).

	#include each;
	each([1, 2, 3], (num) {
		console.log(num);
	});


#### keys(object) ####

Return an array containing an object's property names (like Object.keys).

	var keys = keys(myObj);
	each(keys, (key) {
		console.log(key);
	});


#### map(array, func) ####

Maps the values of an array through a function (like Array.prototoype.map).

	var ages = map(people, (person) -> person.age);


#### filter(array, func) ####

Filters the values of an array through a function (like Array.prototype.filter)

	var adults = filter(people, (person) -> person.age >= 18);


#### undef(val) ####

Tests to see if a value is undefined.

	if (undef(foo)) {
		// typeof foo === 'undefined'
	}


#### nothing(val) ####

Tests to see if a value is null or undefined.

	if (nothing(foo)) {
		// foo === null || typeof foo === 'undefined'
	}


#### once(func) ####

Wraps a function in a proxy that ignores all but the first call. This is particularly useful when mixing callbacks with EventEmitters in Node.js.

	hello() {
		console.log("Hello!");
	}
	
	var helloOnce = once(hello);
	
	// only prints hello the first time
	helloOnce();
	helloOnce();


#### extend(prototype[, props]) ####

Creates a new object with a given prototype and optionally adds new properties.

	Dog() {}
	Dog.prototype = extend(Animal.prototype, {
		bark: () {
			console.log("woof");
		},
	});


#### trycatch(func, callback) ####

Calls func. If func succeeds, the result is passed to callback as the second parameter. If func throws an error, the error is passed to callback as the first parameter.

	trycatch(-> JSON.parse(input), onParsed);
	
	onParsed(err, json) {
		if (err) {
			console.log("input isn't valid JSON");
		}
	}


## Justification ##

- You already need a source validator like JSHint or JSLint.
- The `function` keyword eight characters too long.
- The `this` keyword sucks in functional programming.
- It is surprisingly hard to type `prototype`.
- Including `if (err) throw err;` at the top of every function is an unreasonable amount of boilerplate.
