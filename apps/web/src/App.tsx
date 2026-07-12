import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { ApplicationForm } from './components/ApplicationForm';
import { AllApplications } from './components/AllApplications';

const queryClient = new QueryClient()

export function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <main>
        <header>
          <p class="eyebrow">Moonshot · tutorial project</p>
          <h1>Recruiting, with direction.</h1>
          <p>Track applications and turn each next step into preparation.</p>
        </header>
        <ApplicationForm />
        <AllApplications />
      </main>
    </QueryClientProvider>
  );
}
