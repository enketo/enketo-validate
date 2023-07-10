const puppeteer = require( 'puppeteer' );

/**
 * This class approach makes it easy to open multiple browser instances with
 * different arguments in case that is ever required.
 */
class BrowserHandler {
    constructor() {
        const launchBrowser = async() => {
            this.browser = false;
            this.browser = await puppeteer.launch( {
                headless: 'new',
                devtools: false
            } );
            this.browser.on( 'disconnected', launchBrowser );
        };

        this.exit = ()=>{
            this.browser.off( 'disconnected', launchBrowser );
            this.browser.close();
        };

        ( async() => {
            await launchBrowser();
        } )();
    }
}

const getBrowser = ( handler ) =>
    new Promise( ( resolve ) => {
        const browserCheck = setInterval( () => {
            if ( handler.browser !== false ) {
                clearInterval( browserCheck );
                resolve( handler.browser );
            }
        }, 100 );
    } );

const closeBrowser = ( handler ) => {
    return handler.exit();
};

module.exports = { BrowserHandler, getBrowser, closeBrowser };
