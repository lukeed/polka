import oxc from "oxc-parser";
import MagicString from "magic-string";
import { type ESTreeMap, walk } from "astray";

import { basename, join, resolve } from "node:path";
import * as fs from "node:fs/promises";

let root = resolve("packages");
let packages = await fs.readdir(root);

type Entry = `./${string}`;
type Condition = Record<"types" | "default", Entry>;

for (let name of packages) {
	let dir = join(root, name);

	let file = join(dir, "package.json");
	let data = await fs.readFile(file, "utf8");
	let pkg = JSON.parse(data).exports["."] as {
		import: Entry | Condition;
		require: Entry | Condition;
	};

	let outputs: string[] = [];

	// ESM <- copy
	let entry = join(dir, "index.js");
	data = await fs.readFile(entry, "utf8");
	let target = (pkg.import as Condition).default || pkg.import;
	let outfile = join(dir, target);

	await fs.writeFile(outfile, data);
	outputs.push(outfile);

	// CJS <- transform
	data = await fs.readFile(entry, "utf8");
	let s = new MagicString(data);
	let AST = JSON.parse(
		await oxc.parseAsync(data).then((x) => x.program),
	);

	type Location = {
		start: number;
		end: number;
	};

	walk(AST.body, {
		ImportDeclaration(n) {
			let { start, end } = n as unknown as Location;
			let src = n.source as unknown as {
				type: "StringLiteral";
				value: string;
				start: number;
				end: number;
			};

			let from = src.value;
			if (from.startsWith("node:")) {
				from = from.substring(5);
			}

			let $locals: string[] = [];
			let $default: string | undefined;

			let i = 0, arr = n.specifiers;
			let tmp: typeof arr[number];

			for (; i < arr.length; i++) {
				tmp = arr[i];

				switch (tmp.type) {
					case "ImportDefaultSpecifier":
					case "ImportNamespaceSpecifier": {
						if ($default) throw new Error("Double `default` exports!");
						$default = tmp.local.name;
						break;
					}

					case "ImportSpecifier": {
						let { imported, local } = tmp;
						if (imported.name !== local.name) {
							$locals.push(`${imported.name}: ${local.name}`);
						} else {
							$locals.push(local.name);
						}
						break;
					}
				}
			}

			let stmt = "const ";
			if ($default) {
				stmt += $default;
			}
			if ($locals.length > 0) {
				if ($default) stmt += ", ";
				stmt += "{ " + $locals.join(", ") + " }";
			}

			let qq = s.snip(src.start, src.start + 1);
			stmt += ` = require(${qq + from + qq});`;
			s.overwrite(start, end, stmt);
		},
		ExportDefaultDeclaration(n) {
			let start = (n as unknown as Location).start;
			s.overwrite(start, start + "export default".length, "module.exports =");
		},
		ExportNamedDeclaration(n) {
			let start = (n as unknown as Location).start;
			let type = n.declaration?.type;
			let key: string | undefined;

			if (type === "FunctionDeclaration") {
				key = (n.declaration as ESTreeMap["FunctionDeclaration"]).id?.name;
			} else {
				console.log("EXPORT NAMED TYPE?", n.declaration);
			}

			if (key) {
				s.remove(start, start + "export ".length);
				s.append(`\nexports.${key} = ${key};`);
			}
		},
	});

	target = (pkg.require as Condition).default || pkg.require;
	await fs.writeFile(outfile = join(dir, target), s.toString());
	outputs.push(outfile);

	console.log("\n", name);
	for (let tmp of outputs) {
		let s = await fs.stat(tmp);
		let num = s.size > 1e3 ? (s.size / 1e3).toFixed(2) : s.size;
		let size = `(${num} ${s.size > 1e3 ? "kB" : "b"})`;
		console.log("  %s %s", basename(tmp), size);
	}
}
