# AI Review Rules

Every game submission is reviewed automatically.

Checks:

## Structure

- metadata.json exists
- README.md exists
- files <= 5
- lines <= 500

## Code Quality

- clear variable naming
- simple logic
- beginner friendly
- comments encouraged

## Security

Forbidden patterns:
- eval()
- exec()
- subprocess
- file system writes
- network calls

## Review Output Format

AI should respond with:

Summary
Security concerns
Improvement suggestions
Merge readiness