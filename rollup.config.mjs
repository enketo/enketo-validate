import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: 'src/FormModel.js',
    output: {
        file: 'build/FormModel-bundle.js',
        format: 'iife'
    },
    plugins: [
        resolve( {
            mainFields: [ 'module', 'main', 'browser' ]
        } ),
        commonjs( {
            include: 'node_modules/**',
            sourceMap: false,
        } )
    ]
};
