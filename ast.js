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

var builtins = require('./builtins');

function newDeclaredVars(v) {
	var v2 = {};
	var key;
	for (key in v) {
		if (v.hasOwnProperty(key)) {
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
	this.needsBuiltins = {};
}
exports.Program = Program;
Program.prototype.validate = function() {
	var ctx = {
		program: this,
		declaredVars: {
			console: 2,
			Buffer: 2,
			global: 2,
			module: 2,
			exports: 2,
			setTimeout: 2,
			clearTimeout: 2,
			setInterval: 2,
			clearInterval: 2,
			require: 2,
			process: 2,
			JSON: 2,
			Error: 2,
			Array: 2,
			Boolean: 2,
			Date: 2,
			Function: 2,
			Iterator: 2,
			Number: 2,
			Object: 2,
			RegExp: 2,
			String: 2,
			undefined: 2,
			Math: 2,
			encodeURIComponent: 2,
			decodeURIComponent: 2
		},
		varOk: true
	};
	var i;
	for (i = 0; i < this.elts.length; i++) {
		if (this.elts[i].declare) {
			this.elts[i].declare(ctx);
		}
	}
	for (i = 0; i < this.elts.length; i++) {
		this.elts[i].validate(ctx);
	}
};

Program.prototype.render = function() {
	var out = [
		this.preamble,
		render({elts: this.elts})
	];
	var k;
	for (k in this.needsBuiltins) {
		if (this.needsBuiltins.hasOwnProperty(k)) {
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

IfStatement.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
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

WhileStatement.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
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

ForStatement.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
	this.initExprs.validate(ctx);
	this.testExprs.validate(ctx);
	this.postExprs.validate(ctx);
};

/* ExprStatement */
function ExprStatement(elts) {
	this.elts = elts;
}
exports.ExprStatement = ExprStatement;

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

LabeledStatement.prototype.validate = function(ctx) {
	this.elts[2].validate(ctx);
};

/* FunctionStatement */
function FunctionStatement(elts, thisElt) {
	this.elts = elts;
	this.ident = elts[0];
	this.args = elts[2];
	this.block = elts[4];
	this.thisElt = thisElt;
}
exports.FunctionStatement = FunctionStatement;

FunctionStatement.prototype.declare = function(ctx) {
	var identText = this.ident.elts[0].text;
	if (ctx.declaredVars[identText] === 1) {
		// already declared
		throw [this.ident, "'" + identText + "' is already declared in this scope"];
	}
	else {
		ctx.declaredVars[identText] = 1;
	}
};

FunctionStatement.prototype.validate = function(ctx) {
	if (!ctx.varOk) {
		throw [this.elts[0], "functions may only be declared in the top-level of the program or directly within other functions"];
	}
	ctx = {declaredVars: newDeclaredVars(ctx.declaredVars), varOk: true, program: ctx.program};
	this.args.declareArgs(ctx);
	if (this.thisElt) {
		if (ctx.declaredVars[this.thisElt.text] === 1) {
			throw [this.thisElt, "'" + this.thisElt.text + "' is already declared in this scope"];
		}
		ctx.declaredVars[this.thisElt.text] = 1;
	}
	this.block.declare(ctx);
	this.block.validate(ctx);
};

FunctionStatement.prototype.render = function(ctx) {
	var out = ['function ', render(this.elts[0]), render(this.elts[1])];
	var i;
	var args = this.args;
	var block = this.block;
	var hasPassExpr = false;
	var errIdent;
	for (i = 0; i < args.elts.length; i++) {
		if (i % 2 === 0) {
			if (args.elts[i].isPassExpr) {
				hasPassExpr = true;
				errIdent = args.elts[i].elts[1];
				out.push('__err');
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
	
	if (this.thisElt) {
		out.push(this.thisElt.whitespace);
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
	
	if (this.thisElt) {
		out.push(" var " + this.thisElt.text + " = this;");
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

VarStatement.prototype.declare = function(ctx) {
	var exprElts = this.elts[1].elts;
	var i, expr, ident;
	for (i = 0; i < exprElts.length; i++) {
		if (i % 2 === 0) {
			expr = exprElts[i];
			if (expr.isIdent) {
				ident = expr.elts[0];
			}
			else {
				if (!expr.isBinOp || !expr.elts[1].type === '=' || !expr.elts[0].isIdent) {
					throw [expr.elts[0], "invalid expression in var statement"];
				}
				ident = expr.elts[0].elts[0];
			}
			if (ctx.declaredVars[ident.text] === 1) {
				// already declared
				throw [ident, "'" + ident.text + "' is already declared in this scope"];
			}
			else {
				ctx.declaredVars[ident.text] = 1;
			}
		}
	}
};

VarStatement.prototype.validate = function(ctx) {
	if (!ctx.varOk) {
		throw [this.elts[0], "vars may only be declared in the top-level of the program or directly within functions"];
	}
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
	this.elts[1].validate(ctx);
};

/* ReturnStatement */
function ReturnStatement(elts) {
	this.elts = elts;
}
exports.ReturnStatement = ReturnStatement;

ReturnStatement.prototype.validate = function(ctx) {
	if (this.elts.length === 3) {
		ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
		this.elts[1].validate(ctx);
	}
}

/* ThrowStatement */
function ThrowStatement(elts) {
	this.elts = elts;
}
exports.ThrowStatement = ThrowStatement;

ThrowStatement.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
	this.elts[1].validate(ctx);
}

/* ArgsList */
function ArgsList(elts) {
	this.elts = elts;
}
exports.ArgsList = ArgsList;

/* ExprList */
function ExprList(elts) {
	this.elts = elts;
}
exports.ExprList = ExprList;
ExprList.prototype.checkFormalParams = function() {
	var i;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 2 === 0 && !this.elts[i].isFormalParam) {
			return false;
		}
	}
	return true;
};

ExprList.prototype.declareArgs = function(ctx, noPassExpr) {
	var i, ident;
	for (i = 0; i < this.elts.length; i++) {
		if (i % 2 === 0) {
			if (this.elts[i].isIdent) {
				ident = this.elts[i].elts[0];
				if (ctx.declaredVars[ident.text] === 1) {
					throw [ident, "'" + ident.text + "' is already declared in this scope"];
				}
				ctx.declaredVars[ident.text] = 1;
			}
			else if (noPassExpr) {
				throw [this.elts[i], "arrow functions connot have error passing params"];
			}
			else if (this.elts[i].elts[1]) {
				ident = this.elts[i].elts[1];
				if (!ctx.declaredVars[ident.text]) {
					throw [this.elts[i], "'" + ident.text + "' has not been declared"];
				}
				// we have to list the pass var as redeclared so it doesn't get hidden
				ctx.declaredVars[ident.text] = 1;
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
StringExpr.prototype.validate = function(){};

/* NumberExpr */
function NumberExpr(elts) {
	this.elts = elts;
}
exports.NumberExpr = NumberExpr;
NumberExpr.prototype.validate = function(){};

/* NullExpr */
function NullExpr(elts) {
	this.elts = elts;
}
exports.NullExpr = NullExpr;
NullExpr.prototype.validate = function(){};

/* TrueFalseExpr */
function TrueFalseExpr(elts) {
	this.elts = elts;
}
exports.TrueFalseExpr = TrueFalseExpr;
TrueFalseExpr.prototype.validate = function(){};

/* IdentExpr */
function IdentExpr(elts) {
	this.elts = elts;
}
exports.IdentExpr = IdentExpr;
IdentExpr.prototype.isIdent = true;
IdentExpr.prototype.isLvalue = true;
IdentExpr.prototype.isLabel = true;
IdentExpr.prototype.isFormalParam = true;

IdentExpr.prototype.validate = function(ctx) {
	if (!ctx.declaredVars[this.elts[0].text]) {
		if (builtins.hasOwnProperty(this.elts[0].text)) {
			ctx.program.needsBuiltins[this.elts[0].text] = true;
		}
		else {
			throw [this.elts[0], "'" + this.elts[0].text + "' has not been declared"];
		}
	}
};

/* UnaryOpExpr */
function UnaryOpExpr(elts) {
	this.elts = elts;
}
exports.UnaryOpExpr = UnaryOpExpr;

UnaryOpExpr.prototype.validate = function(ctx) {
	ctx = {
		declaredVars: ctx.declaredVars,
		program: ctx.program
	};
	this.elts[1].validate(ctx);
};

/* BinaryOpExpr */
function BinaryOpExpr(elts) {
	this.elts = elts;
}
exports.BinaryOpExpr = BinaryOpExpr;
BinaryOpExpr.prototype.isBinOp = true;

BinaryOpExpr.prototype.validate = function(ctx) {
	ctx = {
		declaredVars: ctx.declaredVars,
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

/* InvokeExpr */
function InvokeExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[0];
	this.ident = elts[2];
	this.args = elts[4];
}
exports.InvokeExpr = InvokeExpr;

InvokeExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
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
CallExpr.prototype.checkFuncSpec = function() {
	return this.args.checkFormalParams();
};

CallExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
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
IndexExpr.prototype.isLvalue = true;

IndexExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
	this.targetExpr.validate(ctx);
	this.subExpr.validate(ctx);
};

/* PropertyExpr */
function PropertyExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[0];
}
exports.PropertyExpr = PropertyExpr;
PropertyExpr.prototype.isLvalue = true;

PropertyExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
	this.targetExpr.validate(ctx);
};

/* NewExpr */
function NewExpr(elts) {
	this.elts = elts;
	this.targetExpr = elts[1];
	this.args = elts[3];
}
exports.NewExpr = NewExpr;

NewExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
	this.targetExpr.validate(ctx);
	this.args.validate(ctx);
};

/* FunctionExpr */
function FunctionExpr(elts, thisElt) {
	this.elts = elts;
	this.args = elts[1];
	this.block = elts[3];
	this.thisElt = thisElt;
}
exports.FunctionExpr = FunctionExpr;

FunctionExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: newDeclaredVars(ctx.declaredVars), varOk: true, program: ctx.program};
	this.args.declareArgs(ctx);
	if (this.thisElt) {
		if (ctx.declaredVars[this.thisElt.text] === 1) {
			throw [this.thisElt, "'" + this.thisElt.text + "' is already declared in this scope"];
		}
		ctx.declaredVars[this.thisElt.text] = 1;
	}
	this.block.declare(ctx);
	this.block.validate(ctx);
};

FunctionExpr.prototype.render = function(ctx) {
	var out = ['function ', render(this.elts[0])];
	var i;
	var args = this.args;
	var block = this.block;
	var hasPassExpr = false;
	var errIdent;
	for (i = 0; i < args.elts.length; i++) {
		if (i % 2 === 0) {
			if (args.elts[i].isPassExpr) {
				hasPassExpr = true;
				errIdent = args.elts[i].elts[1];
				out.push('__err');
			}
			else {
				out.push(render(args.elts[i]));
			}
		}
		else {
			out.push(render(args.elts[i]));
		}
	}
	
	out.push(render(this.elts[2]));
	
	if (this.thisElt) {
		out.push(this.thisElt.whitespace);
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
	
	if (this.thisElt) {
		out.push(" var " + this.thisElt.text + " = this;");
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
	this.args = elts[1];
	this.expr = elts[4];
}
exports.ArrowFunctionExpr = ArrowFunctionExpr;

ArrowFunctionExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: newDeclaredVars(ctx.declaredVars), varOk: true, program: ctx.program};
	this.args.declareArgs(ctx, true);
	this.expr.validate(ctx);
};

ArrowFunctionExpr.prototype.render = function(ctx) {
	var out = ['function ', render(this.elts[0]), render(this.elts[1]), render(this.elts[2]), '{' + this.elts[3].whitespace, 'return ', render(this.expr), '; }'];
	
	return out.join('');
};

/* SimpleArrowFunctionExpr */
function SimpleArrowFunctionExpr(elts) {
	this.elts = elts;
	this.expr = elts[1];
}
exports.SimpleArrowFunctionExpr = SimpleArrowFunctionExpr;

SimpleArrowFunctionExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: newDeclaredVars(ctx.declaredVars), varOk: true, program: ctx.program};
	ctx.declaredVars['_'] = 1;
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

ArrayExpr.prototype.validate = function(ctx) {
	this.elts[1].validate({declaredVars: ctx.declaredVars});
};

/* ObjectExpr */
function ObjectExpr(elts) {
	this.elts = elts;
}
exports.ObjectExpr = ObjectExpr;

ObjectExpr.prototype.validate = function(ctx) {
	ctx = {declaredVars: ctx.declaredVars, program: ctx.program};
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

GroupExpr.prototype.validate = function(ctx) {
	this.elts[1].validate(ctx);
};

/* PassExpr */
function PassExpr(elts) {
	this.elts = elts;
}
exports.PassExpr = PassExpr;
PassExpr.prototype.isFormalParam = true;
PassExpr.prototype.isPassExpr = true;
