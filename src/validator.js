'use strict';

const { XForm } = require( './xform' );

let validate = ( xformStr, options ) => {
    let warnings = [];
    let errors = [];
    let xform;

    try {
        xform = new XForm( xformStr, options );
    } catch ( e ) {
        //console.error( 'parsing failed: ', e );
        errors.push( e );
    }

    if ( xform ) {
        xform.checkStructure( warnings, errors );
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
        xform.binds.forEach( function( bind, index ) {
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

            [ 'calculate', 'constraint', 'relevant', 'required' ].forEach( function( logicName ) {
                const logicExpr = bind.getAttribute( logicName );
                const calculation = logicName === 'calculate';
                if ( logicExpr ) {
                    try {
                        xform.enketoEvaluate( logicExpr,( calculation ? 'string' : 'boolean' ), path );
                    } catch ( e ) {
                        let friendlyLogicName =  calculation ? 'calculation' : logicName;
                        friendlyLogicName = friendlyLogicName[ 0 ].toUpperCase() + friendlyLogicName.substring( 1 );
                        errors.push( `${friendlyLogicName} formula for "${nodeName}": ${e}` );
                    }
                }
            } );

        } );

    }

    return {
        warnings: warnings,
        errors: errors
    };
};

module.exports = {
    validate: validate
};
