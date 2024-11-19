import { redirect } from 'next/navigation'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/db'

const DashboardPage = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) redirect(`/auth-callback?origin=dashboard`)

	const dbUser = await prisma.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) redirect('/auth-callback?origin=dashboard')

	// const subscriptionPlan = await getUserSubscriptionPlan()

	return (
		<div>
			<h1>Dashboard</h1>
		</div>
	)
}

export default DashboardPage
