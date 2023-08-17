import { c, on } from 'https://frameorc.github.io/src/dom.js';
import { hrRoute } from '../../src/router.js';

let auth;
export const AuthRequired = (view) => auth ? view : (document.location.hash='#auth#next='+document.location.hash);

export default hrRoute(args => c.Button('Login',
  on.click(() => {
    auth = true;
    document.location.hash = args.next;
  })
));

