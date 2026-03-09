## TypeScript

### Compiler Configuration

Always enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type System

- Prefer `type` aliases over `interface` for union types and computed types.
  Use `interface` for object shapes that may be extended (especially public APIs).
- Never use `any`. Use `unknown` for genuinely unknown values and narrow with guards.
- Avoid type assertions (`as Foo`) except at system boundaries with validation.
- Use discriminated unions for modeling state:
  ```typescript
  type Result<T> = { ok: true; value: T } | { ok: false; error: Error }
  ```
- Prefer `readonly` for all data that should not be mutated.
- Use template literal types for string-constrained values: `type EventName = `${string}.${string}``

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Variables, functions | camelCase | `getUserById` |
| Classes, interfaces, types | PascalCase | `UserRepository` |
| Enums | PascalCase (values: SCREAMING_SNAKE) | `Status.ACTIVE` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files | kebab-case | `user-repository.ts` |
| Test files | `*.test.ts` or `*.spec.ts` | `user-repository.test.ts` |

### Module System

- Use ESModules (`"module": "ESNext"` or `"NodeNext"`). Avoid CommonJS for new code.
- Avoid barrel files (`index.ts` re-exporting everything). They hurt tree-shaking and create
  circular dependency risks.
- Use absolute imports configured via `paths` in tsconfig; avoid deeply nested relative imports
  (`../../..`).

### Error Handling

- Model expected errors as values, not exceptions:
  ```typescript
  // Return Result type for expected failures
  function parseAge(raw: string): Result<number> { ... }
  ```
- Reserve `throw` for truly exceptional/unexpected conditions (programming errors, I/O failures).
- Never `catch` an error and silently swallow it. At minimum, log it.
- Use custom error classes with typed properties for domain errors.

### Code Style

- Use `pnpm` as the package manager.
- Format with Prettier (`.prettierrc` in repo root); lint with ESLint (flat config `eslint.config.ts`).
- Prefer `const` over `let`; never use `var`.
- Prefer named exports over default exports for better refactoring support.
- Keep functions small (fits on a screen). Extract when logic becomes layered.
