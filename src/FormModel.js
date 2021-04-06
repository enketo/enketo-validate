/**
 * @class FormModel
 *
 * @description Class imported from Enketo Core.
 *
 * @see {@link https://enketo.github.io/enketo-core/FormModel.html|Enketo Core documentation}
 */

import { FormModel } from 'enketo-core';

import OpenRosaXPath from 'openrosa-xpath-evaluator';

/**
 * @type {Function}
 * @see {@link https://github.com/OpenClinica/enketo-xpath-extensions-oc|extendXPath}
 */
import extendXPath from 'enketo-xpath-extensions-oc';

const evaluatorOc = OpenRosaXPath();
extendXPath( evaluatorOc );

window.ocXPathEvaluator = evaluatorOc;
window.FormModel = FormModel;
