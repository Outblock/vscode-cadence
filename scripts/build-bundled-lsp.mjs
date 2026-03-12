import { spawnSync } from 'child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))

const PLATFORM_BINARY_MAP = {
  'darwin-arm64': { folder: 'darwin-arm64', binaryName: 'lsp-v2' },
  'darwin-x64': { folder: 'darwin-x64', binaryName: 'lsp-v2' },
  'linux-x64': { folder: 'linux-x64', binaryName: 'lsp-v2' },
  'win32-x64': { folder: 'win32-x64', binaryName: 'lsp-v2.exe' }
}

function run (command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`)
  }
}

function getPlatformKey () {
  const platform = process.env.CADENCE_LSP_PLATFORM || process.platform
  const arch = process.env.CADENCE_LSP_ARCH || process.arch
  return `${platform}-${arch}`
}

function getTargetBinaryPath (outputRoot) {
  const entry = PLATFORM_BINARY_MAP[getPlatformKey()]
  if (entry == null) {
    console.warn(`[cadence-lsp] skipping bundled build for unsupported platform ${getPlatformKey()}`)
    return null
  }

  return path.join(outputRoot, entry.folder, entry.binaryName)
}

function resolveLocalCadenceToolsDir () {
  const envDir = process.env.CADENCE_TOOLS_DIR
  if (envDir != null && envDir.trim() !== '') {
    return path.resolve(repoRoot, envDir)
  }

  return path.resolve(repoRoot, '../cadence-tools')
}

function ensureCadenceToolsSource () {
  const candidate = resolveLocalCadenceToolsDir()
  if (existsSync(path.join(candidate, 'languageserver', 'cmd', 'lsp-v2'))) {
    return { sourceDir: candidate, cleanupDir: null }
  }

  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'cadence-tools-'))
  const cadenceToolsRef = process.env.CADENCE_TOOLS_REF || packageJson.cadenceToolsRef

  console.log(`[cadence-lsp] cloning cadence-tools@${cadenceToolsRef} to ${tmpDir}`)
  run('git', ['clone', 'https://github.com/Outblock/cadence-tools.git', tmpDir])
  run('git', ['checkout', cadenceToolsRef], { cwd: tmpDir })

  return { sourceDir: tmpDir, cleanupDir: tmpDir }
}

function main () {
  if (process.env.CADENCE_SKIP_BUNDLED_LSP === '1') {
    console.log('[cadence-lsp] skipping bundled lsp build (CADENCE_SKIP_BUNDLED_LSP=1)')
    return
  }

  const outputRoot = path.resolve(repoRoot, process.env.CADENCE_LSP_OUTPUT_ROOT || 'out/extension/bin')
  const targetBinaryPath = getTargetBinaryPath(outputRoot)
  if (targetBinaryPath == null) {
    return
  }

  if (existsSync(targetBinaryPath)) {
    console.log(`[cadence-lsp] using existing bundled binary ${targetBinaryPath}`)
    return
  }

  mkdirSync(path.dirname(targetBinaryPath), { recursive: true })

  const { sourceDir, cleanupDir } = ensureCadenceToolsSource()

  try {
    console.log(`[cadence-lsp] building ${getPlatformKey()} binary at ${targetBinaryPath}`)
    run('go', ['build', '-o', targetBinaryPath, './cmd/lsp-v2/'], {
      cwd: path.join(sourceDir, 'languageserver'),
      env: {
        ...process.env,
        CGO_ENABLED: '1'
      }
    })

    if (process.platform !== 'win32') {
      chmodSync(targetBinaryPath, 0o755)
    }
  } finally {
    if (cleanupDir != null) {
      rmSync(cleanupDir, { recursive: true, force: true })
    }
  }
}

main()

