import path from 'path'
import webpack from 'webpack'

const devtools = process.env.CONTINUOUS_INTEGRATION
  ? 'inline-source-map'
  // cheap-module-eval-source-map, because we want original source, but we don't
  // care about columns, which makes this devtool faster than eval-source-map.
  // http://webpack.github.io/docs/configuration.html#devtool
  : 'cheap-module-eval-source-map'
const isDevelopment = process.env.NODE_ENV === 'development'
export default {
  hotPort: 8080,
  cache: isDevelopment,
  debug: isDevelopment,
  devtool: isDevelopment ? devtools : '',
  entry: [
    'babel-polyfill',
    './client/index',
  ],
  module: {
    loaders: [{
      test: /\.json$/,
      loader: 'json',
    }, {
      test: /\.(gif|jpg|png|woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader?limit=100000',
    }, {
      test: /\.jsx?$/,
      loader: 'babel',
      exclude: /node_modules/,
      query: {
        presets: ['es2015']
      },
    }],
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(isDevelopment
          ? 'development'
          : 'production'),
        IS_BROWSER: true,
      },
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    ...(isDevelopment ? [
      // new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin(),
    ] : [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          screw_ie8: true, // eslint-disable-line camelcase
          warnings: false, // Because uglify reports irrelevant warnings.
        },
      }),
    ]),
  ],
  resolve: {
    extensions: ['', '.js', '.jsx', '.json'],
    root: __dirname,
  },
}
