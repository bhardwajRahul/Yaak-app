import { duplicateWebsocketRequest as cmdDuplicateWebsocketRequest } from '@yaakapp-internal/ws';
import { createFastMutation } from '../hooks/useFastMutation';
import { router } from '../lib/router';

export const duplicateWebsocketRequest = createFastMutation({
  mutationKey: ['delete_websocket_connection'],
  mutationFn: async function (requestId: string) {
    return cmdDuplicateWebsocketRequest(requestId);
  },
  onSuccess: async (request) => {
    await router.navigate({
      to: '/workspaces/$workspaceId',
      params: { workspaceId: request.workspaceId },
      search: (prev) => ({ ...prev, request_id: request.id }),
    });
  },
});
