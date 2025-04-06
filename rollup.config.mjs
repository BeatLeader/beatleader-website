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
			// if (server) return;
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
			const processed = html.replace(/BUILD_TIMESTAMP/g, buildTimestamp);
			writeFileSync('public/index.html', processed);
		},
	};
}

export default [
	{
		input: 'src/main.js',
		output: {
			sourcemap: true,
			format: 'es',
			dir: 'public/build',
			entryFileNames: `[name].${buildTimestamp}.js`,
			chunkFileNames: '[name].[hash].js',
		},
		plugins: [
			{
				name: 'log-bundle',
				buildStart() {
					if (!production) {
						console.log('Build started...');
					}
				},
				transform(code, id) {
					if (!production) {
						console.log('Processing:', id);
					}
					return null;
				},
				transformBundle(code, id) {
					if (!production) {
						console.log('Finished processing:', id);
					}
					return null;
				},
				buildEnd() {
					if (!production) {
						console.log('Build completed');
					}
				},
			},
			replace({
				'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
				BUILD_TIMESTAMP: buildTimestamp,
				preventAssignment: true,
			}),
			less({
				include: ['**/*.less'],
				output: (css, id) => {
					const parts = id.replace(/\\/g, '.').replace(/\//g, '.').split('.');
					const filename = parts[parts.length - 2];
					fs.rmSync(`public/build/themes/${filename}.css`, {
						force: true,
					});
					const minified = production ? cssMinifier.minify(css).styles : css;
					fs.writeFileSync(`public/build/themes/${filename}.css`, minified);
					return false;
				},
				compress: production,
			}),
			svelte({
				preprocess: sveltePreprocess({sourceMap: !production}),
				compilerOptions: {
					// enable run-time checks when not in production
					dev: !production,
				},
			}),
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css({
				output: function (styles, dependencies) {
					if (!fs.existsSync('public/build')) {
						fs.mkdirSync('public/build', {recursive: true});
					}
					const minified = production ? cssMinifier.minify(styles).styles : styles;
					writeFileSync(`public/build/bundle.${buildTimestamp}.css`, minified);
				},
			}),

			svg(),

			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration -
			// consult the documentation for details:
			// https://github.com/rollup/plugins/tree/master/packages/commonjs
			resolve({
				browser: true,
				dedupe: ['svelte'],
				exportConditions: ['svelte', 'browser'],
			}),
			commonjs(),

			// In dev mode, call `npm run start` once
			// the bundle has been generated
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
				}),

			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser(),

			processHtml(),

			{
				name: 'clean-old-assets',
				buildStart() {
					// Create directories if they don't exist
					['public/build', 'public/build/themes', 'forreload'].forEach(dir => {
						if (!fs.existsSync(dir)) {
							fs.mkdirSync(dir, {recursive: true});
						}
					});
				},
			},
		],
		watch: {
			clearScreen: false,
		},
	},
];
