const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const DotEnv = require("dotenv-webpack");
const webpack = require("webpack");

module.exports = {
    entry: {
        app: './src/index.tsx'
    },
    output: {
        filename: 'main.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
          template: './public/index.html',
          filename: 'index.html',
          favicon: './public/favicon.ico',
          manifest: './public/manifest.json',
        }),
        new webpack.ProvidePlugin({
            React: 'react',
        }),
        new DotEnv(),
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
            test: /\.(ts|tsx|js|jsx)$/,
            use: 'babel-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.css$/,
            use: [
                { loader: 'style-loader', options: { injectType: 'singletonStyleTag' } },
                { 
                    loader: 'css-loader',
                    options: {
                        modules: {
                            localIdentName: "[name]__[local]__[hash:base64:5]",
                            exportLocalsConvention: "camelCase",
                        }
                    }, 
                },
            ]
        },
        {
            test: /\.(bin)$/,
            use: [
              {
                loader: 'file-loader',
                options: {}
              }
            ]
        },
      ]
    },
    performance: {
        hints: false
    }
};
