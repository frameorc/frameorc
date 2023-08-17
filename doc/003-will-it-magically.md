# Will it magically make my code better?

There are no magical promises attached to this collection of libraries.

The author believes that in order to use any technology in the most efficient
way, it is better to understand it than not to understand. To that end, the
library is supplied with documentation and examples. But most importantly, the
library source code is organised into short, succinct and well-structured
modules. Reading them is not necessary, but highly encouraged.

The approach taken is not to create yet another layer of abstraction over the
underlying machinery (DOM, CSS, networking, event-based model, et cetera), but
to effectively orchestrate it.

The author can tell from his experience that it's better to learn the
foundations, rather than be lured into learning some abstraction promising to
magically deliver you from all that "complexity". Because then you will have to
learn in a hurry and desperation why and how it breaks, then how it leaks, and
then anyway all the underlying machinery, and then how to steer the underlying 
machinery from the upper fragile and leaking abstraction, contorting yourself to 
observe its limitations and pretending that it is still useful. In the end, if
you survive, you will have learned all the low-level foundations anyway, plus
what was sold to you under false promises.

If I had to write a disclaimer for frameorc, I would have put together something
like this:

> For the best results, frameorc requires to be used by a competent programmer,
> who, among other things:
> - prefers to understand the technologies one is using and relying upon,
> - considers frequent checks with reality not a burden, but the right way,
> - knows about files, URLs and methods of transferring data in the Internet,
> - has solid understanding of CSS, HTML, DOM and other APIs needed to achieve the
>   goal,
> - understands what variables, functions and modules are and can use them to
>   organise the code,
> - has a certain level of taste allowing one to tell apart things that make the
>   code better from the things that make the code worse,
> - knows when to stop.
