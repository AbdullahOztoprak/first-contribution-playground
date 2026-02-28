# 🌍 Translation Guide

This guide explains how to contribute translations to help us reach developers worldwide.

## What Can You Translate?

| Document | Priority | Path |
|----------|----------|------|
| README.md | ⭐⭐⭐ High | `translations/README/README.LANG.md` |
| CONTRIBUTING.md | ⭐⭐ Medium | `translations/CONTRIBUTING/CONTRIBUTING.LANG.md` |
| Beginner's Guide | ⭐⭐ Medium | `translations/guides/BEGINNER_GUIDE.LANG.md` |

## Language Codes

Use standard ISO language codes:

| Language | Code | Language | Code |
|----------|------|----------|------|
| Turkish | `tr` | Korean | `ko` |
| Spanish | `es` | Arabic | `ar` |
| French | `fr` | Hindi | `hi` |
| German | `de` | Russian | `ru` |
| Japanese | `ja` | Italian | `it` |
| Chinese (Simplified) | `zh-CN` | Dutch | `nl` |
| Portuguese (Brazil) | `pt-BR` | Polish | `pl` |

## Translation Rules

### Do:
- ✅ Translate all text content
- ✅ Keep the original markdown structure
- ✅ Keep all links working
- ✅ Keep code blocks unchanged (code stays in English)
- ✅ Use proper grammar and natural phrasing
- ✅ Ask a native speaker to review if possible

### Don't:
- ❌ Use machine translation only (Google Translate, etc.)
- ❌ Change the document structure
- ❌ Remove or modify links
- ❌ Translate code snippets or commands
- ❌ Translate technical terms that are commonly used in English (e.g., "pull request", "fork", "merge")

## Quality Standards

1. **Accuracy**: Translation must convey the same meaning as the original
2. **Naturalness**: Should read naturally in the target language
3. **Consistency**: Use the same terms throughout the document
4. **Completeness**: Translate the entire document, not just parts

## Auto-Merge

Translation PRs that pass all checks are **automatically merged**! Here's what the system checks:

1. File is in the `translations/` directory
2. File name follows the `FILENAME.LANG_CODE.md` convention
3. File uses UTF-8 encoding
4. File is not empty and has substantial content (5+ lines)
5. Only `.md` files are included

If all checks pass → ✅ Auto-merge!
