const { promisify } = require("util")
const fs = require("fs")
const path = require("path")
const rollup = require("rollup")
const uglifyEs = require("uglify-es")

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const packageName = "mycn-sqlite3"
const srcPath = path.join(__dirname, "src")
const compiledPath = path.join(__dirname, "compiled")
const distNpmPath = path.join(__dirname, "..")

async function build() {
  let bundle = await rollup.rollup({
    input: path.join(compiledPath, "index.js")
  })
  let { code } = await bundle.generate({
    format: "cjs",
    sourcemap: false
  })

  let minified = uglifyEs.minify(code)
  if (minified.error)
    throw minified.error

  await writeFile(path.join(distNpmPath, `${packageName}.min.js`), minified.code)
  await writeFile(path.join(distNpmPath, `${packageName}.d.ts`), await makeDefinitionsCode())
}

async function makeDefinitionsCode() {
  let defs = [
    "// -- Usage definitions --",
    removeLocalImports((await readFile(path.join(srcPath, "exported-definitions.d.ts"), "utf-8")).trim()),
    "// -- Entry point definition --",
    keeyOnlyExportDeclare(await readFile(path.join(compiledPath, "index.d.ts"), "utf-8")),
  ]
  return defs.join("\n\n")
}

function removeLocalImports(code) {
  let regex = /^\s*import .* from "\.\/.*"\s*$/
  return code.split("\n").filter(line => {
    return !regex.test(line)
  }).join("\n").trim()
}

function keeyOnlyExportDeclare(code) {
  return code.split("\n").filter(line => {
    return line.trim().startsWith("export declare ")
  }).join("\n")
}

build().then(() => {
  console.log("done")
}, err => console.log(err.message, err.stack))
