import { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID plugin.
 * Attaches a unique request_id to every incoming request.
 * Adds it to the Fastify logger child for structured logging.
 */
export const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', async (request) => {
        const requestId =
            (request.headers['x-request-id'] as string) || uuidv4();

        // Attach to the request object for downstream use
        (request as any).requestId = requestId;

        // Set reply header
        request.raw.headers['x-request-id'] = requestId;
    });

    fastify.addHook('onSend', async (_request, reply) => {
        const requestId = (_request as any).requestId;
        if (requestId) {
            reply.header('x-request-id', requestId);
        }
    });
};
