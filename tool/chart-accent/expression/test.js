Expression.Test = function(tester) {
    var test_cases = [
        [ "1 + 2 * 3 - 4 - (-7 + 5 * 6)", -20 ],
        [ "-3 + 5", 2 ],
        [ "-5^3", -125 ],
        [ "--5^3", 125 ],
        [ "3--5^3", 128 ],
        [ "3-(-5)^3", 128 ],
        [ "a + b + sum(1,2,3,4) - (1+2-3*4)", 30 ],
        [ '"The value of a is: " & a', "The value of a is: 1" ],
        [ "1 + 2 < 3 + 4", true ],
        [ "1 + 2 == 3 + 4 - 4", true ],
        [ "1 + 2 == 3 + 4", false ],
        [ "3 * 4 <= 4 * 3", true ],
        [ "3 > 1 and 5 < 8 ", true ],
        [ "not a == 1", false ],
        [ "true == (a == 1)", true ],
        [ "false == (a == 1)", false ],
        [ "min(1,2,3,4) == 1 and max(1,2,3,4,5) != 4", true ],
        [ "mean(1,2,3,4)", 2.5 ],
        [ "value + 5", 13 ],
        [ "sum(filter=3)", 0 ],
        [ "range(max=1, min = 3+5)", [ 8, 1 ] ],
        [ "mean(1,2,3,4,filter=true)", 2.5 ],
        [ 'max@(value, [key == "A"])', 1 ],
        [ 'max@(value)', 3 ],
        [ '[key == "A"]', [ { key: "A", value: 1 } ] ]
    ]

    var string_test_cases = [
        [ 'This is value: {value}', "This is value: 8" ]
    ];

    var context = Expression.CreateContext({
        a: 1, b: 10,
        value: 8,
        data: [
            { key: "A", value: 1 },
            { key: "B", value: 2 },
            { key: "C", value: 3 }
        ]
    });

    test_cases.forEach(function(ci) {
        var expr = ci[0];
        var expected = ci[1];

        try {
            var e = new Expression.parse(expr);
        } catch(exception) {
            console.log(ci, exception);
            return;
        }
        var returned = e.eval(context);
        tester.deepEqual(returned, expected, expr);
    });

    tester.ok(Expression.isValue(Expression.parse('1')));
    tester.ok(Expression.isValue(Expression.parse('1+3')) == false);
    tester.ok(Expression.isValue(Expression.parse('"test"')) == true);
    tester.done();
};
