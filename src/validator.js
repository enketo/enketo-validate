/**
 * @module validator
 */

'use strict';

const { XForm } = require( './xform' );
/**
 * @constant
 * @static
 * @type {string}
 */
const { version } = require( '../package' );

/**
 * @typedef ValidateResult
 * @property {Array} warnings - List of warnings.
 * @property {Array} errors - List of errors.
 * @property {string} version - Package version.
 */

/**
 * @typedef ValidationOptions
 * @property {boolean} debug - Run validator in debug mode.
 * @property {boolean} openclinica - Run validator in OpenClinica mode.
 */

/**
 * The validate function. Relies heavily on the {@link XForm} class.
 *
 * @static
 * @param {string} xformStr - XForm content.
 * @param {ValidationOptions} [options] - Validation options.
 * @return {ValidateResult} validation results.
 */
const validate = async( xformStr, options = {} ) => {
    let warnings = [];
    let errors = [];
    let xform;

    try {
        xform = new XForm( xformStr, options );
    } catch ( e ) {
        errors.push( e );
    }

    if ( !xform ){
        return Promise.resolve( { warnings, errors, version } );
    }

    xform.checkStructure( warnings, errors );
    xform.checkBinds( warnings, errors );
    xform.checkAppearances( warnings, errors );

    if ( options.openclinica ) {
        xform.checkOpenClinicaRules( warnings, errors );
    }

    try{
        await xform.parseModel();
    } catch ( e ) {
        let ers = Array.isArray( e ) ? e : [ e ];
        errors = errors.concat( ers );
    }

    // Find binds

    for( const bind of xform.binds ){
        const path = bind.getAttribute( 'nodeset' );

        if ( !path ) {
            warnings.push( 'Found bind without nodeset attribute.' );

            continue;
        }

        const nodeName = path.substring( path.lastIndexOf( '/' ) + 1 );
        // Note: using enketoEvaluate here, would be much slower
        const nodeExists = await xform.nodeExists( path );

        if ( !nodeExists ) {
            warnings.push( `Found bind for "${nodeName}" that does not exist in the model.` );

            continue;
        }

        for ( const logicName of [ 'calculate', 'constraint', 'relevant', 'required' ] ){
            const logicExpr = bind.getAttribute( logicName );
            const calculation = logicName === 'calculate';

            if ( logicExpr ) {
                const friendlyLogicName = calculation ? 'Calculation' : logicName[ 0 ].toUpperCase() + logicName.substring( 1 );

                try {
                    await xform.enketoEvaluate( logicExpr, ( calculation ? 'string' : 'boolean' ), path );
                }
                catch( e ){
                    errors.push( `${friendlyLogicName} formula for "${nodeName}": ${e}` );
                }
                // TODO: check for cyclic dependencies within single expression and between calculations, e.g. triangular calculation dependencies
            }
        }
    }

    await xform.exit();

    return { warnings, errors, version };
};

module.exports = { validate, version };
