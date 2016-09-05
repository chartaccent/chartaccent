{
    function flatten(vars) {
        if(vars instanceof Array) {
            var r = "";
            for(var i = 0; i < vars.length; i++)
                r += flatten(vars[i]);
            return r;
        } else return vars || "";
    }
    function gen_operator(left, others) {
        var r = left;
        for(var i = 0; i < others.length; i++) {
            var op = flatten(others[i][1]);
            var rh = others[i][3];
            r = CreateOperator(op, r, rh);
        }
        return r;
    }
}

start
  = expression

string_start
  = stringexpr

stringexpr_item
  = str:[^{}]+
    { return new Expression.String(flatten(str)); }
  / "{" expr:expression "}"
    { return expr; }

stringexpr
  = names:(stringexpr_item)*
    { return new Expression.StringExpression(names); }

expression
  = sp expr:level_expression sp
    { return expr; }

level_expression
  = expr:levelm0
    { return expr; }

logic_operators = "and" / "or"
compare_operators = ">=" / ">" / "<=" / "<" / "==" / "!=" / "in"

levelm0
  = "not" sp expr:levelm0
    { return CreateOperator("not", expr); }
  / left:level0 others:( sp logic_operators sp level0 )*
    { return gen_operator(left, others); }

level0
  = left:level1 others:( sp compare_operators sp level1 )*
    { return gen_operator(left, others); }

level1
  = left:level2 others:( sp [+\&-] sp level2 )*
    { return gen_operator(left, others); }

level2
  = left:level3 others:( sp [*/] sp level3 )*
    { return gen_operator(left, others); }

level3
  = left:level4 others:( sp [\^] sp level4 )*
    { return gen_operator(left, others); }

level4
  = item
  / op:[-] expr:item
    {
        var k = "unary:" + op;
        return CreateOperator(k, expr);
    }

item
  = primitive
  / function_call
  / function_apply
  / subscription
  / range_expr
  / variable
  / "(" sp expr:levelm0 sp ")" { return expr; }

funcitem
  = variable
  / "(" sp expr:levelm0 sp ")" { return expr; }

variable
  = name:variable_name { return new Expression.Variable(name); }

argitem
  = name:kw_name sp "=" sp expr:level_expression
    { return [ name, expr ] }
  / expr:level_expression
    { return [ expr ] }

argitems
  = expr:argitem sp "," sp other:argitems
    { return [ expr ].concat(other) }
  / expr:argitem
    { return [ expr ] }

argitem_list
  = "(" sp source_args:argitems sp ")"
    {
      var args = [];
      var kwargs_map = { };
      for(var i = 0; i < source_args.length; i++) {
        if(source_args[i].length == 2) {
          kwargs_map[source_args[i][0]] = source_args[i][1];
        } else {
          args.push(source_args[i][0]);
        }
      }
      return [ args, kwargs_map ];
    }
  / "(" sp ")"
    { return [ [], {} ]; }

function_call
  = funcitem:funcitem sp arglist:argitem_list
    { return new Expression.Function(funcitem, arglist[0], arglist[1]); }

function_apply
  = funcitem:funcitem sp "@" sp arglist:argitem_list
    { return new Expression.FunctionApply(funcitem, arglist[0], arglist[1]); }

subscription
  = funcitem:funcitem sp "[" sp expr:level_expression sp "]"
    { return new Expression.Subscription(funcitem, expr); }
  / "[" sp expr:level_expression sp "]"
    { return new Expression.Subscription(new Expression.Variable("data"), expr); }

range_expr
  = "[" sp expr1:level_expression sp ".." sp expr2:level_expression sp "]"
    { return new Expression.Function(new Expression.Variable("range"), [expr1, expr2], {}) }

primitive
  = floating_point
  / boolean
  / string

floating_point
  = str:([+-]? [0-9]+ ("." [0-9]+)? ([eE] [+-]? [0-9]+)?)
    { return new Expression.Number(parseFloat(flatten(str))); }

boolean
  = "true"
    { return new Expression.Boolean(true); }
  / "false"
    { return new Expression.Boolean(false); }

string
  = repr:("\"" [^"]* "\"")
    { var str = JSON.parse(flatten(repr)); return new Expression.String(str); }

kw_name
  = name:([a-zA-Z_][a-zA-Z0-9_]*) { return flatten(name); }

variable_name
  = name:([a-zA-Z_][a-zA-Z0-9_]*) { return flatten(name); }

sp
  = [ \n]*
