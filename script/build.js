

const path = require('path');
const fsExtra = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel').default;
const replace = require('@rollup/plugin-replace');
const rollup = require('rollup').rollup;
const { exec } = require('child-process-promise');
const compiler = require('@ampproject/rollup-plugin-closure-compiler');


const isProduction = argv.prod;
const isRelease = argv.release;

const closureOptions = {
	apply_input_source_maps: false,
	assume_function_wrapper: true,
	compilation_level: 'SIMPLE',
	inject_libraries: false,
	language_in: 'ECMASCRIPT_2019',
	language_out: 'ECMASCRIPT_2019',
	process_common_js_modules: false,
	rewrite_polyfills: false,
	use_types_for_optimization: false,
	warning_level: 'QUIET'
};

const inputOptions = (isProd) => ({
	input: 'src/index.ts',
	external(modulePath, src) {
		return modulePath === 'util';
	},
	plugins: [
		nodeResolve({
			extensions: ['.js', '.jsx', '.ts', '.tsx']
		}),
		babel({
			babelHelpers: 'bundled',
			babelrc: false,
			configFile: false,
			exclude: '/**/node_modules/**',
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
			presets: [
				[
					'@babel/preset-typescript',
					{
						tsconfig: path.resolve('./tsconfig.build.json')
					}
				],
			]
		}),
		commonjs(),
		isProd && compiler()
	],
	treeshake: 'smallest'
})

const outputOptions = {
	esModule: false,
	exports: 'auto',
	externalLiveBindings: false,
	file: './dist/PowerfulMitt.js',
	format: 'cjs', // change between es and cjs modules
	freeze: false,
	interop: false
}

async function buildTSDeclarationFiles() {
	await exec('tsc -p ./tsconfig.build.json');
}

async function moveTSDeclarationFilesIntoDist() {
	await fsExtra.copy(`./.ts-temp`, `dist`);
	await exec(`rm -rf ./.ts-temp`);
}

function getFileName(fileName, isProd) {
	if (isRelease) {
		return `${fileName}.${isProd ? 'prod' : 'dev'}.js`;
	}
	return `${fileName}.js`;
}

function buildForkModule(outputPath) {
	const outputFileName = 'PowerfulEmit'
	const lines = [
		`'use strict'`,
		`const ${outputFileName} = process.env.NODE_ENV === 'development' ? require('./${outputFileName}.dev.js') : require('./${outputFileName}.prod.js')`,
		`module.exports = ${outputFileName};`
	];
	const fileContent = lines.join('\n');
	fsExtra.outputFileSync(
		path.resolve(path.join(`dist/${outputFileName}.js`)),
		fileContent,
	);
}

async function build() {
	if (isRelease || isProduction) {
		await buildTSDeclarationFiles()
	}
	const result = await rollup(inputOptions(isProduction));
	await result.write({
		...outputOptions,
		file: path.resolve(
			path.join(`dist/${getFileName('PowerfulEmit', isProduction)}`),
		)
	});
	if (isRelease) {
		const result = await rollup(inputOptions(false));
		await result.write({
			...outputOptions,
			file: path.resolve(
				path.join(`dist/${getFileName('PowerfulEmit', false)}`),
			)
		});
		buildForkModule()
	}
	if (isRelease || isProduction) {
		await moveTSDeclarationFilesIntoDist()
	}
}

build()
