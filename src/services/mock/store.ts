import { dashboardDonors, dashboardCampaigns, dashboardDonations } from '../../data/dashboard';
import { contentDefaults } from '../../data/content';
import type { FundraisingState } from '../fundraising-types';
import type { ContentDocument, ContentSection } from '../content-types';
import type { PartnerLogo } from '../partners-types';
import { ServiceError } from '../types';
export type LocalState = { version: 1; fundraising: FundraisingState; content: Record<ContentSection, ContentDocument>; uploads: PartnerLogo[] };
export function seedLocalState(): LocalState {
  const dates = { revision: 1, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' };
  return { version: 1, fundraising: {
    donors: dashboardDonors.map(donor => ({ ...dates, ...donor, kind: 'donors', archived: false, email: '', phone: '', organization: '' })),
    campaigns: dashboardCampaigns.map(campaign => ({ ...dates, id: campaign.id, kind: 'campaigns', name: campaign.name, target_amount: campaign.targetAmount, description: '', starts_on: '', ends_on: '', status: 'active', archived: false })),
    donations: dashboardDonations.map(gift => ({ ...dates, id: gift.id, kind: 'donations', donor_id: gift.donorId ?? '', campaign_id: gift.campaignId ?? '', amount: gift.amount, status: gift.status, archived: gift.archived, received_at: gift.status === 'received' ? `${gift.receivedAt}T12:00:00.000Z` : '', expected_at: gift.status === 'pending' ? `${gift.receivedAt}T12:00:00.000Z` : '', note: '' })),
  }, content: Object.fromEntries(Object.entries(contentDefaults).map(([key, content]) => [key, { content: structuredClone(content), revision: 1 }])) as unknown as LocalState['content'], uploads: [] };
}
let memory: LocalState | undefined;
// Explicit test adapter; never a silent fallback when browser persistence fails.
export function useMemoryStoreForTests(state = seedLocalState()) { if (typeof window !== 'undefined') throw new Error('Test adapter is not available in the browser.'); memory = structuredClone(state); }
let connection: Promise<IDBDatabase> | undefined;
function database() {
  if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new ServiceError('Local storage is unavailable in this browser.', 'STORAGE_UNAVAILABLE', 400)); return; }
    const request = indexedDB.open('kindsight-react-demo-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); connection = undefined; }; resolve(db); };
    request.onerror = () => reject(new ServiceError('Could not open local demo storage. Please retry.', 'STORAGE_UNAVAILABLE', 400));
    request.onblocked = () => reject(new ServiceError('Close older Kindsight tabs and retry local storage.', 'STORAGE_BLOCKED', 400));
  }).catch(error => { connection = undefined; throw error; });
  return connection;
}
export async function transact<T>(work: (state: LocalState) => T, write = false): Promise<T> {
  if (memory) { const next = structuredClone(memory), result = work(next); if (write) memory = next; return structuredClone(result); }
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction('state', write ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('state'), request = store.get('current');
    let result: T, failure: unknown;
    request.onsuccess = () => {
      try {
        const state: LocalState = request.result ?? seedLocalState();
        if (state.version !== 1) throw new ServiceError('Unsupported local data version.', 'STORAGE_VERSION', 400);
        result = work(state); if (write) store.put(state, 'current');
      } catch (error) { failure = error; transaction.abort(); }
    };
    transaction.oncomplete = () => resolve(structuredClone(result));
    transaction.onabort = transaction.onerror = () => reject(failure ?? new ServiceError('Local changes could not be saved. Check browser storage and retry; your draft is preserved.', 'STORAGE_WRITE_FAILED', 400));
  });
}
export const localClientId = typeof crypto !== 'undefined' ? crypto.randomUUID() : 'test';
export function notifyLocalChange() { if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('kindsight-local-data'); channel.postMessage({type:'changed',clientId:localClientId}); channel.close(); } }
