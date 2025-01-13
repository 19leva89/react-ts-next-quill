AI (Artificial Intelligence) tools:
- AI (message generation)
- LangChain (AI framework)
- OpenAI (creating AI models)
- Pinecone (vector database)

Authentication and User Management:
- Kinde (authentication)

Content Management:
- React PDF (reading PDF files)

Core Technologies:
- React 18
- TypeScript
- Next 15 (framework)

Data Fetching and State Management:
- Prisma 5 (ORM for DB)

Form and Validation:
- React Hook Form (working with forms)
- React Textarea Autosize (working with textareas)
- Zod (first schema validation)

Image Handling and Optimization:
- React Dropzone (drag and drop)

Middleware and Server Utilities:
- Concurrently (all projects are running in tandem)
- tRPC (end-to-end typesafe APIs)
- UploadThing (uploading files)

Payment:
- Stripe (payment service provider)

Styling and UI Frameworks:
- Lucide React (stylization)
- React Loading Skeleton (stylization)
- SimpleBar React (stylization)
- shadcn/ui (stylization)
- Tailwind CSS (stylization)
- Tailwind CSS Animate
- Tailwind CSS Typography

Text Editing:
- React Markdown

Utilities and Libraries:
- @mantine/hooks (styling)
- Date-fns (date/time manipulation)
- PostCSS (transforms CSS code to AST)
- React Resize Detector (detecting window size)

To run the client and server via concurrently:
terminal powershell -> npm run all
terminal powershell -> npm run lint (loading ESLint checker)

terminal powershell -> npx prisma generate
terminal powershell -> npx prisma db push
terminal powershell -> npx prisma migrate reset

terminal powershell -> npx prisma db seed (loading test database)

terminal CommandPrompt -> stripe login
terminal CommandPrompt -> stripe listen --forward-to localhost:3000/api/webhook