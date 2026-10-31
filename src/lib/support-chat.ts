import { router } from 'expo-router';

import { getThread, upsertThread } from './chat-store';
import { getSession } from './session';

// buka chat dengan tim Dubidu (dibuat sekali per role, lalu dipakai lagi)
export function openSupportChat() {
  const role = getSession().role;
  const id = `dubidu-cs-${role}`;
  if (!getThread(id)) {
    upsertThread({
      id,
      name: 'Tim Dubidu',
      role: 'Customer Support',
      verified: true,
      online: true,
      owner: role,
      child: '',
      preview: 'Halo! Ada yang bisa kami bantu?',
      time: 'Baru saja',
      unread: 0,
      messages: [
        {
          id: `${id}-1`,
          from: 'them',
          type: 'text',
          text: 'Halo! 👋 Kami tim Dubidu. Ceritakan kendalamu ya, kami balas paling lambat 1x24 jam (biasanya jauh lebih cepat).',
          time: 'Baru saja',
        },
      ],
    });
  }
  router.push({ pathname: '/chat/[id]', params: { id } });
}
