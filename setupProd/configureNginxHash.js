import fs from 'fs'

const settings = new Map([
    ['server_names_hash_max_size', '32768'],
    ['server_names_hash_bucket_size', '256'],
])
const [, , sourcePath, targetPath] = process.argv
let content = fs.readFileSync(sourcePath, 'utf8')
const tokenPattern = /#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[{};]|[^\s{};#'"]+/g
const tokens = [...content.matchAll(tokenPattern)].filter(token => !token[0].startsWith('#'))
const httpOpenings = tokens.flatMap((token, index) =>
    token[0] === 'http' && tokens[index + 1]?.[0] === '{' ? [index + 1] : [])
if (httpOpenings.length !== 1) throw new Error('Expected exactly one http block in nginx.conf')

const [openingIndex] = httpOpenings
let depth = 1
let statement = []
const foundSettings = new Set()
const edits = []
for (const token of tokens.slice(openingIndex + 1)) {
    const [value] = token
    if (value === '{') {
        depth += 1
        statement = []
    } else if (value === '}') {
        depth -= 1
        statement = []
        if (depth === 0) break
    } else if (depth === 1) {
        statement.push(token)
        if (value !== ';') continue
        const name = statement[0][0]
        if (settings.has(name)) {
            if (statement.length !== 3) throw new Error(`Unexpected syntax for ${name}`)
            if (foundSettings.has(name)) {
                edits.push(...statement.map(part => [part.index, part.index + part[0].length, '']))
            } else {
                const valueToken = statement[1]
                if (valueToken[0] !== settings.get(name)) {
                    edits.push([valueToken.index, valueToken.index + valueToken[0].length, settings.get(name)])
                }
                foundSettings.add(name)
            }
        }
        statement = []
    }
}

const missingLines = [...settings].filter(([name]) => !foundSettings.has(name))
    .map(([name, value]) => `    ${name} ${value};`)
if (missingLines.length) {
    const insertionPoint = tokens[openingIndex].index + 1
    edits.push([insertionPoint, insertionPoint, `\n${missingLines.join('\n')}`])
}
for (const [start, end, replacement] of edits.sort((first, second) => second[0] - first[0])) {
    content = content.slice(0, start) + replacement + content.slice(end)
}
fs.writeFileSync(targetPath, content)
