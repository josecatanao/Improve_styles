'use client'

import { useState } from 'react'
import { Star, MessageSquare, Send, Loader2 } from 'lucide-react'
import { submitProductReview } from '@/app/produto/[id]/actions'

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  customer: {
    full_name: string | null
  } | null
}

export function ProductReviews({
  productId,
  reviews,
  isLoggedIn,
}: {
  productId: string
  reviews: Review[]
  isLoggedIn: boolean
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setMessage({ type: 'error', text: 'Selecione uma nota de 1 a 5 estrelas.' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await submitProductReview(productId, rating, comment)
      setMessage({ type: 'success', text: 'Avaliacao enviada com sucesso! Obrigado.' })
      setRating(0)
      setComment('')
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Falha ao enviar avaliacao.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-slate-400" />
            Avaliacoes de Clientes
          </h2>
          <p className="mt-2 text-slate-500">O que as pessoas estao achando deste produto.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
          <div className="text-4xl font-black text-slate-900">{averageRating}</div>
          <div>
            <div className="flex items-center gap-1 text-[#3483fa]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= Number(averageRating) ? 'fill-current' : 'text-slate-300'}`}
                />
              ))}
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {reviews.length} {reviews.length === 1 ? 'avaliacao' : 'avaliacoes'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-slate-500">Ainda nao ha avaliacoes para este produto.</p>
              <p className="text-sm font-medium text-slate-700 mt-1">Seja o primeiro a avaliar!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold uppercase">
                      {(review.customer?.full_name || 'A')[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{review.customer?.full_name || 'Cliente Anonimo'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#3483fa]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-slate-700 leading-relaxed text-sm mt-3">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 h-fit">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Deixe sua avaliacao</h3>
          
          {isLoggedIn ? (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Sua nota</label>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none focus-visible:ring-2 rounded-full focus-visible:ring-[#3483fa]"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-[#3483fa] text-[#3483fa]'
                            : 'text-slate-300 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Seu comentario (opcional)</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte para outros clientes o que achou do produto..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {message && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar Avaliacao
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600 mb-4">Voce precisa estar logado para avaliar nossos produtos.</p>
              <a
                href={`/login?mode=customer`}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Fazer login
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
