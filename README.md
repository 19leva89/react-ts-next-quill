# This project contains the following technologies

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
- React 19
- TypeScript
- Next 15 (framework)

Data Fetching and State Management:
- Prisma 6 (ORM for DB)

Form and Validation:
- React Hook Form (working with forms)
- React Textarea Autosize (working with textarea)
- Zod (first schema validation)

Image Handling and Optimization:
- React Dropzone (drag and drop)

Middleware and Server Utilities:
- Concurrently (all projects are running in tandem)
- tRPC (end-to-end type safe APIs)
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

# Project setup commands:
terminal powershell -> `npm i` (install dependencies)
terminal powershell -> `npm run all`
terminal powershell -> `npm run lint` (loading ESLint checker)
terminal powershell -> `npm run knip`

# Database commands:
terminal powershell -> `npx prisma generate`
terminal powershell -> `npx prisma db push`
terminal powershell -> `npx prisma migrate reset`

terminal powershell -> `npx prisma db seed` (loading test DB)

# GitHub commands:
terminal powershell -> `git pull origin master` (get latest changes)

terminal powershell -> `git add .` (add all changes)
terminal powershell -> `git commit -m "commit message"` (commit changes)
terminal powershell -> `git checkout -b <branch-name>` (create new branch)

terminal powershell -> `git push origin master` (push changes to master)
terminal powershell -> `git push origin <branch-name>` (push changes to branch)

# Stripe commands:
terminal CommandPrompt -> `stripe login`
terminal CommandPrompt -> `stripe listen --forward-to localhost:3000/api/webhooks/stripe`