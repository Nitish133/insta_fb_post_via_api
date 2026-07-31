# 📸 Meta Post App

> **A React Native (Expo) application that generates AI images from text prompts and automatically publishes them to Facebook Pages and Instagram Business accounts using Meta's Graph API.**

---

## 🌟 Overview

**meta-post-app** is a mobile application built with React Native and Expo. It demonstrates direct integration with **Meta's Graph API** to publish media to Facebook and Instagram without using native device share sheets or external app handoffs.

- **🎨 Image Generation**: Generates images using [Pollinations.ai](https://pollinations.ai) from user text prompts, with automatic fallback to [Lorem Picsum](https://picsum.photos) stock photography if generation fails or times out.
- **🚀 Meta Publishing**: Posts generated images and captions to both a **Facebook Page** and a linked **Instagram Business Account** in parallel via Meta's Graph API.

---

## 🚀 Features

- **Prompt-to-Image Pipeline**: Instant text-to-image preview in app.
- **Robust Fallback Strategy**: Fallback mechanism ensuring high availability for testing.
- **Direct Graph API Integration**: Executes direct REST calls to Meta's endpoints.
- **Parallel Platform Dispatch**: Publishes to Facebook and Instagram concurrently using `Promise.allSettled`.
- **Detailed Error Handling**: Surfaces granular Meta API error codes (`message`, `code`, `error_subcode`) directly to the user interface.
- **Per-Platform Feedback**: Live status updates showing per-platform success (✅) or failure (❌) details.

---

## 🏗️ Architecture & Project Structure

```
meta-post-app/
├── App.js                      # Main UI component (inputs, preview, post triggers, status UI)
├── app.config.js               # Expo config extending extra properties with .env values
├── babel.config.js             # Babel preset configuration
├── package.json                # React Native & Expo dependencies
├── .env.example                # Template for required Meta API environment variables
└── src/
    ├── config/
    │   └── env.js              # Environment variable validation & loader
    └── services/
        ├── imageService.js     # Image generation & fallback service
        └── metaApi.js          # Meta Graph API integration (FB & IG API calls)
```

### 🔄 Posting Flow

```
[User Input Prompt] ──► [Image Generation Service] ──► [Image URL Generated]
                                                              │
                                     ┌────────────────────────┴────────────────────────┐
                                     ▼                                                 ▼
                          [Facebook Graph API]                               [Instagram Graph API]
                      POST /{page-id}/photos                             1. POST /{ig-id}/media (Container)
                      (Single-step publish)                              2. POST /{ig-id}/media_publish
                                     │                                                 │
                                     └────────────────────────┬────────────────────────┘
                                                              ▼
                                               [Parallel Promise.allSettled]
                                                              │
                                                              ▼
                                                   [UI Results Feedback]
```

1. **Facebook Posting**: Single API call to `POST /{page-id}/photos` passing `url`, `caption`, and `access_token`.
2. **Instagram Posting**: Two-step Graph API container workflow:
   - **Step 1**: Create a media container via `POST /{ig-business-id}/media` with `image_url` and `caption` to obtain a `creation_id`.
   - **Step 2**: Publish the container via `POST /{ig-business-id}/media_publish` using the `creation_id`.

---

## 🔒 Supported Platforms & API Scope

| Platform | Supported | Method | Notes |
|---|---|---|---|
| **Facebook Page** | ✅ Yes | Meta Graph API (`/{page-id}/photos`) | Requires `pages_manage_posts` permission. |
| **Instagram Business** | ✅ Yes | Meta Graph API 2-Step Container Flow | Requires linked FB Page & `instagram_content_publish` permission. |
| **WhatsApp Status** | ❌ No | N/A | No public API exists for WhatsApp Status. Third-party workarounds violate WhatsApp ToS. |

---

## 🔑 Meta Setup Guide (Step-by-Step)

To test the application in **Development Mode** without App Review:

### 1. Developer Account & App Creation
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps** ➔ **Create App**.
3. Select the **Business** app type and set up the app. Keep it in **Development Mode**.

### 2. Configure Products & Roles
1. Add **Instagram Graph API** to your app products.
2. Under **App Roles ➔ Roles**, add your Facebook account as an Administrator.
3. Under **Instagram Graph API ➔ Instagram Testers**, add your test Instagram account's username.
4. Open the Instagram app on your test account ➔ **Settings ➔ Apps and Websites ➔ Tester Invites** ➔ Accept the invite.

### 3. Link Instagram Business Account to Facebook Page
1. Create a throwaway Facebook Page.
2. Convert your test Instagram account to a **Professional/Business Account** in Instagram settings.
3. Link the Instagram account to the Facebook Page created above (**Settings ➔ Account ➔ Linked Accounts ➔ Facebook**).

### 4. Obtain Access Tokens & Identifiers
1. Open the [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your app and request the following permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
3. Generate a **Short-Lived User Access Token**.
4. Exchange for a **Long-Lived User Token** (~60 days):
   ```http
   GET https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-user-token}
   ```
5. Obtain the **Permanent Page Access Token**:
   ```http
   GET https://graph.facebook.com/v19.0/{page-id}?fields=access_token&access_token={long-lived-user-token}
   ```
6. Fetch required IDs:
   - **Page ID**: `GET https://graph.facebook.com/v19.0/me/accounts?access_token={long-lived-user-token}`
   - **Instagram Business ID**: `GET https://graph.facebook.com/v19.0/{page-id}?fields=instagram_business_account&access_token={page-access-token}`

---

## 🛠️ Installation & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go](https://expo.dev/client) app installed on a mobile device, or an Android Emulator / iOS Simulator.

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Nitish133/insta_fb_post_via_api.git
   cd insta_fb_post_via_api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Meta API credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   FB_PAGE_ID=your_facebook_page_id
   FB_PAGE_ACCESS_TOKEN=your_facebook_page_access_token
   IG_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
   GRAPH_API_VERSION=v19.0
   ```

4. **Start the Expo Development Server**:
   ```bash
   npx expo start
   ```
   - Scan the QR code using **Expo Go** on Android/iOS.
   - Or run `npm run android` to launch on an attached Android device/emulator.

---

## ⚠️ Important Considerations & Security Notes

- **Client-Side Tokens**: In this test application, access tokens are exposed inside the Expo bundle via `app.config.js`. This is suitable for local testing only. **For production apps**, token management and Meta API requests must be handled via a secure backend proxy server.
- **Image URL Accessibility**: Meta's Graph API requires publicly accessible image URLs. Local file paths (e.g., `file://...`) must be uploaded to an intermediate cloud storage provider (e.g., AWS S3) before passing to Graph API.
