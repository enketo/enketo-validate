'use strict';

const jsdom = require( 'jsdom' );
const { JSDOM } = jsdom;
const fs = require( 'fs' );
const path = require( 'path' );
const libxslt = require( 'libxslt' );
const libxmljs = libxslt.libxmljs;
const sheets = require( 'enketo-xslt' );
const xslModelSheet = libxslt.parse( sheets.xslModel );

class XForm {

    constructor( xformStr, options = {} ) {
        if ( !xformStr || !xformStr.trim() ) {
            throw 'Empty form. [general]';
        }
        this.xformStr = xformStr;
        this.dom = this._getDom();
        this.doc = this.dom.window.document;
        this.debug = !!options.debug;
    }

    get binds() {
        return this.doc.querySelectorAll( 'bind' );
    }

    // The reason this is not included in the constructor is to separate different types of errors,
    // and keep the constructor just for XML parse errors.
    parseModel() {
        const scriptContent = fs.readFileSync( path.join( __dirname, '../build/FormModel-bundle.js' ), { encoding: 'utf-8' } );

        // This window is not to be confused with this.dom.window which contains the XForm.
        const window = this._getWindow( scriptContent );

        // Disable the jsdom evaluator
        window.document.evaluate = undefined;

        // Get a serialized model with namespaces in locations that Enketo can deal with.
        const modelStr = this._extractModelStr().root().get( '*' ).toString( false );
        const external = this._getExternalDummyContent();

        // Instantiate an Enketo Core Form Model
        this.model = new window.FormModel( { modelStr: modelStr, external: external } );
        let loadErrors = this.model.init();

        if ( loadErrors.length ) {
            throw loadErrors;
        }
    }

    enketoEvaluate( expr, type = 'string', contextPath = null ) {
        try {
            if ( !this.model ) {
                console.log( 'Unexpectedly, there is no model when enketoEvaluate is called, creating one.' );
                this.parseModel();
            }
            // Note that the jsdom XPath evaluator was disabled in parseModel.
            // So we are certain to be testing Enketo's own XPath evaluator.
            let newExpr = this._stripJrChoiceName( expr );
            return this.model.evaluate( newExpr, type, contextPath );
        } catch ( e ) {
            //console.error( 'caught XPath exception', e );
            throw this._cleanXPathException( e );
        }
    }

    checkStructure( warnings, errors ) {
        const htmlNamespace = 'http://www.w3.org/1999/xhtml';
        const xformsNamespace = 'http://www.w3.org/2002/xforms';

        const rootEl = this.doc.documentElement;
        const rootElNodeName = rootEl.nodeName;
        if ( !( /^[A-z]+:html$/.test( rootElNodeName ) ) ) {
            errors.push( 'Root element should be <html>.' );
        }
        if ( rootEl.namespaceURI !== htmlNamespace ) {
            errors.push( 'Root element has incorrect namespace.' );
        }

        let headEl;
        let bodyEl;
        for ( let el of rootEl.children ) {
            if ( /^[A-z]+:head$/.test( el.nodeName ) ) {
                headEl = el;
            } else if ( /^[A-z]+:body$/.test( el.nodeName ) ) {
                bodyEl = el;
            }
        }
        if ( !headEl ) {
            errors.push( 'No head element found as child of <html>.' );
        }
        if ( headEl && headEl.namespaceURI !== htmlNamespace ) {
            errors.push( 'Head element has incorrect namespace.' );
        }
        if ( !bodyEl ) {
            errors.push( 'No body element found as child of <html>.' );
        }
        if ( bodyEl && bodyEl.namespaceURI !== htmlNamespace ) {
            errors.push( 'Body element has incorrect namespace.' );
        }

        let modelEl;
        if ( headEl ) {
            for ( let el of headEl.children ) {
                if ( /^([A-z]+:)?model$/.test( el.nodeName ) ) {
                    modelEl = el;
                    break;
                }
            }
            if ( !modelEl ) {
                errors.push( 'No model element found as child of <head>.' );
            }
            if ( modelEl && modelEl.namespaceURI !== xformsNamespace ) {
                errors.push( 'Model element has incorrect namespace.' );
            }
        }

        let primInstanceEl;
        if ( modelEl ) {
            for ( let el of modelEl.children ) {
                if ( /^([A-z]+:)?instance$/.test( el.nodeName ) ) {
                    primInstanceEl = el;
                    break;
                }
            }
            if ( !primInstanceEl ) {
                errors.push( 'No primary instance element found as first instance child of <model>.' );
            }
            if ( primInstanceEl && primInstanceEl.namespaceURI !== xformsNamespace ) {
                errors.push( 'Primary instance element has incorrect namespace.' );
            }
        }

        if ( primInstanceEl ) {
            const children = primInstanceEl.children;
            if ( children.length === 0 ) {
                errors.push( 'Primary instance element has child.' );
            } else if ( children.length > 1 ) {
                errors.push( 'Primary instance element has more than 1 child.' );
            }
            if ( children && !children[ 0 ].id ) {
                errors.push( `Data root node <${children[0].nodeName}> has no id attribute.` );
            }
        }

        // ODK Build bug
        if ( this.doc.querySelector( 'group:not([ref])' ) ) {
            warnings.push( 'Found <group> without ref attribute. This might be fine as long as the group has no relevant logic.' );
        }

        // ODK Build output
        if ( this.doc.querySelector( 'group:not([ref]) > repeat' ) ) {
            warnings.push( 'Found <repeat> that has a parent <group> without a ref attribute. If the repeat has relevant logic, this will make the form very slow.' );
        }
    }

    /*
     * Obtain an isolated "browser" window context and optionally, run a script in this context.
     */
    _getWindow( scriptContent = '' ) {
        // Let any logging by Enketo Core fall into the abyss.
        const virtualConsole = new jsdom.VirtualConsole();
        const { window } = new JSDOM( '', { runScripts: 'dangerously', virtualConsole: virtualConsole } );
        const scriptEl = window.document.createElement( 'script' );
        scriptEl.textContent = scriptContent;
        window.document.body.appendChild( scriptEl );
        return window;
    }

    _getExternalDummyContent() {
        const dummyXmlStr = '<something/>';
        let external = [];
        this.doc.querySelectorAll( 'instance[id][src]' ).forEach( function( instance ) {
            external.push( { id: instance.id, xmlStr: dummyXmlStr } );
        } );
        return external;
    }

    /*
     * Since this is such a weird function that queries the body of the XForm,
     * and cannot be evaluated in XPath, and I hate it, we just strip it out.
     */
    _stripJrChoiceName( expr ) {
        return expr.replace( /jr:choice-name\(.*\)/g, '"a"' );
    }

    /*
     * This discombulated heavy-handed method ensures that the namespaces are included in their expected locations,
     * at least where Enketo Core knows how to handle them.
     */
    _extractModelStr() {
        let doc = libxmljs.parseXml( this.xformStr );
        return xslModelSheet.apply( doc );
    }

    _getDom() {
        try {
            return new JSDOM( this.xformStr, {
                contentType: 'text/xml'
            } );
        } catch ( e ) {
            throw this._cleanXmlDomParserError( e );
        }
    }

    _cleanXmlDomParserError( error ) {
        if ( this.debug ) {
            return error;
        }
        let parts = error.message.split( '\n' );
        return parts[ 0 ] + ' ' + parts.splice( 1, 4 ).join( ', ' );
    }

    _cleanXPathException( error ) {
        if ( this.debug ) {
            return error;
        }
        let parts = [ error.message.split( '\n' )[ 0 ], error.name, error.code ]
            .filter( part => !!part );

        parts[ 0 ] = parts[ 0 ]
            .replace( /Function "{}(.*)"/g, 'Function "$1"' )
            .replace( /\/model\/instance\[1\]/g, '' )
            .replace( /\(line: undefined, character: undefined\)/g, '' );
        // '. ,' => ','
        return parts.join( ', ' ).replace( /\.\s*,/g, ',' );
    }

}

module.exports = {
    XForm: XForm
};
