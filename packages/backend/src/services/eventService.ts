import { EventModel } from '../models/Event';

export class EventService {
    /**
     * Get event by ID or slug
     */
    static async getFullDetails(idOrSlug: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        let event = null;

        if (isUuid) {
            event = await EventModel.findById(idOrSlug);
        }

        if (!event) {
            event = await EventModel.findBySlug(idOrSlug);
        }

        return event;
    }
}
