const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  entry: {
    background: './src/background/background.ts',
    content: './src/content/content.ts',
    updateContent: './src/content/updateContent.ts',
    preview: './src/preview/preview.ts',
    getHtml: './src/preview/getHtml.ts',
    options: './src/options/options.ts'
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'js')
  },
};