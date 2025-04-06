import fs from 'fs';
import replace from 'rollup-plugin-replace';
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import {terser} from 'rollup-plugin-terser';
import {sveltePreprocess} from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';
import svg from 'rollup-plugin-svg';
import less from 'rollup-plugin-less';
import {execa} from 'execa';
import {readFileSync, writeFileSync} from 'fs';
import CleanCSS from 'clean-css';

const production = !process.env.ROLLUP_WATCH;
const buildTimestamp = Date.now();
const cssMinifier = new CleanCSS({
	level: {
		1: {
			specialComments: 0,
		},
	},
});

// const buildVersion = execSync('git rev-parse --short HEAD').toString();
fs.writeFileSync(
	'build-info.js',
	'export default ' +
		JSON.stringify({
			buildDate: new Date().toISOString().substr(0, 19).replace('T', ' ') + ' UTC',
			buildVersion: '',
			buildTimestamp: buildTimestamp,
		})
);

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = execa('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true,
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		},
	};
}

function processHtml() {
	return {
		name: 'process-html',
		writeBundle() {
			const html = readFileSync('public/index.template.html', 'utf8');
			const timestamp = production ? buildTimestamp : '';
			const processed = production ? html.replace(/BUILD_TIMESTAMP/g, timestamp) : html.replace(/BUILD_TIMESTAMP./g, timestamp);
			writeFileSync('public/index.html', processed);
		},
	};
}

function logTime(name, startTime) {
	const elapsed = Date.now() - startTime;
	console.log(`[${name}] Took ${elapsed}ms`);
}

function createLoggingPlugin(name) {
	return {
		name: `log-${name}`,
		buildStart() {
			console.log(`[${name}] Build starting`);
			this.startTime = Date.now();
		},
		transform(code, id) {
			const start = Date.now();
			console.log(`[${name}] Transforming ${id}`);
			return null;
		},
		generateBundle() {
			console.log(`[${name}] Generating bundle`);
		},
		writeBundle() {
			logTime(name, this.startTime);
		},
	};
}

export default [
	{
		input: 'src/main.js',
		output: {
			sourcemap: !production,
			format: 'es',
			dir: 'public/build',
			entryFileNames: production ? `[name].${buildTimestamp}.js` : '[name].js',
			chunkFileNames: production ? '[name].[hash].js' : '[name].js',
		},
		cache: true,
		experimentalCacheExpiry: 5,
		preserveModules: !production,
		plugins: [
			{
				name: 'build-logger',
				buildStart() {
					console.log('\n=== Build Started ===');
					this.startTime = Date.now();
					this.moduleStartTimes = new Map();
				},
				resolveId(source, importer) {
					if (importer) {
						console.log(`[resolve] ${importer} -> ${source}`);
					}
				},
				load(id) {
					this.moduleStartTimes.set(id, Date.now());
					console.log(`[load] Starting ${id}`);
				},
				transform(code, id) {
					const startTime = this.moduleStartTimes.get(id);
					if (startTime) {
						logTime(`load ${id}`, startTime);
					}
					console.log(`[transform] Starting ${id}`);
					this.moduleStartTimes.set(id, Date.now());
					return null;
				},
				buildEnd() {
					console.log('\n=== Build Completed ===');
					logTime('Total Build', this.startTime);
				},
			},

			createLoggingPlugin('replace'),
			replace({
				'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
				BUILD_TIMESTAMP: buildTimestamp,
				preventAssignment: true,
			}),

			createLoggingPlugin('less'),
			less({
				include: ['**/*.less'],
				output: (css, id) => {
					console.log(`[less] Processing ${id}`);
					const start = Date.now();
					const parts = id.replace(/\\/g, '.').replace(/\//g, '.').split('.');
					const filename = parts[parts.length - 2];
					const outputPath = `public/build/themes/${filename}.css`;

					if (!fs.existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== css) {
						console.log(`[less] Content changed for ${filename}, minifying...`);
						const minified = production ? cssMinifier.minify(css).styles : css;
						fs.writeFileSync(outputPath, minified);
					} else {
						console.log(`[less] Content unchanged for ${filename}, skipping`);
					}
					logTime(`less ${filename}`, start);
					return false;
				},
				compress: production,
			}),

			createLoggingPlugin('svelte'),
			svelte({
				preprocess: {
					...sveltePreprocess({sourceMap: !production}),
					markup: ({content, filename}) => {
						console.log(`[svelte] Preprocessing markup for ${filename}`);
						return {code: content};
					},
					style: ({content, filename}) => {
						console.log(`[svelte] Preprocessing style for ${filename}`);
						return {code: content};
					},
					script: ({content, filename}) => {
						console.log(`[svelte] Preprocessing script for ${filename}`);
						return {code: content};
					},
				},
				compilerOptions: {
					dev: !production,
					warningFilter: warning => false,
				},
				emitCss: true,
			}),

			createLoggingPlugin('css'),
			css({
				output: function (styles, dependencies) {
					console.log('[css] Processing bundle CSS');
					console.log(`[css] Dependencies count: ${dependencies.length}`);
					const start = Date.now();

					if (!fs.existsSync('public/build')) {
						fs.mkdirSync('public/build', {recursive: true});
					}
					const outputFile = production ? `bundle.${buildTimestamp}.css` : 'bundle.css';
					const outputPath = `public/build/${outputFile}`;

					if (!fs.existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== styles) {
						console.log('[css] Content changed, minifying...');
						const minified = production ? cssMinifier.minify(styles).styles : styles;
						writeFileSync(outputPath, minified);
					} else {
						console.log('[css] Content unchanged, skipping');
					}
					logTime('css bundle', start);
				},
			}),

			createLoggingPlugin('svg'),
			svg(),

			createLoggingPlugin('resolve'),
			resolve({
				browser: true,
				dedupe: ['svelte'],
				exportConditions: ['svelte', 'browser'],
			}),

			createLoggingPlugin('commonjs'),
			commonjs(),

			!production && serve(),

			// Create a timestamp file for livereload triggering
			!production && {
				name: 'create-reload-trigger',
				writeBundle() {
					if (!fs.existsSync('forreload')) {
						fs.mkdirSync('forreload', {recursive: true});
					}
					fs.writeFileSync('forreload/timestamp.js', `export default  ${Date.now().toString()}`);
				},
			},

			// Watch only the forreload directory for changes
			!production &&
				livereload({
					watch: 'forreload',
					delay: 50,
					exclusions: ['**/node_modules/**'],
					verbose: true,
					applyCssLive: true,
				}),

			production && terser(),

			processHtml(),

			{
				name: 'clean-old-assets',
				buildStart() {
					console.log('[clean] Creating necessary directories');
					const start = Date.now();
					['public/build', 'public/build/themes', 'forreload'].forEach(dir => {
						if (!fs.existsSync(dir)) {
							console.log(`[clean] Creating directory: ${dir}`);
							fs.mkdirSync(dir, {recursive: true});
						}
					});
					logTime('directory setup', start);
				},
			},
		],
		watch: {
			clearScreen: false,
		},
	},
];
