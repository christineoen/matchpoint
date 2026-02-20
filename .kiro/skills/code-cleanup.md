# Code Cleanup Skill

When making changes to the codebase, always look for opportunities to clean up:

## Redundant Files
- Delete files that have been replaced or are no longer used
- Remove duplicate implementations
- Clean up old migration files that have been consolidated

## Unused Code
- Remove unused imports
- Delete unused functions, variables, and types
- Remove commented-out code blocks

## Code Organization
- Consolidate duplicate logic into shared utilities
- Move related functions into appropriate modules
- Ensure consistent file structure

## Type Safety
- Remove unnecessary type casts (e.g., `as any`, `as Type`)
- Use proper TypeScript types instead of workarounds
- Validate function parameters properly

## Documentation
- Remove outdated comments
- Update documentation when behavior changes
- Add comments for complex logic

## When to Clean Up
- After consolidating features (like the tabbed interface)
- After refactoring logic into utilities
- When you notice duplicate code
- Before deployment

## What NOT to Delete
- Active API routes
- Database migrations (these are historical records)
- Configuration files
- Files referenced in imports
