import { parseFunctionFromExpression } from 'enketo-core/src/js/utils';
import { getXPath } from 'enketo-core/src/js/dom-utils';
import addXPathExtensionsOc from 'enketo-xpath-extensions-oc';

/**
 * @module utils
 *
 * @description Gathers utility functions from third parties.
 */
module.exports = {
    /**
     * @type {Function}
     * @see {@link https://enketo.github.io/enketo-core/module-utils.html#~parseFunctionFromExpression|parseFunctionFromExpression}
     */
    parseFunctionFromExpression,
    /**
     * @type {Function}
     * @see {@link https://github.com/OpenClinica/enketo-xpath-extensions-oc|addXPathExtensionsOc}
     */
    addXPathExtensionsOc,
    getXPath
};
