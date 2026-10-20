// Lint Pages CMS config (.pages.yml).
//
// Catches YAML problems that Pages CMS's parser (js-yaml) rejects — in
// particular duplicate mapping keys, which silently break CMS schema updates:
// Pages CMS fails to parse the new config and keeps serving the last
// successfully parsed one (see: the 19a6002 → endDate incident, where one
// misindented `- name: videoId` line created duplicate `label`/`type` keys).
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const CONFIG_PATH = ".pages.yml";
const src = readFileSync(CONFIG_PATH, "utf8");

let cfg;
try {
  // `uniqueKeys: true` (the default) makes duplicate mapping keys throw.
  cfg = parse(src, { uniqueKeys: true });
} catch (err) {
  console.error(`✖ ${CONFIG_PATH}: YAML parse error`);
  console.error(err.message);
  process.exit(1);
}

const errors = [];

for (const key of ["media", "content"]) {
  if (cfg[key] !== undefined && !Array.isArray(cfg[key])) {
    errors.push(`\`${key}\` must be a list`);
  }
}

const walkFields = (fields, ctx) => {
  for (const field of fields ?? []) {
    if (typeof field !== "object" || field === null) {
      errors.push(`${ctx}: field is not a mapping`);
      continue;
    }
    if (!field.name) {
      errors.push(`${ctx}: field missing \`name\``);
    }
    if (!field.type) {
      errors.push(`${ctx}: field \`${field.name ?? "?"}\` missing \`type\``);
    }
    walkFields(field.fields, `${ctx}/${field.name ?? "?"}`);
  }
};

for (const collection of cfg.content ?? []) {
  if (!collection.name) errors.push("content: collection missing `name`");
  if (!collection.type)
    errors.push(
      `content: collection \`${collection.name ?? "?"}\` missing \`type\``,
    );
  walkFields(collection.fields, collection.name ?? "?");
}

for (const media of cfg.media ?? []) {
  for (const key of ["name", "label", "input", "output"]) {
    if (!media[key])
      errors.push(`media \`${media.name ?? "?"}\` missing \`${key}\``);
  }
}

if (errors.length > 0) {
  console.error(`✖ ${CONFIG_PATH}: ${errors.length} problem(s)`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `✓ ${CONFIG_PATH}: valid (${cfg.content?.length ?? 0} collections, ${cfg.media?.length ?? 0} media roots)`,
);
