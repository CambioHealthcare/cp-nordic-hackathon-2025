const { override, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
    (config) => {
        const fallback = {
            ...config.resolve.fallback,
            process: false,
            module: false
        };

        config.resolve = {
            ...config.resolve,
            fallback,
            alias: {
                ...config.resolve.alias,
                'process/browser': 'process/browser.js'
            }
        };

        config.plugins = [
            ...config.plugins,
            new webpack.ProvidePlugin({
                process: 'process/browser.js',
                Buffer: ['buffer', 'Buffer']
            })
        ];

        return config;
    }
);
