/**
 * @module utils
 *
 * @description Gathers utility functions from third parties.
 *
 * @see {@link https://enketo.github.io/enketo-core/module-utils.html#~parseFunctionFromExpression|parseFunctionFromExpression}
 * @see {@link https://github.com/OpenClinica/enketo-xpath-extensions-oc|addXPathExtensionsOc}
 */

import { parseFunctionFromExpression } from 'enketo-core/src/js/utils';
import addXPathExtensionsOc from 'enketo-xpath-extensions-oc';

module.exports = { parseFunctionFromExpression, addXPathExtensionsOc };
