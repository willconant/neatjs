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

var builtins = require('./builtins');

function newDeclaredVars(v) {
	var v2 = {};
	var key;
	for (key in v) {
		if (hasOwnProperty.call(v, key)) {
			v2[key] = 2;
		}
	}
	return v2;
}

function render(elt) {
	var out = [], i;
	if (elt.render) {
		out.push(elt.render());
	}
	else if (elt.elts) {
		for (i = 0; i < elt.elts.length; i++) {
			out.push(render(elt.elts[i]));
		}
	}
	else {
		out.push(elt.text + elt.whitespace);
	}
	return out.join('');
}

/* Program */
function Program(preamble, elts) {
	this.preamble = preamble;
	this.elts = elts;
}
exports.Program = Program;
Program.prototype.validate = function() {
	var ctx = {
		program: this,
		declared: {},
		included: {},
		varOk: true,
		pragmaOk: true
	};
	var i;
	for (i = 0; i < this.elts.length; i++) {
		if (this.elts[i].pragma) {
			this.elts[i].pragma(ctx);
		}
	}
	for (i = 0; i < this.elts.length; i++) {
		if (this.elts[i].declare) {
			this.elts[i].declare(ctx);
		}
	}
	for (i = 0; i < this.elts.length; i++) {
		this.elts[i].validate(ctx);
	}
	this.included = ctx.included;
};

Program.prototype.render = function() {
	var out = [
		this.preamble,
		render({elts: this.elts})
	];
	var k;
	for (k in this.included) {
		if (hasOwnProperty.call(this.included, k)) {
			out.push(builtins[k]);
		}
	}
	return out.join('');
};

/* Block */
function Block(elts) {
	this.elts = elts;
}
exports.Block = Block;
Block.prototype.astType = 'Block';

Block.prototype.declare = function(ctx) {
	var i;
	for (i = 1; i < (this.elts.length-1); i++) {
		if (this.elts[i].declare) {
			this.elts[i].declare(ctx);
		}
	}
};

Block.prototype.validate = function(ctx) {
	var i;
	for (i = 1; i < (this.elts.length-1); i++) {
		this.elts[i].validate(ctx);
	}
};

/* IfStatement */
function IfStatement(elts) {
	this.elts = elts;
	this.testExpr = elts[2];
	this.block = elts[4];
	this.elsePart = elts[6];
}
exports.IfStatement = IfStatement;
IfStatement.prototype.astType = 'IfStatement';

IfStatement.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.testExpr.validate(ctx);
	this.block.validate(ctx);
	if (this.elsePart) {
		this.elsePart.validate(ctx);
	}
};

/* WhileStatement */
function WhileStatement(elts) {
	this.elts = elts;
	this.testExpr = elts[2];
	this.block = elts[4];
}
exports.WhileStatement = WhileStatement;
WhileStatement.prototype.astType = 'WhileStatement';

WhileStatement.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.testExpr.validate(ctx);
	this.block.validate(ctx);
};

/* ForStatement */
function ForStatement(elts) {
	this.elts = elts;
	this.initExprs = elts[2];
	this.testExprs = elts[4];
	this.postExprs = elts[6];
}
exports.ForStatement = ForStatement;
ForStatement.prototype.astType = 'ForStatement';

ForStatement.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.initExprs.validate(ctx);
	this.testExprs.validate(ctx);
	this.postExprs.validate(ctx);
};

/* ExprStatement */
function ExprStatement(elts) {
	this.elts = elts;
}
exports.ExprStatement = ExprStatement;
ExprStatement.prototype.astType = 'ExprStatement';

ExprStatement.prototype.validate = function(ctx) {
	if (this.elts.length > 1) {
		this.elts[0].validate(ctx);
	}
};

/* LabeledStatement */
function LabeledStatement(elts) {
	this.elts = elts;
}
exports.LabeledStatement = LabeledStatement;
LabeledStatement.prototype.astType = 'LabeledStatement';

LabeledStatement.prototype.validate = function(ctx) {
	this.elts[2].validate(ctx);
};

/* FunctionStatement */
function FunctionStatement(elts, thisElts) {
	this.elts = elts;
	this.ident = elts[1];
	this.args = elts[3];
	this.block = elts[5];
	this.thisElts = thisElts;
}
exports.FunctionStatement = FunctionStatement;
FunctionStatement.prototype.astType = 'FunctionStatement';

FunctionStatement.prototype.declare = function(ctx) {
	var identText = this.ident.text;
	if (ctx.declared[identText] === 1) {
		// already declared
		throw [this.ident, "'" + identText + "' is already declared in this scope"];
	}
	else {
		ctx.declared[identText] = 1;
	}
};

FunctionStatement.prototype.validate = function(ctx) {
	if (!ctx.varOk) {
		throw [this.elts[0], "functions may only be declared in the top-level of the program or directly within other functions"];
	}
	ctx = {declared: newDeclaredVars(ctx.declared), varOk: true, program: ctx.program};
	this.args.declareArgs(ctx);
	if (this.thisElts) {
		if (ctx.declared[this.thisElts[1].text] === 1) {
			throw [this.thisElts[1], "'" + this.thisElts[1].text + "' is already declared in this scope"];
		}
		ctx.declared[this.thisElts[1].text] = 1;
	}
	this.block.declare(ctx);
	this.block.validate(ctx);
};

FunctionStatement.prototype.render = function(ctx) {
	var out = [render(this.elts[0]), render(this.elts[1]), render(this.elts[2])];
	var i;
	var args = this.args;
	var block = this.block;
	var hasPassExpr = false;
	var errIdent;
	var hasYadaExpr = false;
	var yadaIdent;
	var yadaIndex;
	for (i = 0; i < args.elts.length; i++) {
		if (i % 2 === 0) {
			if (args.elts[i].astType === 'PassExpr') {
				hasPassExpr = true;
				errIdent = args.elts[i].elts[1];
				out.push('__err');
			}
			else if (args.elts[i].astType === 'YadaExpr') {
				hasYadaExpr = true;
				yadaIdent = args.elts[i].elts[1];
				yadaIndex = i / 2;
				out.push(args.elts[i].elts[0].whitespace);
				out.push(render(args.elts[i].elts[1]));
			}
			else {
				out.push(render(args.elts[i]));
			}
		}
		else {
			out.push(render(args.elts[i]));
		}
	}
	
	out.push(render(this.elts[4]));
	
	if (this.thisElts) {
		out.push(this.thisElts[0].whitespace);
		out.push(this.thisElts[1].whitespace);
	}
	
	out.push(block.elts[0].text);
	
	if (hasPassExpr) {
		if (errIdent) {
			out.push(" if (__err) { " + errIdent.text + "(__err); return; }");
		}
		else {
			out.push(" if (__err) { throw __err; }");
		}
	}
	
	if (this.thisElts) {
		out.push(" var " + this.thisElts[1].text + " = this;");
	}
	
	if (hasYadaExpr) {
		out.push(" " + yadaIdent.text + " = [].slice.call(arguments, " + yadaIndex + ");");
	}
	
	out.push(block.elts[0].whitespace);
	for (i = 1; i < block.elts.length; i++) {
		out.push(render(block.elts[i]));
	}
	
	return out.join('');
};

/* VarStatement */
function VarStatement(elts) {
	this.elts = elts;
}
exports.VarStatement = VarStatement;
VarStatement.prototype.astType = 'VarStatement';

VarStatement.prototype.declare = function(ctx) {
	var exprElts = this.elts[1].elts;
	var i, expr, ident;
	for (i = 0; i < exprElts.length; i++) {
		if (i % 2 === 0) {
			expr = exprElts[i];
			if (expr.astType === 'IdentExpr') {
				ident = expr.elts[0];
			}
			else {
				if (expr.astType !== 'BinaryOpExpr' || expr.elts[0].astType !== 'IdentExpr' || expr.elts[1].type !== '=') {
					throw [expr.elts[0], "invalid expression in var statement"];
				}
				ident = expr.elts[0].elts[0];
			}
			if (ctx.declared[ident.text] === 1) {
				// already declared
				throw [ident, "'" + ident.text + "' is already declared in this scope"];
			}
			else {
				ctx.declared[ident.text] = 1;
			}
		}
	}
};

VarStatement.prototype.validate = function(ctx) {
	if (!ctx.varOk) {
		throw [this.elts[0], "vars may only be declared in the top-level of the program or directly within functions"];
	}
	ctx = {declared: ctx.declared, program: ctx.program};
	this.elts[1].validate(ctx);
};

/* ReturnStatement */
function ReturnStatement(elts) {
	this.elts = elts;
}
exports.ReturnStatement = ReturnStatement;
ReturnStatement.prototype.astType = 'ReturnStatement';

ReturnStatement.prototype.validate = function(ctx) {
	if (this.elts.length === 3) {
		ctx = {declared: ctx.declared, program: ctx.program};
		this.elts[1].validate(ctx);
	}
}

/* ThrowStatement */
function ThrowStatement(elts) {
	this.elts = elts;
}
exports.ThrowStatement = ThrowStatement;
ThrowStatement.prototype.astType = 'ThrowStatement';

ThrowStatement.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.elts[1].validate(ctx);
}

/* ArgsList */
function ArgsList(elts) {
	this.elts = elts;
}
exports.ArgsList = ArgsList;
ArgsList.prototype.astType = 'ArgsList';

/* ExprList */
function ExprList(elts) {
	this.elts = elts;
}
exports.ExprList = ExprList;
ExprList.prototype.astType = 'ExprList';

ExprList.prototype.checkFormalParams = function() {
	var i, astType;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 2 === 0) {
			astType = this.elts[i].astType;
			if (astType !== 'IdentExpr' && astType !== 'PassExpr' && astType !== 'YadaExpr') {
				return false;
			}
		}
	}
	return true;
};

ExprList.prototype.declareArgs = function(ctx, noPassExpr) {
	var i, ident;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 2 === 0) {
			if (this.elts[i].astType === 'IdentExpr') {
				ident = this.elts[i].elts[0];
				if (ctx.declared[ident.text] === 1) {
					throw [ident, "'" + ident.text + "' is already declared in this scope"];
				}
				ctx.declared[ident.text] = 1;
			}
			else if (noPassExpr) {
				throw [this.elts[i], "arrow functions connot have @ or ... params"];
			}
			else if (this.elts[i].astType === 'YadaExpr') {
				ident = this.elts[i].elts[1];
				if (ctx.declared[ident.text] === 1) {
					throw [ident, "'" + ident.text + "' is already declared in this scope"];
				}
				ctx.declared[ident.text] = 1;
			}
			else if (this.elts[i].elts[1]) {
				ident = this.elts[i].elts[1];
				if (!ctx.declared[ident.text]) {
					throw [this.elts[i], "'" + ident.text + "' has not been declared"];
				}
				// we have to list the pass var as redeclared so it doesn't get hidden
				ctx.declared[ident.text] = 1;
			}
		}
	}
};

ExprList.prototype.validate = function(ctx) {
	var i;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 2 === 0) {
			this.elts[i].validate(ctx);
		}
	}
};

/* StringExpr */
function StringExpr(elts) {
	this.elts = elts;
}
exports.StringExpr = StringExpr;
StringExpr.prototype.astType = 'StringExpr';
StringExpr.prototype.validate = function(){};

/* NumberExpr */
function NumberExpr(elts) {
	this.elts = elts;
}
exports.NumberExpr = NumberExpr;
NumberExpr.prototype.astType = 'NumberExpr';
NumberExpr.prototype.validate = function(){};

/* NullExpr */
function NullExpr(elts) {
	this.elts = elts;
}
exports.NullExpr = NullExpr;
NullExpr.prototype.astType = 'NullExpr';
NullExpr.prototype.validate = function(){};

/* TrueFalseExpr */
function TrueFalseExpr(elts) {
	this.elts = elts;
}
exports.TrueFalseExpr = TrueFalseExpr;
TrueFalseExpr.prototype.astType = 'TrueFalseExpr';
TrueFalseExpr.prototype.validate = function(){};

/* IdentExpr */
function IdentExpr(elts) {
	this.elts = elts;
}
exports.IdentExpr = IdentExpr;
IdentExpr.prototype.astType = 'IdentExpr';

IdentExpr.prototype.validate = function(ctx) {
	if (!ctx.declared[this.elts[0].text]) {
		throw [this.elts[0], "'" + this.elts[0].text + "' has not been declared"];
	}
};

/* UnaryOpExpr */
function UnaryOpExpr(elts) {
	this.elts = elts;
}
exports.UnaryOpExpr = UnaryOpExpr;
UnaryOpExpr.prototype.astType = 'UnaryOpExpr';

UnaryOpExpr.prototype.validate = function(ctx) {
	ctx = {
		declared: ctx.declared,
		program: ctx.program
	};
	this.elts[1].validate(ctx);
};

/* BinaryOpExpr */
function BinaryOpExpr(elts) {
	this.elts = elts;
}
exports.BinaryOpExpr = BinaryOpExpr;
BinaryOpExpr.prototype.astType = 'BinaryOpExpr';

BinaryOpExpr.prototype.validate = function(ctx) {
	ctx = {
		declared: ctx.declared,
		program: ctx.program
	};
	this.elts[0].validate(ctx);
	this.elts[2].validate(ctx);
};

BinaryOpExpr.prototype.render = function() {
	var out = [
		render(this.elts[0])
	];
	if (this.elts[1].text === '==' || this.elts[1].text === '!=') {
		out.push(this.elts[1].text + '=' + this.elts[1].whitespace);
	}
	else {
		out.push(render(this.elts[1]));
	}
	out.push(render(this.elts[2]));
	return out.join('');
};

/* TernaryOpExpr */
function TernaryOpExpr(elts) {
	this.elts = elts;
}
exports.TernaryOpExpr = TernaryOpExpr;
TernaryOpExpr.prototype.astType = 'TernaryOpExpr';

TernaryOpExpr.prototype.validate = function(ctx) {
	ctx = {
		declared: ctx.declared,
		program: ctx.program
	};
	this.elts[0].validate(ctx);
	this.elts[2].validate(ctx);
	this.elts[4].validate(ctx);
};

/* InvokeExpr */
function InvokeExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[0];
	this.ident = elts[2];
	this.args = elts[4];
}
exports.InvokeExpr = InvokeExpr;
InvokeExpr.prototype.astType = 'InvokeExpr';

InvokeExpr.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.targetExpr.validate(ctx);
	this.args.validate(ctx);
};

/* CallExpr */
function CallExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[0];
	this.args = elts[2];
}
exports.CallExpr = CallExpr;
CallExpr.prototype.astType = 'CallExpr';

CallExpr.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.targetExpr.validate(ctx);
	this.args.validate(ctx);
};

/* IndexExpr */
function IndexExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[0];
	this.subExpr = elts[2];
}
exports.IndexExpr = IndexExpr;
IndexExpr.prototype.astType = 'IndexExpr';

IndexExpr.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.targetExpr.validate(ctx);
	this.subExpr.validate(ctx);
};

/* PropertyExpr */
function PropertyExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[0];
}
exports.PropertyExpr = PropertyExpr;
PropertyExpr.prototype.astType = 'PropertyExpr';

PropertyExpr.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.targetExpr.validate(ctx);
};

/* PrototypePropertyExpr */
function PrototypePropertyExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[0];
}
exports.PrototypePropertyExpr = PrototypePropertyExpr;
PrototypePropertyExpr.prototype.astType = 'PrototypePropertyExpr';

PrototypePropertyExpr.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.targetExpr.validate(ctx);
};

PrototypePropertyExpr.prototype.render = function() {
	var out = [
		render(this.elts[0]),
		'.prototype',
		this.elts[1].whitespace
	];
	if (this.elts.length === 3) {
		out.push('.');
		out.push(render(this.elts[2]));
	}
	return out.join('');
};

/* NewExpr */
function NewExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[1];
	this.args = elts[3];
}
exports.NewExpr = NewExpr;
NewExpr.prototype.astType = 'NewExpr';

NewExpr.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	this.targetExpr.validate(ctx);
	this.args.validate(ctx);
};

/* FunctionExpr */
function FunctionExpr(elts, thisElts) {
	this.elts = elts;
	this.args = elts[2];
	this.block = elts[4];
	this.thisElts = thisElts;
}
exports.FunctionExpr = FunctionExpr;
FunctionExpr.prototype.astType = 'FunctionExpr';

FunctionExpr.prototype.validate = function(ctx) {
	ctx = {declared: newDeclaredVars(ctx.declared), varOk: true, program: ctx.program};
	this.args.declareArgs(ctx);
	if (this.thisElts) {
		if (ctx.declared[this.thisElts[1].text] === 1) {
			throw [this.thisElts[1], "'" + this.thisElts[1].text + "' is already declared in this scope"];
		}
		ctx.declared[this.thisElts[1].text] = 1;
	}
	this.block.declare(ctx);
	this.block.validate(ctx);
};

FunctionExpr.prototype.render = function(ctx) {
	var out = [render(this.elts[0]), render(this.elts[1])];
	var i;
	var args = this.args;
	var block = this.block;
	var hasPassExpr = false;
	var errIdent;
	var hasYadaExpr = false;
	var yadaIdent;
	var yadaIndex;
	for (i = 0; i < args.elts.length; i++) {
		if (i % 2 === 0) {
			if (args.elts[i].astType === 'PassExpr') {
				hasPassExpr = true;
				errIdent = args.elts[i].elts[1];
				out.push('__err');
			}
			else if (args.elts[i].astType === 'YadaExpr') {
				hasYadaExpr = true;
				yadaIdent = args.elts[i].elts[1];
				yadaIndex = i / 2;
				out.push(args.elts[i].elts[0].whitespace);
				out.push(render(args.elts[i].elts[1]));
			}
			else {
				out.push(render(args.elts[i]));
			}
		}
		else {
			out.push(render(args.elts[i]));
		}
	}
	
	out.push(render(this.elts[3]));
	
	if (this.thisElts) {
		out.push(this.thisElts[0].whitespace);
		out.push(this.thisElts[1].whitespace);
	}
	
	out.push(block.elts[0].text);
	
	if (hasPassExpr) {
		if (errIdent) {
			out.push(" if (__err) { " + errIdent.text + "(__err); return; }");
		}
		else {
			out.push(" if (__err) { throw __err; }");
		}
	}
	
	if (this.thisElts) {
		out.push(" var " + this.thisElts[1].text + " = this;");
	}
	
	if (hasYadaExpr) {
		out.push(" " + yadaIdent.text + " = [].slice.call(arguments, " + yadaIndex + ");");
	}
	
	out.push(block.elts[0].whitespace);
	for (i = 1; i < block.elts.length; i++) {
		out.push(render(block.elts[i]));
	}
	
	return out.join('');
};

/* ArrowFunctionExpr */
function ArrowFunctionExpr(elts) {
	this.elts = elts;
	this.args = elts[2];
	this.expr = elts[5];
}
exports.ArrowFunctionExpr = ArrowFunctionExpr;
ArrowFunctionExpr.prototype.astType = 'ArrowFunctionExpr';

ArrowFunctionExpr.prototype.validate = function(ctx) {
	ctx = {declared: newDeclaredVars(ctx.declared), varOk: true, program: ctx.program};
	this.args.declareArgs(ctx, true);
	this.expr.validate(ctx);
};

ArrowFunctionExpr.prototype.render = function(ctx) {
	var out = [render(this.elts[0]), render(this.elts[1]), render(this.elts[2]), render(this.elts[3]), '{' + this.elts[4].whitespace, 'return ', render(this.expr), '; }'];
	
	return out.join('');
};

/* SimpleArrowFunctionExpr */
function SimpleArrowFunctionExpr(elts) {
	this.elts = elts;
	this.expr = elts[1];
}
exports.SimpleArrowFunctionExpr = SimpleArrowFunctionExpr;
SimpleArrowFunctionExpr.prototype.astType = 'SimpleArrowFunctionExpr';

SimpleArrowFunctionExpr.prototype.validate = function(ctx) {
	ctx = {declared: newDeclaredVars(ctx.declared), varOk: true, program: ctx.program};
	ctx.declared['_'] = 1;
	this.expr.validate(ctx);
};

SimpleArrowFunctionExpr.prototype.render = function(ctx) {
	var out = ['function (_) {', this.elts[0].whitespace, 'return ', render(this.expr), '; }'];
	return out.join('');
};

/* ArrayExpr */
function ArrayExpr(elts) {
	this.elts = elts;
}
exports.ArrayExpr = ArrayExpr;
ArrayExpr.prototype.astType = 'ArrayExpr';

ArrayExpr.prototype.validate = function(ctx) {
	this.elts[1].validate({declared: ctx.declared});
};

/* ObjectExpr */
function ObjectExpr(elts) {
	this.elts = elts;
}
exports.ObjectExpr = ObjectExpr;
ObjectExpr.prototype.astType = 'ObjectExpr';

ObjectExpr.prototype.validate = function(ctx) {
	ctx = {declared: ctx.declared, program: ctx.program};
	var i;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 4 === 3) {
			this.elts[i].validate(ctx);
		}
	}
};

ObjectExpr.prototype.render = function() {
	var out = [], i;
	for (i = 0; i < this.elts.length; i++) {
		if (i === (this.elts.length - 2) && this.elts[i].text === ',') {
			out.push(this.elts[i].whitespace);
		}
		else {
			out.push(render(this.elts[i]));
		}
	}
	return out.join('');
};

/* GroupExpr */
function GroupExpr(elts) {
	this.elts = elts;
}
exports.GroupExpr = GroupExpr;
GroupExpr.prototype.astType = 'GroupExpr';

GroupExpr.prototype.validate = function(ctx) {
	this.elts[1].validate(ctx);
};

/* PassExpr */
function PassExpr(elts) {
	this.elts = elts;
}
exports.PassExpr = PassExpr;
PassExpr.prototype.astType = 'PassExpr';

PassExpr.prototype.validate = function(ctx) {
	throw [this.elts[0], "invalid expression beginning with '@'"]
};

/* YadaExpr */
function YadaExpr(elts) {
	this.elts = elts;
}
exports.YadaExpr = YadaExpr;
YadaExpr.prototype.astType = 'YadaExpr';

YadaExpr.prototype.validate = function(ctx) {
	throw [this.elts[0], "invalid expression ending with '...'"]
};

/* IncludePragma */
function IncludePragma(elts) {
	this.elts = elts;
}
exports.IncludePragma = IncludePragma;
IncludePragma.prototype.astType = 'IncludePragma';

IncludePragma.prototype.pragma = function(ctx) {
	var i;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 2 === 1) {
			ctx.declared[this.elts[i].text] = 1;
			ctx.included[this.elts[i].text] = true;
		}
	}
};

IncludePragma.prototype.validate = function(ctx) {
	if (!ctx.pragmaOk) {
		throw [this.elts[0], "#include is only allowed at the top-level of the program"];
	}
};

IncludePragma.prototype.render = function() {
	var out = ['/* '], i;
	for (i = 0; i < this.elts.length; i++) {
		out.push(this.elts[i].text);
		if (i % 2 === 0) {
			out.push(' ');
		}
	}
	out.push('*/');
	for (i = 0; i < this.elts.length; i++) {
		out.push(this.elts[i].whitespace);
	}
	return out.join('');
};

/* DeclarePragma */
function DeclarePragma(elts) {
	this.elts = elts;
}
exports.DeclarePragma = DeclarePragma;
DeclarePragma.prototype.astType = 'DeclarePragma';

DeclarePragma.prototype.pragma = function(ctx) {
	var i, j, text, tags;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 2 === 1) {
			text = this.elts[i].text;
			if (text.charAt(0) === ':') {
				tags = declareTags[text];
				if (!tags) {
					throw [this.elts[i], "invalid declaration group '" + text + "'"];
				}
				for (j = 0; j < tags.length; j++) {
					ctx.declared[tags[j]] = 1;
				}
			}
			else {
				ctx.declared[text] = 1;
			}
		}
	}
};

DeclarePragma.prototype.validate = function(ctx) {
	if (!ctx.pragmaOk) {
		throw [this.elts[0], "#declare is only allowed at the top-level of the program"];
	}
};

DeclarePragma.prototype.render = IncludePragma.prototype.render;

var declareTags = {};

declareTags[':standard'] = [
	'arguments',
	'Array',
    'Boolean',
    'Date',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent',
    'Error',
    'eval',
    'EvalError',
    'Function',
    'hasOwnProperty',
    'isFinite',
    'isNaN',
    'JSON',
    'Math',
    'Number',
    'Object',
    'parseInt',
    'parseFloat',
    'RangeError',
    'ReferenceError',
    'RegExp',
    'String',
    'SyntaxError',
    'TypeError',
    'URIError'
];

declareTags[':node'] = declareTags[':standard'].concat(
	'__filename',
    '__dirname',
    'Buffer',
    'console',
    'exports',
    'GLOBAL',
    'global',
    'module',
    'process',
    'require',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval'
);

declareTags[':browser'] = declareTags[':standard'].concat(
	'ArrayBuffer',
    'ArrayBufferView',
    'Audio',
    'addEventListener',
    'applicationCache',
    'blur',
    'clearInterval',
    'clearTimeout',
    'close',
    'closed',
    'DataView',
    'defaultStatus',
    'document',
    'event',
    'FileReader',
    'Float32Array',
    'Float64Array',
    'FormData',
    'focus',
    'frames',
    'getComputedStyle',
    'HTMLElement',
    'HTMLAnchorElement',
    'HTMLBaseElement',
    'HTMLBlockquoteElement',
    'HTMLBodyElement',
    'HTMLBRElement',
    'HTMLButtonElement',
    'HTMLCanvasElement',
    'HTMLDirectoryElement',
    'HTMLDivElement',
    'HTMLDListElement',
    'HTMLFieldSetElement',
    'HTMLFontElement',
    'HTMLFormElement',
    'HTMLFrameElement',
    'HTMLFrameSetElement',
    'HTMLHeadElement',
    'HTMLHeadingElement',
    'HTMLHRElement',
    'HTMLHtmlElement',
    'HTMLIFrameElement',
    'HTMLImageElement',
    'HTMLInputElement',
    'HTMLIsIndexElement',
    'HTMLLabelElement',
    'HTMLLayerElement',
    'HTMLLegendElement',
    'HTMLLIElement',
    'HTMLLinkElement',
    'HTMLMapElement',
    'HTMLMenuElement',
    'HTMLMetaElement',
    'HTMLModElement',
    'HTMLObjectElement',
    'HTMLOListElement',
    'HTMLOptGroupElement',
    'HTMLOptionElement',
    'HTMLParagraphElement',
    'HTMLParamElement',
    'HTMLPreElement',
    'HTMLQuoteElement',
    'HTMLScriptElement',
    'HTMLSelectElement',
    'HTMLStyleElement',
    'HTMLTableCaptionElement',
    'HTMLTableCellElement',
    'HTMLTableColElement',
    'HTMLTableElement',
    'HTMLTableRowElement',
    'HTMLTableSectionElement',
    'HTMLTextAreaElement',
    'HTMLTitleElement',
    'HTMLUListElement',
    'HTMLVideoElement',
    'history',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'Image',
    'length',
    'localStorage',
    'location',
    'moveBy',
    'moveTo',
    'name',
    'navigator',
    'onbeforeunload',
    'onblur',
    'onerror',
    'onfocus',
    'onload',
    'onresize',
    'onunload',
    'open',
    'openDatabase',
    'opener',
    'Option',
    'parent',
    'print',
    'removeEventListener',
    'resizeBy',
    'resizeTo',
    'screen',
    'scroll',
    'scrollBy',
    'scrollTo',
    'sessionStorage',
    'setInterval',
    'setTimeout',
    'SharedWorker',
    'status',
    'top',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'WebSocket',
    'window',
    'Worker',
    'XMLHttpRequest',
    'XPathEvaluator',
    'XPathException',
    'XPathExpression',
    'XPathNamespace',
    'XPathNSResolver',
    'XPathResult'
);
