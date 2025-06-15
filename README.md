# svelte-OnlineTTT

A multi-player online TTT game built with Sveltekit and Cloudflare.
I originally created it using Google App Script and Firestore in 2020.

A Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).


## Developing

Start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, we use 

We use Cloudflare and wrangler for deployment.
It was installed with
`npm install @cloudflare/workers-types wrangler`

