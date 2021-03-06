const { readdirSync } = require('fs');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
	.BundleAnalyzerPlugin;

const config = require('./shared/config');
const { repoRoot, outputPath } = require('../scripts/util');

const listDirsSync = dir =>
	readdirSync(dir, { withFileTypes: true })
		.filter(f => !f.isFile())
		.map(f => f.name);

/**
 * @typedef {{ mode: "development" | "production" }} WebpackArgv
 * @param {string} bundleName
 * @param {string} title
 * @returns {(env: any, argv: WebpackArgv) => import('webpack').Configuration}
 */
const getConfig = (bundleName, title, resolve = {}) => (env, argv) => {
	const isDev = argv.mode === 'development';
	const srcDir = (...args) => repoRoot('./src', bundleName, ...args);
	const distDir = (...args) =>
		outputPath(bundleName == 'homepage' ? '.' : bundleName, ...args);
	const publicPath = bundleName == 'homepage' ? '' : bundleName + '/';

	if (argv.preact) {
		resolve.alias = resolve.alias || {};
		resolve.alias.preact = argv.preact;
		resolve.alias['preact/compat'] = path.join(argv.preact, 'compat');
		resolve.alias['preact/test-utils'] = path.join(argv.preact, 'test-utils');
	}

	return {
		entry: srcDir('index.js'),
		output: {
			filename: isDev
				? `${bundleName}.bundle.js`
				: `${bundleName}.[contenthash:5].bundle.js`,
			path: distDir(),
			publicPath: `${config.base}/${publicPath}`
		},
		resolve,
		module: {
			rules: [
				{
					test: /\.m?js$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: [
								'@babel/preset-env',
								[
									'@babel/preset-react',
									{
										pragma: 'createElement',
										pragmaFrag: 'Fragment'
									}
								]
							],
							plugins: [
								['@babel/plugin-proposal-class-properties', { loose: true }]
							]
						}
					}
				},
				{
					test: /\.css$/,
					exclude: /node_modules/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {
								modules: {
									localIdentName: '[local]__[hash:base64:5]'
								},
								importLoaders: 1,
								sourceMap: true
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								ident: 'postcss',
								sourceMap: true,
								plugins: [require('autoprefixer')]
							}
						}
					]
				},
				{
					test: /\.scss$/,
					exclude: /node_modules/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {
								modules: {
									localIdentName: '[local]__[hash:base64:5]'
								},
								importLoaders: 1,
								sourceMap: true
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								ident: 'postcss',
								sourceMap: true,
								plugins: [require('autoprefixer')]
							}
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.(svg|woff2?|ttf|eot|jpe?g|png|webp|gif|mp4|mov|ogg|webm)(\?.*)?$/i,
					loader: 'file-loader',
					options: {
						name: isDev ? '[name].[ext]' : '[name].[contenthash:5].[ext]'
					}
				}
			]
		},
		optimization: {
			minimizer: [new TerserPlugin(), new OptimizeCssAssetsPlugin()],
			moduleIds: isDev ? 'named' : 'hashed'
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: isDev ? '[name].css' : '[name].[contenthash:5].css',
				chunkFilename: isDev
					? '[id].[name].chunk.css'
					: '[name].chunk.[contenthash:5].css'
			}),
			new HtmlWebpackPlugin({
				title: `${title} - Preact Integrations`,
				template: repoRoot('src/shared/template.ejs'),
				templateParameters(compilation, assets, options) {
					return {
						// Re-create default params
						compilation: compilation,
						// webpack: compilation.getStats().toJson(), // Expensive
						webpackConfig: compilation.options,
						htmlWebpackPlugin: {
							files: assets,
							options: options
						},
						// Add custom params
						libraries: listDirsSync(srcDir())
					};
				}
			}),
			new BundleAnalyzerPlugin({
				analyzerMode: 'static',
				defaultSizes: 'gzip',
				reportFilename: 'stats/bundle-analyzer.html',
				openAnalyzer: false,
				// generateStatsFile: true, // Expensive. Only generate when needed
				statsFilename: 'stats/stats.json'
			}),
			...(isDev ? [] : [new CleanWebpackPlugin({})])
		].filter(Boolean)
	};
};

module.exports = {
	getConfig
};
