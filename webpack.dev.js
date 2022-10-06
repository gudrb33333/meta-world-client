const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require('fs');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        // progress: true,
        //liveReload: false,
        //https: {
        //    key: fs.readFileSync('./src/certs/key.pem', 'utf-8'),
        //    cert: fs.readFileSync('./src/certs/cert.pem', 'utf-8')
        //},
        //host: "hubs.local",
        //disableHostCheck: true
        historyApiFallback : true , 
    },
});