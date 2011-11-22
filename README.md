# JSMint #

Freshens your JavaScript as it validates!

JSMint is a strict dialect of JavaScript with a few carefully chosen tweaks that compiles into standard JavaScript without dropping your comments or changing any line numbers.

## Features ##

### Improved Function Definitions ###

First, the `function` keyword has been dropped, so instead of:

	function add(a, b) {
		return a + b;
	}
	
	Dog.prototype.bark = function (howManyTimes) {
		while (howManyTimes > 0) {
			console.log("woof!");
			howManyTimes -= 1;
		}
	};

You write:

	add(a, b) {
		return a + b;
	}

	Dog.prototype.bark = (howManyTimes) {
		while (howManyTimes > 0) {
			console.log("woof!");
			howManyTimes -= 1;
		}
	};

Second, the error prone `this` keyword has been dropped. Instead, you explicitly choose a name for the this-value in function declarations:

	Dog.prototype.careForPuppies = () dog {
		dog.puppies.forEach((puppy) {
			// there is no confusion about the value of dog
			dog.clean(puppy);
		});
	};

Third, for very simple functions that return a single value, we have a shorter syntax:

	var adder = (a, b) -> a + b;

If you only expect one param, you can be even more concise:

	var add3 = -> _ + 3;

Fourth, for asynchronous programming in environments like Node.js, there is a better syntax for error handling:

	fs.readFile('filename', onReadFile);
	
	// if fs.readFile sends an error to this function, it will be thrown
	onReadFile(@, text) {
		console.log(text);
	}
	
Even better, if you are composing async functions:

	readFileOrDir(filename, callback) {
		fs.stat(filename, onStat);
		
		// if fs.stat sends an error to onStat, it will be passed
		// along to callback, and onStat will terminate.
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


### Better Equality Operators ###

JSMint transforms `==` into `===` and `!=` into `!==` for the obvious reasons.


### Trailing Commas in Array and Object Literals ###

Hooray!


### Try/Catch Simplification ###

In async environments, try/catch seldom works the way people expect. JSMint removes the try/catch construct in favor of a simple trycatch() function that normalizes thrown errors to look like other errors in Node.js:

	trycatch(-> JSON.parse(input), onParsed);
	
	onParsed(err, json) {
		// if JSON.parse fails, err will be set
	}

See below for more info on JSMint's built-in functions.


### Strict Syntax and Variable Name Checking ###

Other than that, JSMint is just JavaScript with stricter syntax rules:

- variables must be declared
- no implied semicolons
- if statements and while statements always require blocks
- switch cases must break
- vars and functions may only be declared at the top-level or directly within functions


### Built-in Functions ###

Some versions of JavaScript are missing a few very critical features. To remedy this, JSMint provides some built-in functions. It does this by appending the built-ins you use to the end of your source. By doing it this way, JSMint is only a dependency during build-time and not during runtime.


#### each(array, func) ####

Iterate over an array-like object (like Array.prototoype.forEach).

	each([1, 2, 3], (num) {
		console.log(num);
	});


#### keys(object) ####

Return an array containing an objects property names (like Object.keys).

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


#### nada(val) ####

Tests to see if a value is null or undefined.

	if (nada(foo)) {
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

Anyone building a serious server-side JavaScript project should be using a source validator to avoid horrible things like polluting the global namespace.

Almost every JavaScript programmer agrees that the `function` keyword is a total bummer.

The majority of JavaScript programmers will admit to misusing the `this` keyword inside callbacks and spending precious moments being horribly confused by the outcome.

About half of Node.js programmers secretly hate typing `if (err) throw err;`
