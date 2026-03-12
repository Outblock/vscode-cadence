import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'

export interface BundledBinaryResolution {
  path: string
  source: 'bundled' | 'path'
}

const PLATFORM_BINARY_MAP: Record<string, { folder: string, binaryName: string }> = {
  'darwin-arm64': { folder: 'darwin-arm64', binaryName: 'lsp-v2' },
  'darwin-x64': { folder: 'darwin-x64', binaryName: 'lsp-v2' },
  'linux-x64': { folder: 'linux-x64', binaryName: 'lsp-v2' },
  'win32-x64': { folder: 'win32-x64', binaryName: 'lsp-v2.exe' }
}

function getPlatformKey (platform = process.platform, arch = process.arch): string {
  return `${platform}-${arch}`
}

export function getBundledBinaryRelativePath (platform = process.platform, arch = process.arch): string | null {
  const entry = PLATFORM_BINARY_MAP[getPlatformKey(platform, arch)]
  if (entry == null) return null
  return path.join('out', 'extension', 'bin', entry.folder, entry.binaryName)
}

export async function resolveBundledLspBinary (extensionPath: string): Promise<BundledBinaryResolution | null> {
  const relativePath = getBundledBinaryRelativePath()
  if (relativePath == null) return null

  const absolutePath = path.resolve(extensionPath, relativePath)
  if (!fs.existsSync(absolutePath)) return null

  if (process.platform !== 'win32') {
    await fsp.chmod(absolutePath, 0o755).catch(() => {})
  }

  return {
    path: absolutePath,
    source: 'bundled'
  }
}

