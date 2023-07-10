const XForm = require( '../../src/xform' ).XForm;
const validator = require( '../../src/validator' );
const expect = require( 'chai' ).expect;
const fs = require( 'fs' );
const path = require( 'path' );

const loadXForm = filename => fs.readFileSync( path.join( process.cwd(), 'test/xform', filename ), 'utf-8' );
const arrContains = ( arr, reg ) => arr.some( item => item.search( reg ) !== -1 );


describe( 'XForm', () => {

    describe( 'that is valid', () => {
        const xf = loadXForm( 'model-only.xml' );
        it( 'returns duration', async() => {
            const result = await validator.validate( xf );
            expect( result.duration ).to.be.above( 0 );
        } );

        it( 'returns no errors and no warnings', async() => {
            const result = await validator.validate( xf );
            expect( result.errors.length ).to.equal( 0 );
            expect( result.warnings.length ).to.equal( 0 );
        } );
    } );

    describe( 'that is invalid', () => {
        const xf = loadXForm( 'missing-closing-tag.xml' );
        it( 'returns duration', async() => {
            const result = await validator.validate( xf );
            expect( result.duration ).to.be.above( 0 );
        } );
    } );

    describe( 'with bind that has no matching primary instance node (b)', () => {
        const xf = loadXForm( 'bind-not-binding.xml' );

        it( 'should return an error', async() => {
            const result = await validator.validate( xf );
            expect( result.warnings.length ).to.equal( 0 );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[0] ).to.include( 'not exist' );
        } );
    } );

    describe( 'with bind that has no matching primary instance node (instanceID)', () => {
        const xf = loadXForm( 'missing-instanceID.xml' );
        it( 'should return a error', async() => {
            const result = await validator.validate( xf );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[0] ).to.include( 'instanceID' );
        } );
    } );

    describe( 'with bind that has no nodeset', () => {
        const xf = loadXForm( 'bind-without-nodeset.xml' );
        it( 'should return an error', async() => {
            const result = await validator.validate( xf );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[0] ).to.include( 'without a nodeset attribute' );
        } );
    } );

    describe( 'with external instance', () => {
        const xf = loadXForm( 'external-instance.xml' );
        it( 'should not return an error because the instance is empty', async() => {
            const result = await validator.validate( xf );
            expect( result.errors.length ).to.equal( 0 );
        } );
    } );

    describe( 'with basic XForm structural errors', () => {
        const validation1 = validator.validate( loadXForm( 'structure-1.xml' ) );
        const validation2 = validator.validate( loadXForm( 'structure-2.xml' ) );
        const validation3 = validator.validate( loadXForm( 'structure-3.xml' ) );
        const validation4 = validator.validate( loadXForm( 'structure-4.xml' ) );

        it( 'should return a root nodename error', async() => {
            const result1 = await validation1;
            expect( arrContains( result1.errors, /root.*html/i ) ).to.equal( true );
        } );
        it( 'should return a root namespace error', async() => {
            const result1 = await validation1;
            expect( arrContains( result1.errors, /root.*namespace/i ) ).to.equal( true );
        } );

        it( 'should return a head not found error', async() => {
            const result1 = await validation1;
            expect( arrContains( result1.errors, /head/i ) ).to.equal( true );
        } );
        it( 'should return a head namespace error', async() => {
            const result2 = await validation2;
            expect( arrContains( result2.errors, /head.*namespace/i ) ).to.equal( true );
        } );
        it( 'should return a body not found error', async() => {
            const result2 = await validation2;
            expect( arrContains( result2.errors, /body/i ) ).to.equal( true );
        } );
        it( 'should return a body namespace error', async() => {
            const result1 = await validation1;
            expect( arrContains( result1.errors, /body.*namespace/i ) ).to.equal( true );
        } );
        it( 'should return a model not found error', async() => {
            const result2 = await validation2;
            expect( arrContains( result2.errors, /model/i ) ).to.equal( true );
        } );
        it( 'should return a model namespace error', async() => {
            const result3 = await validation3;
            expect( arrContains( result3.errors, /model.*namespace/i ) ).to.equal( true );
        } );
        it( 'should return a primary instance not found error', async() => {
            const result3 = await validation3;
            expect( arrContains( result3.errors, /primary instance.*found/i ) ).to.equal( true );
        } );
        it( 'should return a primary instance has too many children error', async() => {
            const result4 = await validation4;
            expect( arrContains( result4.errors, /primary instance.*more than 1 child/i ) ).to.equal( true );
        } );
        it( 'should return a missing id attribute error', async() => {
            const result4 = await validation4;
            expect( arrContains( result4.errors, /data root.*no id attribute/i ) ).to.equal( true );
        } );
    } );

    describe( 'with errors in relevant, constraint, calculate and required expressions', () => {
        const validation = validator.validate( loadXForm( 'xpath-fails.xml' ) );

        it( 'should be detected', async() => {
            const result = await validation;
            expect( result.errors.length ).to.equal( 7 );
            expect( arrContains( result.errors, /Calculation formula for "calc1"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Relevant formula for "calc1"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Calculation formula for "calc11"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Relevant formula for "calc11"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Constraint formula for "cond1"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Required formula for "cond1"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Calculation formula for "instanceID"/i ) ).to.equal( true );
        } );

    } );

    describe( 'with errors in setvalue expressions and attributes', () => {
        const validation = validator.validate( loadXForm( 'setvalue-fails.xml' ) );

        it( 'should be detected', async() => {
            const result = await validation;
            expect( result.errors.length ).to.equal( 5 );
            expect( arrContains( result.errors, /setvalue without a ref attribute/i ) ).to.equal( true );
            expect( arrContains( result.errors, /setvalue for "age_chang" that does not exist in the model/i ) ).to.equal( true );
            expect( arrContains( result.errors, /default formula for "b"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /calculation formula for "my_age_changed"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /default formula for "age"/i ) ).to.equal( true );
        } );

    } );

    describe( 'with calculations on a form control that are not set to readonly', () => {
        const validation = validator.validate( loadXForm( 'calculation-not-readonly.xml' ) );

        it( 'returns errors', async() => {
            const result = await validation;
            expect( arrContains( result.errors, /"a" has a calculation that is not set to readonly/i ) ).to.equal( true );
        } );
    } );

    describe( 'validated with custom OpenClinica rules', () => {

        describe( 'forms with special clinicaldata extensions', () => {
            const validation = validator.validate( loadXForm( 'openclinica-clinicaldata.xml' ), {
                openclinica: true
            } );

            it( 'returns errors', async() => {
                const result = await validation;
                expect( result.errors.length ).to.equal( 6 );
            } );

            it( 'returns errors for calculations without form control that refer to external ' +
                'clinicaldata instance but do not have the oc:external="clinicaldata" bind', async() => {
                const result = await validation;
                expect( arrContains( result.errors, /"invalid1" .* to external clinicaldata without the required "external" attribute/i ) ).to.equal( true );
                expect( arrContains( result.errors, /"invalid2" .* to external clinicaldata without the required "external" attribute/i ) ).to.equal( true );
                expect( arrContains( result.errors, /"invalid3" .* to external clinicaldata without the required "external" attribute/i ) ).to.equal( true );
            } );

            it( 'returns errors for binds with oc:external="clinicaldata" that do not ' +
                'do not have a calculation that refers to instance(\'clinicaldata\')', async() => {
                const result = await validation;
                expect( arrContains( result.errors, /"invalid4" .* not .* calculation referring to instance\("clinicaldata"\)/i ) ).to.equal( true );
                expect( arrContains( result.errors, /"invalid5" .* not .* calculation referring to instance\("clinicaldata"\)/i ) ).to.equal( true );
                expect( arrContains( result.errors, /"invalid6" .* not .* calculation referring to instance\("clinicaldata"\)/i ) ).to.equal( true );
            } );

        } );

        describe( 'forms with the special signature extensions ', ()=>{
            const validation1 = validator.validate( loadXForm( 'openclinica-external-signature-invalid.xml' ), {
                openclinica: true
            } );
            const validation2 = validator.validate( loadXForm( 'openclinica-external-signature-valid.xml' ), {
                openclinica: true
            } );

            it( 'passes without errors and warnings when defined correctly', async()=>{
                const result = await validation2;
                expect( result.warnings.length ).to.equal( 0 );
                expect( result.errors.length ).to.equal( 0 );
            } );

            it( 'returns errors when defined incorrectly', async()=>{
                const result = await validation1;
                expect( result.warnings.length ).to.equal( 0 );
                expect( result.errors.length ).to.equal( 11 );
                expect ( arrContains( result.errors, /Signature .* choice name set to "1"/  ) ).to.equal( true );
                expect ( arrContains( result.errors, /only include one signature item/  ) ).to.equal( true );
                expect ( arrContains( result.errors, /Signature .* must be of type "select_multiple" with one option/ )  ).to.equal( true );
            } );
        } );

        describe( 'forms with special multiple constraints extensions', () => {
            const validation = validator.validate( loadXForm( 'openclinica-multiple-constraints-fails.xml' ), {
                openclinica: true
            } );

            it( 'returns errors', async() => {
                const result = await validation;
                expect( result.errors.length ).to.equal( 9 );
                expect( arrContains( result.errors, /unsupported oc:constraint .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /unsupported oc:constraint22 .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /unsupported oc:constraintMsg .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /unsupported oc:constraint21Msg .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /unsupported oc:constraintABCMsg .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /matching oc:constraint1Msg .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /matching oc:constraint2Msg .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /matching oc:constraint18 .+ "something"/ ) ).to.equal( true );
                expect( arrContains( result.errors, /matching oc:constraint20Msg .+ "something"/ ) ).to.equal( true );
            } );
        } );

        describe( 'forms using the special last-saved instance', () => {
            const validation = validator.validate( loadXForm( 'last-saved.xml' ), {
                openclinica: true
            } );

            it( 'returns an error', async() => {
                const result = await validation;
                expect( result.errors.length ).to.equal( 1 );
                expect( arrContains( result.errors, /last-saved\s+not supported/ ) );
            } );
        } );

    } );

    // This test is to confirm the opposite behavior of the behavior in OpenClinica mode to ensure that behavior is isolated.
    describe( 'forms using the special last-saved instance', () => {
        const validation = validator.validate( loadXForm( 'last-saved.xml' ) );

        it( 'does not return an error', async() => {
            const result = await validation;
            expect( result.errors.length ).to.equal( 0 );
        } );
    } );

    describe( 'with incorrect appearance usage', () => {
        const xf = loadXForm( 'appearances.xml' );
        const validation = validator.validate( xf );
        const validationOc = validator.validate( xf, {
            openclinica: true
        } );
        const WARNINGS = 14;
        const ERRORS = 1;

        it( 'returns warnings', async() => {
            const result = await validation;

            expect( result.warnings.length ).to.equal( WARNINGS );
            expect( arrContains( result.warnings, /"minimal" for "b"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"compact-2" for "b"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"maximal" for question "c"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"hide-input" for "d"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"search" for question "d" .+ deprecated.+"autocomplete"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"compact" for "e"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"compact-19" for question "f"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"numbers" for question "g"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"no-ticks" for question "g"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"maps" for question "h"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"signature" for "h"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"pulldown" for question "i"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal-compact" for question "k" .+ deprecated.+"columns-pack"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"field-list" for "two"/i ) ).to.equal( true );
        } );

        it( 'returns 1 error', async() => {
            const result = await validation;
            expect( result.errors.length ).to.equal( ERRORS );
            expect( arrContains( result.errors, /"search" for question "l"/i ) ).to.equal( true );
        } );

        it( 'returns 1 error with --oc flag', async() => {
            const resultOc = await validationOc;
            expect( resultOc.errors.length ).to.equal( ERRORS );
            expect( arrContains( resultOc.errors, /"search" for question "l"/i ) ).to.equal( true );
        } );

        it( 'returns warnings with --oc flag too', async() => {
            const resultOc = await validationOc;
            //expect( arrContains( result.warnings, /deprecated/ ) ).to.equal( false );
            expect( resultOc.warnings.length ).to.equal( WARNINGS );
        } );

        it( 'including the special case "horizontal" return warnings', async() => {
            const result = await validator.validate( loadXForm( 'appearance-horizontal.xml' ) );

            expect( result.warnings.length ).to.equal( 4 );
            expect( arrContains( result.warnings, /"horizontal" for question "d" .+ deprecated.+"columns"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal" for question "f" .+ deprecated.+"columns"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal" for "i".+not valid.+type odkkkkkk:rank/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"horizontal" for "one".+not valid.+type group/i ) ).to.equal( true );
        } );

        it( 'for custom analog-scale widgets', async() => {
            const result = await validator.validate( loadXForm( 'openclinica-analog-scale.xml' ) );
            expect( result.warnings.length ).to.equal( 2 );
            expect( arrContains( result.warnings, /"show-scale" for question "d" .+ combination .+no-ticks/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"show-scale" for question "e" .+ combination .+horizontal/i ) ).to.equal( true );
        } );

    } );

    describe( 'with repeats with incorrect w-values for Grid Theme forms', () => {
        const xf = loadXForm( 'appearances-repeat.xml' );
        const validation = validator.validate( xf );
        const WARNINGS = 3;

        it( 'returns warnings', async() => {
            const result = await validation;

            expect( result.warnings.length ).to.equal( WARNINGS );
            expect( arrContains( result.warnings, /"w3" for "rep3"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"w1" for "rep2"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /"w2" for "rep1"/i ) ).to.equal( true );
        } );
    } );

    describe( 'with likely user errors that are not actually XPath syntax errors', () => {
        const xf = loadXForm( 'user-ues.xml' );
        const validation = validator.validate( xf );

        it( 'returns warnings', async() => {
            const result = await validation;

            expect( result.warnings.length ).to.equal( 12 );
            expect( arrContains( result.warnings, /Constraint .+ "ues"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Relevant .+ "ues"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Required .+ "ues"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Readonly .+ "ues"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Constraint .+ "w6"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Relevant .+ "w6"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Required .+ "w6"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Readonly .+ "w6"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Constraint .+ "true\(\)"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Constraint .+ "false\(\)"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Relevant .+ "true\(\)"/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Relevant .+ "false\(\)"/i ) ).to.equal( true );
        } );
    } );

    describe( 'with unsupported external app launching syntax', () => {
        const xf = loadXForm( 'external-app.xml' );
        const validation = validator.validate( xf );

        it( 'returns warnings', async() => {
            const result = await validation;

            expect( result.errors.length ).to.equal( 2 );
            expect( arrContains( result.errors, /"ex:" to launch an external app for question "counter"/i ) ).to.equal( true );
            expect( arrContains( result.errors, /"intent" attribute to launch an external app/i ) ).to.equal( true );
        } );

    } );

    describe( 'with missing <label> elements', () => {

        it( 'returns errors', async() => {
            const result = await validator.validate( loadXForm( 'missing-labels.xml' ) );
            const ISSUES = 6;
            expect( result.errors.length ).to.equal( ISSUES );
            expect( arrContains( result.errors, /"a" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /"e" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /"f" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /"i" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /option for question "f" has no label/i ) ).to.equal( true );
            expect( arrContains( result.errors, /option for question "i" has no label/i ) ).to.equal( true );
        } );

        it( 'does not return errors for setvalue actions without a label', async() => {
            const result = await validator.validate( loadXForm( 'setvalue.xml' ) );
            expect( result.errors.length ).to.equal( 0 );
        } );

    } );

    describe( 'with missing <value> elements', () => {

        it( 'returns errors', async() => {
            const result = await validator.validate( loadXForm( 'missing-values.xml' ) );
            expect( result.errors.length ).to.equal( 1 );
            expect( arrContains( result.errors, /option for question "k" has no value/i ) ).to.equal( true );
        } );

        it( 'does not return errors for setvalue actions without a label', async() => {
            const result = await validator.validate( loadXForm( 'setvalue.xml' ) );
            expect( result.errors.length ).to.equal( 0 );
        } );

    } );

    describe( 'with duplicate nodenames', () => {

        it( 'returns warnings', async() => {
            const result = await validator.validate( loadXForm( 'duplicate-nodename.xml' ) );
            expect( result.warnings.length ).to.equal( 2 );
            expect( arrContains( result.warnings, /Duplicate .* name "a" found/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Duplicate .* name "g" found/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Duplicate .* name "b" found/i ) ).to.equal( false );
        } );

    } );

    describe( 'with nodenames containing underscores', () => {

        it( 'returns warnings', async() => {
            const result = await validator.validate( loadXForm( 'nodename-underscore.xml' ) );
            expect( result.warnings.length ).to.equal( 0 );
            expect( result.errors.length ).to.equal( 0 );
        } );

    } );

    describe( 'with nested repeats', () => {

        it( 'returns warnings', async() => {
            const result = await validator.validate( loadXForm( 'nested-repeats.xml' ) );
            expect( result.warnings.length ).to.equal( 2 );
            expect( arrContains( result.warnings, /Repeat "immunization-info" .* nested/i ) ).to.equal( true );
            expect( arrContains( result.warnings, /Repeat "kids-details" .* nested/i ) ).to.equal( true );
        } );

    } );

    xdescribe( 'with disallowed self-referencing', () => {

        it( 'returns errors for disallowed self-referencing', async() => {
            // Unit tests are in xpath.spec.js
            const result = await validator.validate( loadXForm( 'self-reference.xml' ) );
            expect( result.errors.length ).to.equal( 2 );
            expect( arrContains( result.errors, /Calculation formula for "calc1".*refers to itself/i ) ).to.equal( true );
            expect( arrContains( result.errors, /Relevant formula for "rel".*refers to itself/i ) ).to.equal( true );
        } );
    } );
} );

describe( 'XForm Class', () => {
    it( 'should throw if XForm string not provided', () => {
        let failure = () => {
            new XForm();
        };
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
        it( 'should parse model if it wasn\'t parsed already', async() => {
            expect( typeof xf.modelHandle === 'undefined' ).to.equal( true );
            await xf.enketoEvaluate( 'floor(1)' );
            expect( typeof xf.modelHandle === 'undefined' ).to.equal( false );
        } );
    } );
} );
