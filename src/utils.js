import { parseFunctionFromExpression, isNumber } from 'enketo-core/src/js/utils';
import { getXPath } from 'enketo-core/src/js/dom-utils';

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
    isNumber,
    getXPath
};
