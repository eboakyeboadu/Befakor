# Befakor

This project is a demo marketplace app with Firebase-backed auth, storage, and Firestore. It is intended for learning, internal testing, or a private demo environment only.

## Security notice

This repository originally included Firebase client configuration values in a committed config file. Before making the app public, confirm the Firebase project is a dedicated demo project and that the web API key is not tied to a production environment.

The app uses Firebase client configuration and therefore should not be treated as a no-auth public app. A production-safe public release requires:

- a dedicated Firebase project
- Firebase Security Rules that restrict access
- no real user data or listings in the database
- no secrets in committed files
- a clean review of all env and config files in Git history

## Run locally

```bash
npm install
npm run dev
```

## Important

- Do not commit real user data or uploaded photos.
- Restrict Firestore and Storage access to signed-in users only.
- Keep all Firebase rules private and reviewed before any public access.
- If you intend to share this repo publicly, remove all project-specific Firebase configuration and replace it with placeholders.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
