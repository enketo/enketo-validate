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
 * @property {Array<string>} warnings - List of warnings.
 * @property {Array<string>} errors - List of errors.
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
    let result = {};
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

    result = xform.checkStructure();
    warnings = warnings.concat( result.warnings );
    errors = errors.concat( result.errors );

    result = xform.checkBinds();
    warnings = warnings.concat( result.warnings );
    errors = errors.concat( result.errors );

    result = xform.checkAppearances();
    warnings = warnings.concat( result.warnings );
    errors = errors.concat( result.errors );

    if ( options.openclinica ) {
        result = xform.checkOpenClinicaRules(  );
        warnings = warnings.concat( result.warnings );
        errors = errors.concat( result.errors );
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
        const props = type === 'bind' ? { path: 'nodeset', logic: [ 'calculate', 'constraint', 'relevant', 'required', 'readonly' ]  } : { path: 'ref', logic: [ 'value' ] };
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
                } else {
                    // e.g. the results for accidentally writing "ues" instead of "yes", putting an appearance in a logic column, etc
                    // and accidentally writing 'true' or 'false' or 'yes' or 'no' in the constraint or relevant column in XLSForm
                    if ( likelyNonSyntaxError( logicExpr )
                        || [ 'relevant', 'constraint' ].includes( logicName ) && likelyTrueFalseError( logicExpr ) ) {
                        warnings.push( `${friendlyLogicName} formula "${logicExpr}" for "${nodeName}" is likely meant for something else.` );
                    }
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

const likelyNonSyntaxError = ( logicExpr ) => {
    return /^[A-z0-9_]+$/.test( logicExpr.trim() );
};

const likelyTrueFalseError = ( logicExpr ) => {
    return /^(true|false)\(\)$/.test( logicExpr.trim() );
};

module.exports = { validate, version };
