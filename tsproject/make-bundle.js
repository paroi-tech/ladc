const { promisify } = require("util")
const fs = require("fs")
const path = require("path")
const rollup = require("rollup")
const uglifyEs = require("uglify-es")

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const packageName = "mycn"
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
    "// -- Driver definitions --",
    removeLocalImports((await readFile(path.join(srcPath, "driver-definitions.d.ts"), "utf-8")).trim()),
    "// -- Entry point definition --",
    cleanEntryPointDefs(await readFile(path.join(compiledPath, "index.d.ts"), "utf-8")),
  ]
  return defs.join("\n\n")
}

function removeLocalImports(code) {
  let importLocal = /^\s*import .* from "\.\/.*"\s*;?\s*$/
  return code.split("\n").filter(line => {
    return !importLocal.test(line)
  }).join("\n").trim()
}

function cleanEntryPointDefs(code) {
  let importExternal = /^\s*import .* from "[^\.].*"\s*;?\s*$/
  let lines = code.split("\n").filter(line => {
    if (importExternal.test(line))
      return true
    return line.trim().startsWith("export declare ")
  })
  return removeSemicolons(lines.join("\n"))
}

function removeSemicolons(code) {
  return code.replace(/;/g, "")
}

build().then(() => {
  console.log("done")
}, err => console.log(err.message, err.stack))
