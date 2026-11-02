# Medication reminders

A reminder app for a person who takes medicine. They write down what
they were told to take, at what times of day, and for how long. After
that, the app reminds them at each dose time until the course ends.

A course is one medicine taken on a set pattern, for example "one
tablet at 08:00 and 20:00 for seven days".

## What finished looks like

Anyone can open the app and:

- create an account and confirm their email address
- set a course of medicine with a first day, and a last day or none
- see every dose listed at the hour they will take it, including on the
  days the clocks change
- get a reminder at that hour, with nobody pressing anything
- say whether they took the dose

Finished means it is live on the internet, not just on your laptop.
Someone you have never met can use it from another country.

## The road map

Seven sprints. Each sprint delivers one part of the list above. They
must be done in order, because each one builds on the one before.

| # | Sprint | What it delivers |
|---|---|---|
| 1 | Somebody to remind | People create an account, come back to it, and say where they live |
| 2 | A course with an end | People record a medicine, an amount, the times of day, a first day and a last day or none |
| 3 | The hour on their own clock | Every dose is listed at the local hour, including on the days the clocks change |
| 4 | A reminder you can answer | The app sends a reminder, and the person's answer becomes the record |
| 5 | Work nobody starts | Reminders go out on their own, at each person's local hour, in many countries, never twice |
| 6 | An address that is theirs | Nothing is sent until the person proves the email address is theirs |
| 7 | Somewhere with its own clock | The app is live on the internet, and the server's own clock and time zone never leak into what people see |

## The hard part

"08:00" is not a time until you say where. In places that use daylight
saving time, the clocks move forward one hour in spring and back one
hour in autumn. So one day a year has 23 hours, and one has 25.

Sprint 3 solves this. Suppose an app stores each dose as a fixed moment,
such as "07:00 in UTC". UTC is the world's reference time. In London in
summer, 07:00 UTC is 08:00 on the wall clock. After the clocks go back
in October, the same stored moment shows as 07:00. The dose is now an
hour early, and nobody notices until it happens.

You can check sprint 3 in ten seconds, without waiting for the clocks to
change. Set a course that runs across the day the clocks change where
you live. Open the plan and check that every dose still says 08:00.

## What the app does not do

It does not give medical advice. It repeats what the person wrote down.
It does not check drug interactions, work out doses, or say what to do
about a missed dose.

## Working on it

The sprints, their briefs and their tickets are in Blacksmith
Experience. Start with sprint 1. Each sprint opens when the one before
it is finished.

Read the documents attached to a sprint before you start its first
ticket. They explain the choices you will make and the options you are
choosing between. The sprint 3 document is the longest, because sprint 3
is the hardest.

## What this is built with

The whole product: an API and the screens that use it.

- **Django** with **Django REST Framework** for the API.
- **SimpleJWT** for authentication, against a custom user model in `apps/users`.
- **drf-spectacular** for the OpenAPI schema, served at `/api/schema/` and browsable at `/api/docs/`.
- **React** with **Vite** for the dev server and the build.
- **Chakra UI** for components, and **React Router** for routes.
- **TanStack Query** for every call to the API, so caching and refetching are decided in one place.

## Setting it up

You need the CLI once: `npm install -g blacksmith-cli`.

```bash
blacksmith setup     # dependencies, database, migrations
blacksmith dev       # start it
```

The API answers on `http://localhost:8000`, and the app on `http://localhost:5173`.

Copy `backend/.env.example` to `backend/.env` before the first run. It is ignored by git and holds the secret key, the database URL and anything else this project should not carry in its history.

## Where the code lives

```
backend/
├── config/
│   ├── settings/        # base, development, production
│   └── urls.py          # where routes are mounted
├── apps/
│   └── users/           # the custom user model, and auth
├── utils/               # shared helpers, base model
├── manage.py
└── requirements.txt

frontend/
└── src/
    ├── api/
    │   ├── generated/   # written by `blacksmith sync` — do not edit
    │   └── hooks/       # your queries and mutations
    ├── pages/           # one folder per page
    ├── features/        # auth, and anything else that spans pages
    ├── router/          # routes and layouts
    ├── shared/          # components and hooks used across pages
    └── styles/
```

## Day to day

| Command | What it does |
| --- | --- |
| `blacksmith dev` | Run it locally. |
| `blacksmith sync` | Regenerate the frontend API types and hooks from the backend schema. Run it after changing a serializer or a route. |
| `blacksmith make:resource Post` | Scaffold a model, serializer, viewset and routes, plus the hooks and pages that use them. |
| `blacksmith backend <command>` | Run a Django management command, e.g. `blacksmith backend createsuperuser`. |
| `blacksmith frontend <command>` | Run an npm command in the frontend, e.g. `blacksmith frontend install axios`. |
| `blacksmith eject` | Remove Blacksmith and keep a plain Django and React project. Nothing here is a dependency on us. |
