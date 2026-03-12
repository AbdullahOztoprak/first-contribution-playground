# Platform Browser IDE — Technical Architecture

> **⚠️ NOT BUILT YET — This is a design document for a potential future feature.**  
> Nothing described below exists in the current codebase.

> A lightweight VS Code-like experience for submitting games directly from the browser  
> Design Exploration Document

---

## Executive Summary

Build a browser-based IDE that lets contributors:
1. **Login with GitHub** (OAuth)
2. **Write code** in Monaco Editor
3. **Preview games** live (iframe/Pyodide)
4. **Submit** → automatically creates a PR to the repo

**Key constraint:** The PR must be created **under the user's GitHub account**, not a bot account. This preserves contribution credit.

---

## PART 1 — Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (CLIENT)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   GitHub    │  │  Monaco Editor  │  │  Preview Panel  │                 │
│  │   OAuth     │  │  (Multi-file)   │  │  (iframe/Pyodide)│                │
│  │   Login     │  │                 │  │                 │                 │
│  └──────┬──────┘  └────────┬────────┘  └────────┬────────┘                 │
│         │                  │                    │                          │
│         └──────────────────┼────────────────────┘                          │
│                            │                                               │
│                            ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Client State Manager                            │   │
│  │  - Files in memory (virtual FS)                                     │   │
│  │  - User session (GitHub token)                                      │   │
│  │  - Game metadata                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                            │                                               │
└────────────────────────────┼───────────────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (EDGE/SERVERLESS)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  /api/auth/*    │  │  /api/submit    │  │  /api/validate  │             │
│  │  OAuth flow     │  │  Create PR      │  │  Pre-check      │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                      │
│           └────────────────────┼────────────────────┘                      │
│                                │                                           │
│                                ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      GitHub REST API                                │   │
│  │  - Fork repo (if needed)                                            │   │
│  │  - Create branch                                                    │   │
│  │  - Create/update files (blob → tree → commit)                       │   │
│  │  - Open PR                                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GITHUB (EXTERNAL)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AbdullahOztoprak/Platform (upstream)                                       │
│       │                                                                     │
│       ├── PR opened by user-fork                                            │
│       │                                                                     │
│       └── GitHub Actions (ci.yml)                                           │
│              │                                                              │
│              ├── validate.ts runs                                           │
│              ├── security scan                                              │
│              └── auto-label / review request                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Decision

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14 (App Router) | SSR for auth pages, client components for editor |
| **Editor** | Monaco Editor | Same engine as VS Code, excellent TS/JS/Python support |
| **Preview** | iframe (web) + Pyodide (Python) | Client-side only, no server compute |
| **Auth** | NextAuth.js + GitHub OAuth | Battle-tested, handles token refresh |
| **Backend** | Next.js API Routes (Edge) | Serverless, scales automatically |
| **GitHub API** | Octokit.js | Official SDK, handles pagination/errors |
| **Hosting** | Vercel | Zero-config Next.js, edge functions, preview deploys |
| **State** | Zustand | Lightweight, perfect for editor state |

### Why NOT Other Options

| Alternative | Why Not |
|-------------|---------|
| **CodeSandbox/StackBlitz** | Overkill; we don't need full Node.js environment |
| **Custom backend** | Unnecessary; GitHub API does the heavy lifting |
| **Firebase/Supabase** | No database needed; GitHub IS the database |
| **WebContainers** | Heavy; games are simple, don't need npm install |

---

## PART 2 — GitHub Integration Flow

### OAuth Flow (Detailed)

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Browser │                    │ Backend │                    │ GitHub  │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │ 1. Click "Login with GitHub" │                              │
     │ ─────────────────────────────>                              │
     │                              │                              │
     │ 2. Redirect to GitHub OAuth  │                              │
     │ <─────────────────────────────                              │
     │                              │                              │
     │ 3. User authorizes scopes    │                              │
     │ ─────────────────────────────────────────────────────────────>
     │                              │                              │
     │ 4. GitHub redirects with code│                              │
     │ <─────────────────────────────────────────────────────────────
     │                              │                              │
     │ 5. Send code to backend      │                              │
     │ ─────────────────────────────>                              │
     │                              │                              │
     │                              │ 6. Exchange code for token   │
     │                              │ ─────────────────────────────>
     │                              │                              │
     │                              │ 7. Return access_token       │
     │                              │ <─────────────────────────────
     │                              │                              │
     │ 8. Set encrypted session     │                              │
     │ <─────────────────────────────                              │
     │                              │                              │
     │ 9. Redirect to /editor       │                              │
     │ <─────────────────────────────                              │
     │                              │                              │
```

### Required GitHub OAuth Scopes

```
public_repo    — Read/write to public repos (for forking and PR creation)
read:user      — Read user profile (username, avatar)
user:email     — Read user email (for commit author)
```

**Why `public_repo` and not `repo`?**
- `repo` grants access to ALL repos including private
- `public_repo` only grants access to public repos
- Platform repo is public, so `public_repo` is sufficient
- Principle of least privilege

### PR Creation Flow (Step-by-Step)

```typescript
// 1. Check if user has forked the repo
const forks = await octokit.repos.listForks({
  owner: 'AbdullahOztoprak',
  repo: 'Platform',
});
const userFork = forks.data.find(f => f.owner.login === username);

// 2. If no fork, create one
if (!userFork) {
  await octokit.repos.createFork({
    owner: 'AbdullahOztoprak',
    repo: 'Platform',
  });
  // Wait for fork to be ready (can take a few seconds)
  await waitForFork(username, 'Platform');
}

// 3. Get the default branch's latest SHA
const { data: ref } = await octokit.git.getRef({
  owner: username,
  repo: 'Platform',
  ref: 'heads/main',
});
const baseSha = ref.object.sha;

// 4. Create a new branch
const branchName = `game/${gameName}-${Date.now()}`;
await octokit.git.createRef({
  owner: username,
  repo: 'Platform',
  ref: `refs/heads/${branchName}`,
  sha: baseSha,
});

// 5. Create blobs for each file
const blobs = await Promise.all(
  files.map(file =>
    octokit.git.createBlob({
      owner: username,
      repo: 'Platform',
      content: Buffer.from(file.content).toString('base64'),
      encoding: 'base64',
    })
  )
);

// 6. Create a tree with all files
const { data: tree } = await octokit.git.createTree({
  owner: username,
  repo: 'Platform',
  base_tree: baseSha,
  tree: files.map((file, i) => ({
    path: file.path,
    mode: '100644',
    type: 'blob',
    sha: blobs[i].data.sha,
  })),
});

// 7. Create a commit
const { data: commit } = await octokit.git.createCommit({
  owner: username,
  repo: 'Platform',
  message: `feat(game): add ${gameName}\n\nSubmitted via Platform Browser IDE`,
  tree: tree.sha,
  parents: [baseSha],
  author: {
    name: userData.name || username,
    email: userData.email,
    date: new Date().toISOString(),
  },
});

// 8. Update branch to point to new commit
await octokit.git.updateRef({
  owner: username,
  repo: 'Platform',
  ref: `heads/${branchName}`,
  sha: commit.sha,
});

// 9. Create Pull Request to upstream
const { data: pr } = await octokit.pulls.create({
  owner: 'AbdullahOztoprak',
  repo: 'Platform',
  title: `feat(game): ${gameName}`,
  body: generatePRBody(metadata),
  head: `${username}:${branchName}`,
  base: 'main',
});

return pr.html_url;
```

### GitHub REST Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /repos/{owner}/{repo}/forks` | Fork the repo |
| `GET /repos/{owner}/{repo}/git/ref/{ref}` | Get branch SHA |
| `POST /repos/{owner}/{repo}/git/refs` | Create branch |
| `POST /repos/{owner}/{repo}/git/blobs` | Upload file content |
| `POST /repos/{owner}/{repo}/git/trees` | Create file tree |
| `POST /repos/{owner}/{repo}/git/commits` | Create commit |
| `PATCH /repos/{owner}/{repo}/git/refs/{ref}` | Update branch |
| `POST /repos/{owner}/{repo}/pulls` | Open PR |

### Error Handling

```typescript
const GITHUB_ERRORS = {
  401: 'Token expired. Please login again.',
  403: 'Rate limited. Please wait a few minutes.',
  404: 'Repository not found. Has it been renamed?',
  409: 'Branch already exists. Try a different game name.',
  422: 'Invalid request. Check your file names.',
};

async function handleGitHubError(error: OctokitError) {
  const message = GITHUB_ERRORS[error.status] || 'Unknown GitHub error';
  
  if (error.status === 403 && error.headers['x-ratelimit-remaining'] === '0') {
    const resetTime = new Date(error.headers['x-ratelimit-reset'] * 1000);
    throw new Error(`Rate limited until ${resetTime.toLocaleTimeString()}`);
  }
  
  throw new Error(message);
}
```

---

## PART 3 — Code Editor Experience

### Monaco Editor Setup

```typescript
// components/Editor.tsx
import Editor, { Monaco } from '@monaco-editor/react';
import { useEditorStore } from '@/stores/editor';

const LANGUAGE_MAP: Record<string, string> = {
  '.py': 'python',
  '.js': 'javascript',
  '.html': 'html',
  '.css': 'css',
  '.json': 'json',
  '.md': 'markdown',
};

export function CodeEditor() {
  const { activeFile, files, updateFile } = useEditorStore();
  
  const handleEditorMount = (editor: any, monaco: Monaco) => {
    // Configure Python IntelliSense
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: () => ({
        suggestions: pythonCompletions,
      }),
    });
    
    // Custom theme matching Platform branding
    monaco.editor.defineTheme('platform-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
      },
    });
    monaco.editor.setTheme('platform-dark');
  };
  
  const language = LANGUAGE_MAP[getExtension(activeFile)] || 'plaintext';
  
  return (
    <Editor
      height="100%"
      language={language}
      value={files[activeFile]?.content || ''}
      onChange={(value) => updateFile(activeFile, value || '')}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
      }}
    />
  );
}
```

### Virtual File System

```typescript
// stores/editor.ts
import { create } from 'zustand';

interface EditorFile {
  path: string;
  content: string;
  language: string;
  dirty: boolean;
}

interface EditorState {
  files: Record<string, EditorFile>;
  activeFile: string;
  category: 'cli' | 'web' | 'algorithm';
  gameName: string;
  
  // Actions
  setCategory: (cat: 'cli' | 'web' | 'algorithm') => void;
  setGameName: (name: string) => void;
  createFile: (path: string, content: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  loadTemplate: (category: string) => void;
  getFilesForSubmit: () => { path: string; content: string }[];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  files: {},
  activeFile: '',
  category: 'cli',
  gameName: '',
  
  loadTemplate: (category) => {
    const templates = GAME_TEMPLATES[category];
    set({
      files: templates.reduce((acc, t) => ({
        ...acc,
        [t.path]: { path: t.path, content: t.content, language: t.language, dirty: false },
      }), {}),
      activeFile: templates[0].path,
      category: category as any,
    });
  },
  
  getFilesForSubmit: () => {
    const { files, category, gameName } = get();
    return Object.values(files).map(f => ({
      path: `games/${category}/${gameName}/${f.path}`,
      content: f.content,
    }));
  },
  
  // ... other actions
}));
```

### Game Templates

```typescript
// lib/templates.ts
export const GAME_TEMPLATES = {
  cli: [
    {
      path: 'main.py',
      language: 'python',
      content: `#!/usr/bin/env python3
"""
🎮 My CLI Game
A simple terminal-based game.
"""

def main():
    print("Welcome to My Game!")
    
    while True:
        user_input = input("Enter your choice (q to quit): ")
        
        if user_input.lower() == 'q':
            print("Thanks for playing!")
            break
        
        # TODO: Add your game logic here
        print(f"You entered: {user_input}")

if __name__ == "__main__":
    main()
`,
    },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# My CLI Game

## How to Play

1. Run \`python main.py\`
2. Follow the prompts
3. Enter 'q' to quit

## What I Learned

- TODO: Add what you learned while building this

## Screenshots

\`\`\`
$ python main.py
Welcome to My Game!
Enter your choice (q to quit): 
\`\`\`
`,
    },
    {
      path: 'metadata.json',
      language: 'json',
      content: '', // Generated dynamically
    },
  ],
  
  web: [
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Game</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game-container">
    <h1>🎮 My Web Game</h1>
    <div id="game-area">
      <!-- Your game content here -->
    </div>
    <p id="score">Score: 0</p>
  </div>
  <script src="game.js"></script>
</body>
</html>
`,
    },
    {
      path: 'style.css',
      language: 'css',
      content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  background: #0d1117;
  color: #e6edf3;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#game-container {
  text-align: center;
  padding: 2rem;
}

#game-area {
  width: 400px;
  height: 400px;
  background: #161b22;
  border: 2px solid #30363d;
  border-radius: 8px;
  margin: 1rem auto;
}

#score {
  font-size: 1.5rem;
  color: #0ea5e9;
}
`,
    },
    {
      path: 'game.js',
      language: 'javascript',
      content: `// 🎮 My Web Game

let score = 0;
const scoreDisplay = document.getElementById('score');
const gameArea = document.getElementById('game-area');

function updateScore(points) {
  score += points;
  scoreDisplay.textContent = \`Score: \${score}\`;
}

function init() {
  console.log('Game initialized!');
  // TODO: Add your game initialization here
}

// Start the game
init();
`,
    },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# My Web Game

## How to Play

1. Open \`index.html\` in a browser
2. TODO: Add instructions

## What I Learned

- TODO: Add what you learned

## Demo

[Add a screenshot or GIF here]
`,
    },
    {
      path: 'metadata.json',
      language: 'json',
      content: '',
    },
  ],
  
  algorithm: [
    {
      path: 'solution.py',
      language: 'python',
      content: `#!/usr/bin/env python3
"""
🧮 Algorithm Challenge: [Challenge Name]

Problem:
  TODO: Describe the problem

Example:
  Input: [1, 2, 3]
  Output: 6
"""

def solve(data):
    """
    Your solution here.
    
    Args:
        data: Input data
        
    Returns:
        The solution
    """
    # TODO: Implement your algorithm
    pass


# Test cases
if __name__ == "__main__":
    # Test 1
    assert solve([1, 2, 3]) == 6, "Test 1 failed"
    
    # Test 2
    assert solve([]) == 0, "Test 2 failed"
    
    print("✅ All tests passed!")
`,
    },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# Algorithm Challenge

## Problem Statement

TODO: Describe the problem in detail

## Examples

\`\`\`
Input: [1, 2, 3]
Output: 6
Explanation: 1 + 2 + 3 = 6
\`\`\`

## Approach

TODO: Explain your approach

## Complexity

- Time: O(?)
- Space: O(?)

## What I Learned

- TODO: Add insights
`,
    },
    {
      path: 'metadata.json',
      language: 'json',
      content: '',
    },
  ],
};
```

### Auto Metadata Generator

```typescript
// components/MetadataPanel.tsx
import { useEditorStore } from '@/stores/editor';
import { useSession } from 'next-auth/react';

export function MetadataPanel() {
  const { data: session } = useSession();
  const { gameName, category, setGameName, files, updateFile } = useEditorStore();
  
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const generateMetadata = () => {
    const metadata = {
      name: gameName,
      author: session?.user?.login || 'unknown',
      category,
      difficulty,
      language: category === 'web' ? 'HTML/CSS/JS' : 'Python',
      version: '1.0.0',
      description,
      tags,
      entry_point: category === 'web' ? 'index.html' : 'main.py',
      created_at: new Date().toISOString().split('T')[0],
    };
    
    updateFile('metadata.json', JSON.stringify(metadata, null, 2));
  };
  
  return (
    <div className="p-4 bg-dark-card border-t border-dark-border">
      <h3 className="font-semibold mb-4">Game Metadata</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-dark-muted">Game Name</label>
          <input
            value={gameName}
            onChange={(e) => setGameName(slugify(e.target.value))}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded"
            placeholder="my-awesome-game"
          />
        </div>
        
        <div>
          <label className="text-sm text-dark-muted">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded"
          >
            <option value="beginner">🟢 Beginner (1x XP)</option>
            <option value="intermediate">🟡 Intermediate (1.5x XP)</option>
            <option value="advanced">🔴 Advanced (2x XP)</option>
          </select>
        </div>
        
        <div>
          <label className="text-sm text-dark-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded"
            rows={3}
            placeholder="A short description of your game..."
          />
        </div>
        
        <button
          onClick={generateMetadata}
          className="w-full py-2 bg-primary-500 hover:bg-primary-600 rounded"
        >
          Update metadata.json
        </button>
      </div>
    </div>
  );
}
```

---

## PART 4 — Live Execution Strategy

### Web Games: iframe Sandbox

```typescript
// components/WebPreview.tsx
import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores/editor';
import { useDebouncedValue } from '@/hooks/useDebounce';

export function WebPreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { files } = useEditorStore();
  
  // Debounce to avoid too many reloads
  const debouncedFiles = useDebouncedValue(files, 500);
  
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const html = debouncedFiles['index.html']?.content || '';
    const css = debouncedFiles['style.css']?.content || '';
    const js = debouncedFiles['game.js']?.content || '';
    
    // Inject CSS and JS into HTML
    const fullHtml = html
      .replace('</head>', `<style>${css}</style></head>`)
      .replace('</body>', `<script>${wrapWithErrorHandler(js)}</script></body>`);
    
    // Use srcdoc for sandboxed execution
    iframeRef.current.srcdoc = fullHtml;
  }, [debouncedFiles]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 bg-dark-card border-b border-dark-border flex items-center justify-between">
        <span className="text-sm font-medium">Preview</span>
        <button
          onClick={() => {
            if (iframeRef.current) {
              iframeRef.current.srcdoc = iframeRef.current.srcdoc;
            }
          }}
          className="text-xs px-2 py-1 bg-dark-bg rounded hover:bg-dark-border"
        >
          🔄 Refresh
        </button>
      </div>
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="flex-1 w-full bg-white"
        title="Game Preview"
      />
    </div>
  );
}

// Wrap user JS to catch errors gracefully
function wrapWithErrorHandler(js: string): string {
  return `
    window.onerror = (msg, url, line) => {
      document.body.innerHTML = '<div style="color:red;padding:20px;">' +
        '<h2>Error</h2><pre>' + msg + ' (line ' + line + ')</pre></div>';
      return true;
    };
    try {
      ${js}
    } catch (e) {
      document.body.innerHTML = '<div style="color:red;padding:20px;">' +
        '<h2>Error</h2><pre>' + e.message + '</pre></div>';
    }
  `;
}
```

### Python Games: Pyodide

```typescript
// components/PythonPreview.tsx
import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editor';

export function PythonPreview() {
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const { files } = useEditorStore();
  
  // Load Pyodide once
  useEffect(() => {
    async function loadPyodide() {
      const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
      const py = await pyodideModule.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        stdout: (text: string) => setOutput(prev => [...prev, text]),
        stderr: (text: string) => setOutput(prev => [...prev, `❌ ${text}`]),
      });
      setPyodide(py);
    }
    loadPyodide();
  }, []);
  
  const runPython = async () => {
    if (!pyodide) return;
    
    setOutput([]);
    setIsRunning(true);
    
    const code = files['main.py']?.content || files['solution.py']?.content || '';
    
    try {
      // Mock input() for interactive games
      pyodide.globals.set('__platform_inputs__', ['test', 'q']);
      await pyodide.runPythonAsync(`
import sys
from io import StringIO

__input_index__ = 0
def mock_input(prompt=''):
    global __input_index__
    print(prompt, end='')
    if __input_index__ < len(__platform_inputs__):
        val = __platform_inputs__[__input_index__]
        __input_index__ += 1
        print(val)
        return val
    return 'q'

# Replace input with mock
import builtins
builtins.input = mock_input
      `);
      
      // Run with timeout
      const result = await Promise.race([
        pyodide.runPythonAsync(code),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout (5s)')), 5000)
        ),
      ]);
      
      if (result !== undefined) {
        setOutput(prev => [...prev, `→ ${result}`]);
      }
    } catch (e: any) {
      setOutput(prev => [...prev, `❌ ${e.message}`]);
    }
    
    setIsRunning(false);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 bg-dark-card border-b border-dark-border flex items-center justify-between">
        <span className="text-sm font-medium">Python Output</span>
        <button
          onClick={runPython}
          disabled={isRunning || !pyodide}
          className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
        >
          {isRunning ? '⏳ Running...' : '▶ Run'}
        </button>
      </div>
      <div className="flex-1 bg-black p-4 font-mono text-sm overflow-auto">
        {!pyodide && <div className="text-yellow-400">Loading Python...</div>}
        {output.map((line, i) => (
          <div key={i} className="text-green-400">{line}</div>
        ))}
        {output.length === 0 && pyodide && (
          <div className="text-dark-muted">Click "Run" to execute your Python code</div>
        )}
      </div>
    </div>
  );
}
```

### Execution Tradeoffs

| Approach | Pros | Cons |
|----------|------|------|
| **Pyodide (Browser)** | No server, instant, free | 5-10MB download, limited libraries |
| **Server Sandbox** | Full Python, all libraries | Complex, expensive, latency |
| **WebContainer** | Full Node.js | Heavy, overkill for simple games |

**Recommendation:** Start with Pyodide. 95% of beginner Python games will work. Add server fallback in Phase 3 if needed.

---

## PART 5 — Security Model

### Threat Model

| Threat | Risk | Mitigation |
|--------|------|------------|
| **XSS via preview** | High | iframe sandbox, CSP |
| **Token theft** | Critical | HttpOnly cookies, server-side storage |
| **Infinite loops** | Medium | Execution timeout |
| **Resource abuse** | Medium | Rate limiting, file size limits |
| **Malicious PRs** | Low | Existing CI validation |
| **API abuse** | Medium | Rate limiting, auth required |

### iframe Sandbox Configuration

```html
<iframe
  sandbox="allow-scripts"
  <!-- Explicitly NOT allowing:
    - allow-same-origin (prevents access to parent window)
    - allow-top-navigation (prevents redirects)
    - allow-forms (prevents form submission)
    - allow-popups (prevents window.open)
  -->
/>
```

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline';
      frame-src 'self' blob:;
      connect-src 'self' https://api.github.com;
      img-src 'self' https://github.com https://avatars.githubusercontent.com data:;
    `.replace(/\n/g, ''),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
];
```

### Execution Limits

```typescript
// lib/limits.ts
export const LIMITS = {
  // File limits
  maxFileSize: 50 * 1024,        // 50KB per file
  maxTotalSize: 200 * 1024,      // 200KB total
  maxFiles: 5,                   // Max 5 files
  maxLineLength: 500,            // Max 500 chars per line
  
  // Execution limits
  pythonTimeout: 5000,           // 5 seconds
  jsTimeout: 5000,               // 5 seconds
  
  // Rate limits
  submitsPerHour: 5,             // Max 5 PRs per hour
  submitsPerDay: 20,             // Max 20 PRs per day
  
  // Anti-abuse
  minAccountAge: 7,              // Days old GitHub account
};

export function validateFiles(files: EditorFile[]): ValidationResult {
  const errors: string[] = [];
  
  if (files.length > LIMITS.maxFiles) {
    errors.push(`Too many files (max ${LIMITS.maxFiles})`);
  }
  
  const totalSize = files.reduce((sum, f) => sum + f.content.length, 0);
  if (totalSize > LIMITS.maxTotalSize) {
    errors.push(`Total size too large (max ${LIMITS.maxTotalSize / 1024}KB)`);
  }
  
  for (const file of files) {
    if (file.content.length > LIMITS.maxFileSize) {
      errors.push(`${file.path} is too large (max ${LIMITS.maxFileSize / 1024}KB)`);
    }
    
    const longLines = file.content.split('\n').filter(l => l.length > LIMITS.maxLineLength);
    if (longLines.length > 0) {
      errors.push(`${file.path} has lines > ${LIMITS.maxLineLength} chars (possible obfuscation)`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

### Rate Limiting

```typescript
// lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const submitRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 per hour
  analytics: true,
  prefix: 'platform:submit',
});

// In API route
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { success, remaining, reset } = await submitRateLimit.limit(session.user.id);
  
  if (!success) {
    return Response.json({
      error: `Rate limited. Try again at ${new Date(reset).toLocaleTimeString()}`,
      remaining: 0,
      reset,
    }, { status: 429 });
  }
  
  // Continue with submission...
}
```

---

## PART 6 — Data Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  User   │
    └────┬────┘
         │
         │ 1. Visit platform.dev/editor
         ▼
    ┌─────────────────────────────────────────┐
    │           BROWSER IDE                   │
    │                                         │
    │  [Login with GitHub] ────────────────┐  │
    │                                      │  │
    └──────────────────────────────────────┼──┘
                                           │
         │                                 │ 2. OAuth redirect
         │                                 ▼
         │                         ┌─────────────┐
         │                         │   GitHub    │
         │                         │   OAuth     │
         │                         └──────┬──────┘
         │                                │
         │ 3. Token stored in session     │
         │ <──────────────────────────────┘
         ▼
    ┌─────────────────────────────────────────┐
    │           BROWSER IDE                   │
    │                                         │
    │  ┌─────────────────────────────────┐   │
    │  │      Monaco Editor              │   │
    │  │  - main.py / index.html         │   │
    │  │  - game.js / style.css          │   │
    │  │  - metadata.json                │   │
    │  └─────────────────────────────────┘   │
    │                                         │
    │  ┌─────────────────────────────────┐   │
    │  │      Preview Panel              │   │
    │  │  - iframe (web)                 │   │
    │  │  - Pyodide (Python)             │   │
    │  └─────────────────────────────────┘   │
    │                                         │
    │  [Submit to Platform] ────────────────┐ │
    │                                       │ │
    └───────────────────────────────────────┼─┘
                                            │
         │                                  │ 4. POST /api/submit
         │                                  │    { files, metadata }
         │                                  ▼
    ┌────┴───────────────────────────────────────────────────────────────────┐
    │                        BACKEND API                                      │
    │                                                                         │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │  /api/submit                                                    │   │
    │  │                                                                 │   │
    │  │  1. Validate session (user logged in?)                          │   │
    │  │  2. Rate limit check (5/hour, 20/day)                          │   │
    │  │  3. Validate files (size, count, structure)                    │   │
    │  │  4. Pre-run security patterns (no eval, no network)            │   │
    │  │                                                                 │   │
    │  │  If all pass:                                                   │   │
    │  │  5. Fork repo (if not exists)                                  │   │
    │  │  6. Create branch                                              │   │
    │  │  7. Create commits                                             │   │
    │  │  8. Open PR                                                    │   │
    │  │                                                                 │   │
    │  │  Return: { pr_url, pr_number }                                 │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                      │                                                  │
    └──────────────────────┼──────────────────────────────────────────────────┘
                           │
         │                 │ 5. GitHub API calls
         │                 ▼
    ┌────┴───────────────────────────────────────────────────────────────────┐
    │                        GITHUB                                           │
    │                                                                         │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │  user/Platform (fork)                                           │   │
    │  │                                                                 │   │
    │  │  Branch: game/my-game-1709312400                               │   │
    │  │  Files:                                                         │   │
    │  │    games/cli/my-game/main.py                                   │   │
    │  │    games/cli/my-game/README.md                                 │   │
    │  │    games/cli/my-game/metadata.json                             │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                      │                                                  │
    │                      │ 6. PR opened to upstream                         │
    │                      ▼                                                  │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │  AbdullahOztoprak/Platform (upstream)                          │   │
    │  │                                                                 │   │
    │  │  PR #123: feat(game): my-game                                  │   │
    │  │  Author: @user                                                 │   │
    │  │  Status: Open                                                  │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                      │                                                  │
    │                      │ 7. Triggers GitHub Actions                       │
    │                      ▼                                                  │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │  GitHub Actions: ci.yml                                        │   │
    │  │                                                                 │   │
    │  │  Jobs:                                                         │   │
    │  │  ├── detect (game PR detected)                                 │   │
    │  │  ├── validate (structure, metadata, files)                     │   │
    │  │  ├── lint (python/js linting)                                  │   │
    │  │  └── security (pattern scanning)                               │   │
    │  │                                                                 │   │
    │  │  ✅ All checks pass                                            │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                      │                                                  │
    │                      │ 8. Reviewer merges                               │
    │                      ▼                                                  │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │  Merge to main                                                  │   │
    │  │                                                                 │   │
    │  │  Triggers: deploy.yml                                          │   │
    │  │  ├── build-data (update games.json)                            │   │
    │  │  ├── build-site (astro build)                                  │   │
    │  │  └── deploy (GitHub Pages)                                     │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                      │                                                  │
    └──────────────────────┼──────────────────────────────────────────────────┘
                           │
         │                 │ 9. Site updated
         │                 ▼
    ┌────┴───────────────────────────────────────────────────────────────────┐
    │                        PLATFORM WEBSITE                                 │
    │                                                                         │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │  Games page now shows: my-game                                  │   │
    │  │  Contributor profile updated                                    │   │
    │  │  Leaderboard updated (on Sunday)                               │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                                                                         │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

## PART 7 — Scalability

### GitHub API Rate Limits

| Auth Type | Limit | Per |
|-----------|-------|-----|
| Unauthenticated | 60 | Hour |
| User token | 5,000 | Hour |
| GitHub App | 5,000 × installations | Hour |

### Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SCALING TIERS                                           │
└─────────────────────────────────────────────────────────────────────────────┘

Tier 1: 0-500 users/day
├── Direct GitHub API calls with user tokens
├── No caching needed
├── Vercel free tier
└── Cost: $0

Tier 2: 500-2,000 users/day
├── Add Redis for rate limiting
├── Cache user fork status (5 min TTL)
├── Queue PR submissions (avoid burst)
├── Vercel Pro ($20/mo)
└── Cost: ~$30/mo

Tier 3: 2,000-10,000 users/day
├── GitHub App for higher rate limits
├── Background job queue (Inngest/Trigger.dev)
├── CDN for static assets
├── Database for submission history
└── Cost: ~$100/mo

Tier 4: 10,000+ users/day
├── Multiple GitHub Apps (load balance)
├── Custom submission queue
├── Dedicated Redis cluster
├── Consider self-hosted runners
└── Cost: ~$500/mo
```

### Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({...});

// Cache user's fork status (avoid repeated API calls)
export async function getUserForkStatus(username: string): Promise<boolean | null> {
  const cached = await redis.get(`fork:${username}`);
  if (cached !== null) return cached === 'true';
  return null;
}

export async function setUserForkStatus(username: string, hasFork: boolean) {
  await redis.set(`fork:${username}`, hasFork ? 'true' : 'false', { ex: 300 }); // 5 min
}

// Cache latest main branch SHA (avoid repeated API calls)
export async function getMainBranchSha(): Promise<string | null> {
  return redis.get('main:sha');
}

export async function setMainBranchSha(sha: string) {
  await redis.set('main:sha', sha, { ex: 60 }); // 1 min
}
```

### Queue System (Phase 2+)

```typescript
// lib/queue.ts
import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'platform' });

// Define the submission job
export const submitGame = inngest.createFunction(
  { id: 'submit-game', retries: 3 },
  { event: 'game/submit' },
  async ({ event, step }) => {
    const { userId, files, metadata } = event.data;
    
    // Step 1: Ensure fork exists
    const fork = await step.run('ensure-fork', async () => {
      return ensureUserFork(userId);
    });
    
    // Step 2: Create branch
    const branch = await step.run('create-branch', async () => {
      return createBranch(userId, metadata.name);
    });
    
    // Step 3: Commit files
    await step.run('commit-files', async () => {
      return commitFiles(userId, branch, files);
    });
    
    // Step 4: Open PR
    const pr = await step.run('open-pr', async () => {
      return openPullRequest(userId, branch, metadata);
    });
    
    return { pr_url: pr.html_url };
  }
);
```

---

## PART 8 — MVP vs Advanced Roadmap

### Phase 1: MVP (2-3 weeks)

**Goal:** Working browser → PR flow

**Features:**
- [ ] GitHub OAuth login
- [ ] Monaco editor (single file)
- [ ] Category selector (CLI/Web/Algorithm)
- [ ] Basic template injection
- [ ] Web preview (iframe)
- [ ] Submit button → creates PR
- [ ] Success/error feedback

**Tech:**
- Next.js 14 App Router
- NextAuth.js
- Monaco Editor
- Octokit.js
- Vercel deployment

**Not included:**
- Multi-file editor
- Python execution
- Rate limiting
- Caching

```
/editor (page)
├── Login with GitHub
├── Select category
├── Write code
├── Preview (web only)
└── Submit

/api/auth/* (NextAuth)
/api/submit (create PR)
```

### Phase 2: Enhanced Editor (2-3 weeks)

**Goal:** Better editing experience

**Features:**
- [ ] Multi-file support (file tree)
- [ ] Python execution (Pyodide)
- [ ] Auto-save to localStorage
- [ ] Metadata form (not just JSON)
- [ ] Pre-submit validation
- [ ] Rate limiting (5/hour)
- [ ] Loading states

**Tech additions:**
- Zustand for state
- Pyodide
- Upstash Redis

### Phase 3: Full Platform (4-6 weeks)

**Goal:** Production-ready IDE

**Features:**
- [ ] User dashboard (my submissions)
- [ ] PR status tracking
- [ ] Inline validation errors
- [ ] Git diff view
- [ ] Collaboration (share draft link)
- [ ] Keyboard shortcuts
- [ ] Mobile-responsive
- [ ] Analytics

**Tech additions:**
- Database (PlanetScale/Turso)
- Background jobs (Inngest)
- Error tracking (Sentry)

---

## File Structure (MVP)

```
platform-ide/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing / redirect to editor
│   ├── editor/
│   │   └── page.tsx                # Main IDE page
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts        # NextAuth handler
│   │   └── submit/
│   │       └── route.ts            # PR creation endpoint
│   └── globals.css
├── components/
│   ├── Editor.tsx                  # Monaco wrapper
│   ├── Preview.tsx                 # iframe / Pyodide
│   ├── Sidebar.tsx                 # Category, templates
│   ├── MetadataPanel.tsx           # Game metadata form
│   └── SubmitButton.tsx            # Submit + loading state
├── lib/
│   ├── github.ts                   # Octokit helpers
│   ├── templates.ts                # Game templates
│   ├── validation.ts               # Client-side validation
│   └── limits.ts                   # Size/rate limits
├── stores/
│   └── editor.ts                   # Zustand store
├── next.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## Quick Start Commands

```bash
# Create Next.js project
npx create-next-app@latest platform-ide --typescript --tailwind --app --src-dir=false

cd platform-ide

# Install dependencies
npm install @monaco-editor/react next-auth @octokit/rest zustand

# Add environment variables
cat > .env.local << EOF
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
EOF

# Run development server
npm run dev
```

---

## Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Framework** | Next.js 14 | Best DX, built-in API routes |
| **Editor** | Monaco | VS Code engine, best-in-class |
| **Auth** | NextAuth + GitHub OAuth | Standard, secure |
| **Python** | Pyodide | Client-side, free |
| **PR Creation** | User's token | Preserves contribution credit |
| **Hosting** | Vercel | Zero-config Next.js |
| **MVP scope** | Single-file, web preview | Ship fast, iterate |

**Total MVP effort:** ~2-3 weeks for one developer  
**Production-ready:** ~8-10 weeks total

This architecture is:
- **Simple** — No custom backend, GitHub is the database
- **Secure** — Sandbox isolation, rate limiting, validation
- **Scalable** — Serverless, stateless, cacheable
- **User-friendly** — VS Code-like experience, no git knowledge needed
