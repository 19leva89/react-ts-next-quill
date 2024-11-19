Authentication and User Management:
- Kinde (authentication)

Core Technologies:
- React 18
- TypeScript
- Next 15 (framework)

Data Fetching and State Management:
- Prisma 5 (ORM for DB)

Form and Validation:
- React Hook Form (working with forms)
- Zod (first schema validation)

Middleware and Server Utilities:
- Concurrently (all projects are running in tandem)
- tRPC (end-to-end typesafe APIs)

Payment:
- Stripe (payment service provider)

Styling and UI Frameworks:
- Lucide React (stylization)
- shadcn/ui (stylization)
- Tailwind CSS (stylization)
- Tailwind CSS Animate
- Tailwind CSS Typography

Utilities and Libraries:
- PostCSS (transforms CSS code to AST)

To run the client and server via concurrently:
terminal powershell -> npm run all

terminal powershell -> npx prisma generate
terminal powershell -> npx prisma db push
terminal powershell -> npx prisma migrate reset

terminal powershell -> npx prisma db seed (loading test database)

terminal CommandPrompt -> stripe login
terminal CommandPrompt -> stripe listen --forward-to localhost:3000/api/webhook