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
    const start = Date.now();
    let warnings = [];
    let errors = [];
    let xform;

    try {
        xform = new XForm( xformStr, options );
    } catch ( e ) {
        errors.push( e );
    }

    if ( !xform ){
        const duration = Date.now() - start;

        return Promise.resolve( { warnings, errors, version, duration } );
    }
    
    xform.checkStructure( warnings, errors );
    xform.checkBinds( warnings, errors );
    xform.checkRelatives( warnings, errors );
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

    // Check logic

    for( const el of xform.binds.concat( xform.setvalues ) ){
        const type = el.nodeName.toLowerCase();
        const props = type === 'bind' ? { path: 'nodeset', logic: [ 'calculate', 'constraint', 'relevant', 'required' ]  } : { path: 'ref', logic: [ 'value' ] };
        const path = el.getAttribute( props.path );

        if ( !path ) {
            errors.push( `Found ${type} without a ${props.path} attribute.` );

            continue;
        }

        const nodeName = xform._nodeName( path );
        // Note: using enketoEvaluate here, would be much slower
        const nodeExists = await xform.nodeExists( path );

        if ( !nodeExists ) {
            errors.push( `Found ${type} for "${nodeName}" that does not exist in the model.` );

            continue;
        }

        for ( const logicName of props.logic ){
            const logicExpr = el.getAttribute( logicName );
            const calculation = logicName === 'calculate';

            if ( logicExpr ) {
                let friendlyLogicName = logicName[ 0 ].toUpperCase() + logicName.substring( 1 );
                if ( calculation ){
                    friendlyLogicName = 'Calculation';
                } else if ( type === 'setvalue' ){
                    const event = el.getAttribute( 'event' );
                    if ( !event ){
                        errors.push( 'Found ${type} without event attribute.' );
                        continue;
                    }
                    friendlyLogicName = event.split( ' ' ).includes( 'xforms-value-changed' ) ? 'Triggered calculation' : 'Dynamic default';
                }

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
    const duration = Date.now() - start;

    await xform.exit();

    return { warnings, errors, version, duration };
};

module.exports = { validate, version };
