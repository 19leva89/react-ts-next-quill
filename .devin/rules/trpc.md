---
trigger: always_on
---

---
description: 
globs: 
alwaysApply: true
---
---
description: Guidelines for writing Next.js apps with tRPC
globs: "**/*.ts, **/*.tsx, **/*.js, **/*.jsx"
---

## Overview

@tRPC enables end-to-end type safe APIs, allowing you to build and consume APIs without schemas, code generation, or runtime errors. These rules will help you follow best practices for tRPC v11.

## Project Structure

For a clean tRPC setup, follow this recommended structure:
```
.
├── src
│   ├── app
│   │   ├── example
│   │   │   └── page.tsx                     # Example page using tRPC queries with prefetching
│   │   └── api
│   │       └── trpc
│   │           └── [trpc]
│   │               └── route.ts             # HTTP handler for tRPC requests (Next.js API route)
│   ├── modules
│   │   └── examples
│   │       ├── hooks
│   │       │   └── use-hook-example.ts      # Custom hooks for example module logic
│   │       ├── schema
│   │       │   └── index.ts                 # Zod schemas for validation and types
│   │       ├── server
│   │       │   └── procedures.ts            # tRPC procedures and business logic
│   │       ├── types
│   │       │   └── index.ts                 # TypeScript types and interfaces
│   │       └── ui
│   │           ├── views
│   │           │   └── examples-view.tsx    # Main view component with tRPC data fetching
│   │           └── components
│   │               └── examples-header.tsx  # Reusable UI component with tRPC integration
│   ├── trpc
│   │   ├── routers
│   │   │   └── _app.ts                      # Root router merging all module procedures
│   │   ├── client.tsx                       # Client-side setup with TRPCProvider
│   │   ├── init.ts                          # Core tRPC initialization and middleware
│   │   ├── query-client.ts                  # TanStack Query client configuration
│   │   └── server.tsx                       # Server-side utils and prefetching helpers
```

## Server-Side Setup

### Initialize tRPC Backend

```typescript
// src/trpc/init.ts
import { cache } from 'react'
import { initTRPC, TRPCError } from '@trpc/server'

import { auth } from '@/auth'

export const createTRPCContext = cache(async () => {
	const session = await auth()

	return { userId: session?.user?.id }
})

// Avoid exporting the entire t-object since it's not very descriptive.
// For instance, the use of a t variable is common in i18n libraries.
const t = initTRPC.create({
	/**
	 * @see https://trpc.io/docs/server/data-transformers
	 */
	// transformer: superjson,
})

// Base router and procedure helpers
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

export const baseProcedure = t.procedure

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
	const session = await auth()

	if (!session) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'USER' })
	}

	return next({ ctx: { ...ctx, auth: session } })
})
```

### Create Router

```typescript
// server/routers/_app.ts
import { createTRPCRouter } from '@/trpc/init'
import { chartsRouter } from '@/modules/charts/server/procedures'

export const appRouter = createTRPCRouter({
	charts: chartsRouter,
})

// export type definition of API
export type TAppRouter = typeof appRouter
```

## Client-Side Setup

### Next.js Integration

```typescript
// src/trpc/client.tsx
'use client'
// ^-- to make sure we can mount the Provider from a server component

import { PropsWithChildren, useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { createTRPCClient, httpBatchLink, TRPCClient } from '@trpc/client'

import { absoluteUrl } from '@/lib/utils'
import { makeQueryClient } from '@/trpc/query-client'
import type { TAppRouter } from '@/trpc/routers/_app'

export const { TRPCProvider, useTRPC } = createTRPCContext<TAppRouter>()

let browserQueryClient: QueryClient

function getQueryClient() {
	if (typeof window === 'undefined') {
		// Server: always make a new query client
		return makeQueryClient()
	}

	// Browser: make a new query client if we don't already have one
	// This is very important, so we don't re-make a new client if React
	// suspends during the initial render. This may not be needed if we
	// have a suspense boundary BELOW the creation of the query client
	if (!browserQueryClient) browserQueryClient = makeQueryClient()

	return browserQueryClient
}

const fullUrl = absoluteUrl('/api/trpc')

export function TRPCReactProvider(props: PropsWithChildren) {
	// NOTE: Avoid useState when initializing the query client if you don't
	//       have a suspense boundary between this and the code that may
	//       suspend because React will throw away the client on the initial
	//       render if it suspends and there is no boundary
	const queryClient = getQueryClient()

	const [trpcClient] = useState<TRPCClient<TAppRouter>>(() =>
		createTRPCClient<TAppRouter>({
			links: [
				httpBatchLink({
					// transformer: superjson, <-- if you use a data transformer
					url: fullUrl,
				}),
			],
		}),
	)

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{props.children}
			</TRPCProvider>
		</QueryClientProvider>
	)
}
```

## Best Practices

1. **Use Zod for Input Validation**: Always validate procedure inputs with Zod for better type safety and runtime validation.

    ```typescript
    import { z } from 'zod';
    
    procedure
      .input(z.object({ 
        id: z.string().uuid(),
        email: z.email(),
        age: z.number().min(18) 
      }))
      .mutation(({ input }) => { /* your code */ })
    ```

2. **Organize Routers by Feature**: Split your routers into logical domains/features rather than having one large router.

    ```typescript
    // server/routers/user.ts
    export const userRouter = router({
      list: publicProcedure.query(() => { /* ... */ }),
      byId: publicProcedure.input(z.string()).query(({ input }) => { /* ... */ }),
      create: publicProcedure.input(/* ... */).mutation(({ input }) => { /* ... */ }),
    });
    
    // server/routers/_app.ts
    import { userRouter } from './user';
    import { postRouter } from './post';
    
    export const appRouter = router({
      user: userRouter,
      post: postRouter,
    });
    ```

3. **Use Middleware for Common Logic**: Apply middleware for authentication, logging, or other cross-cutting concerns.

    ```typescript
    const isAuthed = t.middleware(({ next, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'USER' });
      }
      return next({
        ctx: {
          // Add user information to context
          user: ctx.user,
        },
      });
    });
    
    const protectedProcedure = t.procedure.use(isAuthed);
    ```

4. **Use Proper Error Handling**: Utilize tRPC's error handling for consistent error responses.

    ```typescript
    import { TRPCError } from '@trpc/server';
    
    publicProcedure
      .input(z.string())
      .query(({ input }) => {
        const user = getUserById(input);
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with id ${input} not found`,
          });
        }
        return user;
      });
    ```

5. **Use Data Transformers**: Use SuperJSON for automatic handling of dates, Maps, Sets, etc.

    ```typescript
    import { initTRPC } from '@trpc/server';
    import superjson from 'superjson';
    
    const t = initTRPC.create({
      transformer: superjson,
    });
    ```

6. **Leverage React Query Integration**: For React projects, use tRPC's React Query utilities for data fetching, mutations, and caching.

    ```tsx
    function UserProfile({ userId }: { userId: string }) {
      const { data, isLoading, error } = trpc.user.byId.useQuery(userId);
      
      if (isLoading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      
      return <div>{data.name}</div>;
    }
    ```

7. **Context Creation**: Create a proper context object to share resources across procedures.

    ```typescript
    // server/context.ts
    import { inferAsyncReturnType } from '@trpc/server';
    import * as trpcNext from '@trpc/server/adapters/next';
    import { prisma } from './prisma';
    
    export async function createContext({
      req,
      res,
    }: trpcNext.CreateNextContextOptions) {
      const user = await getUser(req);
      return {
        req,
        res,
        prisma,
        user,
      };
    }
    
    export type TContext = inferAsyncReturnType<typeof createContext>;
    ```

8. **Type Exports**: Only export types, not the actual router implementations, from your server code to client code.

    ```typescript
    // Export type router type signature, NOT the router itself
    export type TAppRouter = typeof appRouter;
    ```

9. **Procedure Types**: Use different procedure types for different authorization levels.

    ```typescript
    export const publicProcedure = t.procedure;
    export const protectedProcedure = t.procedure.use(isAuthed);
    export const adminProcedure = t.procedure.use(isAdmin);
    ```

10. **Performance Optimization**: Use batching and prefetching for optimized data loading.

    ```typescript
    // Client-side batching in Next.js setup
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      maxURLLength: 2083,
    })
    
    // Prefetching data in Next.js
    export async function getStaticProps() {
      const ssg = createServerSideHelpers({
        router: appRouter,
        ctx: {},
      });
      
      await ssg.post.byId.prefetch('1');
      
      return {
        props: {
          trpcState: ssg.dehydrate(),
        },
        revalidate: 1,
      };
    }
    ```

## Version Compatibility

This guide is for tRPC v11, which requires:
- TypeScript >= 5.7.2
- Strict TypeScript mode (`"strict": true` in tsconfig.json)

## Further Resources

- @Official Documentation
- @GitHub Repository
- @Example Apps