# Why pure JavaScript and not another HTML-like syntax?

Inventing a new language is cool and interesting. However, to invent a good
language you need a considerable prior experience. After having invented a few
languages you need to have used them extensively, make sober observations on
what has gone right and what has gone wrong, and have the ability of figuring out how
to fix the defects in the future without introducing new problems.

With templating languages, there is a problem. Not only are they being invented
by authors doodling for the first time, and then we are getting stuck with all
the unforeseen problems forever, but also the required features are not timely
anticipated and implemented. In the end, patch by patch, hack after hack, we get
a complete programming language, in a very ugly form.

In browsers, we already have a programming language. Some may not like it, but I
argue that even if you take it for its worst, it is levels and levels above in its
quality over the ugly templating abominations. Consider for a moment: no one
forces an experienced programmer to write ugly and hacky code in JavaScript,
while in templating languages, to achieve a certain goal, you are often mandated
to write something monstrous.

Not only do we already have a programming language, but the one that has been
around for quite a bit of time, and has seen much love. It manifested not only
in ones among the fastest and most ingenious JIT compilers, but also recorded
experience of rights and wrongs, good parts to use and bad parts to avoid,
textbooks, articles, instruction material of all levels and grades of quality,
where the best, hopefully, still can be found, and prevail.

So, the first upside is that you don't have to learn any new syntax and gain
experience of using a new language. All the techniques you have learned are
immediately applicable with frameorc. The second advantage is that all the
tooling you have at your disposal still works: syntax colouring, editors,
linters, formatters, debuggers, code analysis and generation tools and so on.
Third, and no less important: all the syntax constructs of the language, and,
if needed, libraries, work with your "markup" or "templates", while you are
realising that your "templates" themselves can be organised in the usual way,
by using functions and variables.

That means getting immense power without doing much other than understanding
how things really are.

