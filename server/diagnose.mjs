import { AppError, providerError } from './errors.mjs';

// Apenas consultas GET: não gera texto, não envia a transcrição, não salva alterações.
export async function diagnoseProvider(config, fetchImpl = fetch) {
  if (!config.apiKey) throw new AppError('Informe a chave de API do provedor antes de verificar.');
  const signal = AbortSignal.timeout(12000);
  const base = config.baseUrl.replace(/\/$/, '');
  async function get(path) {
    let response;
    try { response = await fetchImpl(base + path, { method: 'GET', headers: { Authorization: `Bearer ${config.apiKey}` }, signal }); }
    catch { throw new AppError('Não foi possível concluir a verificação no provedor. Confira a conexão e tente novamente.', 502); }
    let data;
    try { data = await response.json(); } catch {
      if (!response.ok) throw providerError(config, response.status);
      throw new AppError('O provedor retornou uma resposta inválida na verificação.', 502);
    }
    if (!response.ok || data?.error) throw providerError(config, response.status, data);
    if (!data || typeof data !== 'object') throw new AppError('O provedor retornou uma resposta inválida na verificação.', 502);
    return data;
  }
  if (config.provider === 'openrouter') {
    const info = await get('/key');
    if (!info?.data || typeof info.data !== 'object') throw new AppError('O OpenRouter não confirmou a credencial.', 502);
    if ((typeof info.data.limit_remaining === 'number' && info.data.limit_remaining <= 0) || (typeof info.data.effective_budget?.remaining_usd === 'number' && info.data.effective_budget.remaining_usd <= 0)) {
      throw new AppError('OpenRouter: a chave foi aceita, mas um limite de uso informado está esgotado. Confira os limites da chave ou do workspace.', 402);
    }
    const catalog = await get('/models');
    if (!Array.isArray(catalog?.data)) throw new AppError('A chave foi aceita, mas não foi possível conferir o catálogo de modelos.', 502);
    const modelListed = catalog.data.some(model => model.id === config.model);
    return { ok: true, provider: config.provider, modelListed, message: modelListed
      ? 'OpenRouter: chave aceita e ID encontrado no catálogo. A inferência ainda depende das permissões, do saldo e das políticas do provedor. Nenhum resumo foi gerado.'
      : 'OpenRouter: chave aceita, mas o ID não foi encontrado no catálogo público. Confira o ID ou alias escolhido. Nenhum resumo foi gerado.' };
  }
  const model = await get('/models/' + encodeURIComponent(config.model));
  if (typeof model.id !== 'string' || !model.id) throw new AppError('A consulta não confirmou o modelo na OpenAI.', 502);
  return { ok: true, provider: 'openai', modelListed: true, message: 'OpenAI: chave aceita e modelo consultado com sucesso. Isso não garante saldo ou permissão para gerar texto. Nenhum resumo foi gerado.' };
}
