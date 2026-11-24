import {normalizeSummaryLength, summaryPath} from '../extension/core.js';
import {summarize} from './openrouter.js';

const fields = ['title', 'transcript', 'summaryLocale', 'summaryLength'];
const maxBodyBytes = 750000;
const publicErrors = new Set(['transcript', 'parameters', 'rate', 'outputLimit', 'reasoningOnly', 'refused', 'incomplete', 'network']);
const json = (data, status = 200) => Response.json(data, {status, headers: {'Cache-Control': 'no-store'}});

async function* summaryBody(result) {
  const encoder = new TextEncoder();
  // Send response headers immediately, before the browser's extension-worker fetch deadline.
  yield encoder.encode('\n');
  yield encoder.encode(JSON.stringify(await result));
}

async function readInput(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const decoder = new TextDecoder('utf-8', {fatal: true});
  let length = 0;
  let body = '';
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBodyBytes) throw new Error('tooLarge');
      body += decoder.decode(value, {stream: true});
    }
    return JSON.parse(body + decoder.decode());
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error.message === 'tooLarge') throw error;
    throw new Error('invalid');
  } finally {
    reader.releaseLock();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Older extensions name a different downstream provider in their consent notice.
    if (['/summary', '/v2/summary'].includes(url.pathname)) return json({error: 'updateRequired'}, 410);
    if (url.pathname !== summaryPath || url.search) return json({error: 'invalid'}, 404);
    if (request.method !== 'POST') return json({error: 'invalid'}, 405);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json({error: 'invalid'}, 415);
    if (Number(request.headers.get('content-length')) > maxBodyBytes) return json({error: 'tooLarge'}, 413);
    if (!env.OPENROUTER_API_KEY || !env.OPENROUTER_MODEL || !env.RATE_LIMIT || !env.SERVICE_LIMIT) return json({error: 'serviceUnavailable'}, 503);
    try {
      const client = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!(await env.RATE_LIMIT.limit({key: client})).success) return json({error: 'rate'}, 429);
      const input = await readInput(request);
      if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some(field => !fields.includes(field)) ||
          typeof input.title !== 'string' || input.title.length > 500 || typeof input.transcript !== 'string' ||
          input.transcript.length > 120000 || typeof input.summaryLocale !== 'string' || input.summaryLocale.length > 64) {
        return json({error: 'invalid'}, 400);
      }
      const summaryLength = normalizeSummaryLength(input.summaryLength);
      if (!(await env.SERVICE_LIMIT.limit({key: 'summary'})).success) return json({error: 'rate'}, 429);
      const result = summarize({summaryLocale: input.summaryLocale, summaryLength,
        key: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL, signal: request.signal}, input.title, input.transcript).then(
        summary => ({summary}),
        error => ({error: publicErrors.has(error.message) ? error.message : 'serviceUnavailable'})
      );
      return new Response(ReadableStream.from(summaryBody(result)), {headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'identity',
        'Cache-Control': 'no-store, no-transform'
      }});
    } catch (error) {
      if (error.message === 'tooLarge') return json({error: 'tooLarge'}, 413);
      if (error.message === 'invalid') return json({error: 'invalid'}, 400);
      if (error.message === 'summaryLengthConfig') return json({error: 'summaryLengthConfig'}, 400);
      return json({error: 'serviceUnavailable'}, 503);
    }
  }
};
