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

var ast = require('./ast');

var tokens = [
	{ re: /^[0-9]+(\.[0-9]+)?/ , type: 'NUMBER'      },
	{ eq: '==='                                      },
	{ eq: '!=='                                      },
	{ eq: '...'                                      },
	{ eq: '->'                                       },
	{ eq: '=='                                       },
	{ eq: '!='                                       },
	{ eq: '+='                                       },
	{ eq: '-='                                       },
	{ eq: '*='                                       },
	{ eq: '/='                                       },
	{ eq: '%='                                       },
	{ eq: '||'                                       },
	{ eq: '&&'                                       },
	{ eq: '<='                                       },
	{ eq: '>='                                       },
	{ eq: '=='                                       },
	{ eq: '::'                                       },
	{ eq: '*'                                        },
	{ eq: '/'                                        },
	{ eq: '-'                                        },
	{ eq: '+'                                        },
	{ eq: '!'                                        },
	{ eq: '('                                        },
	{ eq: ')'                                        },
	{ eq: '{'                                        },
	{ eq: '}'                                        },
	{ eq: '['                                        },
	{ eq: ']'                                        },
	{ eq: '<'                                        },
	{ eq: '>'                                        },
	{ eq: '.'                                        },
	{ eq: ','                                        },
	{ eq: ';'                                        },
	{ eq: ':'                                        },
	{ eq: '^'                                        },
	{ eq: '='                                        },
	{ eq: '%'                                        },
	{ eq: '-'                                        },	
	{ eq: '"'                                        },	
	{ eq: "'"                                        },	
	{ eq: '@'                                        },	
	{ eq: '?'                                        },	
	
	{ re: /^break\b/                                 },
	{ re: /^case\b/                                  },
	{ re: /^catch\b/                                 },
	{ re: /^continue\b/                              },
	{ re: /^debugger\b/                              },
	{ re: /^default\b/                               },
	{ re: /^delete\b/                                },
	{ re: /^do\b/                                    },
	{ re: /^else\b/                                  },
	{ re: /^finally\b/                               },
	{ re: /^for\b/                                   },
	{ re: /^function\b/                              },
	{ re: /^if\b/                                    },
	{ re: /^in\b/                                    },
	{ re: /^instanceof\b/                            },
	{ re: /^new\b/                                   },
	{ re: /^return\b/                                },
	{ re: /^switch\b/                                },
	{ re: /^this\b/                                  },
	{ re: /^throw\b/                                 },
	{ re: /^try\b/                                   },
	{ re: /^typeof\b/                                },
	{ re: /^var\b/                                   },
	{ re: /^void\b/                                  },
	{ re: /^while\b/                                 },
	{ re: /^with\b/                                  },
	
	{ re: /^null\b/                                  },
	{ re: /^true\b/                                  },
	{ re: /^false\b/                                 },
	
	{ re: /^class\b/                                 },
	{ re: /^enum\b/                                  },
	{ re: /^export\b/                                },
	{ re: /^extend\b/                                },
	{ re: /^import\b/                                },
	{ re: /^super\b/                                 },
	
	{ re: /^implements\b/                            },
	{ re: /^interface\b/                             },
	{ re: /^let\b/                                   },
	{ re: /^package\b/                               },
	{ re: /^private\b/                               },
	{ re: /^protected\b/                             },
	{ re: /^public\b/                                },
	{ re: /^static\b/                                },
	{ re: /^yield\b/                                 },
	
	{ re: /^[a-zA-Z$_][a-zA-Z0-9$_]*/, type: 'IDENT' },
	{ re: /^#include\b/                              },
	{ re: /^#declare\b/                              }
];

var whitespace = [
	/^\s+/,
	/^\/\/.*/,
	/^\/\*[\s\S]*?\*\//,
	/^#!.+/
];

exports.compile = function(filename, text) {
	var program;
	try {
		program = (new Parser(filename, text)).parse();
	}
	catch (err) {
		return {error: err};
	}
	return {ok: true, output: program.render()};
}

function Parser(filename, text) {
	this.filename = filename;
	this.original = text;
	this.text = text;
	this.loc = 0;
	this.peeked = null;
}

Parser.prototype.findString = function(quote) {
	var len = 0, result;
	while (true) {
		if (len >= this.text.length) {
			this.error("runaway string literal");
		}
		else if (this.text.charAt(len) === '\\') {
			len += 2;
		}
		else if (this.text.charAt(len) === quote) {
			len += 1;
			break;
		}
		else {
			len += 1;
		}
	}
	result = { type: 'STRING', text: quote + this.text.substr(0, len), loc: this.loc-1 };
	this.text = this.text.substr(len);
	this.loc += len;
	result.whitespace = this.findWhitespace();
	return result;
}

Parser.prototype.findToken = function() {
	var i, t, m, result;
		
	for (i = 0; i < tokens.length; i++) {
		t = tokens[i];
		if (t.eq && this.text.substr(0, t.eq.length) === t.eq) {
			result = { text: t.eq, type: t.eq, loc: this.loc };
		}
		else if (t.re) {
			m = t.re.exec(this.text);
			if (m) {
				result = { text: m[0], type: m[0], loc: this.loc };
			}
		}
		
		if (result) {
			this.text = this.text.substr(result.text.length);
			this.loc += result.text.length;
			if (t.type) {
				result.type = t.type;
			}
			return result;
		}
	}
	
	// none of the tokens matched
	this.error("invalid token");
}

Parser.prototype.findWhitespace = function() {
	var m, i, ws = [];
	while (true) {
		for (i = 0; i < whitespace.length; i++) {
			m = whitespace[i].exec(this.text);
			if (m) {
				ws.push(m[0]);
				this.loc += m[0].length;
				this.text = this.text.substr(m[0].length);
				break;
			}
		}
		if (i == whitespace.length) {
			break;
		}
	}
	return ws.join('');
}

Parser.prototype.next = function() {
	var result, m;
	if (this.peeked) {
		result = this.peeked;
		this.peeked = null;
	}
	else {
		if (this.text === '') {
			result = {type: 'EOF', text: '', whitespace: '', loc: this.loc};
		}
		else {
			result = this.findToken();
		}
		
		result.whitespace = this.findWhitespace();
	}
	this.lastToken = result;
	
	// check for the reserved keywords
	switch (result.type) {
	case 'function':
	case 'this':
	case 'yield':
	case 'try':
	case 'catch':
	case 'finally':
		this.error("'" + result.type + "' is a reserved keyword");
		
	case '===':
	case '!==':
		this.error("use '" + result.type.substr(0, 2) + "' instead of '" + result.type + "'");
	}
	
	return result;
};

Parser.prototype.peek = function() {
	if (!this.peeked) {
		this.peeked = this.next();
	}
	return this.peeked;
};

Parser.prototype.parse = function() {
	var program = new ast.Program(this.findWhitespace(), this.parseStatements());
	try {
		program.validate();
	}
	catch (err) {
		if (err.stack) console.log(err.stack);
		while (err[0].elts) {
			err[0] = err[0].elts[0];
		}
		this.error(err[1], err[0].loc);
	}
	return program;
};

Parser.prototype.expect = function(type) {
	var t = this.next();
	if (t.type !== type) {
		this.error("expected '" + type + "' instead of '" + (t.text || t.type) + "'");
	}
	return t;
};

Parser.prototype.parseStatements = function() {
	var statements = [];
	while (this.peek().type !== 'EOF') {
		statements.push(this.parseStatement());
	}
	return statements;
};

Parser.prototype.parseStatement = function() {
	switch (this.peek().type) {
		case 'if':       return this.parseIf();
		case 'while':    return this.parseWhile();
		case 'for':      return this.parseFor();
		case 'break':    return this.parseBreak();
		case 'continue': return this.parseContinue();
		case 'return':   return this.parseReturn();
		case 'throw':    return this.parseThrow();
		case 'var':      return this.parseVar();
		case '#include': return this.parseIncludePragma();
		case '#declare': return this.parseDeclarePragma();
		default:         return this.parseExprStatement();
	}
};

Parser.prototype.parseIf = function() {
	var elts = [
		this.expect('if'),
		this.expect('('),
		this.parseExpr(),
		this.expect(')'),
		this.parseBlock()
	];
	
	if (this.peek().type === 'else') {
		elts.push(this.next());
		if (this.peek().type === 'if') {
			elts.push(this.parseIf());
		}
		else {
			elts.push(this.parseBlock());
		}
	}
	
	return new ast.IfStatement(elts);
};

Parser.prototype.parseWhile = function() {
	var elts = [
		this.expect('while'),
		this.expect('('),
		this.parseExpr(),
		this.expect(')'),
		this.parseBlock()
	];
	return new ast.WhileStatement(elts);
};

Parser.prototype.parseFor = function() {
	var elts = [
		this.expect('for'),
		this.expect('('),
		this.parseExprList(),
		this.expect(';'),
		this.parseExprList(),
		this.expect(';'),
		this.parseExprList(),
		this.expect(')'),
		this.parseBlock()
	];
		
	return new ast.ForStatement(elts);
};

Parser.prototype.parseBreak = function() {
	var elts = [
		this.expect('break')
	];
	if (this.peek().type === 'IDENT') {
		elts.push(this.next());
	}
	elts.push(this.expect(';'));
	return new ast.BreakStatement(elts);
};

Parser.prototype.parseContinue = function() {
	var elts = [
		this.expect('continue')
	];
	if (this.peek().type === 'IDENT') {
		elts.push(this.next());
	}
	elts.push(this.expect(';'));
	return new ast.ContinueStatement(elts);
};

Parser.prototype.parseReturn = function() {
	var elts = [
		this.expect('return')
	];
	if (this.peek().type === ';') {
		elts.push(this.next());
	}
	else {
		elts.push(this.parseExpr());
		elts.push(this.expect(';'));
	}
	return new ast.ReturnStatement(elts);
};

Parser.prototype.parseThrow = function() {
	var elts = [
		this.expect('throw'),
		this.parseExpr(),
		this.expect(';')
	];
	return new ast.ThrowStatement(elts);
};

Parser.prototype.parseVar = function() {
	var elts = [
		this.expect('var'),
		this.parseExprList(),
		this.expect(';')
	];
	return new ast.VarStatement(elts);
};

Parser.prototype.parseExprList = function() {
	var elts = [];
	while (true) {
		if (this.peek().type === ')' || this.peek().type === ']' || this.peek().type === ';') {
			break;
		}
		elts.push(this.parseExpr());
		if (this.peek().type === ',') {
			elts.push(this.next());
		}
		else {
			break;
		}
	}
	return new ast.ExprList(elts);
};

function precOf(t) {
	switch (t.type) {
		case '*':
		case '/':
		case '%':
			return 60;
		
		case '+':
		case '-':
			return 50;
			
		case '<':
		case '<=':
		case '>':
		case '>=': 
		case 'instanceof':
			return 40;
			
		case '==':
		case '!=':
			return 30;
			
		case '&&':
			return 20;
			
		case '||':
			return 10;
		
		case '?':
			return 7;
		
		case '=':
		case '+=':
		case '-=':
		case '*=':
		case '/=':
		case '%=':
			return 5;
	};
}

var maxPrec = 100;

Parser.prototype.parseExpr = function(prec) {
	var expr, opr, elts;
	
	prec = prec || 0;
	
	switch (this.peek().type) {
		case 'NUMBER':
			expr = new ast.NumberExpr([this.next()]);
			break;
		case 'null':
			expr = new ast.NullExpr([this.next()]);
			break;
		case 'true':
		case 'false':
			expr = new ast.TrueFalseExpr([this.next()]);
			break;
		case 'IDENT':
			expr = new ast.IdentExpr([this.next()]);
			break;
		case "'":
			this.next();
			expr = new ast.StringExpr([this.findString("'")]);
			break;
		case '"':
			this.next();
			expr = new ast.StringExpr([this.findString('"')]);
			break;
		case '/':
			this.next();
			expr = new ast.StringExpr([this.findString('/')]);
			break;
		case '@':
			expr = this.parsePassExpr();
			break;
		case '[':
			expr = this.parseArrayExpr();
			break;
		case '{':
			expr = this.parseObjectExpr();
			break;
		case 'new':
			expr = this.parseNewExpr();
			break;
		case '!':
		case '-':
		case '+':
		case 'typeof':
		case 'delete':
			expr = new ast.UnaryOpExpr([this.next(), this.parseExpr(maxPrec)]);
			break;
		case '(':
			expr = this.parseGroupExpr();
			break;
		case '->':
			expr= this.parseSimpleArrowFunction();
			break;
		default:
			this.error("invalid expression");
	}
	
	GOBBLE: while (true) {
		switch (this.peek().type) {
			case '+':
			case '-':
			case '*':
			case '/':
			case '%':
			case '==':
			case '!=':
			case '<':
			case '<=':
			case '>':
			case '>=':
			case '&&':
			case '||':
				if (precOf(this.peek()) > prec) {
					opr = this.next();
					expr = new ast.BinaryOpExpr([expr, opr, this.parseExpr(precOf(opr))])
					break;
				}
				else {
					break GOBBLE;
				}
			case '=':
			case '+=':
			case '-=':
			case '*=':
			case '/=':
			case '%=':
				if (precOf(this.peek()) >= prec) {
					opr = this.next();
					expr = new ast.BinaryOpExpr([expr, opr, this.parseExpr(precOf(opr))])
					break;
				}
				else {
					break GOBBLE;
				}
			case '?':
				if (precOf(this.peek()) >= prec) {
					opr = this.next();
					expr = new ast.TernaryOpExpr([expr, opr, this.parseExpr(0), this.expect(':'), this.parseExpr(precOf(opr))]);
				}
				else {
					break GOBBLE;
				}
				break;
			case '.':
				elts = [expr, this.next(), this.expect('IDENT')];
				if (this.peek().type === '(') {
					elts.push(this.next());
					elts.push(this.parseExprList());
					elts.push(this.expect(')'));
					expr = new ast.InvokeExpr(elts);
				}
				else {
					expr = new ast.PropertyExpr(elts);
				}
				break;
			
			case '(':
				elts = [expr, this.next(), this.parseExprList(), this.expect(')')];
				expr = new ast.CallExpr(elts);
				break;
			
			case '[':
				elts = [expr, this.next(), this.parseExpr(), this.expect(']')];
				expr = new ast.IndexExpr(elts);
				break;
			
			case '::':
				elts = [expr, this.next()];
				if (this.peek().type === 'IDENT') {
					elts.push(this.next());
				}
				expr = new ast.PrototypePropertyExpr(elts);
				break;
			
			case '...':
				if (expr.astType !== 'IdentExpr') {
					this.error("unexpected '...'");
				}
				elts = [expr.elts[0], this.next()];
				expr = new ast.YadaExpr(elts);
				break;
			
			default:
				break GOBBLE;
		}
	}
	
	return expr;
};

Parser.prototype.parsePassExpr = function() {
	var elts = [
		this.expect('@')
	];
	if (this.peek().type === 'IDENT') {
		elts.push(this.next());
	}
	return new ast.PassExpr(elts);
};

Parser.prototype.parseArrayExpr = function() {
	var elts = [
		this.expect('['),
		this.parseExprList(),
		this.expect(']')
	];
	return new ast.ArrayExpr(elts);
};

Parser.prototype.parseObjectExpr = function() {
	var elts = [
		this.expect('{')
	];
	while (true) {
		if (this.peek().type === '}') {
			break;
		}
		else if (this.peek().type === 'IDENT') {
			elts.push(this.next());
		}
		else if (this.peek().type === '"') {
			this.next();
			elts.push(this.findString('"'));
		}
		else if (this.peek().type === "'") {
			this.next();
			elts.push(this.findString("'"));
		}
		else {
			this.error("invalid object key");
		}
		elts.push(this.expect(':'));
		elts.push(this.parseExpr());
		if (this.peek().type === ',') {
			elts.push(this.next());
		}
		else {
			break;
		}
	}
	elts.push(this.expect('}'));
	return new ast.ObjectExpr(elts);
};

Parser.prototype.parseNewExpr = function() {
	var elts = [
		this.expect('new'),
		new ast.IdentExpr([this.expect('IDENT')])
	];
	while (true) {
		if (this.peek().type === '.') {
			elts[1] = new ast.PropertyExpr([elts[1], this.next(), this.expect('IDENT')]);
		}
		else {
			break;
		}
	}
	elts.push(this.expect('('));
	elts.push(this.parseExprList());
	elts.push(this.expect(')'));
	return new ast.NewExpr(elts);
};

Parser.prototype.parseGroupExpr = function() {
	var elts = [
		this.expect('(')
	];
	var exprList = this.parseExprList();
	var closeParen = this.expect(')');
	
	var thisElts = null;
	if (this.peek().type === ':') {
		// this is going to be a function expr with a this var
		thisElts = [this.next(), this.expect('IDENT')];
	}
	
	if (this.peek().type === '{') {
		// this is actually a function expr
		if (!exprList.checkFormalParams()) {
			this.error("invalid formal parameter list before '{'");
		}
		elts.push(exprList);
		elts.push(closeParen);
		elts.push(this.parseBlock());
		return new ast.FunctionExpr(elts, thisElts);
	}
	else if (thisElts !== null) {
		// this needed to be a function
		this.expect('{');
	}
	else if (this.peek().type === '->') {
		// this is an arrow function
		if (!exprList.checkFormalParams()) {
			this.error("invalid formal parameter list before '->'");
		}
		elts.push(exprList);
		elts.push(closeParen);
		elts.push(this.next());
		elts.push(this.parseExpr());
		return new ast.ArrowFunctionExpr(elts);
	}
	else {
		if (exprList.elts.length !== 1) {
			this.error("unexpected " + this.peek().type + " after formal parameter list");
		}
		elts.push(exprList.elts[0]);
		elts.push(closeParen);
		return new ast.GroupExpr(elts);
	}
};

Parser.prototype.parseSimpleArrowFunction = function() {
	var elts = [
		this.expect('->'),
		this.parseExpr()
	];
	return new ast.SimpleArrowFunctionExpr(elts);
};

Parser.prototype.parseExprStatement = function() {
	var elts = [], thisElts;
	if (this.peek().type === ';') {
		elts.push(this.next());
	}
	else {
		var expr = this.parseExpr();
		if (expr.astType === 'IdentExpr' && this.peek().type === ':') {
			// this is actually a labeled statement
			elts.push(expr.elts[0]);
			elts.push(this.next());
			if (this.peek().type === 'while') {
				elts.push(this.parseWhile());
			}
			else if (this.peek().type === 'for') {
				elts.push(this.parseFor());
			}
			else {
				this.error("invalid labeled statement");
			}
			return new ast.LabeledStatement(elts);
		}
		
		// do we have a thisElt?
		thisElts = null;
		if (this.peek().type === ':') {
			thisElts = [this.next(), this.expect('IDENT')];
		}
		
		if (expr.checkFuncSpec && expr.checkFuncSpec() && this.peek().type === '{') {
			// this is actually a function declaration
			elts = expr.elts;
			elts.push(this.parseBlock());
			return new ast.FunctionStatement(elts, thisElts);
		}
		else if (thisElts !== null) {
			this.expect('{');
		}
		
		elts.push(expr);
		elts.push(this.expect(';'));
	}
	return new ast.ExprStatement(elts);
};

Parser.prototype.parseBlock = function() {
	var t, elts = [this.expect('{')];
	while (true) {
		t = this.peek();
		if (t.type === 'EOF' || t.type === '}') break;
		elts.push(this.parseStatement());
	}
	elts.push(this.expect('}'));
	return new ast.Block(elts);
};

Parser.prototype.parseIncludePragma = function() {
	var elts = [
		this.expect('#include')
	];
	while (true) {
		elts.push(this.expect('IDENT'));
		if (this.peek().type === ',') {
			elts.push(this.next());
		}
		else {
			elts.push(this.expect(';'));
			break;
		}
	}
	return new ast.IncludePragma(elts);
};

Parser.prototype.parseDeclarePragma = function() {
	var elts = [
		this.expect('#declare')
	];
	while (true) {
		elts.push(this.expect('IDENT'));
		if (this.peek().type === ',') {
			elts.push(this.next());
		}
		else {
			elts.push(this.expect(';'));
			break;
		}
	}
	return new ast.DeclarePragma(elts);
};

Parser.prototype.error = function(msg, loc) {
	if (typeof loc === 'undefined') {
		loc = this.lastToken ? this.lastToken.loc : 0;
	}
	var i = 0, line = 1, char = 1;
	while (i < loc){
		if (this.original.charAt(i) === "\n") {
			line += 1;
			char = 1;
		}
		else {
			char += 1;
		}
		i += 1;
	}
	throw new Error(this.filename + ", line " + line +  ": " + msg);
	// throw new Error(msg + " in " + this.filename + " at line " + line + ", char " + char + " (byte " + loc + ")");
};
