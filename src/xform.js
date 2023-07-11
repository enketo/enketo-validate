global.IntersectionObserver = function(){};
const utils = require( '../build/utils-cjs-bundle' );
const { JSDOM } = require( 'jsdom' );
const { getBrowser } = require( './headless-browser' );
const libxslt = require( 'libxslt' );
const libxmljs = libxslt.libxmljs;
const path = require( 'path' );
const sheets = require( 'enketo-transformer' ).sheets;
const xslModelSheet = libxslt.parse( sheets.xslModel );
const appearanceRules = require( './appearances' );


/**
 * @typedef Result
 * @property {Array<string>} warnings - List of warnings.
 * @property {Array<string>} errors - List of errors.
 */

/**
 * @class XForm
 */
class XForm {

    /**
     * @constructs
     *
     * @param {string} xformStr - XForm content.
     * @param {module:validator~ValidateResult} [options] - Validation options.
     */
    constructor( xformStr, options = {} ) {
        this.options = options;
        if ( !xformStr || !xformStr.trim() ) {
            throw 'Empty form.';
        }
        this.xformStr = xformStr;

        const dom = this._getDom();
        this.doc = dom.window.document;

        this.loadBrowserPage = getBrowser( )
            .then( browser =>{
                this.browser = browser;

                return browser.newPage();
            } )
            .then( page => {

                return page.addScriptTag( { path: path.join( __dirname, '../build/FormModel-bundle.js' ) } )
                    .then( () => page );
            } );
    }

    /*
    init(){
        return this.loadBrowserPage
         .then( page => page.evaluateHandle( ( ) => new DOMParser() ) )
            .then( parser => {
                console.log( parser, parser );
                console.log( 'doc', parser.parseFromString( this.xformStr ) );
            } );
            .then( page => page.evaluateHandle( xformStr => {
                const doc = new DOMParser().parseFromString( xformStr, 'text/xml' );
                console.log( 'doc', xformStr, doc );

                return doc;//new XMLSerializer().serializeToString( doc );
            }, this.xformStr ) )
            .then( result  => result.$( '*' ) )
            .then( value => {
                console.log( 'DOMParser parsing result',value );
                console.log( 'DOMParser parsing result',value.querySelector( '*' ) );
                //this.doc = result.asElement();
            } );

        // TODO: check DOMParser result for XML parse errors and throw those using cleanXMLDOMParserError
    }*/

    /**
     * @type {Array<Node>}
     */
    get instances() {
        this._instances = this._instances || [ ...this.doc.querySelectorAll( 'model > instance' ) ];

        return this._instances;
    }

    /**
     * @type {Array<Node>}
     */
    get binds() {
        this._binds = this._binds || [ ...this.doc.querySelectorAll( 'bind' ) ];

        return this._binds;
    }

    /**
     * @type {Array<Node>}
     */
    get bindsWithCalc() {
        this._bindsWithCalc = this._bindsWithCalc || [ ...this.doc.querySelectorAll( 'bind[calculate]' ) ];

        return this._bindsWithCalc;
    }

    /**
     * @type {Array<Node>}
     */
    get formControls() {
        // doc.evaluate does not support namespaces at all (nsResolver is not used) in JSDom, hence this clever not() trick
        // to use querySelectorAll instead.
        this._formControls = this._formControls || [ ...this.doc.querySelectorAll( '*|body *:not(item):not(label):not(hint):not(value):not(itemset):not(output):not(repeat):not(group):not(setvalue)' ) ];

        return this._formControls;
    }

    /**
     * @type {Array<Node>}
     */
    get groups() {
        // doc.evaluate does not support namespaces at all (nsResolver is not used) in JSDom
        this._groups = this._groups || [ ...this.doc.querySelectorAll( '*|body group' ) ];

        return this._groups;
    }

    /**
     * @type {Array<Node>}
     */
    get repeats() {
        // doc.evaluate does not support namespaces at all (nsResolver is not used) in JSDom
        this._repeats = this._repeats || [ ...this.doc.querySelectorAll( '*|body repeat' ) ];

        return this._repeats;
    }

    /**
     * @type {Array<Node>}
     */
    get setvalues() {
        this._setvalues = this._setvalues || [ ...this.doc.querySelectorAll( 'setvalue',  ) ];

        return this._setvalues;
    }

    /**
     * @type {Array<Node>}
     */
    get items() {
        // doc.evaluate does not support namespaces at all (nsResolver is not used) in JSDom
        this._items = this._items || [ ...this.doc.querySelectorAll( '*|body item, *|body itemset' ) ];

        return this._items;
    }

    /**
     * Object of known namespaces uses in ODK XForms, with prefixes as used in this validator.
     *
     * @type {object}
     */
    get NAMESPACES() {
        return {
            '': 'http://www.w3.org/2002/xforms',
            h: 'http://www.w3.org/1999/xhtml',
            oc: 'http://openclinica.org/xforms',
            odk: 'http://www.opendatakit.org/xforms',
            enk: 'http://enketo.org/xforms',
            orx: 'http://openrosa.org/xforms',
            xsd: 'http://www.w3.org/2001/XMLSchema',
        };
    }

    exit(){
        return this.loadBrowserPage
            .then( page => page.close() );
    }

    /**
     * Returns a `<bind>` element with the provided nodeset attribute value.
     *
     * @param {string} nodeset - nodeset attribute value
     * @return {Node} bind element matching the nodeset value
     */
    getBind( nodeset ) {
        return this.doc.querySelector( `bind[nodeset="${nodeset}"]` );
    }

    /**
     * Returns a `<setvalue>` element with the provided ref attribute value.
     *
     * @param {string} ref - ref attribute value
     * @return {Node} setvalue element matching the nodeset value
     */
    getSetvalue( ref ) {
        return this.doc.querySelector( `setvalue[ref="${ref}"]` );
    }

    /**
     * Returns namespace prefix for given namespace.
     *
     * @param {string} ns - One of predefined {@link XForm#NAMESPACES|NAMESPACES}.
     * @return {string} namespace prefix.
     */
    nsPrefixResolver( ns ) {
        let prefix = null;
        if ( !ns ) {
            return prefix;
        }
        Object.entries( this.NAMESPACES ).some( obj => {
            if ( obj[ 1 ] === ns ) {
                prefix = obj[ 0 ];

                return true;
            }
        } );

        return prefix;
    }

    /**
     * Parses the Model
     *
     * The reason this is not included in the constructor is to separate different types of errors,
     * and keep the constructor just for XML parse errors.
     */
    parseModel() {
        // Be careful here, the pkg module to create binaries is surprisingly sophisticated, but the paths cannot be dynamic.
        //const scriptContent = fs.readFileSync( path.join( __dirname, '../build/FormModel-bundle.js' ), { encoding: 'utf-8' } );

        // This window is not to be confused with this.dom.window which contains the XForm.
        //const window = this._getWindow( scriptContent );

        // Disable the jsdom evaluator
        // window.document.evaluate = undefined;
        let page;

        return this.loadBrowserPage
            .then( p => {
                page = p;
                // Get a serialized model with namespaces in locations that Enketo can deal with.
                const modelStr = this._extractModelStr().root().get( '*' ).toString( false );
                const externalArr = this._getExternalDataArray();

                // DEBUG
                /*
                page.on( 'console', msg => {
                    for ( let i = 0; i < msg.args().length; ++i )
                        console.log( `${i}: ${msg.args()[i]}` );
                } );
                */

                return page.evaluateHandle( ( modelStr,  externalArr, ocExtensions ) => {
                    const parser = new DOMParser();
                    const external = externalArr.map( instance => {
                        instance.xml = parser.parseFromString( '<something/>', 'text/xml' );

                        return instance;
                    } );

                    // Instantiate an Enketo Core Form Model
                    const model = new window.FormModel( { modelStr, external } );
                    // Add custom XPath functions
                    if ( ocExtensions ) {
                        model.bindJsEvaluator = () => {
                            model.xml.jsEvaluate = window.ocXPathEvaluator.evaluate;
                        };
                    }

                    return model;
                }, modelStr, externalArr, !!this.options.openclinica );
            } )
            .then( modelHandle => {

                this.modelHandle = modelHandle;

                return page.evaluateHandle( model => model.init(), modelHandle );
            } )
            .then( loadErrorsHandle => loadErrorsHandle.jsonValue() )
            .then( loadErrors => {
                if ( loadErrors.length ) {
                    throw loadErrors;
                }

                return page;
            } )
            .catch( e => {
                throw e;
            } );
    }

    /**
     * Evaluates an XPath expression on the XForm's primary instance.
     *
     * @param {string} expr - The expression to evaluate.
     * @param {string} [type] - One of boolean, string, number, node, nodes.
     * @param {string} [contextPath] - Query selector.
     * @param {boolean} tryNative - Whether it is safe to try the native evaluator (no date comparisons or calculations)
     * @return {Array<Element>} an array of elements.
     */
    enketoEvaluate( expr, type = 'string', contextPath = null, tryNative = false ) {
        const newExpr = this._stripJrChoiceName( expr );
        const getPage = this.modelHandle ? this.loadBrowserPage : this.parseModel();

        return getPage
            .then( page =>  page.evaluateHandle( ( model, newExpr, type, contextPath, tryNative ) => model.evaluate( newExpr, type, contextPath, null, tryNative ),  this.modelHandle, newExpr, type, contextPath, tryNative ) )
            .then ( resultHandle => resultHandle.jsonValue() )
            .catch( e => {
                throw this._cleanXPathException( e );
            } );
    }

    /**
     * Obtains a node from the model from its simple path.
     *
     * @param {string} path - simple path to node
     * @return {Element|null} the result element or null if not found
     */
    nodeExists( path ){
        return this.enketoEvaluate( path, 'node', null, true )
            .then( element => {
                return !!element;
            } );
    }

    /**
     * Checks if the structure is valid.
     *
     * @return {Result} Result object with warnings and errors.
     */
    checkStructure() {
        const errors = [];
        const warnings = [];
        const rootEl = this.doc.documentElement;
        const rootElNodeName = rootEl.nodeName;
        if ( !( /^[A-z]+:html$/.test( rootElNodeName ) ) ) {
            errors.push( 'Root element should be <html>.' );
        }
        if ( rootEl.namespaceURI !== this.NAMESPACES.h ) {
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
        if ( headEl && headEl.namespaceURI !== this.NAMESPACES.h ) {
            errors.push( 'Head element has incorrect namespace.' );
        }
        if ( !bodyEl ) {
            errors.push( 'No body element found as child of <html>.' );
        }
        if ( bodyEl && bodyEl.namespaceURI !== this.NAMESPACES.h ) {
            errors.push( 'Body element has incorrect namespace.' );
        }

        // These are the elements we expect to have a label though we're going slightly beyond spec requirement here.
        this.formControls.forEach( control => {
            // The selector ":scope > label" fails with namespaced elements such as odk:rank
            if ( ![ ...control.childNodes ].some( el => el.nodeName === 'label' ) ) {
                const nodeName = this._nodeName( control,'ref' ) || '?';
                errors.push( `Question "${nodeName}" has no label.` );
            }
        } );

        this.items.forEach( item => {
            if ( ![ ...item.childNodes ].some( el => el.nodeName === 'label' ) ){
                const nodeName = this._nodeName( item.parentElement, 'ref' ) || '?';
                errors.push( `Select option for question "${nodeName}" has no label.` );
            }
            if ( ![ ...item.childNodes ].some( el => el.nodeName === 'value' ) ){
                const nodeName = this._nodeName( item.parentElement, 'ref' ) || '?';
                errors.push( `Select option for question "${nodeName}" has no value.` );
            }
        } );

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
            if ( modelEl && modelEl.namespaceURI !== this.NAMESPACES[ '' ] ) {
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
            if ( primInstanceEl && primInstanceEl.namespaceURI !== this.NAMESPACES[ '' ] ) {
                errors.push( 'Primary instance element has incorrect namespace.' );
            }
        }

        if ( primInstanceEl ) {
            const children = primInstanceEl.children;
            if ( children.length === 0 ) {
                errors.push( 'Primary instance element has no child.' );
            } else if ( children.length > 1 ) {
                errors.push( 'Primary instance element has more than 1 child.' );
            }
            if ( children && !children[ 0 ].id ) {
                errors.push( `Data root node <${children[0].nodeName}> has no id attribute.` );
            }
            if ( children && children[ 0 ] ) {
                const dataNodeNames = [];
                const dataNodes = children[ 0 ].querySelectorAll( '*' );

                dataNodes.forEach( el => {
                    const nodeName = el.nodeName;
                    const index = dataNodeNames.indexOf( nodeName );
                    // Save XPath determination for when necessary, to not negatively affect performance.
                    if ( index !== -1 && utils.getXPath( dataNodes[ index ], 'instance' ) !== utils.getXPath( el, 'instance' ) ) {
                        warnings.push( `Duplicate question or group name "${nodeName}" found. Unique names are recommended` );
                    }
                    dataNodeNames.push( nodeName );
                } );
            }
        }

        if ( this.repeats.length ) {
            const repeatPaths = [];
            this.repeats.reverse().forEach( repeat => {
                const nodeset = repeat.getAttribute( 'nodeset' );
                // This check will fail if relative nodesets are used (not supported in Enketo any more).
                if ( repeatPaths.some( repeatPath => repeatPath.startsWith( nodeset + '/' ) ) ) {
                    warnings.push( `Repeat "${this._nodeName( nodeset )}" contains a nested repeat. This not recommended.` );
                }
                repeatPaths.push( nodeset );
            } );
        }

        if ( this.groups.length ){
            this.groups.forEach( group => {
                const ref = group.getAttribute( 'ref' );
                if ( group.getAttribute( 'intent' ) ){
                    errors.push( `Group "${this._nodeName( ref )}" has an unsupported "intent" attribute to launch an external app.` );
                }
            } );
        }

        // ODK Build bug
        if ( bodyEl && bodyEl.querySelector( 'group:not([ref])' ) ) {
            warnings.push( 'Found <group> without ref attribute. This might be fine as long as the group has no relevant logic.' );
        }

        // ODK Build output
        if ( bodyEl && bodyEl.querySelector( 'group:not([ref]) > repeat' ) ) {
            warnings.push( 'Found <repeat> that has a parent <group> without a ref attribute. ' +
                'If the repeat has relevant logic, this will make the form very slow.' );
        }

        return { warnings, errors };
    }

    /**
     * Checks if binds are valid.
     *
     * @return {Result} Result object with warnings and errors.
     */
    checkBinds() {
        const warnings = [];
        const errors = [];
        // Check for use of form controls with calculations that are not readonly
        this.bindsWithCalc
            .filter( this._withFormControl.bind( this ) )
            .filter( bind => {
                const readonly = bind.getAttribute( 'readonly' );

                // TODO: the check for true() should be probably be done in XPath,
                // using XPath boolean conversion rules.
                return !readonly || readonly.trim() !== 'true()';
            } )
            .map( bind => this._nodeName( bind ) )
            .forEach( nodeName => errors.push( `Question "${nodeName}" has a calculation that is not set to readonly.` ) );

        return { warnings, errors };
    }

    /**
     * Checks if appearances are valid.
     *
     * @return {Result} Result object with warnings and errors.
     */
    checkAppearances() {
        const warnings = [];
        const errors = [];
        this.formControls.concat( this.groups ).concat( this.repeats )
            .forEach( control => {
                let appearanceVal = control.getAttribute( 'appearance' );
                if ( !appearanceVal || !appearanceVal.trim() ) {
                    return;
                }

                const controlNsPrefix = this.nsPrefixResolver( control.namespaceURI );
                const controlName = controlNsPrefix && /:/.test( control.nodeName ) ? controlNsPrefix + ':' + control.nodeName.split( ':' )[ 1 ] : control.nodeName;
                const pathAttr = controlName === 'repeat' ? 'nodeset' : 'ref';
                const ref = control.getAttribute( pathAttr );
                const friendlyControlName = controlName === 'repeat' || controlName === 'group' ? controlName : 'question';
                if ( !ref ) {
                    errors.push( `A ${friendlyControlName} found in body that has no ${pathAttr} attribute (${control.nodeName}).` );

                    return;
                }
                const nodeName = this._nodeName( ref ); // in model!
                const bindEl = this.getBind( ref );
                let dataType = bindEl ? bindEl.getAttribute( 'type' ) : 'string';
                // Convert ns prefix to properly evaluate XML Schema datatypes regardless of namespace prefix used in XForm.
                const typeValNs = /:/.test( dataType ) ? bindEl.lookupNamespaceURI( dataType.split( ':' )[ 0 ] ) : null;
                dataType = typeValNs ? `${this.nsPrefixResolver( typeValNs )}:${dataType.split( ':' )[1]}` : dataType;

                // Special error for use of ex;
                if ( appearanceVal.trim().startsWith( 'ex:' ) ){
                    errors.push( `Appearance "ex:" to launch an external app for ${friendlyControlName} "${nodeName}" is not supported.` );

                    return;
                }
                // Special search() error to avoid splitting space-separated parameters causing many unhelpful errors
                const searchMatches = appearanceVal.match( /search\(.+\)/ );
                if ( searchMatches ){
                    appearanceVal = appearanceVal.replace( searchMatches[0], '' );
                    errors.push( `Appearance "search" for ${friendlyControlName} "${nodeName}" is not supported.` );
                }
                const appearances = appearanceVal.trim() ? appearanceVal.split( ' ' ) : [];
                appearances.forEach( appearance => {
                    let rules = appearanceRules[ appearance ] || [];

                    if ( typeof rules === 'string' ) {
                        rules = appearanceRules[ rules ];
                    }
                    if ( typeof rules === 'object' && !Array.isArray( rules ) ){
                        rules = [ rules ];
                    }
                    if ( !Array.isArray( rules ) ){
                        console.error( 'Appearance rules not in expected format.' );
                    }

                    if ( rules.length === 0 ) {
                        warnings.push( `Appearance "${appearance}" for ${friendlyControlName} "${nodeName}" is not supported.` );

                        return;
                    }

                    const allowedControls = rules.map( rule => rule.controls || [] ).flat();
                    if ( allowedControls.length && !allowedControls.includes( controlName ) ) {
                        warnings.push( `Appearance "${appearance}" for "${nodeName}" is not valid for type ${control.nodeName}.` );

                        return;
                    }

                    const allowedTypes = rules.map( rule => rule.types || [] ).flat();
                    if ( allowedTypes.length && !allowedTypes.includes( dataType ) ) {
                        // Only check types if controls check passed.
                        // TODO check namespaced types when it becomes applicable (for XML Schema types).
                        warnings.push( `Appearance "${appearance}" for ${friendlyControlName} "${nodeName}" is not valid for this data type (${dataType}).` );

                        return;
                    }

                    // Find rule that allows this appearance.
                    // For now it is safe to just take the first matching control if one exist and otherwise the first matching type.
                    const applicableRule = rules.find( rule => ( rule.controls || [] ).includes( controlName ) )
                        || rules.find( rule => ( rule.types || [] ).includes( dataType ) )
                        || rules[0];

                    if ( applicableRule && applicableRule.appearances && !applicableRule.appearances.some( appearanceMatch => appearances.includes( appearanceMatch ) ) ) {
                        warnings.push( `Appearance "${appearance}" for ${friendlyControlName} "${nodeName}" requires any of these appearances: "${this._join( applicableRule.appearances )}".` );

                        return;
                    }

                    if ( applicableRule && applicableRule.appearancesConflict && applicableRule.appearancesConflict.some( appearanceMatch => appearances.includes( appearanceMatch ) ) ) {
                        warnings.push( `Appearance "${appearance}" for ${friendlyControlName} "${nodeName}" cannot be used in combination with any of these appearances: "${this._join( applicableRule.appearancesConflict )}".` );

                        return;
                    }


                    if ( applicableRule && applicableRule.preferred ) {
                        warnings.push( `Appearance "${appearance}" for ${friendlyControlName} "${nodeName}" is deprecated, use "${applicableRule.preferred}" instead.` );
                    }
                    // Possibilities for future additions:
                    // - check accept/mediaType
                    // - check conflicting combinations of appearances



                } );

            } );

        return { warnings, errors };
    }

    /**
     * Checks special OpenClinica rules.
     *
     * @return {Result} Result object with warnings and errors.
     */
    checkOpenClinicaRules() {
        const warnings = [];
        const errors = [];
        const CLINICALDATA_REF = /instance\(\s*(["'])((?:(?!\1)clinicaldata))\1\s*\)/;

        // Check for use of external data in instance "clinicaldata"
        this.binds
            .filter( this._withoutFormControl.bind( this ) )
            .filter( bind => {
                const path = bind.getAttribute( 'nodeset' );
                const setvalue = this.getSetvalue( path );
                const calculation = bind.getAttribute( 'calculate' );
                const value = setvalue && setvalue.getAttribute( 'value' );

                return ( CLINICALDATA_REF.test( calculation ) || CLINICALDATA_REF.test( value ) ) &&
                    bind.getAttributeNS( this.NAMESPACES.oc, 'external' ) !== 'clinicaldata';
            } )
            .map( bind => this._nodeName( bind ) )

            .forEach( nodeName => errors.push( `Found calculation for question "${nodeName}" that refers to ` +
                'external clinicaldata without the required "external" attribute in the correct namespace.' ) );

        this.binds
            .filter( bind => bind.getAttributeNS( this.NAMESPACES.oc, 'external' ) === 'clinicaldata' )
            .filter( bind => {
                const path = bind.getAttribute( 'nodeset' );
                const setvalue = this.getSetvalue( path );
                const calculation = bind.getAttribute( 'calculate' );
                const value = setvalue && setvalue.getAttribute( 'value' );

                return ( !calculation && !value ) ||
                    ( calculation && !CLINICALDATA_REF.test( calculation ) ) ||
                    ( value && !CLINICALDATA_REF.test( value ) ) ;
            } )
            .map( bind => this._nodeName( bind ) )
            .forEach( nodeName => errors.push( `Found bind with external attribute with "clinicaldata" value for question "${nodeName}" that does not ` +
                'have a calculation referring to instance("clinicaldata").' ) );

        const externalSignatureQuestions =  this.binds
            .filter( bind => bind.getAttributeNS( this.NAMESPACES.oc, 'external' ) === 'signature' );

        if ( externalSignatureQuestions.length > 1 ){
            errors.push( 'Consent forms can only include one signature item.' );
        }

        externalSignatureQuestions
            .forEach( bind => {
                const path = bind.getAttribute( 'nodeset' );
                const select = this.doc.querySelector( `select[ref="${path}"]` );
                const appearanceVal = select ? select.getAttribute( 'appearance' ) : '';
                const options = select ? select.querySelectorAll( 'item' ) : [];
                const valueEl = options[0] ? options[0].querySelector( 'value' ) : null;

                if( !select || options.length !== 1 ||
                    ( appearanceVal && appearanceVal.trim().split( ' ' ).includes( 'minimal' ) ) ){
                    errors.push( 'Signature items must be of type "select_multiple" with one option.' );
                } else if ( valueEl && valueEl.textContent !== '1' ){
                    errors.push( 'Signature items must have choice name set to "1"' );
                }
            } );

        this.binds
            .forEach( bind => {
                const question = this._nodeName( bind );
                const missingAttributes = [];

                for ( const prop in bind.attributes ){
                    const attribute = bind.attributes[prop];
                    if ( attribute.namespaceURI === this.NAMESPACES.oc && attribute.localName !== 'constraint-type' && attribute.localName.startsWith( 'constraint' ) ){
                        const constraintName = attribute.localName;
                        const match = constraintName.match( /^constraint(.*)$/ );
                        const msg = constraintName.endsWith( 'Msg' ) ? 'Msg' : '';
                        const id = msg ? match[1].substring( 0, match[1].length - 3 ) : match[1];

                        if ( !utils.isNumber( id ) || id < 1 || id > 20 ){
                            errors.push( `Found unsupported oc:constraint${id}${msg} for question "${question}". Only numbers 1 to 20 are supported.` );

                        } else {
                            // Only check valid attributes for matching Msg attributes and vice versa
                            const matchingAttribute = `constraint${id}${msg ? '' : 'Msg'}`;
                            const foundIndex = missingAttributes.findIndex( arr => arr[0] === matchingAttribute );
                            if ( foundIndex === -1 ){
                                // presume missing until found
                                missingAttributes.push( [ matchingAttribute, constraintName ] );
                            } else {
                                missingAttributes.splice( foundIndex, 1 );
                            }
                        }
                    }
                }

                missingAttributes.forEach( arr => errors.push( `Missing matching oc:${arr[0]} for oc:${arr[1]} for question "${question}".` ) );
            } );


        // check for use of last-saved feature
        this.instances
            .forEach( instance => {
                const src = instance.getAttribute( 'src' );
                if ( /\s?jr:\/\/instance\/last-saved/.test( src ) ){
                    errors.push( 'The form includes the use of the "last-saved" feature. This feature is not supported.' );
                }
            } );

        return { warnings, errors };
    }

    /**
     * Returns some dummy external data that can be used to instantiate a Form instance that requires external data.
     *
     * @return {Array<{id: string}>} external data object with dummy content
     */
    _getExternalDataArray() {
        return [ ...this.doc.querySelectorAll( 'instance[id][src]' ) ].map( instance => ( { id:instance.id } ) );
    }

    /**
     * Strips jr:choice-name function.
     *
     * Since this is such a weird function that queries the body of the XForm,
     * and cannot be evaluated in XPath, we just strip it out.
     *
     * @param {string} expr - The initial expression.
     * @return {string} expression after stripping.
     */
    _stripJrChoiceName( expr ) {
        utils.parseFunctionFromExpression( expr, 'jr:choice-name' ).forEach( choiceFn => {
            expr = expr.replace( choiceFn[ 0 ], '"a"' );
        } );

        return expr;
    }

    /**
     * Inefficient method that ensures that the namespaces are included in their expected locations,
     * so Enketo Core knows how to handle them.
     *
     * @return {string|Document} The XML content to apply the stylesheet to given as a string or a libxmljs document.
     */
    _extractModelStr() {
        // First remove all jr:template="" attributes, because older forms won't have an additional first repeat instance.
        // https://github.com/enketo/enketo-validate/issues/73
        // This is of course a very bad way of doing this relying on a jr prefix, but likely no problem for anyone.
        this.xformStr = this.xformStr.replace( /jr:template=""/g, '' );

        let doc = libxmljs.parseXml( this.xformStr );

        return xslModelSheet.apply( doc );
    }

    /**
     * Returns a JSDOM instance of the XForm.
     *
     * @return {JSDOM} JSDOM instance of the XForm
     */
    _getDom() {
        try {
            return new JSDOM( this.xformStr, {
                contentType: 'text/xml'
            } );
        } catch ( e ) {
            throw this._cleanXmlDomParserError( e );
        }
    }

    /**
     * Determines whether  a `<bind>` element has corresponding input form control.
     *
     * @param {Element} bind - The XForm <bind> element.
     * @return {boolean} whether the provided bind has a matching form control
     */
    _withFormControl( bind ) {
        const nodeset = bind.getAttribute( 'nodeset' );

        // We are not checking for <group> and <repeat>,
        // as the purpose of this function is to identify calculations without form control
        return !!this.doc.querySelector( `input[ref="${nodeset}"], select[ref="${nodeset}"], ` +
            `select1[ref="${nodeset}"], trigger[ref="${nodeset}"]` );
    }

    /**
     * A reverse method of {@link XForm#_withFormControl|_withFormControl}
     *
     * @param {Element} bind - The XForm <bind> element.
     * @return {boolean} whether the provided bind has no matching form control
     */
    _withoutFormControl( bind ) {
        return !this._withFormControl( bind );
    }

    /**
     * Returns the model node name that a provided element refers to.
     *
     * @param {Element|string} thing - The XForm element or path.
     * @param {string} attribute - The attribute that contains the path.
     * @return {string|null} the node name.
     */
    _nodeName( thing, attribute = 'nodeset' ) {
        let path;

        if ( typeof  thing === 'string' ){
            path = thing;
        } else {
            path = thing.getAttribute( attribute );
        }

        return path ? path.substring( path.lastIndexOf( '/' ) + 1 ) : null;
    }

    /**
     * Returns a cleaned-up XmlDomParser error string unless in debug mode.
     *
     * @param {Error} error - Error object
     * @return {Error|string} cleaned up error message or original error object
     */

    _cleanXmlDomParserError( error ) {
        if ( this.options.debug ) {
            return error;
        }
        let parts = error.message.split( '\n' );

        return parts[ 0 ] + ' ' + parts.splice( 1, 4 ).join( ', ' );
    }

    /**
     * Returns cleaned-up XPath Exception error string unless in debug mode.
     *
     * @param {Error} error - Error object
     * @return {Error|string} cleaned up error message or original error object
     */
    _cleanXPathException( error ) {
        if ( this.options.debug ) {
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

    /**
     * Joins an array of strings into a readable string.
     *
     * @param {Array<string>} arr - array of strings
     */
    _join( arr ) {
        const words = Array.from( arr );
        const last = words.length > 1 ? `, and ${words.pop()}` : '';

        return `${words.join( ', ' )}${last}`;
    }
}

module.exports = {
    XForm: XForm
};
