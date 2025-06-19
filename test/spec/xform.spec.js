const XForm = require( '../../src/xform' ).XForm;
const validator = require( '../../src/validator' );
const {expect} = require( 'chai' );
const fs = require( 'fs' );
const path = require( 'path' );

const loadXForm = filename => fs.readFileSync( path.join( process.cwd(), 'test/xform', filename ), 'utf-8' );
const arrContains = ( arr, reg ) => arr.some( item => item.search( reg ) !== -1 );


const beforeAllReturn = (fn, timeout) => {
    const box = { current: null }
    before(async () => box.current = await fn(), timeout)
    return box
}
const beforeValidateLoadXForm = (path, timeout) => beforeAllReturn(() => validator.validate(loadXForm(path)), timeout)

describe( 'XForm', () => {

    describe( 'that is valid', () => {
        const validation = beforeValidateLoadXForm('model-only.xml')
        it( 'returns no errors and no warnings', () => expect( validation.current.errors.length ).to.equal( 0 ))
        it( 'returns no warnings', () => expect( validation.current.warnings.length ).to.equal( 0 ))
        it( 'returns duration', () => expect( validation.current.duration ).to.be.above( 0 ))
    } );

    describe( 'that is invalid', () => {
        const validation = beforeValidateLoadXForm('missing-closing-tag.xml')
        it( 'returns duration', () => expect( validation.current.duration ).to.be.above( 0 ));
    } );

    describe( 'with bind that has no matching primary instance node (b)', () => {
        const validation = beforeValidateLoadXForm('bind-not-binding.xml')

        it( 'should return no warnings', () => expect( validation.current.warnings.length ).to.equal( 0 ) );
        it( 'should return one error', () => expect( validation.current.errors.length ).to.equal( 1 ) );
        it( 'should return an error "not exist"', () => expect( validation.current.errors[0] ).to.include( 'not exist' ) );
    } );

} );
