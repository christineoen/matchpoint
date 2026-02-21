# Temporarily Disable Middleware for Testing

If you're having redirect issues, you can temporarily disable the middleware:

## Option 1: Comment out the middleware

In `middleware.ts`, comment out the entire file or just return early:

```typescript
export async function middleware(req: NextRequest) {
  return NextResponse.next() // Just return early
}
```

## Option 2: Rename the file

```bash
mv middleware.ts middleware.ts.disabled
```

Then you can manually test auth by:
1. Going to `/login` directly
2. Signing up/logging in
3. Checking if the header shows your email
4. Manually navigating to `/` to see if you're logged in

Once auth is working, re-enable the middleware.
