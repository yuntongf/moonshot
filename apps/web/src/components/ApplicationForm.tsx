import { applicationSchema, type Application } from '@moonshot/contracts';
import { useQueryClient } from '@tanstack/solid-query';
import { createSignal } from 'solid-js';
import { z } from 'zod';

type errorState = Partial<Record<'company' | 'role' | 'api', string>>;


export function ApplicationForm() {
  const queryClient = useQueryClient();

  const [company, setCompany] = createSignal<string>('');
  const [role, setRole] = createSignal<string>('');
  const [errorState, setErrorState] = createSignal<errorState>();

  async function addApplication(event: SubmitEvent) {
    event.preventDefault();

    const parseResult = applicationSchema.safeParse({
      id: crypto.randomUUID(),
      company: company().trim(),
      role: role().trim(),
    });

    if (!parseResult.success) {
      const err = z.treeifyError(parseResult.error).properties;
      setErrorState({
        company: err?.company?.errors.at(0),
        role: err?.role?.errors.at(0),
      });
      return;
    }

    try {
      const resp = await fetch('http://localhost:8787/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parseResult.data)
      })

      if (!resp.ok) {
        setErrorState({
          api: await resp.text()
        });
        return;
      }

      const created = applicationSchema.parse(await resp.json());
      queryClient.setQueryData<Application[]>(
        ['applications'],
        (current = []) => [...current, created]
      );

      setCompany('');
      setRole('');
    } catch (e) {
      console.error(e);
    }
  }

  return <section class="card"><h2>Add an application</h2><form onSubmit={addApplication}>
    <div class='field'>Company
      <input
        value={company()}
        onInput={(e) => setCompany(e.currentTarget.value)}
        placeholder="Macro"
        aria-invalid={Boolean(errorState()?.company)}
        aria-describedby={errorState()?.company ? 'company-err' : undefined}
      />
      {errorState()?.company && <p id='company-err' class="field-error" role='alert'>{errorState()?.company}</p>}
    </div>
    <div class='field'>Role
      <input
        value={role()}
        onInput={(e) => setRole(e.currentTarget.value)}
        placeholder="Product engineer"
        aria-invalid={Boolean(errorState()?.role)}
        aria-describedby={errorState()?.role ? 'role-err' : undefined}
      />
      {errorState()?.role && <p id='role-err' class="field-error" role='alert'>{errorState()?.role}</p>}
    </div>
    {errorState()?.api && <p role='alert'>{ errorState()?.api }</p>}
    <button type="submit" style={{'align-self': 'start'}}>Add to Moonshot</button>
  </form></section>
}
