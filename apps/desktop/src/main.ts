import { sendNotification } from '@tauri-apps/plugin-notification';

export async function notifyAboutFollowUp(company: string) {
  await sendNotification({ title: 'Moonshot follow-up', body: `Choose the next step for ${company}.` });
}

// TODO(moonshot-05): expose this via a deliberate user action and add platform
// permission handling. Native capability calls must never be implicit.
