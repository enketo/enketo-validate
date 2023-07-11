import resolve from 'rollup-plugin-node-resolve';

export default {
    input: 'src/utils.js',
    output: {
        file: 'build/utils-cjs-bundle.js',
        format: 'cjs'
    },
    plugins: [
        resolve( {
            module: true,
            main: true,
            node: true,
            browser: false,
        } )
    ]
};
