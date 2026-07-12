import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { applicationSchema } from '@moonshot/contracts';
import { ApplicationForm } from './App'
import { QueryClientProvider, QueryClient } from '@tanstack/solid-query';

describe('application contract', () => {
  it('rejects an empty company name', () => {
    expect(applicationSchema.safeParse({ id: crypto.randomUUID(), company: '', role: 'Engineer', stage: 'Saved' }).success).toBe(false);
  });
});

describe('Submit empty company', () => {
  it('shows errors for empty required fields', () => {
    render(() =>
      <QueryClientProvider client={new QueryClient()}>
        <ApplicationForm />
      </QueryClientProvider>);

      const button = screen.getByRole('button', {
        name: 'Add to Moonshot',
      });

      fireEvent.submit(button.closest('form')!);

      expect(screen.getAllByRole('alert')).toHaveLength(2);

      expect(
        screen.getByPlaceholderText('Macro').getAttribute('aria-invalid'),
      ).toBe('true');

      expect(
        screen.getByPlaceholderText('Product engineer').getAttribute('aria-invalid'),
      ).toBe('true');
    });
})
