import * as aws from '@pulumi/aws';

// A real resource makes this an executable Pulumi starting point without
// prematurely provisioning a complete production platform.
export const applicationEvents = new aws.sqs.Queue('application-events', {
  messageRetentionSeconds: 60 * 60 * 24 * 4,
});

// TODO(moonshot-05): add a dead-letter queue, least-privilege publisher and
// consumer roles, encryption, alarms, tags, and a separate production stack.
