import type { Folder, Workspace } from '@yaakapp-internal/models';
import { useMemo } from 'react';
import { trackEvent } from '../lib/analytics';
import { router } from '../lib/router';
import { invokeCmd } from '../lib/tauri';
import { getActiveWorkspaceId } from './useActiveWorkspace';
import { createFastMutation } from './useFastMutation';
import { usePrompt } from './usePrompt';

function makeCommands({ prompt }: { prompt: ReturnType<typeof usePrompt> }) {
  return {
    createWorkspace: createFastMutation<Workspace, void, Partial<Workspace>>({
      mutationKey: ['create_workspace'],
      mutationFn: (patch) => invokeCmd<Workspace>('cmd_update_workspace', { workspace: patch }),
      onSuccess: async (workspace) => {
        await router.navigate({
          to: '/workspaces/$workspaceId',
          params: { workspaceId: workspace.id },
        });
      },
      onSettled: () => trackEvent('workspace', 'create'),
    }),

    createFolder: createFastMutation<
      Folder | null,
      void,
      Partial<Pick<Folder, 'name' | 'sortPriority' | 'folderId'>>
    >({
      mutationKey: ['create_folder'],
      mutationFn: async (patch) => {
        const workspaceId = getActiveWorkspaceId();
        if (workspaceId == null) {
          throw new Error("Cannot create folder when there's no active workspace");
        }

        if (!patch.name) {
          const name = await prompt({
            id: 'new-folder',
            label: 'Name',
            defaultValue: 'Folder',
            title: 'New Folder',
            confirmText: 'Create',
            placeholder: 'Name',
          });
          if (name == null) return null;

          patch.name = name;
        }

        patch.sortPriority = patch.sortPriority || -Date.now();
        return invokeCmd<Folder>('cmd_update_folder', { folder: { workspaceId, ...patch } });
      },
      onSettled: () => trackEvent('folder', 'create'),
    }),
  } as const;
}

export function useCommands() {
  const prompt = usePrompt();
  return useMemo(() => makeCommands({ prompt }), [prompt]);
}