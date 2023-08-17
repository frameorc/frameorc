import { attr, c } from 'https://frameorc.github.io/src/dom.js';
import { AuthRequired } from './auth.js';
import { hrRoute } from '../../src/router.js';

export default hrRoute(args => AuthRequired(c.H1(c.A('back to main', attr.href('#')))))
