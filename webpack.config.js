const path = require('path');

module.exports = {
  mode: 'production',
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
    background: './src/background.ts',
    content: './src/content.ts',
    preview: './src/preview.ts'
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'js')
  },
};