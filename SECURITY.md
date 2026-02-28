# Security Policy

## 🛡️ How We Protect the Platform

Game submissions run through multiple layers of automated security checks before they can be merged.

### Automated Security Layers

#### Layer 1: File Type Restriction
Only these file types are allowed in game submissions:
- `.py` — Python source files
- `.js` — JavaScript source files
- `.html` — HTML files
- `.css` — CSS stylesheets
- `.json` — JSON data files (metadata)
- `.md` — Markdown documentation
- `.txt` — Plain text files

**All other file types are rejected.** No executables, no binaries, no archives.

#### Layer 2: Code Scanning
Every code file is scanned for dangerous patterns:

| Category | Blocked Patterns |
|----------|-----------------|
| **System Execution** | `os.system`, `subprocess`, `exec()`, `eval()`, `__import__` |
| **Network Access** | `requests`, `urllib`, `http`, `socket`, `fetch()`, `XMLHttpRequest` |
| **File System** | `os.remove`, `shutil.rmtree`, `fs.unlink` (outside game dir) |
| **Browser Exploits** | `document.cookie`, `localStorage`, inline event handlers |
| **Obfuscation** | Base64 encoding, minified code (lines > 300 chars) |

#### Layer 3: Size Limits
- Maximum **5 files** per game submission
- Maximum **500 lines of code** total
- These limits prevent complex attack vectors

#### Layer 4: Human Review
- All game submissions require **at least 1 maintainer approval**
- Security-flagged PRs get the `🔒 needs-security-review` label
- Critical security issues **block merging automatically**

#### Layer 5: Anti-Spam
- Maximum **3 PRs per day** per author
- New accounts (< 7 days) get flagged for review
- Empty or suspicious PRs are auto-closed

### Severity Levels

| Level | Action |
|-------|--------|
| 🔴 **Critical** | PR blocked, cannot merge |
| 🟠 **High** | PR flagged, requires security review |
| 🟡 **Medium** | Warning noted, included in normal review |
| 🔵 **Info** | Informational, no action needed |

### What is NOT Allowed

- ❌ Code that makes network requests
- ❌ Code that modifies the file system outside the game directory
- ❌ Code that uses `eval()`, `exec()`, or similar dynamic execution
- ❌ Code that accesses environment variables or system info
- ❌ Minified, obfuscated, or encoded code
- ❌ External dependencies or package installations
- ❌ Inline scripts from external sources
- ❌ Any form of data collection or tracking

### Reporting a Vulnerability

If you discover a security vulnerability in the platform automation:

1. **DO NOT** create a public issue
2. Email us at **[INSERT EMAIL]** with details
3. Include steps to reproduce, if possible
4. We will respond within 48 hours

### Responsible Disclosure

We follow responsible disclosure practices. If you find a vulnerability:
- We will acknowledge receipt within 48 hours
- We will provide an estimated timeline for a fix
- We will credit you (if desired) once the fix is deployed
- We ask that you do not disclose publicly until we have patched it
