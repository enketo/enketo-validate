const puppeteer = require( 'puppeteer' );

const CI = !!process.env.CI
console.log(process.env.CI, CI)

/**
 * This class approach makes it easy to open multiple browser instances with
 * different arguments in case that is ever required.
 */
class BrowserHandler {
    /**
     * @type Promise<import( 'puppeteer' ).Browser | null>
     */
    _instance = Promise.resolve(null)

    get instance() {
        return this._instance
    }

    async setup() {
        console.log('BrowserHandler.setup', CI)
        const instance = await this._instance
        if(instance) return instance

        const newInstance = puppeteer.launch( {
            // Disable Chrome sandbox on CI. For running tests locally, it should work or you *should* configure it!
            // See https://pptr.dev/troubleshooting#setting-up-chrome-linux-sandbox
            ...(CI ? {args: ['--no-sandbox']} : {}),
            headless: 'new',
            devtools: false
        } ).then((pupeteerInstance) => {
            pupeteerInstance.on( 'disconnected', this.setup.bind(this) );
            return pupeteerInstance
        })
        this._instance = newInstance
        return await newInstance
    }

    async teardown() {
        const instance = await this._instance
        if(!instance) return
        this._instance = Promise.resolve(null)

        instance.off( 'disconnected', this.setup.bind(this) );
        instance.close()
    }
}

const handler = new BrowserHandler();

const getBrowser = ( ) => handler.setup()
const closeBrowser = ( ) => handler.teardown()
module.exports = { getBrowser, closeBrowser };
