'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';

import { signInWithCredentials, type SignInState } from '@/app/signin/actions';
import { AnimatedButtonLabel } from '@/components/ui/animated-button-label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const initialState: SignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className='min-h-12 w-full rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60'
      disabled={pending}
      size='lg'
      type='submit'
    >
      <AnimatedButtonLabel stateKey={pending ? 'pending' : 'ready'}>
        {pending ? 'Signing in...' : 'Sign in'}
      </AnimatedButtonLabel>
    </Button>
  );
}

export function CredentialsForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(
    signInWithCredentials,
    initialState,
  );

  return (
    <form action={formAction} className='flex flex-col gap-4'>
      <input name='callbackUrl' type='hidden' value={callbackUrl} />

      <FieldGroup className='gap-4'>
        <Field>
          <FieldLabel className='text-sm font-semibold' htmlFor='email'>
            Email
          </FieldLabel>
          <Input
            autoComplete='email'
            className='min-h-12 rounded-md border-border bg-background px-3.5 text-base font-normal'
            id='email'
            name='email'
            placeholder='you@example.com'
            required
            type='email'
          />
        </Field>

        <Field>
          <FieldLabel className='text-sm font-semibold' htmlFor='password'>
            Password
          </FieldLabel>
          <Input
            autoComplete='current-password'
            className='min-h-12 rounded-md border-border bg-background px-3.5 text-base font-normal'
            id='password'
            name='password'
            placeholder='Your password'
            required
            type='password'
          />
          <Link
            className='w-fit text-xs font-semibold text-primary-muted hover:text-primary'
            href='/forgot-password'
          >
            Forgot password?
          </Link>
        </Field>
      </FieldGroup>

      {state.error ? (
        <Alert
          aria-live='polite'
          className='rounded-md border-danger/30 bg-danger/10 text-danger'
          variant='destructive'
        >
          <AlertDescription className='text-danger'>
            {state.error}
          </AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}
