import { ENV } from '../config/env';

const BASE = `https://graph.facebook.com/${ENV.GRAPH_API_VERSION}`;

function assertConfigured() {
  const missing = [];
  if (!ENV.FB_PAGE_ID) missing.push('FB_PAGE_ID');
  if (!ENV.FB_Access_page_token) missing.push('FB_Access_page_token');
  if (!ENV.IG_PAGE_ACCESS_TOKEN) missing.push('IG_PAGE_ACCESS_TOKEN');
  if (!ENV.IG_BUSINESS_ACCOUNT_ID) missing.push('IG_BUSINESS_ACCOUNT_ID');
  if (missing.length) {
    throw new Error(
      `App is not configured: missing ${missing.join(', ')}.`
    );
  }
}

async function graphPost(path, params) {
  const url = `${BASE}/${path}`;
  const body = new URLSearchParams(params).toString();

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (networkErr) {
    throw new Error(`Network error calling Graph API: ${networkErr.message}`);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Graph API returned a non-JSON response (HTTP ${res.status}).`);
  }

  if (!res.ok || json.error) {
    const msg = json?.error?.message || `Graph API request failed with HTTP ${res.status}`;
    const code = json?.error?.code;
    const subcode = json?.error?.error_subcode;
    const suffix = code ? ` (code ${code}${subcode ? `/${subcode}` : ''})` : '';
    throw new Error(`${msg}${suffix}`);
  }

  return json;
}

/**
 * Posts a photo to the configured Facebook Page's feed.
 * Requires: pages_manage_posts, pages_read_engagement (Page access token).
 */
export async function postToFacebook(imageUrl, caption) {
  assertConfigured();
  const json = await graphPost(`${ENV.FB_PAGE_ID}/photos`, {
    url: imageUrl,
    caption: caption || '',
    access_token: ENV.FB_Access_page_token,
  });
  return { platform: 'facebook', postId: json.post_id || json.id };
}

/**
 * Posts a photo to the Instagram Business account linked to the Page.
 * This is a two-step Graph API flow:
 *   1. Create a media container (uploads the image by URL, doesn't publish yet)
 *   2. Publish that container
 * Requires: instagram_basic, instagram_content_publish (Page access token,
 * since IG Graph API calls are made against the linked Page's token).
 */
export async function postToInstagram(imageUrl, caption) {
  assertConfigured();

  const container = await graphPost(`${ENV.IG_BUSINESS_ACCOUNT_ID}/media`, {
    image_url: imageUrl,
    caption: caption || '',
    access_token: ENV.IG_PAGE_ACCESS_TOKEN,
  });

  if (!container.id) {
    throw new Error('Instagram did not return a media container id.');
  }

  const published = await graphPost(`${ENV.IG_BUSINESS_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
    access_token: ENV.IG_PAGE_ACCESS_TOKEN,
  });

  return { platform: 'instagram', postId: published.id };
}

/**
 * Fires both posts independently so one platform failing doesn't hide the
 * other's result. Caller gets a per-platform ok/error breakdown.
 */
export async function postToBoth(imageUrl, caption) {
  const settled = await Promise.allSettled([
    postToFacebook(imageUrl, caption),
    postToInstagram(imageUrl, caption),
  ]);

  return settled.map((result, i) => {
    const platform = i === 0 ? 'facebook' : 'instagram';
    if (result.status === 'fulfilled') {
      return { platform, ok: true, ...result.value };
    }
    return { platform, ok: false, error: result.reason.message };
  });
}
