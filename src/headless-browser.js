const puppeteer = require( 'puppeteer' );

const CI = !!process.env.CI

/**
 * This class approach makes it easy to open multiple browser instances with
 * different arguments in case that is ever required.
 */
class BrowserHandler {
    constructor() {
        const launchBrowser = async() => {
            this.browser = false;
            this.browser = await puppeteer.launch( {
                // Disable Chrome sandbox on CI. For running tests locally, it should work or you *should* configure it!
                // See https://pptr.dev/troubleshooting#setting-up-chrome-linux-sandbox
                ...(CI ? {args: ['--no-sandbox']} : {}),
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

const handler = new BrowserHandler();

const getBrowser = ( ) =>
    new Promise( ( resolve ) => {
        const browserCheck = setInterval( () => {
            if ( handler.browser !== false ) {
                clearInterval( browserCheck );
                resolve( handler.browser );
            }
        }, 100 );
    } );


// TODO: it's weird that after calling this function there is no way to
// get a browser any more. If getBrowser() is called again a new BrowserHandler instance should be created
const closeBrowser = ( ) => {

    return handler.exit();
};

module.exports = { getBrowser, closeBrowser };
