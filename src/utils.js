import { parseFunctionFromExpression } from 'enketo-core/src/js/utils';
import addXPathExtensionsOc from 'enketo-xpath-extensions-oc';

/**
 * @module utils
 *
 * @description Gathers utility functions from third parties.
 */
module.exports = {
    /**
     * @type function
     * @see {@link https://enketo.github.io/enketo-core/module-utils.html#~parseFunctionFromExpression|parseFunctionFromExpression}
     */
    parseFunctionFromExpression,
    /**
     * @type function
     * @see {@link https://github.com/OpenClinica/enketo-xpath-extensions-oc|addXPathExtensionsOc}
     */
    addXPathExtensionsOc
};
