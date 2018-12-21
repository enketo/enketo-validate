'use strict';

/* global ArrayBuffer, Uint8Array */

/**
 * Parses an Expression to extract all function calls and theirs argument arrays.
 *
 * @param  {String} expr The expression to search
 * @param  {String} func The function name to search for
 * @return {<String, <String*>>} The result array, where each result is an array containing the function call and array of arguments.
 */
function parseFunctionFromExpression( expr, func ) {
    let index;
    let result;
    let openBrackets;
    let start;
    let argStart;
    let args;
    const findFunc = new RegExp( `${func}\\s*\\(`, 'g' );
    const results = [];

    if ( !expr || !func ) {
        return results;
    }

    while ( ( result = findFunc.exec( expr ) ) !== null ) {
        openBrackets = 1;
        args = [];
        start = result.index;
        argStart = findFunc.lastIndex;
        index = argStart - 1;
        while ( openBrackets !== 0 && index < expr.length ) {
            index++;
            if ( expr[ index ] === '(' ) {
                openBrackets++;
            } else if ( expr[ index ] === ')' ) {
                openBrackets--;
            } else if ( expr[ index ] === ',' && openBrackets === 1 ) {
                args.push( expr.substring( argStart, index ).trim() );
                argStart = index + 1;
            }
        }
        // add last argument
        if ( argStart < index ) {
            args.push( expr.substring( argStart, index ).trim() );
        }

        // add [ 'function( a ,b)', ['a','b'] ] to result array
        results.push( [ expr.substring( start, index + 1 ), args ] );
    }

    return results;
}

function addXPathExtensionsOc( XPathJS ) {

    const FUNCTIONS = {
        'comment-status': {

            fn( a ) {
                const curValue = a.toString();
                let status = '';
                let comment;

                if ( curValue ) {
                    try {
                        comment = JSON.parse( curValue );
                        comment.queries = ( Array.isArray( comment.queries ) ) ? comment.queries : [];
                        comment.logs = ( Array.isArray( comment.logs ) ) ? comment.logs : [];
                        if ( typeof comment === 'object' && comment !== null ) {
                            // duplicates _getCurrentStatus() in Dn.js
                            comment.queries.concat( comment.logs ).some( item => {
                                if ( typeof item === 'object' && item !== null && item.status ) {
                                    status = item.status;
                                    return true;
                                }
                                return false;
                            } );
                        }
                    } catch ( e ) {
                        console.error( 'Could not parse JSON from', curValue );
                    }
                }

                return new XPathJS.customXPathFunction.type.StringType( status );
            },

            args: [
                { t: 'string' }
            ],

            ret: 'string'

        }
    };

    Object.keys( FUNCTIONS ).forEach( fnName => {
        XPathJS.customXPathFunction.add( fnName, FUNCTIONS[ fnName ] );
    } );

}

module.exports = { parseFunctionFromExpression, addXPathExtensionsOc };
