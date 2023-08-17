// * OPTION 1: Deno
// import { assertEquals } from "https://deno.land/std@0.182.0/testing/asserts.ts";
// const test = Deno.test;
// * OPTION 2: Bun
import { expect, test } from "bun:test";
const assertEquals = (a, b) => expect(a).toEqual(b);


import { attr, c, cls, css, hook, on, prop, Element as VNode } from "./dom.js";
import { rRef, rVal } from './chain.js';
import { launch } from './builder.js';

const Element = (tag, classes, ...children) => {
  let result = new VNode(tag, { }, children);
  if (classes?.length) result.data.classes = new Set(classes);
  return result;
};

function render(fn) {
  let el = { children: [] };
  launch(fn, el);
  return el.children[0];
}

function norm(e) {
  if (e instanceof VNode) {
    e.children = e.children.map(norm);
    if (e.data.classes?.size === 0) delete e.data.classes;
  }
  else if (typeof e === "string") e = { text: e };
  return e;
}

function compare(name, form, expected) {
  test(name, () => {
    let res = render(form);
    assertEquals(norm(res), norm(expected));
  });
}

compare("plain call", c("Text content"), Element("div", [], "Text content"));
compare(
  "single class",
  c.cls1("Text content"),
  Element("div", ["cls1"], "Text content"),
);
compare(
  "single tag",
  c.Span("Text content"),
  Element("span", [], "Text content"),
);
compare(
  "multiple classes",
  c.cls1.cls2.cls3("Text content"),
  Element("div", ["cls1", "cls2", "cls3"], "Text content"),
);
compare(
  "multiple tags",
  c.Span.Def("Text content"),
  Element("def", [], "Text content"),
);
compare(
  "mixture of tags and classes, tags first",
  c.Span.cls1.Def.cls2("Text content"),
  Element("def", ["cls1", "cls2"], "Text content"),
);
compare(
  "mixture of tags and classes, classes first",
  c.cls1.Span.cls2.Def("Text content"),
  Element("def", ["cls1", "cls2"], "Text content"),
);
compare(
  "mixture of tags and classes, multiple clauses",
  c.cls1.Span.cls2.Def("Text content").cls3().cls4("Second"),
  Element(
    "def",
    ["cls1", "cls2", "cls3", "cls4"],
    "Text content",
    "Second",
  ),
);
compare(
  "mixture of tags and classes, kebab case",
  c.specialClass.MyElement.manyBrightHighlights
    .MyListEditor("Text content")
    .largeFont().singleBlackBorder("Second"),
  Element(
    "my-list-editor",
    [
      "special-class",
      "many-bright-highlights",
      "large-font",
      "single-black-border",
    ],
    "Text content",
    "Second",
  ),
);

compare(
  "nesting",
  c(c.child1("First"), "Text content", c.child2("Second")),
  Element(
    "div",
    [],
    Element("div", ["child1"], "First"),
    "Text content",
    Element("div", ["child2"], "Second"),
  ),
);

compare(
  "fragments",
  (() => {
    let frag = ["Hello", c.inner("~"), "World"];
    return c(c.child1("First"), frag, "Text content", frag, c.child2("Second"));
  })(),
  Element(
    "div",
    [],
    Element("div", ["child1"], "First"),
    "Hello",
    Element("div", ["inner"], "~"),
    "World",
    "Text content",
    "Hello",
    Element("div", ["inner"], "~"),
    "World",
    Element("div", ["child2"], "Second"),
  ),
);

function elm(ps, ...children) {
  if (ps?.classes) ps.classes = new Set(ps.classes);
  let elm = Element("div", [], ...children);
  Object.assign(elm.data, ps);
  return elm;
}

test("fragments carrying modifiers", () => {
  let frag = [
    "Hello",
    c.inner("~"),
    prop.y(2),
    cls.special,
    "World",
    prop.x("y").z("w"),
  ];
  let res = render(
    c(c.child1("First"), frag, "Text content", frag, c.child2("Second")),
  );
  assertEquals(
    res,
    norm(
      elm(
        { classes: ["special"], props: { x: "y", y: 2, z: "w" } },
        Element("div", ["child1"], "First"),
        "Hello",
        Element("div", ["inner"], "~"),
        "World",
        "Text content",
        "Hello",
        Element("div", ["inner"], "~"),
        "World",
        Element("div", ["child2"], "Second"),
      ),
    ),
  );
});

compare("prop", c(prop.x("y")), elm({ props: { x: "y" } }));

test("handlers", () => {
  function f() {}
  function g() {}
  function h() {}
  let res = render(c(on.a.b(f).c.b(g, h)));
  assertEquals(res, norm(elm({ on: { a: [f], b: [f, g, h], c: [g, h] } })));
});

compare(
  "classes",
  c(
    cls.a,
    1,
    cls.b(),
    2,
    cls.c.h.kebabClass.ShishKebab(true).d(false).e(true, false).f(true),
  ),
  Element(
    "div",
    ["a", "b", "c", "e", "f", "h", "kebab-class", "shish-kebab"],
    "1",
    "2",
  ),
);

compare(
  "nesting",
  c(1, 2, 3, [4, [5], 6]),
  Element("div", [], "1", "2", "3", "4", "5", "6"),
);

compare(
  "functions",
  c(1, 2, 3, () => 4, () => 5, 6),
  Element("div", [], "1", "2", "3", "4", "5", "6"),
);

compare(
  "nesting and functions",
  c(1, 2, 3, [() => 4, () => [5, [6]]]),
  Element("div", [], "1", "2", "3", "4", "5", "6"),
);

compare(
  "composition",
  (() => {
    let r = c(1, 2, 3);
    return r(4, 5)(6);
  })(),
  Element("div", [], "1", "2", "3", "4", "5", "6"),
);

compare(
  "composition with template strings",
  (() => {
    let r = c(1, 2, 3);
    return r`0`(4, 5)(6)`7`(8);
  })(),
  Element("div", [], "1", "2", "3", "0", "4", "5", "6", "7", "8"),
);


compare(
  "Vals",
  (() => {
    let v = rVal(10);
    v(20, 30, c(35), 40);
    return c(1, 2, v, 3);
  })(),
  Element("div", [], "1", "2", "20", "30", Element("div", [], "35"), "40", "3"),
);

test("Refs", () => {
  let o = { a: { b: { c: 100 } } };
  let v = rRef(o.a.b, "c");
  v(20, 30, 40);
  let res = render(c(1, 2, v, 3));
  assertEquals(
    res,
    norm(Element("div", [], "1", "2", "20", "30", "40", "3")),
  );
  assertEquals(v(), [20, 30, 40]);
  assertEquals(o.a.b.c, [20, 30, 40]);
});

compare("CSS", c(css.x("y")), elm({ style: { x: "y" } }));

compare(
  "CSS property chains",
  c(css.x.y.z(1).w.s(2).t(3).y(4)),
  elm({ style: { x: "1", y: "4", z: "1", w: "2", s: "2", t: "3" } }),
);

compare(
  "CSS template strings",
  (() => {
    let v = 1, val = rVal(2);
    return c(
      css.x.y.z(1).w.s(2).t(3).y(4).prop`5`.pop.top`6`.lop`a${v}b`
        .mop`c${val}d`,
    );
  })(),
  elm({
    style: {
      x: "1",
      y: "4",
      z: "1",
      w: "2",
      s: "2",
      t: "3",
      prop: "5",
      pop: "6",
      top: "6",
      lop: "a1b",
      mop: "c2d",
    },
  }),
);

compare(
  "CSS variables",
  c(css._SpecialProp("y")),
  elm({ style: { "--special-prop": "y" } }),
);

for (
  let [func, label, key] of [[attr, "attrs", "attrs"], [css, "css", "style"]]
) {
  compare(
    `${label} are converted to strings`,
    c(func.a(5)),
    elm({ [key]: { a: "5" } }),
  );
  compare(
    `${label} concatenate multiple arguments`,
    c(func.a(5, "x", 7)),
    elm({ [key]: { a: "5x7" } }),
  );
  compare(
    `${label} are chainable`,
    c(func.a(5).b(6)),
    elm({ [key]: { a: "5", b: "6" } }),
  );
  compare(
    `${label} when repeated override the previous`,
    c(func.a(5).b(6).a(7)),
    elm({ [key]: { a: "7", b: "6" } }),
  );
  compare(
    `${label} accept template strings`,
    (() => {
      let x = 7;
      return c(func.a`x${x}y`);
    })(),
    elm({ [key]: { a: "x7y" } }),
  );
  compare(
    `${label} with template strings are chainable`,
    (() => {
      let x = 7;
      return c(func.a`x${x}y`.b(6).c`zw`);
    })(),
    elm({ [key]: { a: "x7y", b: "6", c: "zw" } }),
  );
  compare(
    `${label} flattens arrays and functions`,
    (() => {
      let x = [7, [8, () => [9, () => 10, 11, [12]], 13], 14];
      return c(
        func.a(x, [15, 16], () => [17, () => 18, () => [19, 20]]).b(6).c`zw`,
      );
    })(),
    elm({ [key]: { a: "7891011121314151617181920", b: "6", c: "zw" } }),
  );
  compare(
    `${label} flattens arrays and functions in template strings`,
    (() => {
      let x = [7, [8, () => [9, () => 10, 11, [12]], 13], 14];
      return c(
        func.a`x${[x, [15, 16], () => [17, () => 18, () => [19, 20]]]}y`.b(6)
          .c`zw`,
      );
    })(),
    elm({ [key]: { a: "x7891011121314151617181920y", b: "6", c: "zw" } }),
  );
}

compare(
  "false attr value makes it disappear",
  c(attr.x(false).y(() => false).w(2).z(1).w(false)),
  elm({ attrs: { w: "2", z: "1" } }),
);
test("attribute functions are computed only once, not computed after false", () => {
  let f1 = 0, f2 = 0;
  let res = c(attr.x(() => {
    f1++;
    return false;
  }, () => {
    f2++;
    return false;
  }));
  assertEquals(render(res), norm(Element("div", [])));
  assertEquals(f1, 1);
  assertEquals(f2, 0);
});

test("cls functions are computed upon the truthy value", () => {
  let f1 = 0, f2 = 0, f3 = 0;
  let res = c(cls.x(
    () => {
      f1++;
      return false;
    },
    () => {
      f2++;
      return true;
    },
    () => {
      f3++;
      return false;
    },
  ));
  assertEquals(render(res), norm(Element("div", ["x"])));
  assertEquals(f1, 1);
  assertEquals(f2, 1);
  assertEquals(f3, 0);
});

compare("classes can be unset", c(cls.x(true).x(false)), Element("div", []));
compare(
  "class setting and unsetting works in order",
  c(
    cls.important(2 === 2).red.bold(2 === 3, 2 < 3),
    cls.red(2 > 3), // .red will be unset
    cls.red(2 !== 3), // .red is set again, last setting, affects the result
    "Important!",
  ),
  Element("div", ["important", "red", "bold"], "Important!"),
);

{
  let [func, label, key] = [prop, "props", "props"];
  compare(
    `${label} are not converted to strings`,
    c(func.a(5)),
    elm({ [key]: { a: 5 } }),
  );
  compare(
    `${label} accept multiple arguments`,
    c(func.a(5, "x", 7)),
    elm({ [key]: { a: [5, "x", 7] } }),
  );
  compare(
    `${label} are chainable`,
    c(func.a(5).b(6)),
    elm({ [key]: { a: 5, b: 6 } }),
  );
  compare(
    `${label} when repeated override the previous`,
    c(func.a(5).b(6).a(7)),
    elm({ [key]: { a: 7, b: 6 } }),
  );
  compare(
    `${label} accept template strings`,
    (() => {
      let x = 7;
      return c(func.a`x${x}y`);
    })(),
    elm({ [key]: { a: "x7y" } }),
  );
  compare(
    `${label} with template strings are chainable`,
    (() => {
      let x = 7;
      return c(func.a`x${x}y`.b(6).c`zw`);
    })(),
    elm({ [key]: { a: "x7y", b: 6, c: "zw" } }),
  );
}

compare(
  "elements accept template strings",
  c`Text content`,
  Element("div", [], "Text content"),
);

compare(
  "elements' template strings work with tags",
  c.Span`Text content`,
  Element("span", [], "Text content"),
);

compare(
  "elements' template strings work with classes",
  c.cls1`Text content`,
  Element("div", ["cls1"], "Text content"),
);

compare(
  "elements' template strings support chaining",
  (() => {
    let x = 5;
    return c.cls1`Text ${x} content`.cls2`+`;
  })(),
  Element("div", ["cls1", "cls2"], "Text ", "5", " content", "+"),
);

test("hook chaining", () => {
  let effect = [];
  const makeFn = (char) => (v) => effect.push(char + v);
  let [ha, hb, hc, hd, he, hf] = "abcdef".split("").map(makeFn);
  let res = render(c("Text", hook.init(ha, hb).pre(hc, hd).init(he).init(hf)));
  res.data.hook.init(1);
  res.data.hook.pre(2);
  assertEquals(effect, ["a1", "b1", "e1", "f1", "c2", "d2"]);
  delete res.data.hook;
  assertEquals(res, norm(Element("div", [], "Text")));
});

const svg = e => { e.data.ns = "http://www.w3.org/2000/svg"; return e; };

compare(
  "SVG elements have the correct namespace",
  c.Svg(c.Rect()),
  svg(Element("svg", [],
    svg(Element("rect", [])))));

compare(
  "SVG elements leave the namespace around them intact",
  c(c(), c.Svg(c.Rect()), c()),
  Element("div", [],
    Element("div", []),
    svg(Element("svg", [],
      svg(Element("rect", [])))),
    Element("div", [])));

