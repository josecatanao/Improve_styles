'use server'

export type CepResult = {
  logradouro: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  erro?: boolean
}

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      next: { revalidate: 86400 },
    })

    if (!response.ok) return null

    const data = await response.json()

    if (data.erro) return null

    return {
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? '',
      estado: data.uf ?? '',
      cep: data.cep ?? digits,
    }
  } catch {
    return null
  }
}
