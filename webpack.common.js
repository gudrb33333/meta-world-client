const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InterpolateHtmlPlugin = require("interpolate-html-plugin")

module.exports = {
    entry: {
        app: './src/index.tsx'
    },
    output: {
        filename: './build/main.js',
        library: 'MetaWorld',
        libraryTarget: 'umd',
        path: path.resolve(__dirname)
    },
    plugins: [
        new HtmlWebpackPlugin({
          template: './public/index.html',
          filename: './index.html',
          favicon: './public/favicon.ico'
        }),
        new InterpolateHtmlPlugin({
            PUBLIC_URL: 'public' // can modify `static` to another name or get it from `process`
        })
    ],
    resolve: {
        alias: {
          cannon: path.resolve(__dirname, './src/lib/cannon/cannon.js')
        },
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    module: {
        rules: [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.css$/,
            use: [
                { loader: 'style-loader', options: { injectType: 'singletonStyleTag' } },
                { loader: 'css-loader' },
            ]
        },
        {
            test: /\.(glb|gltf)$/,
            use:
            [
                {
                    loader: 'file-loader',
                    options:
                    {
                        outputPath: 'assets/models/'
                    }
                }
            ]
        },
      ]
    },
    performance: {
        hints: false
    }
};