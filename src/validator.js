'use strict';

const { XForm } = require( './xform' );
const { version } = require( '../package' );

let validate = ( xformStr, options = {} ) => {
    let warnings = [];
    let errors = [];
    let xform;

    try {
        xform = new XForm( xformStr, options );
    } catch ( e ) {
        errors.push( e );
    }

    if ( xform ) {
        xform.checkStructure( warnings, errors );
        xform.checkBinds( warnings, errors );

        if ( options.openclinica ) {
            xform.checkOpenClinicaRules( warnings, errors );
            // OpenClinica would like all appearance warnings to be output as errors, for now
            xform.checkAppearances( errors, errors );
        } else {
            xform.checkAppearances( warnings, errors );
        }
    }

    try {
        if ( xform ) {
            xform.parseModel();
        }
    } catch ( e ) {
        let ers = Array.isArray( e ) ? e : [ e ];
        errors = errors.concat( ers );
    }

    if ( xform && errors.length === 0 ) {

        // Find binds
        xform.binds.forEach( ( bind, index ) => {
            const path = bind.getAttribute( 'nodeset' );

            if ( !path ) {
                warnings.push( `Found bind (index: ${index}) without nodeset attribute.` );
                return;
            }

            const nodeName = path.substring( path.lastIndexOf( '/' ) + 1 );
            const context = xform.enketoEvaluate( path, 'node' );

            if ( !context ) {
                warnings.push( `Found bind for "${nodeName}" that does not exist in the model.` );
                return;
            }

            [ 'calculate', 'constraint', 'relevant', 'required' ].forEach( logicName => {
                const logicExpr = bind.getAttribute( logicName );
                const calculation = logicName === 'calculate';

                if ( logicExpr ) {
                    const friendlyLogicName = calculation ? 'Calculation' : logicName[ 0 ].toUpperCase() + logicName.substring( 1 );;

                    try {
                        xform.enketoEvaluate( logicExpr, ( calculation ? 'string' : 'boolean' ), path );

                        // TODO: check for cyclic dependencies within single expression and between calculations, e.g. triangular calculation dependencies
                    } catch ( e ) {
                        errors.push( `${friendlyLogicName} formula for "${nodeName}": ${e}` );
                    }

                }
            } );

        } );

    }

    return { warnings, errors, version };
};

module.exports = { validate, version };