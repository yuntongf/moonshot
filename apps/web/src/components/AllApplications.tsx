import { For, Switch, Match, createEffect } from 'solid-js';
import { useQuery } from '@tanstack/solid-query';
import { Document } from './Document';

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
              <Document application={application} />
            </article>}
          </For>
        </Match>
      </Switch>
    </div>
  </section>
}
