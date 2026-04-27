import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error
  const message = resolvedParams?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-sm border-slate-100">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Bem-vindo ao Dashboard
          </CardTitle>
          <CardDescription className="text-center">
            Faça login na sua conta para gerenciar sua loja
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4 border border-red-100">
                {message || 'Ocorreu um erro ao fazer login.'}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@exemplo.com"
                required
                className="bg-slate-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-slate-50/50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" formAction={login}>
              Entrar
            </Button>
            <div className="relative my-4 w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Primeiro Acesso?</span>
              </div>
            </div>
            <Button type="submit" variant="outline" className="w-full text-slate-600" formAction={signup}>
              Criar Conta Admin
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Dev shortcut helper */}
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg text-xs text-slate-500 border border-slate-200">
        <p className="font-semibold mb-1">Dica de Dev:</p>
        <p>Acesse <a href="/test-connection" className="text-blue-600 underline">/test-connection</a> para validar as chaves do Supabase.</p>
      </div>
    </div>
  )
}
