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
            module: true,
            main: true,
            browser: true,
        } ),
        commonjs( {
            include: 'node_modules/**',
            sourceMap: false,
        } )
    ]
};