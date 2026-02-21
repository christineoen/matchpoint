# Authentication Setup Guide

## 1. Install Dependencies

```bash
npm install @supabase/ssr
```

## 2. Run Migration

Apply the auth setup migration:

```bash
npx supabase db push
```

Or if using remote:
```bash
npx supabase db push --db-url "your-connection-string"
```

## 3. Enable Email Auth in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure email settings:
   - Enable "Confirm email" (recommended for production)
   - For development, you can disable email confirmation

## 4. Configure Email Templates (Optional)

Go to **Authentication** → **Email Templates** to customize:
- Confirmation email
- Password reset email
- Magic link email

## 5. Test the Authentication

1. Start your dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. You'll be redirected to `/login`
4. Create a new account with email/password
5. After signup, you'll be logged in and redirected to home

## Features Implemented

✅ Email/password authentication
✅ Login page with signup toggle
✅ Protected routes (middleware)
✅ Automatic profile creation on signup
✅ User header with email and logout button
✅ Session management
✅ Row Level Security (RLS) policies

## User Roles

The system supports three roles (defined in profiles table):
- `member` - Default role for new users
- `organizer` - Can create and manage events
- `admin` - Full access to all features

## Next Steps

To add role-based access control:
1. Update middleware to check user role
2. Add role checks in API routes
3. Show/hide UI elements based on role

## Troubleshooting

**Issue: Can't sign up**
- Check that email provider is enabled in Supabase dashboard
- Check browser console for errors
- Verify environment variables are set

**Issue: Profile not created**
- Check that migration ran successfully
- Check Supabase logs for trigger errors
- Verify RLS policies are correct

**Issue: Redirected to login after signup**
- Check that session is being set correctly
- Clear browser cookies and try again
- Check middleware configuration
