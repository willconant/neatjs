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
	
	{ re: /^break\b/              , isWord: true     },
	{ re: /^case\b/               , isWord: true     },
	{ re: /^catch\b/              , isWord: true     },
	{ re: /^continue\b/           , isWord: true     },
	{ re: /^debugger\b/           , isWord: true     },
	{ re: /^default\b/            , isWord: true     },
	{ re: /^delete\b/             , isWord: true     },
	{ re: /^do\b/                 , isWord: true     },
	{ re: /^else\b/               , isWord: true     },
	{ re: /^finally\b/            , isWord: true     },
	{ re: /^for\b/                , isWord: true     },
	{ re: /^function\b/           , isWord: true     },
	{ re: /^if\b/                 , isWord: true     },
	{ re: /^in\b/                 , isWord: true     },
	{ re: /^instanceof\b/         , isWord: true     },
	{ re: /^new\b/                , isWord: true     },
	{ re: /^return\b/             , isWord: true     },
	{ re: /^switch\b/             , isWord: true     },
	{ re: /^this\b/               , isWord: true     },
	{ re: /^throw\b/              , isWord: true     },
	{ re: /^try\b/                , isWord: true     },
	{ re: /^typeof\b/             , isWord: true     },
	{ re: /^var\b/                , isWord: true     },
	{ re: /^void\b/               , isWord: true     },
	{ re: /^while\b/              , isWord: true     },
	{ re: /^with\b/               , isWord: true     },
	
	{ re: /^null\b/               , isWord: true     },
	{ re: /^true\b/               , isWord: true     },
	{ re: /^false\b/              , isWord: true     },
	
	{ re: /^class\b/              , isWord: true     },
	{ re: /^enum\b/               , isWord: true     },
	{ re: /^export\b/             , isWord: true     },
	{ re: /^extend\b/             , isWord: true     },
	{ re: /^import\b/             , isWord: true     },
	{ re: /^super\b/              , isWord: true     },
	
	{ re: /^implements\b/         , isWord: true     },
	{ re: /^interface\b/          , isWord: true     },
	{ re: /^let\b/                , isWord: true     },
	{ re: /^package\b/            , isWord: true     },
	{ re: /^private\b/            , isWord: true     },
	{ re: /^protected\b/          , isWord: true     },
	{ re: /^public\b/             , isWord: true     },
	{ re: /^static\b/             , isWord: true     },
	{ re: /^yield\b/              , isWord: true     },
	
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

function Parser(filename, text) {
	this.filename = filename;
	this.original = text;
	this.text = text;
	this.loc = 0;
	this.peeked = null;
}

module.exports = Parser;

Parser.prototype.findString = function(quote) {
	var len = 0, result, flagre;
	
	// if a string literal starts with whitespace, it will have been gobbled
	// up by the last call to findWhitespace
	if (this.lastToken.whitespace.length > 0) {
		this.text = this.lastToken.whitespace + this.text;
		this.loc -= this.lastToken.whitespace.length;
	}
	
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
	
	// grab regexp flags
	if (quote === '/') {
		flagre = /[gimy]/;
		while (true) {
			if (len >= this.text.length || !flagre.test(this.text.charAt(len))) {
				break;
			}
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
				result = { text: m[0], type: m[0], loc: this.loc, isWord: t.isWord };
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

Parser.prototype.expectIdentOrWord = function() {
	var t = this.next();
	if (t.type !== 'IDENT' && !t.isWord) {
		this.error("expected word instead of '" + (t.text || t.type) + "'");
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
		case 'function': return this.parseFunctionStatement();
		case 'switch':   return this.parseSwitch();
		case '#include': return this.parseIncludePragma();
		case '#declare': return this.parseDeclarePragma();
			
		case 'try':
			this.error("try/catch blocks are not supported. Use the built-in trycatch() function");
			break;
			
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

Parser.prototype.parseSwitch = function() {
	var elts = [
		this.expect('switch'),
		this.expect('('),
		this.parseExpr(),
		this.expect(')'),
		this.expect('{')
	];
	
	var caseElts, lastAstType;
	while (this.peek().type === 'case') {
		caseElts = [
			this.expect('case'),
			this.parseExpr(),
			this.expect(':')
		];
		
		while (this.peek().type !== '}' && this.peek().type !== 'case' && this.peek().type !== 'default') {
			caseElts.push(this.parseStatement());
		}
		
		lastAstType = caseElts[caseElts.length-1].astType;
		if (lastAstType !== 'ReturnStatement' && lastAstType !== 'BreakStatement' && lastAstType !== 'ThrowStatement') {
			this.error("switch case must end with return, break, or throw statement");
		}
		
		elts.push(new ast.SwitchCase(caseElts));
	}
	
	if (this.peek().type === 'default') {
		caseElts = [
			this.expect('default'),
			this.expect(':')
		];
		
		while (this.peek().type !== '}') {
			caseElts.push(this.parseStatement());
		}
				
		elts.push(new ast.SwitchDefaultCase(caseElts));
	}
	
	elts.push(this.expect('}'));
		
	return new ast.SwitchStatement(elts);
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
	if (containsLineTerminator(elts[0].whitespace)) {
		this.error("illegal newline after break keyword");
	}
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
	if (containsLineTerminator(elts[0].whitespace)) {
		this.error("illegal newline after continue keyword");
	}
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
	if (containsLineTerminator(elts[0].whitespace)) {
		this.error("illegal newline after return keyword");
	}
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
	];
	if (containsLineTerminator(elts[0].whitespace)) {
		this.error("illegal newline after throw keyword");
	}
	elts.push(this.parseExpr());
	elts.push(this.expect(';'))
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

Parser.prototype.parseFunctionStatement = function() {
	var elts = [
		this.expect('function'),
		this.expect('IDENT'),
		this.expect('('),
		this.parseFormalParams(),
		this.expect(')')
	];
		
	// do we have a thisElt?
	var thisElts = null;
	if (this.peek().type === ':') {
		thisElts = [this.next(), this.expect('IDENT')];
	}
	
	elts.push(this.parseBlock());
	
	return new ast.FunctionStatement(elts, thisElts);
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

Parser.prototype.parseFormalParams = function() {
	var elts = [], expr, t, hasYada;
	while (this.peek().type !== ')') {
		t = this.peek();
		
		if (hasYada) {
			this.error("... argument must be last in formal params");
		}
		
		if (t.type !== 'IDENT' && t.type !== '@' && t.type !== '...') {
			this.error("unexpected '" + (t.text || t.type) + "' in formal params");
		}
	
		if (t.type === '@' && elts.length > 0) {
			this.error("@ argument must be first in formal params");
		}
		
		if (t.type === '...') {
			hasYada = true;
		}

		elts.push(this.parseExpr());
		if (this.peek().type === ',') {
			elts.push(this.next());
		}
		else {
			break;
		}
	}
	return new ast.FormalParams(elts);
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
		case '===':
		case '!==':
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
		case 'function':
			expr = this.parseFunctionExpr();
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
		case '...':
			expr = this.parseYadaExpr();
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
			if (this.peek().isWord) {
				this.error("'" + this.peek().type + "' is a reserved word");
			}
			else {
				this.error("invalid expression starting with '" + this.peek().type + "'");
			}
	}
	
	GOBBLE: while (true) {
		switch (this.peek().type) {
			case '==':
				this.error("use of '==' is not safe in this context, use '===' instead");
				break;
			case '!=':
				this.error("use of '!=' is not safe in this context, use '!==' instead");
				break;
			case '===':
			case '!==':
			case '+':
			case '-':
			case '*':
			case '/':
			case '%':
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
				elts = [expr, this.next(), this.expectIdentOrWord()];
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
				if (this.peek().type === 'IDENT' || this.peek().isWord) {
					elts.push(this.next());
				}
				expr = new ast.PrototypePropertyExpr(elts);
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

Parser.prototype.parseYadaExpr = function() {
	var elts = [
		this.expect('...'),
		this.expect('IDENT')
	];
	return new ast.YadaExpr(elts);
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
		else if (this.peek().type === 'IDENT' || this.peek().isWord) {
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
			elts[1] = new ast.PropertyExpr([elts[1], this.next(), this.expectIdentOrWord()]);
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

Parser.prototype.parseFunctionExpr = function() {
	var elts = [
		this.expect('function'),
		this.expect('('),
		this.parseFormalParams(),
		this.expect(')')
	];
		
	var thisElts = null;
	if (this.peek().type === ':') {
		thisElts = [this.next(), this.expect('IDENT')];
	}
	
	// handle arrow functions
	if (!thisElts && this.peek().type === '->') {
		elts.push(this.next());
		elts.push(this.parseExpr());
		return new ast.ArrowFunctionExpr(elts);
	}
	
	// otherwise, we expect a block
	elts.push(this.parseBlock());
	return new ast.FunctionExpr(elts, thisElts);
};

Parser.prototype.parseGroupExpr = function() {
	var elts = [
		this.expect('('),
		this.parseExpr(),
		this.expect(')')
	];
	return new ast.GroupExpr(elts);
};

Parser.prototype.parseSimpleArrowFunction = function() {
	var elts = [
		this.expect('->'),
		this.parseExpr()
	];
	return new ast.SimpleArrowFunctionExpr(elts);
};

Parser.prototype.parseExprStatement = function() {
	var elts = [];
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
	var isTag = false;
	var ident;
	while (true) {
		if (this.peek().type === ':') {
			this.next();
			isTag = true;
		}
		ident = this.expect('IDENT');
		if (isTag) {
			ident.text = ':' + ident.text;
			isTag = false;
		}
		elts.push(ident);
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

function containsLineTerminator(str) {
	return /[\r\n\u2028\u2029]/.test(str);
}
