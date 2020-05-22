/* eslint-env mocha */

'use strict';

const XForm = require( '../../src/xform' ).XForm;
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

    describe( 'with bind that has no nodeset', () => {
        const xf = loadXForm( 'bind-without-nodeset.xml' );
        it( 'should return a warning', () => {
            const result = validator.validate( xf );
            expect( result.warnings.length ).to.equal( 1 );
            expect( result.warnings[ 0 ] ).to.include( 'without nodeset attribute' );
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

    describe( 'validated with custom OpenClinica rules', () => {
        const xf1 = loadXForm( 'openclinica.xml' );
        const result1 = validator.validate( xf1, { openclinica: true } );
        const ERRORS = 10;

        it( `outputs ${ERRORS} errors`, () => {
            expect( result1.errors.length ).to.equal( ERRORS );
        } );

        it( 'outputs errors for calculations without form control that refer to external ' +
            'clinicaldata instance but do not have the oc:external="clinicaldata" bind', () => {
            expect( arrContains( result1.errors, /refers to external clinicaldata without the required "external" attribute/i ) ).to.equal( true );
        } );

        it( 'outputs errors for binds with oc:external="clinicaldata" that do not ' +
            'do not have a calculation that refers to instance(\'clinicaldata\')', () => {
            expect( arrContains( result1.errors, /not .* calculation referring to instance\('clinicaldata'\)/i ) ).to.equal( true );
        } );
    } );

    describe( 'with incorrect appearance usage', () => {
        const xf = loadXForm( 'appearances.xml' );
        const result = validator.validate( xf );
        const resultOc = validator.validate( xf, { openclinica: true } );
        const ISSUES = 14;

        it( 'outputs warnings', () => {
            expect( result.warnings.length ).to.equal( ISSUES );
            expect( arrContains( result.warnings, /"minimal" for question "b"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"compact-2" for question "b"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"maximal" for question "c"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"hide-input" for question "d"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"search" for question "d" .+ deprecated.+"autocomplete"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"compact" for question "e"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"compact-19" for question "f"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"numbers" for question "g"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"no-ticks" for question "g"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"maps" for question "h"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"signature" for question "h"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"pulldown" for question "i"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal-compact" for question "k" .+ deprecated.+"columns-pack"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"field-list" for question "two"/i ) ).to.equal( true );
        } );

        it( 'outputs no errors', () => {
            expect( result.errors.length ).to.equal( 0 );
        } );

        it( 'outputs no errors with --oc flag either', () => {
            expect( resultOc.errors.length ).to.equal( 0 );
        } );

        it( 'outputs warnings with --oc flag too', () => {
            //expect( arrContains( result.warnings, /deprecated/ ) ).to.equal( false );
            expect( resultOc.warnings.length ).to.equal( ISSUES );
        } );

        it( 'including the special case "horizontal" output warnings', () => {
            const xf = loadXForm( 'appearance-horizontal.xml' );
            const result = validator.validate( xf );

            expect( result.warnings.length ).to.equal( 4 );
            expect( arrContains( result.warnings, /"horizontal" for question "d" .+ deprecated.+"columns"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal" for question "f" .+ deprecated.+"columns"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal" for question "i".+not valid/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal" for question "one".+not valid.+\(group\)/i ) ).to.equal( true );
        } );
    } );

    describe( 'with missing <label> elements', () => {

        it( 'outputs errors', () => {
            const xf = loadXForm( 'missing-labels.xml' );
            const result = validator.validate( xf );
            const ISSUES = 6;
            expect( result.errors.length ).to.equal( ISSUES );
            expect( arrContains( result.errors, /"a" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /"e" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /"f" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /"i" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /option for question "f" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /option for question "i" has no label/i ) ).to.equal( true );
        } );

        it( 'does not output errors for setvalue actions without a label', () => {
            const xf = loadXForm( 'setvalue.xml' );
            const result = validator.validate( xf );
            expect( result.errors.length ).to.equal( 0 );
        } );

    } );

    describe( 'with duplicate nodenames', () => {
        const xf = loadXForm( 'duplicate-nodename.xml' );
        const result = validator.validate( xf );

        it( 'outputs warnings', () => {
            expect( result.warnings.length ).to.equal( 2 );
            expect( arrContains( result.warnings, /Duplicate .* name "a" found/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Duplicate .* name "g" found/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Duplicate .* name "b" found/i ) ).to.equal( false );
        } );

    } );

    describe( 'with nested repeats', () => {
        const xf = loadXForm( 'nested-repeats.xml' );
        const result = validator.validate( xf );

        it( 'outputs warnings', () => {
            expect( result.warnings.length ).to.equal( 2 );
            expect( arrContains( result.warnings, /Repeat "immunization-info" .* nested/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Repeat "kids-details" .* nested/i ) ).to.equal( true );
        } );

    } );

    xdescribe( 'with disallowed self-referencing', () => {
        // Unit tests are in xpath.spec.js
        const xf = loadXForm( 'self-reference.xml' );
        const result = validator.validate( xf );

        it( 'outputs errors for disallowed self-referencing', () => {
            expect( result.errors.length ).to.equal( 2 );
            expect( arrContains( result.errors, /Calculation formula for "calc1".*refers to itself/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Relevant formula for "rel".*refers to itself/i ) ).to.equal( true );
        } );
    } );
} );

describe( 'XForm Class', () => {
    it( 'should throw if XForm string not provided', () => {
        let failure = () => { new XForm(); };
        expect( failure ).to.throw();
    } );

    describe( 'nsPrefixResolver method', () => {
        const xf = new XForm( loadXForm( 'model-only.xml' ) );
        it( 'should return namespace prefix', () => {
            expect( xf.nsPrefixResolver( 'http://enketo.org/xforms' ) ).to.equal( 'enk' );
        } );
        it( 'should return null if namespace not given', () => {
            expect( xf.nsPrefixResolver() ).to.equal( null );
        } );
    } );

    describe( 'enketoEvaluate method', () => {
        const xf = new XForm( loadXForm( 'model-only.xml' ) );
        it( 'should parse model if it wasn\'t parsed already', () => {
            expect( typeof xf.model === 'undefined' ).to.equal( true );
            xf.enketoEvaluate( 'floor(1)' );
            expect( typeof xf.model === 'undefined' ).to.equal( false );
        } );
    } );
} );
