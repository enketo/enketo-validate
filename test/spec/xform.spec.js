/* eslint-env mocha */

'use strict';

const validator = require( '../../src/validator' );
const expect = require( 'chai' ).expect;
const fs = require( 'fs' );
const path = require( 'path' );

const loadXForm = filename => fs.readFileSync( path.join( process.cwd(), 'test/xform', filename ), 'utf-8' );
const arrContains = ( arr, reg ) => arr.some( item => item.search( reg ) !== -1 );

describe( 'XForm', () => {

    describe( 'with bind that has no matching primary instance node', () => {
        const xf = loadXForm( 'bind-not-binding.xml' );
        it( 'should return a warning', () => {
            const result = validator.validate( xf );
            expect( result.errors.length ).to.equal( 0 );
            expect( result.warnings.length ).to.equal( 1 );
            expect( result.warnings[ 0 ] ).to.include( 'not exist' );
        } );
    } );

    describe( 'with bind that has no matching primary instance node', () => {
        const xf = loadXForm( 'missing-instanceID.xml' );
        it( 'should return a error', () => {
            const result = validator.validate( xf );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[ 0 ] ).to.include( 'instanceID' );
        } );
    } );

    describe( 'with external instance', () => {
        const xf = loadXForm( 'external-instance.xml' );
        it( 'should not return an error because the instance is empty', () => {
            const result = validator.validate( xf );
            expect( result.errors.length ).to.equal( 0 );
        } );
    } );

    describe( 'with basic XForm structural errors', () => {
        const xf1 = loadXForm( 'structure-1.xml' );
        const xf2 = loadXForm( 'structure-2.xml' );
        const xf3 = loadXForm( 'structure-3.xml' );
        const xf4 = loadXForm( 'structure-4.xml' );
        const result1 = validator.validate( xf1 );
        const result2 = validator.validate( xf2 );
        const result3 = validator.validate( xf3 );
        const result4 = validator.validate( xf4 );

        it( 'should return a root nodename error', () => {
            expect( arrContains( result1.errors, /root.*html/i ) ).to.equal( true );
        } );
        it( 'should return a root namespace error', () => {
            expect( arrContains( result1.errors, /root.*namespace/i ) ).to.equal( true );
        } );
        it( 'should return a head not found error', () => {
            expect( arrContains( result1.errors, /head/i ) ).to.equal( true );
        } );
        it( 'should return a head namespace error', () => {
            expect( arrContains( result2.errors, /head.*namespace/i ) ).to.equal( true );
        } );
        it( 'should return a body not found error', () => {
            expect( arrContains( result2.errors, /body/i ) ).to.equal( true );
        } );
        it( 'should return a body namespace error', () => {
            expect( arrContains( result1.errors, /body.*namespace/i ) ).to.equal( true );
        } );
        it( 'should return a model not found error', () => {
            expect( arrContains( result2.errors, /model/i ) ).to.equal( true );
        } );
        it( 'should return a model namespace error', () => {
            expect( arrContains( result3.errors, /model.*namespace/i ) ).to.equal( true );
        } );
        it( 'should return a primary instance not found error', () => {
            expect( arrContains( result3.errors, /primary instance.*found/i ) ).to.equal( true );
        } );
        it( 'should return a primary instance has too many children error', () => {
            expect( arrContains( result4.errors, /primary instance.*more than 1 child/i ) ).to.equal( true );
        } );
        it( 'should return a missing id attribute error', () => {
            expect( arrContains( result4.errors, /data root.*no id attribute/i ) ).to.equal( true );
        } );
    } );

} );