# Warning: I am not responsible for any user-uploaded files to Telegram as this project is intended for personal use.

## Setup your Telegram Bot
Fork this repository and go to [NuxtHub](https://hub.nuxt.com) and create a new project, import this repository and add the following environment variables:

```bash
NUXT_TELEGRAM_BOT_TOKEN=TOKEN FROM @BotFather (Encrypted value)
NUXT_WEBHOOK_SECRET=RANDOM STRING (Encrypted value)
NUXT_ID_SALT=RANDOM STRING (Encrypted value)
NUXT_PUBLIC_BASE_URL=CLOUDFLARE PAGES URL | CUSTOM DOMAIN
NUXT_PUBLIC_SUPPORT_LINK= (optional) LINK TO SUPPORT GROUP
NUXT_PUBLIC_SHOW_INFO_BOT= (optional) SHOW INFO BOT
NUXT_HUB_PROJECT_KEY=NUXT HUB PROJECT KEY (Automatically generated)
```

Follow this tutorial to setup your Telegram Bot and get your Bot Token: [https://core.telegram.org/bots/tutorial](https://core.telegram.org/bots/tutorial)

After deploying the project, you can add the webhook to your Bot by using the following link: [https://yourproject.pages.dev/w3bhook/set-webhook](https://yourproject.pages.dev/w3bhook/set-webhook)

If successful, you will see a message like this: 
```JSON
{
  "ok": true,
  "webhook": "https://yourproject.pages.dev/w3bhook",
  "info": {
    "url": "https://yourproject.pages.dev/w3bhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40,
    "ip_address": "xxx.xxx.xxx.xxx",
    "allowed_updates": [
      "message",
      "callback_query"
    ]
  }
}
```

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/tvd1981/send2ko.git
cd send2ko
pnpm install
```

Copy .env.example to .env and replace the values with your own

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

## Deploy


Deploy the application on the Edge with [NuxtHub](https://hub.nuxt.com) on your Cloudflare account:

```bash
npx nuxthub deploy
```

Then checkout your server logs, analaytics and more in the [NuxtHub Admin](https://admin.hub.nuxt.com).

You can also deploy using [Cloudflare Pages CI](https://hub.nuxt.com/docs/getting-started/deploy#cloudflare-pages-ci).

