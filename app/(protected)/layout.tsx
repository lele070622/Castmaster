import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/shell/nav'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .single()

  const username = profile?.username ?? data.user.email?.split('@')[0] ?? 'Angler'

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav username={username} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
