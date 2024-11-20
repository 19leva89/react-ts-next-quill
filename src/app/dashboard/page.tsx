'use server'

import { redirect } from 'next/navigation'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/db'
import { Dashboard } from '@/components/shared'

const DashboardPage = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	// Check if the user is authenticated
	if (!user || !user.id) {
		return redirect('/auth-callback?origin=dashboard')
	}

	const dbUser = await prisma.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) {
		return redirect('/auth-callback?origin=dashboard')
	}

	// const subscriptionPlan = await getUserSubscriptionPlan()

	return <Dashboard />
}

export default DashboardPage
