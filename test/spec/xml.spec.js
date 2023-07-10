const validator = require( '../../src/validator' );
const expect = require( 'chai' ).expect;
const { BrowserHandler } = require( '../../src/headless-browser' );
const fs = require( 'fs' );
const path = require( 'path' );

const browserHandler = new BrowserHandler();
const loadXForm = filename => fs.readFileSync( path.join( process.cwd(), 'test/xform', filename ), 'utf-8' );

describe( 'XML', () => {

    describe( 'with missing closing tag', () => {
        const xf = loadXForm( 'missing-closing-tag.xml' );
        it( 'should return an error', async() => {
            const result = await validator.validate( xf, browserHandler );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[ 0 ] ).to.include( 'close tag' );
        } );
    } );

    describe( 'with invalid node name that starts with number', () => {
        const xf = loadXForm( 'invalid-nodename.xml' );
        it( 'should return an error', async() => {
            const result = await validator.validate( xf, browserHandler );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[ 0 ] ).to.include( 'disallowed character' );
        } );
    } );

    describe( 'with missing namespace declaration', () => {
        const xf = loadXForm( 'missing-namespace.xml' );
        it( 'should return an error', async() => {
            const result = await validator.validate( xf, browserHandler );
            expect( result.errors.length ).to.equal( 1 );
            expect( result.errors[ 0 ] ).to.include( 'namespace prefix' );
        } );
    } );

    describe( 'with invalid primary element namespace', () => {
        const xf = loadXForm( 'invalid-primary-namespace.xml' );
        it( 'should return an error', async() => {
            const result = await validator.validate( xf, browserHandler );
            expect( result.errors.indexOf( 'Primary instance element has incorrect namespace.' ) ).to.not.equal( -1 );
        } );
    } );

    describe( 'with group missing ref attribute that has repeat inside', () => {
        const xf = loadXForm( 'no-group-repeat-ref.xml' );
        it( 'should return a warning', async() => {
            const result = await validator.validate( xf, browserHandler );
            expect( result.warnings.length ).to.equal( 2 );
            expect( result.warnings[ 0 ] ).to.include( '<group> without ref attribute' );
            expect( result.warnings[ 1 ] ).to.include( '<repeat> that has a parent <group> without a ref attribute' );
        } );
    } );

} );
