# cloning the repository

The most widespread approach is to clone the repository, check out the necessary
branch or tag, and copy the files to your project.

```
git clone https://github.com/frameorc/frameorc
cd frameorc
git checkout v20230818
cd ..
mkdir -p myproject/lib
cp -r frameorc/src myproject/lib/frameorc
vim myproject/index.html
```

Replace `v20230818` with the name of a branch or a tag you are willing to use.


index.html:

```html
<!DOCTYPE html>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="module">
  import { body, c } from './lib/frameorc/dom.js';
  body(
    c.H1`Test`,
    c.P`Hello, world!`);
</script>
```

