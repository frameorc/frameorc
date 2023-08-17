# frameorc

**frameorc** is not a framework. It is a collection of libraries for building
web applications.

Brutally simple and efficient, it was created with the goal of endowing
a single programmer with formidable power that extends well to teams.


# release

The current release is 20230818 [[Changelog](doc/changelog.md)]

There are several ways you can obtain and use the included modules:
- [cloning the repository and checking out the corresponding tag](doc/n01-cloning.md)
- [downloading the repository as an archive](doc/n02-archive.md)
- [linking to the files in the repository directly](doc/n03-hotlinking.md)


# contents

frameorc is comprised of the following libraries:

[dom](doc/dom.md): a better, shorter, more organised way to define DOM trees.
It replaces HTML without inventing a new syntax while adding predictable dynamic
capabilities, so your interface goes live at once.

[router](doc/router.md): split your app into parts that load and update
on-the-fly.

[com](doc/com.md): shadow DOM made easy. Build modern Web Components according
to the standards, or make your own rules. Especially useful while we are waiting
for the CSS scopes to be supported in browsers.

[flex.css](doc/flex.html): robust layout builder for forms and programmatic UIs,
achieving the goal with just a few keystrokes. The resulting interfaces are
approachable in coding and play well with version control.

[state](doc/state.md): one of the lightest and fastest ways to keep the
persistent state. Useful when heavier databases are an overkill.

[rpc](doc/rpc.md): makes you forget you are using RPC. It allows the server and
browser to call each other's functions as if they are local. It just works.

[builder](doc/builder.md): define your own tiny domain-specific languages with
this foundational implementation of a builder pattern.

[chain](doc/chain.md): the simplest and smartest event system that distils the
foundations of a reactive approach.


# examples

frameorc has a growing collection of examples:

[todomvc](examples/todomvc/index.html) — a classical TodoMVC application built
with frameorc dom ([source](examples/todomvc/index.js)).

[state](examples/state.html) — how state library works in general, with reactive
values and local storage

[rpc](https://github.com/frameorc/frameorc/tree/github/examples/rpc) — how to set up RPC on Deno or Node (express.js)

[router](examples/router/index.html) — a very simple demo of the router library
capabilities

[keypad](examples/keypad.html) — playing with Shadow DOM. A simple keypad
component.

[frag](examples/frag.html) — advanced topic of fragments, groups of elements
that have a key and hooks, is illustrated in this short example.

[container operators](examples/container-operators.html) — a demo, or, rather, a
test of how some operators affect their container, even if it is a page body
element.

[flex](doc/flex.html) is not only an article describing the idea of a
programmatic layout builder, but its source code is a take on an idea of writing
documents with frameorc. At the same time it generates, explains and
demonstrates flex.css

# prose

There are several documents explaining the author's vision and experience that
led to the creation of frameorc library collection.

[Why are libraries better than frameworks?](doc/001-libs-are-better.md)

[Why pure JavaScript and not another HTML-like syntax?](doc/002-why-js.md)

[Will it magically make my code better?](doc/003-will-it-magically.md)

[Coming up with an idea of a flex layout constructor](doc/004-flex.html)


# acknowledgements

Thanks to Anton Baranov, Daniil Terlyakhin, Fedot Kryutchenko and
Elnur Yusifov for reading drafts, testing multiple versions of this
library over the past eight years, collaborating and exchanging ideas
together. I could have never gone as far as making a public release of
frameorc without your support and encouragement.

For its virtual DOM layer, frameorc is using [Snabbdom](https://github.com/snabbdom/snabbdom),
a MIT-licensed library by Simon Friis Vindum et al.

[TodoMVC example](/examples/todomvc/index.js) is based on the work of Addy Osmani,
Sindre Sorhus, Pascal Hartig, Stephen Sawchuk and others.

The (de)serialisation of RPC messages is performed with a MIT-Licensed
[msgpackr](https://github.com/kriszyp/msgpackr) library by Kris Zyp.

