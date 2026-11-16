export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// Classifica o retorno sem repassar mensagens, metadados ou trechos privados.
export function providerError(config, httpStatus, data = {}) {
  const label = config.provider === 'openrouter' ? 'OpenRouter' : 'OpenAI';
  const error = data?.error || {};
  const kind = data?.error_type || error.metadata?.error_type || error.type || error.code;
  const raw = typeof error.message === 'string' ? error.message : '';
  const source = error.metadata?.limit_source;
  const code = kind === 'authentication' || kind === 'invalid_api_key' ? 401
    : ['permission_denied', 'content_policy_violation', 'refusal'].includes(kind) ? 403
    : kind === 'payment_required' ? 402 : kind === 'rate_limit_exceeded' ? 429
    : kind === 'not_found' ? 404 : Number.isInteger(error.code) ? error.code : httpStatus;
  const prefix = `${label} (${httpStatus === 200 ? 'erro durante a resposta' : 'HTTP ' + httpStatus}): `;
  let hint;
  if (code === 401) {
    hint = config.provider === 'openrouter'
      ? 'credencial recusada. Recole a chave da sua conta OpenRouter no campo de API; não use o token do serviço local. Confira se ela está ativa e não expirou.'
      : 'credencial recusada. Confira a chave da conta OpenAI e o provedor selecionado nas opções.';
  } else if (code === 403 && ['openrouter_guardrail_budget', 'openrouter_workspace_budget', 'openrouter_key_limit'].includes(source)) {
    hint = 'o limite de uso da chave ou do workspace foi atingido. Confira os limites da conta no OpenRouter.';
  } else if (code === 403 && (['content_policy_violation', 'refusal'].includes(kind) || /moderation|content.?policy|prompt injection|guardrail|safety/i.test(raw))) {
    hint = 'a solicitação foi recusada por uma política de conteúdo ou regra do provedor. Isso não confirma uma chave inválida.';
  } else if (code === 403) {
    hint = 'acesso bloqueado. Confira permissões da chave, limites da conta, acesso ao modelo e políticas do provedor. Isso não confirma uma chave inválida.';
  } else if (code === 402 && source === 'openrouter_in_flight_budget') {
    hint = 'o orçamento temporário está ocupado por outras solicitações. Aguarde o término delas antes de tentar novamente.';
  } else if (code === 402) {
    hint = 'Saldo insuficiente ou limite da chave atingido. Confira os créditos e limites no provedor de IA.';
  } else if (code === 429) hint = 'Limite ou saldo da API de IA atingido. Aguarde antes de tentar novamente.';
  else if (code === 404) hint = 'modelo ou recurso não encontrado. Confira o ID exato do modelo nas opções.';
  else hint = 'a solicitação não foi concluída. Confira o modelo e o esforço nas opções ou tente mais tarde.';
  return new AppError(prefix + hint, [402, 429].includes(code) ? code : 502);
}
