#!/usr/bin/env tsx
/**
 * Unified Validation Script
 * 
 * Replaces multiple shell-based validations with a single TypeScript script.
 * Runs: file validation, security scanning, structure checks
 * 
 * Run: npx tsx scripts/validate.ts <pr-files-json>
 * Or:  npm run validate
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  maxFilesPerGame: 5,
  maxLinesPerGame: 500,
  allowedExtensions: ['.py', '.js', '.html', '.css', '.json', '.md', '.txt'],
  requiredFiles: ['README.md', 'metadata.json'],
  metadataRequiredFields: ['name', 'author', 'category', 'difficulty', 'language', 'description', 'entry_point'],
  translationDirectories: ['README', 'CONTRIBUTING', 'guides'],
};

const SECURITY_PATTERNS = {
  critical: [
    // System execution
    { pattern: /\b(os\.system|subprocess\.|os\.popen|child_process)\b/g, message: 'System command execution' },
    { pattern: /\b(exec\(|eval\(|compile\(|__import__)\b/g, message: 'Dynamic code execution' },
    // Network (Python)
    { pattern: /\bimport\s+(requests|urllib|http\.client|socket|aiohttp)\b/g, message: 'Network library import' },
    // Network (JS)
    { pattern: /\brequire\s*\(\s*['"`](http|https|net|dgram|axios|node-fetch)['"`]\s*\)/g, message: 'Network library import' },
  ],
  high: [
    // Network (browser)
    { pattern: /\b(fetch\(|XMLHttpRequest|WebSocket|\.ajax\()\b/g, message: 'Network request' },
    // File system
    { pattern: /\b(os\.remove|os\.unlink|shutil\.rmtree|fs\.(unlink|rmdir|writeFile))\b/g, message: 'File system modification' },
  ],
  medium: [
    // Browser storage
    { pattern: /\b(document\.cookie|localStorage|sessionStorage)\b/g, message: 'Browser storage access' },
    // Encoding
    { pattern: /\b(atob\(|btoa\(|Buffer\.from\(.*base64)\b/g, message: 'Base64 encoding' },
  ],
};

// ============================================================
// TYPES
// ============================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  security: {
    severity: 'safe' | 'medium' | 'high' | 'critical';
    issues: Array<{ file: string; line: number; severity: string; message: string }>;
  };
}

interface FileInfo {
  path: string;
  content?: string;
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

function validateStructure(files: FileInfo[], gameDir: string, basePath: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file count
  if (files.length > CONFIG.maxFilesPerGame) {
    errors.push(`Too many files: ${files.length} (max ${CONFIG.maxFilesPerGame})`);
  }

  // Check file extensions
  for (const file of files) {
    const ext = path.extname(file.path).toLowerCase();
    if (!CONFIG.allowedExtensions.includes(ext) && !file.path.endsWith('.gitkeep')) {
      errors.push(`Invalid file type: ${file.path} (allowed: ${CONFIG.allowedExtensions.join(', ')})`);
    }
  }

  // Check required files
  for (const required of CONFIG.requiredFiles) {
    if (!fs.existsSync(path.join(basePath, gameDir, required))) {
      errors.push(`Missing required file: ${required}`);
    }
  }

  // Check line count
  let totalLines = 0;
  for (const file of files) {
    const ext = path.extname(file.path);
    if (['.py', '.js', '.html', '.css'].includes(ext) && file.content) {
      const lines = file.content.split('\n').length;
      totalLines += lines;
      
      // Check for long lines (obfuscation)
      const longLines = file.content.split('\n').filter(l => l.length > 300);
      if (longLines.length > 0) {
        errors.push(`Possible obfuscated code in ${file.path}: ${longLines.length} lines > 300 chars`);
      }
    }
  }
  if (totalLines > CONFIG.maxLinesPerGame) {
    errors.push(`Too many lines: ${totalLines} (max ${CONFIG.maxLinesPerGame})`);
  }

  return { errors, warnings };
}

function validateMetadata(metadataFile: FileInfo): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!metadataFile.content) {
    errors.push('Could not read metadata.json');
    return { errors, warnings };
  }

  let metadata: Record<string, unknown>;
  try {
    metadata = JSON.parse(metadataFile.content);
  } catch (e) {
    errors.push('Invalid JSON in metadata.json');
    return { errors, warnings };
  }

  // Check required fields
  for (const field of CONFIG.metadataRequiredFields) {
    if (!(field in metadata) || !metadata[field]) {
      errors.push(`Missing required field in metadata.json: ${field}`);
    }
  }

  // Validate category
  if (metadata.category && !['cli', 'web', 'algorithm'].includes(metadata.category as string)) {
    errors.push(`Invalid category: ${metadata.category} (must be cli, web, or algorithm)`);
  }

  // Validate difficulty
  if (metadata.difficulty && !['beginner', 'intermediate', 'advanced'].includes(metadata.difficulty as string)) {
    errors.push(`Invalid difficulty: ${metadata.difficulty}`);
  }

  return { errors, warnings };
}

function scanSecurity(files: FileInfo[]): ValidationResult['security'] {
  const issues: ValidationResult['security']['issues'] = [];
  const severityLevels = { safe: 0, medium: 1, high: 2, critical: 3 } as const;
  let maxSeverityLevel = 0;

  const getSeverity = (): 'safe' | 'medium' | 'high' | 'critical' => {
    const levels = ['safe', 'medium', 'high', 'critical'] as const;
    return levels[maxSeverityLevel];
  };

  for (const file of files) {
    const ext = path.extname(file.path);
    if (!['.py', '.js'].includes(ext) || !file.content) continue;

    const lines = file.content.split('\n');

    // Check critical patterns
    for (const { pattern, message } of SECURITY_PATTERNS.critical) {
      lines.forEach((line, i) => {
        pattern.lastIndex = 0; // Reset regex state
        if (pattern.test(line)) {
          issues.push({ file: file.path, line: i + 1, severity: 'critical', message });
          maxSeverityLevel = Math.max(maxSeverityLevel, severityLevels.critical);
        }
      });
    }

    // Check high patterns
    for (const { pattern, message } of SECURITY_PATTERNS.high) {
      lines.forEach((line, i) => {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          issues.push({ file: file.path, line: i + 1, severity: 'high', message });
          maxSeverityLevel = Math.max(maxSeverityLevel, severityLevels.high);
        }
      });
    }

    // Check medium patterns
    for (const { pattern, message } of SECURITY_PATTERNS.medium) {
      lines.forEach((line, i) => {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          issues.push({ file: file.path, line: i + 1, severity: 'medium', message });
          maxSeverityLevel = Math.max(maxSeverityLevel, severityLevels.medium);
        }
      });
    }
  }

  return { severity: getSeverity(), issues };
}

// ============================================================
// MAIN VALIDATION
// ============================================================

export function validateGameSubmission(changedFiles: string[], basePath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    security: { severity: 'safe', issues: [] },
  };

  // Group files by game directory
  const gameFiles = changedFiles.filter(f => f.startsWith('games/'));
  if (gameFiles.length === 0) {
    return result; // No game files, nothing to validate
  }

  for (const file of gameFiles) {
    const [, category, gameName] = file.split('/');
    if (!category || !gameName || !['cli', 'web', 'algorithm'].includes(category)) {
      result.errors.push(`Invalid game path: ${file} (expected games/{cli|web|algorithm}/{game-name}/...)`);
    }
  }

  // Detect game directory
  const gameDirs = [...new Set(gameFiles.map(f => {
    const parts = f.split('/');
    return parts.length >= 3 ? `${parts[0]}/${parts[1]}/${parts[2]}` : null;
  }).filter(Boolean))];

  for (const gameDir of gameDirs) {
    const filesInGame = gameFiles
      .filter(f => f.startsWith(gameDir + '/'))
      .map(f => ({
        path: f,
        content: fs.existsSync(path.join(basePath, f)) 
          ? fs.readFileSync(path.join(basePath, f), 'utf-8')
          : undefined,
      }));

    // Structure validation
    const structureResult = validateStructure(filesInGame, gameDir!, basePath);
    result.errors.push(...structureResult.errors);
    result.warnings.push(...structureResult.warnings);

    // Metadata validation
    const metadataPath = path.join(basePath, gameDir!, 'metadata.json');
    const metadataFile = fs.existsSync(metadataPath)
      ? { path: `${gameDir}/metadata.json`, content: fs.readFileSync(metadataPath, 'utf-8') }
      : undefined;
    if (metadataFile) {
      const metadataResult = validateMetadata(metadataFile);
      result.errors.push(...metadataResult.errors);
      result.warnings.push(...metadataResult.warnings);
    }

    // Security scan
    const securityResult = scanSecurity(filesInGame);
    result.security = securityResult;
  }

  result.valid = result.errors.length === 0 && !['critical', 'high'].includes(result.security.severity);
  return result;
}

export function validateTranslationSubmission(changedFiles: string[], basePath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    security: { severity: 'safe', issues: [] },
  };

  const translationFiles = changedFiles.filter(file => file.startsWith('translations/'));
  if (translationFiles.length === 0) return result;

  for (const file of translationFiles) {
    const relativePath = file.slice('translations/'.length);
    const parts = relativePath.split('/');
    const basename = path.basename(file);
    const absolutePath = path.join(basePath, file);

    if (file.endsWith('.gitkeep')) continue;
    if (path.extname(file).toLowerCase() !== '.md') {
      result.errors.push(`Invalid translation file type: ${file} (only .md files are allowed)`);
      continue;
    }

    // translations/README.md is the translation index; submitted translations
    // belong in one of the documented subdirectories.
    if (relativePath !== 'README.md') {
      if (parts.length !== 2 || !CONFIG.translationDirectories.includes(parts[0])) {
        result.errors.push(`Invalid translation path: ${file}`);
      }

      const expectedPrefix = parts[0] === 'guides'
        ? '[document-name]'
        : parts[0];
      const languageSuffix = /^[^.]+\.[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*\.md$/;
      if (!languageSuffix.test(basename)) {
        result.errors.push(
          `Invalid translation filename: ${basename} (expected ${expectedPrefix}.LANG_CODE.md)`,
        );
      }
    }

    // Deleted translations are reviewable changes; content checks only apply to
    // files that still exist in the pull request checkout.
    if (!fs.existsSync(absolutePath)) continue;
    const content = fs.readFileSync(absolutePath, 'utf-8');
    if (content.trim().length === 0) {
      result.errors.push(`Translation file is empty: ${file}`);
    } else if (content.split(/\r?\n/).length < 5) {
      result.errors.push(`Translation is too short: ${file} (minimum 5 lines)`);
    }
  }

  result.valid = result.errors.length === 0;
  return result;
}

export function validateSubmission(changedFiles: string[], basePath: string): ValidationResult {
  const game = validateGameSubmission(changedFiles, basePath);
  const translation = validateTranslationSubmission(changedFiles, basePath);
  const severityOrder = { safe: 0, medium: 1, high: 2, critical: 3 } as const;
  const security = severityOrder[game.security.severity] >= severityOrder[translation.security.severity]
    ? game.security
    : translation.security;

  return {
    valid: game.valid && translation.valid,
    errors: [...game.errors, ...translation.errors],
    warnings: [...game.warnings, ...translation.warnings],
    security,
  };
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/validate.ts <files.json> [base-path]');
    console.log('       files.json: JSON array of changed file paths');
    process.exit(1);
  }

  let changedFiles: string[];
  try {
    changedFiles = JSON.parse(args[0]);
  } catch {
    // Assume it's a file path
    changedFiles = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
  }

  const basePath = args[1] || process.cwd();
  const result = validateSubmission(changedFiles, basePath);

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}
