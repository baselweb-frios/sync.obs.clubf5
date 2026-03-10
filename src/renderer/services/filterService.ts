// Filter Service - Handle file exclusion patterns
import { minimatch } from 'minimatch'

export interface FilterPreset {
  id: string
  name: string
  patterns: string[]
}

export const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'development',
    name: 'Desarrollo',
    patterns: [
      'node_modules/**',
      '.git/**',
      '.vscode/**',
      '*.log',
      '*.tmp',
      '.env',
      '.env.*',
      'dist/**',
      'build/**',
      '.cache/**',
      '__pycache__/**',
      '*.pyc'
    ]
  },
  {
    id: 'backup',
    name: 'Backup',
    patterns: [
      '*.tmp',
      '*.bak',
      '*.log',
      'Thumbs.db',
      '.DS_Store',
      'desktop.ini',
      '*.swp',
      '*~'
    ]
  },
  {
    id: 'media',
    name: 'Solo Media',
    patterns: [
      '!*.jpg',
      '!*.jpeg',
      '!*.png',
      '!*.gif',
      '!*.webp',
      '!*.mp3',
      '!*.mp4',
      '!*.wav',
      '!*.avi',
      '!*.mkv',
      '*' // Exclude everything else
    ]
  }
]

class FilterService {
  private patterns: string[] = []

  /**
   * Set exclusion patterns
   */
  setPatterns(patterns: string[]): void {
    this.patterns = patterns
  }

  /**
   * Get current patterns
   */
  getPatterns(): string[] {
    return [...this.patterns]
  }

  /**
   * Add a pattern
   */
  addPattern(pattern: string): void {
    if (!this.patterns.includes(pattern)) {
      this.patterns.push(pattern)
    }
  }

  /**
   * Remove a pattern
   */
  removePattern(pattern: string): void {
    const index = this.patterns.indexOf(pattern)
    if (index > -1) {
      this.patterns.splice(index, 1)
    }
  }

  /**
   * Apply a preset
   */
  applyPreset(presetId: string): void {
    const preset = DEFAULT_PRESETS.find(p => p.id === presetId)
    if (preset) {
      this.patterns = [...preset.patterns]
    }
  }

  /**
   * Check if a path should be excluded
   */
  shouldExclude(filePath: string): boolean {
    if (this.patterns.length === 0) {
      return false
    }

    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/')

    for (const pattern of this.patterns) {
      // Handle negation patterns (include if matches)
      if (pattern.startsWith('!')) {
        if (minimatch(normalizedPath, pattern.slice(1), { dot: true })) {
          return false // Explicitly included
        }
      } else {
        if (minimatch(normalizedPath, pattern, { dot: true })) {
          return true // Excluded
        }
      }
    }

    return false
  }

  /**
   * Filter an array of paths
   */
  filterPaths<T extends { name: string }>(items: T[]): T[] {
    return items.filter(item => !this.shouldExclude(item.name))
  }

  /**
   * Get available presets
   */
  getPresets(): FilterPreset[] {
    return DEFAULT_PRESETS
  }

  /**
   * Validate a pattern
   */
  isValidPattern(pattern: string): boolean {
    try {
      minimatch('test', pattern)
      return true
    } catch {
      return false
    }
  }
}

export const filterService = new FilterService()
export default filterService
