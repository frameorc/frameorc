# downloading the archive

Instead of [cloning the repository](n01-cloning.md), you can just download the
archive of a specific branch or tag. For example:

```
wget -c https://github.com/frameorc/frameorc.github.io/archive/refs/heads/main.zip
unzip main.zip
```

The URL can be different depending on the branch or tag you are willing to use.
It is not necessary to download the archive via the command line. In the GitHub
user interface available via browser, you can switch to the desired branch, tag
or commit, and use "Download ZIP" option from the "Code" button's drop-down menu.


After that step, creating a project is done the usual way:

```
mkdir -p myproject/lib
cp -r frameorc/src myproject/lib/frameorc
vim myproject/index.html
```

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

