const puppeteer = require( 'puppeteer' );

const CI = !!process.env.CI;

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
        const instance = await this._instance
        if(instance) return instance

        const newInstance = puppeteer.launch( {
            args: CI ? [ '--no-sandbox' ] : undefined,
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
        if(!instance) return null

        this._instance = Promise.resolve(null)
        instance.off( 'disconnected', this.setup.bind(this) );
        instance.close()
        return null
    }
}

const handler = new BrowserHandler();

const getBrowser = ( ) => handler.setup()
const closeBrowser = ( ) => handler.teardown()
module.exports = { getBrowser, closeBrowser };
