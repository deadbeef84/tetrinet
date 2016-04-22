import path from 'path'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

const isDevelopment = process.env.NODE_ENV !== 'production'
export default {
  hotPort: 8080,
  cache: isDevelopment,
  debug: isDevelopment,
  devtool: isDevelopment ? 'cheap-module-eval-source-map' : '',
  entry: [
    'babel-polyfill',
    './src/client'
  ],
  module: {
    loaders: [{
      test: /\.json$/,
      loader: 'json'
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
    }, {
      test: /\.(gif|jpg|png|woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader?limit=100000'
    }, {
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel'
    }]
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  plugins: [
    new ExtractTextPlugin('[name].css'),
    new HtmlWebpackPlugin({
      title: 'Tetrinet'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(isDevelopment ? 'development' : 'production'),
        IS_BROWSER: true
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    ...(isDevelopment ? [
      // new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ] : [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          screw_ie8: true, // eslint-disable-line camelcase
          warnings: false // Because uglify reports irrelevant warnings.
        }
      })
    ])
  ],
  resolve: {
    extensions: ['', '.js', '.jsx', '.json'],
    root: __dirname
  }
}
