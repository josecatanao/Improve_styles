import { createClient } from '@/utils/supabase/server'
import { getProducts } from '@/lib/products'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const page = searchParams.get('page') ?? '1'

  const result = await getProducts({ query, status, page })

  return Response.json(result)
}
