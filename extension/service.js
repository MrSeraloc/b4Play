import {summaryPath} from './core.js';

export function serviceAccess() {
  const origins = chrome.runtime.getManifest().optional_host_permissions;
  return origins?.length ? {origins} : null;
}

export async function authorizeSummaries() {
  const access = serviceAccess();
  if (!access) throw new Error('serviceUnavailable');
  if (!await chrome.permissions.request(access)) throw new Error('permission');
  return chrome.runtime.sendMessage({type: 'AUTHORIZE_SUMMARIES'});
}

const serviceErrors = new Set(['transcript', 'parameters', 'rate', 'outputLimit', 'reasoningOnly', 'refused', 'incomplete', 'network']);

export async function requestSummary(input, signal) {
  const access = serviceAccess();
  if (!access) throw new Error('serviceUnavailable');
  const endpoint = new URL(summaryPath, access.origins[0]);
  let result;
  try {
    result = await fetch(endpoint.href, {
      method: 'POST', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(input),
      signal: AbortSignal.any([signal, AbortSignal.timeout(95000)])
    });
  } catch {
    throw new Error('network');
  }
  const data = await result.json().catch(() => null);
  if (result.ok && typeof data?.summary === 'string' && data.summary.trim()) return data.summary;
  throw new Error(serviceErrors.has(data?.error) ? data.error : 'serviceUnavailable');
}
