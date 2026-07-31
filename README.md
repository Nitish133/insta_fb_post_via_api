# meta-post-app

A small React Native (Expo) Android app that generates an image from a text
prompt and posts it directly to a **test** Facebook Page and its linked
Instagram Business account, using Meta's Graph API. No share sheet, no
handing off to another app — the RN app calls the Graph API itself.

This was built as a test/evaluation exercise. Everything runs against a
throwaway Meta Developer app in **Development Mode**, with a test Facebook
Page and a test Instagram account. No App Review, no Business Verification,
no real business account is involved anywhere.

---

## What's actually in scope here

Per the task brief, image generation is not the interesting part — the
posting mechanism is. So:

- **Image generation**: calls [pollinations.ai](https://pollinations.ai), a
  free, keyless text-to-image endpoint. If that call fails or times out, the
  app falls back to a photo from [Lorem Picsum](https://picsum.photos)
  (openly licensed stock photography, sourced from real photographers under
  terms that permit this kind of use — no brand logos, faces, or NSFW
  content, since these were going onto a live test account).
- **Posting**: the real work. Done via Meta's **Graph API**, directly from
  the RN app, to both a Facebook Page and its linked Instagram Business
  account.

---

## Why WhatsApp isn't included

There is no public API for posting to WhatsApp Status — not even the
official WhatsApp Business API exposes this. The only ways to do it involve
reverse-engineered private endpoints that break WhatsApp's Terms of Service
and can get a number banned. That's not something to build into a real
product, so it's out of scope here. Facebook + Instagram, both officially
supported by the Graph API, are what's implemented.

---

## Architecture

```
App.js                     UI: prompt input, Generate, Post, loading/error states
src/services/imageService.js   Calls pollinations.ai, falls back to Picsum
src/services/metaApi.js        Graph API calls: postToFacebook, postToInstagram, postToBoth
src/config/env.js              Reads FB/IG config from Expo Constants (populated from .env)
app.config.js                  Loads .env and injects it into Constants.expoConfig.extra
.env.example                   Variable names only — copy to .env and fill in real values
```

**Posting flow:**
- **Facebook**: single call — `POST /{page-id}/photos` with `url`, `caption`,
  `access_token`.
- **Instagram**: two-step Graph API flow, because IG doesn't publish in one
  call:
  1. `POST /{ig-business-id}/media` with `image_url` + `caption` → returns a
     `creation_id` (this uploads the image into a container but does not
     publish it yet).
  2. `POST /{ig-business-id}/media_publish` with that `creation_id` →
     actually publishes it.

Both platforms are called in parallel via `Promise.allSettled`, so if one
fails the other's result still comes back — the UI shows a per-platform
✅/❌ status rather than one opaque failure.

**Error handling**: every Graph API error response includes a `message`,
`code`, and sometimes `error_subcode` — the app surfaces these directly
(e.g. "Invalid OAuth access token (code 190)") rather than a generic "something
went wrong," since the specific code is usually what tells you whether it's
an expired token, a missing permission, or a bad image URL.

---

## An important constraint this design accepts

The Graph API's simple photo-publishing endpoints (`/photos`, `/media` with
`image_url`) take a **publicly reachable image URL**, not a local file
upload. That's naturally satisfied here because the generated image already
lives at a public URL (pollinations.ai / picsum.photos serve it directly).
If you wanted to post an image that only exists on-device (e.g. from a
camera roll), you'd need to upload it somewhere public first — a small
backend, S3 bucket, or similar — before handing the URL to Graph API. That's
a deliberate scope cut for this exercise, not an oversight.

---

## Security note (read before you build on this)

The `.env` values get bundled into the app via `app.config.js` /
`Constants.expoConfig.extra`. That means the Page Access Token ships inside
the app bundle. **This is fine for a local test build you run yourself, and
not fine for anything you'd distribute.** A real product would keep tokens
server-side and have the app call your own backend, which then calls Graph
API. Flagging this explicitly rather than quietly shipping it.

---

## Meta setup, step by step

This is the part that's actually fiddly. Do this once, then drop the
resulting IDs/token into `.env`.

### 1. Create a Meta Developer account
Go to [developers.facebook.com](https://developers.facebook.com) and log in
with a Facebook account (use a throwaway one, not a personal/main account).

### 2. Create the app
- **My Apps → Create App**
- Choose the **"Business"** app type
- Give it any name — it stays in **Development Mode** by default, which is
  what we want (no App Review needed at this stage)

### 3. Add products
In the app dashboard, add:
- **Facebook Login** (optional, only needed if you want interactive OAuth in-app rather than manually pulling a token from Graph API Explorer)
- **Instagram Graph API**

### 4. Create a throwaway test Facebook Page
- Go to Facebook directly (not the developer dashboard) → **Create a Page**
- Any name, any category — this is disposable

### 5. Create a test Instagram account and convert it to Business
- Sign up a fresh Instagram account (don't use a personal one)
- In the Instagram app: **Settings → Account type and tools → Switch to
  professional account → Business**
- Then: **Settings → Account → Linked accounts → Facebook** → link it to the
  test Page created in step 4. (IG Business accounts *must* be linked to a
  Facebook Page for the Graph API endpoints used here to work.)

### 6. Add yourself and the test account as Roles on the app
- In the Developer dashboard → **App roles → Roles**
- Add yourself as **Administrator**
- Under **Instagram Graph API → Instagram Testers** (or App Roles →
  Instagram Testers, naming varies by dashboard version), add the test IG
  account's username
- Open Instagram on that test account → **Settings → Apps and websites →
  Tester invites** → accept the invite. This step is what lets a
  Development Mode app touch that IG account without going through App
  Review.

### 7. Generate an access token via Graph API Explorer
- Go to **Tools → Graph API Explorer** in the developer dashboard
- Select your app, select the test user/Page
- Request these permissions:
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_posts`
  - `instagram_basic`
  - `instagram_content_publish`
  - `business_management`
- Generate a **User Access Token** (short-lived, ~1 hour)

### 8. Exchange for a long-lived token, then a Page token
Short-lived tokens expire fast, so exchange it:

```
GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={app-id}
  &client_secret={app-secret}
  &fb_exchange_token={short-lived-user-token}
```

This returns a long-lived user token (~60 days). Then get the **Page**
access token derived from it (Page tokens from a long-lived user token
effectively don't expire as long as the user token stays valid):

```
GET https://graph.facebook.com/v19.0/{page-id}?fields=access_token
  &access_token={long-lived-user-token}
```

Use the returned value as `FB_PAGE_ACCESS_TOKEN`.

### 9. Get the IDs you need
```
GET https://graph.facebook.com/v19.0/me/accounts?access_token={long-lived-user-token}
```
→ gives you `FB_PAGE_ID`.

```
GET https://graph.facebook.com/v19.0/{page-id}?fields=instagram_business_account&access_token={page-access-token}
```
→ gives you `IG_BUSINESS_ACCOUNT_ID`.

### 10. Fill in `.env`
```
FB_PAGE_ID=...
FB_PAGE_ACCESS_TOKEN=...
IG_BUSINESS_ACCOUNT_ID=...
GRAPH_API_VERSION=v19.0
```

---

## Running it

```bash
npm install
cp .env.example .env    # then fill in the values from the steps above
npx expo start
```

Scan the QR code with **Expo Go** on an Android device (or run
`npx expo start --android` with an emulator running). Type a prompt, tap
**Generate**, then **Post to Instagram + Facebook**.

---

## Known limitations / things a production version would need

- Tokens live client-side (see security note above) — needs a backend proxy
  for real distribution.
- No token-refresh flow — long-lived Page tokens are effectively permanent
  in practice, but a production app should handle expiry/re-auth gracefully
  instead of just surfacing a Graph API error.
- Posting requires a publicly reachable image URL; local-only images aren't
  supported without an intermediate upload step.
- WhatsApp Status is intentionally not implemented — no public API exists
  for it.
