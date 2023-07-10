'use strict';

/**
 * Various utilities.
 *
 * @module utils
 */


/**
 * Parses an Expression to extract all function calls and their argument arrays.
 *
 * @static
 * @param {string} expr - The expression to search
 * @param {string} func - The function name to search for
 * @return {Array<Array<string, any>>} The result array, where each result is an array containing the function call and array of arguments.
 */
function parseFunctionFromExpression(expr, func) {
    let result;
    const findFunc = new RegExp(`${func}\\s*\\(`, 'g');
    const results = [];

    if (!expr || !func) {
        return results;
    }

    while ((result = findFunc.exec(expr)) !== null) {
        const args = [];
        let openBrackets = 1;
        const start = result.index;
        let argStart = findFunc.lastIndex;
        let index = argStart - 1;
        while (openBrackets !== 0 && index < expr.length) {
            index++;
            if (expr[index] === '(') {
                openBrackets++;
            } else if (expr[index] === ')') {
                openBrackets--;
            } else if (expr[index] === ',' && openBrackets === 1) {
                args.push(expr.substring(argStart, index).trim());
                argStart = index + 1;
            }
        }
        // add last argument
        if (argStart < index) {
            args.push(expr.substring(argStart, index).trim());
        }

        // add [ 'function( a ,b)', ['a','b'] ] to result array
        results.push([expr.substring(start, index + 1), args]);
    }

    return results;
}

/**
 * @static
 * @param {*} n - value
 * @return {boolean} whether it is a number value
 */
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * @module dom-utils
 */


/**
 * @param {Element} el - Target node
 * @return {boolean} Whether previous sibling has the same node name
 */
function hasPreviousSiblingElementSameName(el) {
    let found = false;
    const { nodeName } = el;
    el = el.previousSibling;

    while (el) {
        // Ignore any sibling text and comment nodes (e.g. whitespace with a newline character)
        // also deal with repeats that have non-repeat siblings in between them, event though that would be a bug.
        if (el.nodeName && el.nodeName === nodeName) {
            found = true;
            break;
        }
        el = el.previousSibling;
    }

    return found;
}

/**
 * @param {Element} el - Target node
 * @return {boolean} Whether next sibling has the same node name
 */
function hasNextSiblingElementSameName(el) {
    let found = false;
    const { nodeName } = el;
    el = el.nextSibling;

    while (el) {
        // Ignore any sibling text and comment nodes (e.g. whitespace with a newline character)
        // also deal with repeats that have non-repeat siblings in between them, event though that would be a bug.
        if (el.nodeName && el.nodeName === nodeName) {
            found = true;
            break;
        }
        el = el.nextSibling;
    }

    return found;
}

/**
 * @param {Element} el - Target node
 * @return {boolean} Whether a sibling has the same node name
 */
function hasSiblingElementSameName(el) {
    return (
        hasNextSiblingElementSameName(el) ||
        hasPreviousSiblingElementSameName(el)
    );
}

/**
 * Creates an XPath from a node
 *
 * @param {Element} node - XML node
 * @param {string} [rootNodeName] - Defaults to #document
 * @param {boolean} [includePosition] - Whether or not to include the positions `/path/to/repeat[2]/node`
 * @return {string} XPath
 */
function getXPath(node, rootNodeName = '#document', includePosition = false) {
    let index;
    const steps = [];
    let position = '';
    if (!node || node.nodeType !== 1) {
        return null;
    }
    const { nodeName } = node;
    let parent = node.parentElement;
    let parentName = parent ? parent.nodeName : null;

    if (includePosition) {
        index = getRepeatIndex(node);
        if (index > 0) {
            position = `[${index + 1}]`;
        }
    }

    steps.push(nodeName + position);

    while (
        parent &&
        parentName !== rootNodeName &&
        parentName !== '#document'
    ) {
        if (includePosition) {
            index = getRepeatIndex(parent);
            position = hasSiblingElementSameName(parent)
                ? `[${index + 1}]`
                : '';
        }
        steps.push(parentName + position);
        parent = parent.parentElement;
        parentName = parent ? parent.nodeName : null;
    }

    return `/${steps.reverse().join('/')}`;
}

/**
 * Obtains the index of a repeat instance within its own series.
 *
 * @param {Element} node - XML node
 * @return {number} index
 */
function getRepeatIndex(node) {
    let index = 0;
    const { nodeName } = node;
    let prevSibling = node.previousSibling;

    while (prevSibling) {
        // ignore any sibling text and comment nodes (e.g. whitespace with a newline character)
        if (prevSibling.nodeName && prevSibling.nodeName === nodeName) {
            index++;
        }
        prevSibling = prevSibling.previousSibling;
    }

    return index;
}

/** @type {HTMLElement | null} */
let scrollIntoViewTarget = null;

const intersectionObserver = new IntersectionObserver((records) => {
    for (const { target, isIntersecting } of records) {
        if (target === scrollIntoViewTarget && !isIntersecting) {
            target.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
            });
        }

        intersectionObserver.unobserve(target);
    }
});

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
