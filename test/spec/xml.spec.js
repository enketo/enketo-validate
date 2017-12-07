/* global describe, it*/
'use strict';

const validator = require( '../../src/validator' );
const expect = require( 'chai' ).expect;
const fs = require( 'fs' );
const path = require( 'path' );

const loadXForm = filename => fs.readFileSync( path.join( process.cwd(), 'test/xform', filename ), 'utf-8' );

describe( 'XML', () => {

    describe( 'with missing closing tag', () => {
        const xf = loadXForm( 'missing-closing-tag.xml' );
        it( 'should return an error', () => {
            const result = validator.validate( xf );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[ 0 ] ).to.include( 'close tag' );
        } );
    } );

    describe( 'with invalid node name that starts with number', () => {
        const xf = loadXForm( 'invalid-nodename.xml' );
        it( 'should return an error', () => {
            const result = validator.validate( xf );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[ 0 ] ).to.include( 'Unencoded <' );
        } );
    } );

    describe( 'with missing namespace declaration', () => {
        const xf = loadXForm( 'missing-namespace.xml' );
        it( 'should return an error', () => {
            const result = validator.validate( xf );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[ 0 ] ).to.include( 'namespace prefix' );
        } );
    } );

} );
