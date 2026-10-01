# Job Tracker Client

React and Apollo Client frontend for the GraphQL Job Tracker API.

## Run locally

Start the API from the repository root:

```bash
npm run db:up
npm run db:deploy
npm run db:seed:demo
npm run dev
```

Then start this client in another terminal:

```bash
npm run dev:client
```

Open <http://localhost:5173>. The Vite development server proxies `/graphql`
to the API at <http://localhost:4000/graphql>.

The local seeded login is `demo@example.com` with password
`portfolio-demo-password`. Production builds do not prefill or display these
credentials, and production deployment never runs the demo seed.

Use **Create an account** on the authentication screen to register a regular
user. Successful registration stores the returned access token and opens the
authenticated workspace immediately. Registration also requires Cloudflare
Turnstile; copy `.env.example` to `.env.local` to use Cloudflare's published
development test site key locally.

For a production build, set `VITE_GRAPHQL_URL` to the deployed API's full
`/graphql` URL and `VITE_TURNSTILE_SITE_KEY` to the public key for a real
Turnstile widget before running `npm run build`. Its matching secret belongs
only on the API and must never use the `VITE_` prefix.
