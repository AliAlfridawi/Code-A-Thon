# Testing Guide

This project now includes comprehensive testing infrastructure with both unit tests and E2E tests.

## Unit Tests (Vitest)

### Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once with coverage report
npm run test:coverage

# Open interactive UI dashboard
npm run test:ui

# Run tests headlessly (CI mode)
npm run test:run
```

### Writing Unit Tests

Unit tests live in `__tests__` folders next to the code they test. Example structure:

```
src/
  hooks/
    useAsync.ts
    __tests__/
      useAsync.test.ts
  components/
    Button.tsx
    __tests__/
      Button.test.tsx
```

### Example: Testing a Hook

See [src/hooks/__tests__/useAsync.test.ts](src/hooks/__tests__/useAsync.test.ts) for a complete example.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should return expected value', async () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.value).toBe('expected');
  });
});
```

### Key Testing Libraries

- **Vitest**: Fast unit test runner (Vite-native)
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: DOM matchers

### Configuration

- **Config**: [vitest.config.ts](vitest.config.ts)
- **Setup**: [vitest.setup.ts](vitest.setup.ts)

---

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run E2E tests in headed mode (see browser)
npm run e2e

# Run tests in headed mode with Playwright UI
npm run e2e:ui

# Debug a specific test
npm run e2e:debug

# Run specific test file
npx playwright test e2e/onboarding.spec.ts
```

### Writing E2E Tests

E2E tests live in the `e2e/` directory and test user workflows end-to-end.

Example structure:

```
e2e/
  app.spec.ts        # General app flows
  onboarding.spec.ts # Onboarding flow tests
  messaging.spec.ts  # Messaging feature tests
```

### Example: Testing User Flow

```typescript
import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test('user can complete onboarding', async ({ page }) => {
    // Navigate to app
    await page.goto('/onboarding');
    
    // Select mentor role
    await page.click('text=Become a Mentor');
    
    // Fill profile
    await page.fill('input[name="department"]', 'Computer Science');
    
    // Verify success
    await expect(page.locator('text=Welcome!')).toBeVisible();
  });
});
```

### Configuration

- **Config**: [playwright.config.ts](playwright.config.ts)
- **Tests**: [e2e/app.spec.ts](e2e/app.spec.ts)

### Playwright Features

- **Auto-wait**: Elements are waited for automatically
- **Network**: Mock API calls and network requests
- **Screenshots/Videos**: Captured on failure
- **Tracing**: Full page interaction traces

### Before Running E2E Tests

Make sure you have:

1. **Dev server running** (Playwright will start it automatically, but you can also run `npm run dev` separately)
2. **Test accounts** in Clerk and/or mocked Clerk helpers
3. **Environment variables** set in `.env`

> **TODO**: Set up Clerk E2E testing helpers for authenticated flows
> See: https://clerk.com/docs/testing/e2e-testing

---

## Best Practices

### Unit Testing

✅ **DO:**
- Test pure logic (hooks, utilities, services)
- Use descriptive test names: `should handle async errors with retry`
- Mock external dependencies (API calls, Supabase)
- Aim for ~60%+ coverage on critical paths

❌ **DON'T:**
- Test implementation details (internal state mutations)
- Mock components from your own app
- Write overly complex assertions

### E2E Testing

✅ **DO:**
- Test complete user workflows (sign up → onboard → send message)
- Use `data-testid` attributes for reliable selectors
- Test critical paths only (not every edge case)
- Keep tests independent (each test should be runnable alone)

❌ **DON'T:**
- Test things better suited for unit tests
- Use fragile selectors (CSS classes, text that changes)
- Share state between tests
- Run slow operations (long waits, large data sets)

---

## Debugging Tests

### Debug Unit Tests

```bash
# Run single test file in debug mode
npm run test -- src/hooks/__tests__/useAsync.test.ts

# With VS Code debugger
node --inspect-brk ./node_modules/.bin/vitest run
```

### Debug E2E Tests

```bash
# Debug with Playwright Inspector
npm run e2e:debug

# View test traces (generated on failure)
npx playwright show-trace trace.zip
```

---

## CI/CD Integration

Tests are ready for GitHub Actions or other CI systems:

```yaml
# Example: .github/workflows/test.yml
- name: Run unit tests
  run: npm run test:run

- name: Run E2E tests
  run: npm run e2e
```

---

## Coverage Reports

After running `npm run test:coverage`, open the HTML report:

```bash
open coverage/index.html
```

---

## Next Steps

1. **Add data-testid** attributes to components for E2E tests
2. **Set up Clerk E2E** helpers for authenticated tests
3. **Write critical path tests** (onboarding, messaging, pairing)
4. **Integrate into CI/CD** pipeline
5. **Aim for 60%+ coverage** on hooks and services
