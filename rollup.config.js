import replace from 'rollup-plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';
import svg from 'rollup-plugin-svg';
import less from 'rollup-plugin-less';
import { execSync } from 'child_process';
import fs, { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import path, { join } from 'path';
import alias from '@rollup/plugin-alias';

const production = !process.env.ROLLUP_WATCH;

const buildVersion = execSync('git rev-parse --short HEAD').toString();
fs.writeFileSync(
	'build-info.js',
	'export default ' +
	JSON.stringify({
		buildDate: new Date().toISOString().substr(0, 19).replace('T', ' ') + ' UTC',
		buildVersion,
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
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true,
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		},
	};
}


const patchCompiler = (compilerPath) => {
	const compiler = fs.readFileSync(compilerPath).toString();
	if (compiler.includes('/*flagPatched*/')) {
		console.log("[i18n] compiler already patched.")
	} else {
		const compilerPatched = compiler.replace(
			'function parse(template, options = {}) {',
			'const parse = function (){if(globalThis.parsePatched) return globalThis.parsePatched.apply(this,arguments); throw "BeatLeader patched compiler must run within i18n environment"};\nglobalThis.parse1 = /*flagPatched*/ function parse1(template, options = {}) {'
		);
		fs.writeFileSync(compilerPath, compilerPatched);
		console.log("[i18n] compiler patched.")
	}
}

const i18nData = {}
const saveI18n = () => {
	return {
		writeBundle() {
			console.log("[i18n] saving i18n data...")
			const i18nDir = join(__dirname, 'public','assets','i18n')
			for (const fileName of readdirSync(i18nDir)) {
				const file = join(i18nDir, fileName)
				const data = existsSync(file) ? JSON.parse(readFileSync(file) || '{}') : {}
				for (const key in i18nData)
					if (!(key in data) || data[key].origin !== i18nData[key].origin) 
						data[key] = i18nData[key]

				writeFileSync(file, JSON.stringify(data, null, 4))
			}
		},
	};
}
const textToSlug = (text) => {
	const t = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
	if (t.length > 100)
		return t.substr(0, 100) + ':l' /* partial */ + (t.length - 100);
	return t + ':f' // full
}

globalThis.parsePatched = (source, options) => {
	const templateInstance = parse1(`
<script>
	import { _i18n } from '@/utils/i18n.js';
</script>
`).instance;

	const res = parse1(source, options);
	if (res.instance) {
		res.instance.content.body.unshift(
			templateInstance.content.body[0]
		);
	} else {
		res.instance = templateInstance;
	}

	const walk = (node) => {
		if (node.type === 'Text' && node.data.trim() !== '') {
			const id = textToSlug(node.data)
			i18nData[id] = { 
				origin: node.data,
				translated: null
			}
			node.type = 'MustacheTag';
			node.expression = {
				type: 'CallExpression',
				callee: {
					type: 'Identifier',
					name: '_i18n',
				},
				arguments: [
					{
						type: 'Literal',
						value: id,
					},
					{
						type: 'Literal',
						value: node.data,
					},
				],
			};
		}

		const parentTypeBlacklist = ['Title', 'Style', 'Head']
		if (parentTypeBlacklist.includes(node.type)) return;

		for (const n of node.children ?? []) {
			walk(n)
		}
	}

	walk(res.html)

	return res; 
}

patchCompiler(path.join(__dirname, 'node_modules', 'svelte', 'compiler.cjs'));
require.cache = {}
const svelte = require('rollup-plugin-svelte');

export default [
	{
		input: 'src/main.js',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'app',
			file: 'public/build/bundle.js',
		},
		plugins: [
			alias({
				entries: [
					{ find: '@', replacement: join(__dirname, "src") },
				]
			}),
			replace({
				include: 'node_modules/svelte/internal/*',
				"text('')": "document.createComment('')",
				delimiters: ['', ''],
			}),
			less({
				include: ['**/*.less'],
				output: (css, id) => {
					const parts = id.replace(/\\/g, '.').replace(/\//g, '.').split('.');
					const filename = parts[parts.length - 2];
					fs.rmSync(`public/build/themes/${filename}.css`, {
						force: true,
					});
					return `public/build/themes/${filename}.css`;
				},
			}),
			svelte({
				preprocess: sveltePreprocess({ sourceMap: !production }),
				compilerOptions: {
					// enable run-time checks when not in production
					dev: !production,
				},
			}),
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css({ output: 'bundle.css' }),

			svg(),

			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration -
			// consult the documentation for details:
			// https://github.com/rollup/plugins/tree/master/packages/commonjs
			resolve({
				browser: true,
				dedupe: ['svelte'],
				exportConditions: ['browser'],
			}),
			commonjs(),
			// In dev mode, call `npm run start` once
			// the bundle has been generated
			!production && serve(),

			// Watch the `public` directory and refresh the
			// browser on changes when not in production
			!production && livereload('public'),

			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser(),

			saveI18n(),
		],
		watch: {
			clearScreen: false,
		},
	},
];
