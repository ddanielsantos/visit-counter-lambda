const path = require('path');
const minify = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    target: 'node',
    entry: './app.ts',
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                        },
                    },
                },
                type: 'javascript/auto',
            },
        ],
    },
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            type: 'commonjs',
        }
    },
    optimization: {
        minimize: true,
        minimizer: [new minify()],
    }
};