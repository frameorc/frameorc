# Why not a framework?

Frameworks dictate the structure of your application, practices that you must
adhere to, and even style. They feel easy to start using to a person who does
not care to know how things work before relying on them. Frameworks put hard
limits on what may be customised. They resemble paper forms, as most of the text
is already written for you, the design has been made, and if you only need to
fill the blanks, and the blanks provide enough space for you, it works great.
If you need to put something unanticipated on the form, you'll have a harder
time.

Frameworks do not compose. If you need some features from framework A and others
from framework B, good luck. Usually people wait for framework C to appear,
since its authors promised to have all the features from A and B, but done
differently, and "blazing fast", when all the bugs are at last fixed. Then the
cycle continues, then someone rightfully starts complaining about feature bloat,
slow build times, ridiculous codebase size and complexity spiralling out of
control.

Libraries. Because they do not necessarily always lead to insanity.

# Why libraries?

If you need a function f from library L1 and function g from library L2, you
just import those functions and call them. This way you can assemble your
application from a variety of available building blocks. It does not mean that
every library in the world is good or it must necessarily suit you. It means
that if a high-quality code that is doing useful things is organised in
libraries, there is a clear, well-known architectural pattern allowing to bring
the functionality from such libraries together.

