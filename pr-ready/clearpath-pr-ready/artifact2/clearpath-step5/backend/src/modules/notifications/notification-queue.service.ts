import { Injectable } from '@nestjs/common';
import type { DeliveryJob } from './delivery.types';

/** Queue boundary. Replace the in-memory adapter with Bull/BullMQ backed by Redis before production. */
@Injectable()
export class NotificationQueueService {
  async enqueue(job: Omit<DeliveryJob, 'attempts'>) {
    // TODO: inject Bull queue and add attempts/backoff/dead-letter settings.
    return { queued: true, job: { ...job, attempts: 0 } };
  }
}
