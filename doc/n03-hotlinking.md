# hotlinking

If you are after the quickest, but not the most reliable solution, you can
proceed without downloading anything, and just hotlink to either GitHub Pages or
[jsDelivr](https://www.jsdelivr.com/?docs=gh) resource. Keep in mind that
contrary to using the files you downloaded and have complete control over,
like in [two](n01-cloning.md) [other](n02-archive.md) methods, no guarantees are
given that the files published online will stay in place, stay the same, or stay
published at all.


index.html

```html
<!DOCTYPE html>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="module">
  import { body, c } from 'https://cdn.jsdelivr.net/gh/frameorc/frameorc/src/dom.js';
  body(
    c.H1`Test`,
    c.P`Hello, world!`);
</script>
```

