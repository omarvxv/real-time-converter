module.exports = {
    mode: 'production',
    entry: './script.js',
    output: {
        filename: './main.minified.js',
    },
    module: {
        rules: [
            {
             test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
      },
 
 };
 