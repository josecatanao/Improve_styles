import { createClient } from '@/utils/supabase/server'

type DbConnectionError = {
  code?: string
  message: string
}

export default async function TestConnectionPage() {
  const supabase = await createClient()

  // We do a simple query to see if the connection is working
  // If the 'stores' table doesn't exist yet, it might throw an error or return null.
  // We can just try to get the current session or a health check.
  const { error: authError } = await supabase.auth.getSession()

  let dbStatus = 'Nao testado'
  let dbError: DbConnectionError | null = null

  try {
    // Attempt to query a non-existent table just to check the connection response
    // If it returns a standard postgrest error (like relation does not exist), the connection is fine.
    // If it returns a network error or JWT error, the keys are wrong.
    const { error } = await supabase.from('stores').select('id').limit(1)
    
    if (error) {
      if (error.code === '42P01') {
        dbStatus = "Conectado com sucesso (a tabela 'stores' ainda nao existe, o que e esperado)."
      } else {
        dbStatus = 'Erro ao consultar o banco'
        dbError = {
          code: error.code,
          message: error.message,
        }
      }
    } else {
      dbStatus = 'Conectado com sucesso!'
    }
  } catch (error: unknown) {
    dbStatus = 'Falha critica na conexao'
    dbError = {
      message: error instanceof Error ? error.message : 'Erro desconhecido ao testar a conexao.',
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Teste de Conexão Supabase</h1>
        
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h2 className="font-semibold text-slate-700 mb-2">1. Status da Autenticação</h2>
            {authError ? (
              <p className="text-red-500 text-sm">{authError.message}</p>
            ) : (
              <p className="text-emerald-600 text-sm">✅ Autenticação conectada com sucesso</p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h2 className="font-semibold text-slate-700 mb-2">2. Status do Banco de Dados</h2>
            {dbError ? (
              <div className="text-red-500 text-sm">
                <p>❌ {dbStatus}</p>
                <pre className="mt-2 bg-red-50 p-2 rounded text-xs overflow-auto">{JSON.stringify(dbError, null, 2)}</pre>
              </div>
            ) : (
              <p className="text-emerald-600 text-sm">✅ {dbStatus}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <a href="/login" className="text-blue-600 hover:underline text-sm font-medium">
            Ir para a tela de Login &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}
