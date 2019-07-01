const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: path.resolve(__dirname, '../internal/loader')
          },
          {
            loader: 'raw-loader'
          }
        ]
      }
    ]
  }
};
