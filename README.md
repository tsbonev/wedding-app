# Wedding Seating App (Vue 3 + TypeScript + Vite)

This application is a tool for managing wedding guests, groups, and seating charts.

## Development

To start the development server with **Hot Module Replacement (HMR)**, run:

```bash
npm run dev
```

The app will be available at `http://localhost:5173/wedding-app/` (or the port shown in your terminal). Changes to the code will automatically reflect in the browser without requiring a full rebuild or manual refresh.

## Production Build

To build the application for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

## Architecture

- **Framework**: Vue 3 (Composition API)
- **Store**: Pinia (Persisted in LocalStorage)
- **UI Components**: Naive UI
- **Build Tool**: Vite
- **Language**: TypeScript
