import { auth } from '../cloudContext';

const REDIRECT_KEY = 'cnb_oauth_redirect_uri';
const STATE_KEY = 'cnb_oauth_state';

/** 与云开发控制台「登录方式」中配置的微信身份源一致，未设置时默认 wx_open（微信开放平台网站应用） */
export function getWechatProviderId() {
  return import.meta.env.VITE_CNB_AUTH_PROVIDER_ID || 'wx_open';
}

function buildOAuthRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * 跳转微信授权页（当前 @cloudbase/js-sdk 已无 toDefaultLoginPage，需走 OAuth 跳转）
 */
export async function startWechatWebLogin() {
  const redirectUri = buildOAuthRedirectUri();
  const state =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(REDIRECT_KEY, redirectUri);
  sessionStorage.setItem(STATE_KEY, state);

  const { uri } = await auth.genProviderRedirectUri({
    provider_id: getWechatProviderId(),
    redirect_uri: redirectUri,
    provider_redirect_uri: redirectUri,
    state,
  });
  if (!uri) {
    throw new Error('未获取到授权地址');
  }
  window.location.assign(uri);
}

/**
 * 从 URL 查询参数处理 OAuth 回调：?code= &state=
 * @returns {Promise<boolean>} 是否完成了授权登录流程
 */
export async function tryCompleteWechatOAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('error');
  if (oauthError) {
    const clean =
      window.location.origin + window.location.pathname + (window.location.hash || '');
    window.history.replaceState(null, '', clean);
    throw new Error(params.get('error_description') || oauthError);
  }

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) {
    return false;
  }

  const expectState = sessionStorage.getItem(STATE_KEY);
  const redirectUri = sessionStorage.getItem(REDIRECT_KEY);
  if (!expectState || !redirectUri || state !== expectState) {
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    const clean =
      window.location.origin + window.location.pathname + (window.location.hash || '');
    window.history.replaceState(null, '', clean);
    return false;
  }

  const { provider_token: providerToken } = await auth.grantProviderToken({
    provider_id: getWechatProviderId(),
    provider_code: code,
    provider_redirect_uri: redirectUri,
  });

  if (!providerToken) {
    throw new Error('授权未返回有效凭证');
  }

  await auth.signInWithProvider({ provider_token: providerToken });
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);

  const clean = window.location.origin + window.location.pathname + (window.location.hash || '');
  window.history.replaceState(null, '', clean);
  return true;
}
