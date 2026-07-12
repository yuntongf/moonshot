import { For, Switch, Match, createSignal } from 'solid-js';
import { applicationSchema, type Application } from '@moonshot/contracts';
import { useQuery, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/solid-query'
import { z } from 'zod';

type errorState = Partial<Record<'company' | 'role' | 'api', string>>;


const queryClient = new QueryClient()

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

export function AllApplications() {
  async function fetchApplications() {
    const resp = await fetch('http://localhost:8787/applications');

    if (!resp.ok) {
      throw new Error(`Failed to get applications: ${await resp.text()}`);
    }

    return await resp.json();
  }

  const applications = useQuery(() => ({
    queryKey: ['applications'],
    queryFn: fetchApplications
  }));

  return <section>
    <h2>Applications</h2>
    <div class="grid">
      <Switch>
        <Match when={applications.isLoading}>
          <div>Loading applications...</div>
        </Match>
        <Match when={applications.isError}>
          <p role='alert'>{ applications.error?.message }</p>
        </Match>
        <Match when={applications.isFetched}>
          <For each={applications.data}>{(application) =>
            <article class="card">
              <p class="stage">{application.stage}</p><h3>{application.company}</h3><p>{application.role}</p>
              <p class="next">Next: {application.nextStep ?? 'Choose your next action'}</p>
            </article>}
          </For>
        </Match>
      </Switch>
    </div>
  </section>
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main>
        <header><p class="eyebrow">Moonshot · tutorial project</p><h1>Recruiting, with direction.</h1><p>Track applications and turn each next step into preparation.</p></header>
        <ApplicationForm />
        <AllApplications />
      </main>
    </QueryClientProvider>
  );
}
