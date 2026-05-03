'use client'

import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Minus,
  Package2,
  Plus,
  ShieldCheck,
  SwatchBook,
  Trash2,
  Upload,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type {
  ProductColor,
  ProductDetail,
  ProductFormOptions,
  ProductStatus,
  ProductVariantStatus,
} from '@/lib/product-shared'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  resolveUniqueProductSlug,
  createSku,
  createVariantSku,
  normalizeHex,
  isValidHex,
  parseOptionalNumber,
  formatCurrency,
  checkSkuUniqueness,
  resolveUniqueSku,
  validateRemoteImageUrl,
} from '@/lib/product-form-utils'
import { useProductDraft } from '@/hooks/use-product-draft'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useConfirm } from '@/components/ui/feedback-provider'

export type ProductFormState = {
  name: string
  category: string
  brand: string
  shortDescription: string
  description: string
  price: string
  compare_at_price: string
  status: ProductStatus
  is_featured: boolean
  show_specs: boolean
  collection: string
  audience: string
  weight: string
  width: string
  height: string
  length: string
}

export type VariantRow = {
  id: string
  size: string
  sku: string
  stock: string
  price: string
  compare_at_price: string
  status: ProductVariantStatus
}

export type ColorGroup = {
  id: string
  name: string
  hex: string
  variants: VariantRow[]
}

type ExistingImageItem = {
  id: string
  kind: 'existing'
  url: string
  storagePath: string | null
  assignedColorName: string | null
  assignedColorHex: string | null
}

type NewImageItem = {
  id: string
  kind: 'new'
  file: File
  url: string
  assignedColorName: string | null
  assignedColorHex: string | null
}

type RemoteImageItem = {
  id: string
  kind: 'remote'
  url: string
  assignedColorName: string | null
  assignedColorHex: string | null
}

export type ImageItem = ExistingImageItem | NewImageItem | RemoteImageItem
type ProductType = 'simple' | 'variant'
type ToastState = { type: 'success' | 'error'; message: string } | null

type ProductFormProps = {
  mode?: 'create' | 'edit'
  product?: ProductDetail | null
  options: ProductFormOptions
}


const initialState: ProductFormState = {
  name: '',
  category: '',
  brand: '',
  shortDescription: '',
  description: '',
  price: '',
  compare_at_price: '',
  status: 'draft',
  is_featured: false,
  show_specs: false,
  collection: '',
  audience: '',
  weight: '',
  width: '',
  height: '',
  length: '',
}

const stepItems = [
  {
    key: 'basic',
    title: 'Informacoes basicas',
    description: 'Nome, descricao, categoria, marca e preco.',
    icon: Package2,
  },
  {
    key: 'variations',
    title: 'Variacoes',
    description: 'Tipo de produto, cores e tamanhos.',
    icon: SwatchBook,
  },
  {
    key: 'images',
    title: 'Imagens',
    description: 'Upload, preview e ordenacao.',
    icon: ImagePlus,
  },
  {
    key: 'review',
    title: 'Revisao final',
    description: 'Cheque tudo antes de salvar.',
    icon: ShieldCheck,
  },
] as const

const commonColors = [
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Preto', hex: '#000000' },
  { name: 'Cinza', hex: '#9E9E9E' },
  { name: 'Azul', hex: '#2196F3' },
  { name: 'Azul Marinho', hex: '#000080' },
  { name: 'Vermelho', hex: '#F44336' },
  { name: 'Vinho', hex: '#800020' },
  { name: 'Verde', hex: '#4CAF50' },
  { name: 'Amarelo', hex: '#FFEB3B' },
  { name: 'Laranja', hex: '#FF9800' },
  { name: 'Bege', hex: '#F5F5DC' },
  { name: 'Rosa', hex: '#E91E63' },
  { name: 'Marrom', hex: '#795548' },
]

const suggestedSizes = ['P', 'M', 'G', 'GG'] as const

function revokeNewImageUrls(images: ImageItem[]) {
  images.forEach((image) => {
    if (image.kind === 'new') {
      URL.revokeObjectURL(image.url)
    }
  })
}

function buildInitialImages(product?: ProductDetail | null): ImageItem[] {
  return (
    product?.product_images
      ?.slice()
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .flatMap((image) =>
        image.id && image.public_url
          ? [
              {
                id: image.id,
                kind: 'existing' as const,
                url: image.public_url,
                storagePath: image.storage_path ?? null,
                assignedColorName: image.assigned_color_name ?? null,
                assignedColorHex: image.assigned_color_hex ?? null,
              },
            ]
          : []
      ) ?? []
  )
}

function buildVariantRow(
  productName: string,
  colorName: string,
  size: string,
  index: number,
  existing?: Partial<VariantRow>
): VariantRow {
  return {
    id: existing?.id ?? crypto.randomUUID(),
    size,
    sku: existing?.sku ?? createVariantSku(productName, colorName, size, index),
    stock: existing?.stock ?? '0',
    price: existing?.price ?? '',
    compare_at_price: existing?.compare_at_price ?? '',
    status: existing?.status ?? 'active',
  }
}

function buildInitialGroups(product?: ProductDetail | null): ColorGroup[] {
  if (product?.product_variants?.length) {
    const grouped = new Map<string, ColorGroup>()

    product.product_variants
      .slice()
      .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
      .forEach((variant, index) => {
        const key = `${variant.color_name}::${variant.color_hex}`
        const current = grouped.get(key)
        const row = buildVariantRow(product.name, variant.color_name, variant.size, index, {
          id: variant.id ?? crypto.randomUUID(),
          sku: variant.sku ?? undefined,
          stock: String(variant.stock ?? 0),
          price: variant.price == null ? '' : String(variant.price),
          compare_at_price: variant.compare_at_price == null ? '' : String(variant.compare_at_price),
          status: variant.status ?? 'active',
        })

        if (current) {
          current.variants.push(row)
        } else {
          grouped.set(key, {
            id: crypto.randomUUID(),
            name: variant.color_name,
            hex: variant.color_hex,
            variants: [row],
          })
        }
      })

    return Array.from(grouped.values())
  }

  if (product?.colors?.length) {
    return product.colors.map((color, index) => ({
      id: crypto.randomUUID(),
      name: color.name,
      hex: color.hex,
      variants: [
        buildVariantRow(product.name, color.name, 'Unico', index, {
          stock: index === 0 ? String(product.stock ?? 0) : '0',
          price: product.price == null ? '' : String(product.price),
          compare_at_price: product.compare_at_price == null ? '' : String(product.compare_at_price),
        }),
      ],
    }))
  }

  return []
}

function createEmptyColorGroup(productName: string, colorName: string, colorHex: string, useSizes: boolean): ColorGroup {
  return {
    id: crypto.randomUUID(),
    name: colorName,
    hex: colorHex,
    variants: useSizes ? [] : [buildVariantRow(productName, colorName, 'Unico', 0)],
  }
}

function normalizeGroupsForMode(groups: ColorGroup[], productName: string, useSizes: boolean) {
  return groups.map((group) => {
    if (!useSizes) {
      const primary = group.variants[0]
      return {
        ...group,
        variants: [buildVariantRow(productName, group.name, 'Unico', 0, primary)],
      }
    }

    return {
      ...group,
      variants: group.variants.filter((variant) => variant.size !== 'Unico'),
    }
  })
}

function moveItem<T>(items: T[], fromId: string, toId: string, getId: (item: T) => string) {
  const fromIndex = items.findIndex((item) => getId(item) === fromId)
  const toIndex = items.findIndex((item) => getId(item) === toId)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items
  }

  const nextItems = [...items]
  const [moved] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, moved)
  return nextItems
}

function Textarea(props: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={cn(
        'flex min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-600 dark:focus-visible:ring-slate-800',
        props.className
      )}
    />
  )
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-visible border-0 bg-white/90 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80 dark:bg-slate-900/95 dark:ring-slate-800">
      <CardHeader className="gap-2 border-b border-slate-100 bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(255,255,255,0.9))] dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))]">
        <CardTitle className="text-lg text-slate-950 dark:text-slate-50">{title}</CardTitle>
        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">{children}</CardContent>
    </Card>
  )
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</Label>
        {hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function CreatableField({
  label,
  hint,
  value,
  draft,
  options,
  placeholder,
  onDraftChange,
  onSelect,
}: {
  label: string
  hint?: string
  value: string
  draft: string
  options: string[]
  placeholder: string
  onDraftChange: (value: string) => void
  onSelect: (value: string) => void
}) {
  const [isEditing, setIsEditing] = useState(!value)
  const filtered = useMemo(() => {
    const normalized = draft.trim().toLowerCase()
    if (!normalized) {
      return options.slice(0, 6)
    }

    return options.filter((option) => option.toLowerCase().includes(normalized)).slice(0, 6)
  }, [draft, options])

  function commit(nextValue: string) {
    const normalized = nextValue.trim()
    onSelect(normalized)
    onDraftChange('')
    setIsEditing(false)
  }

  return (
    <FieldGroup label={label} hint={hint}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-950/70">
        {value && !isEditing ? (
          <div className="flex min-h-10 items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-100">{value}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Alterar
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelect('')
                  onDraftChange('')
                  setIsEditing(true)
                }}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
              >
                Limpar
              </button>
            </div>
          </div>
        ) : (
          <>
            <Input
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={placeholder}
              className="h-10 bg-white dark:bg-slate-900"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => commit(option)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    value === option
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                  )}
                >
                  {option}
                </button>
              ))}
              {draft.trim() && !options.some((option) => option.toLowerCase() === draft.trim().toLowerCase()) ? (
                <button
                  type="button"
                  onClick={() => commit(draft)}
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20 dark:hover:bg-emerald-500/20"
                >
                  Criar &quot;{draft.trim()}&quot;
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </FieldGroup>
  )
}

export function ProductForm({ mode = 'create', product = null, options }: ProductFormProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialImages = buildInitialImages(product)
  const initialGroups = buildInitialGroups(product)
  const initialUseSizes = initialGroups.some((group) => group.variants.some((variant) => variant.size !== 'Unico'))

  const draft = useProductDraft(mode, product?.id ?? null)

  const getInitialForm = (): ProductFormState => {
    if (draft.draftRestored) return initialState
    if (mode === 'edit' && product) {
      return {
        name: product.name,
        category: product.category ?? '',
        brand: product.brand ?? '',
        shortDescription: product.short_description ?? '',
        description: product.description ?? '',
        price: String(product.price ?? ''),
        compare_at_price: String(product.compare_at_price ?? ''),
        status: product.status ?? 'draft',
        is_featured: product.is_featured ?? false,
        show_specs: product.show_specs ?? false,
        collection: product.collection ?? '',
        audience: product.audience ?? '',
        weight: product.weight != null ? String(product.weight) : '',
        width: product.width != null ? String(product.width) : '',
        height: product.height != null ? String(product.height) : '',
        length: product.length != null ? String(product.length) : '',
      }
    }
    return initialState
  }

  const [form, setForm] = useState<ProductFormState>(getInitialForm)
  const [step, setStep] = useState(0)
  const [productType, setProductType] = useState<ProductType>(initialUseSizes ? 'variant' : 'simple')
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>(initialGroups)
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#111111')
  const [categoryDraft, setCategoryDraft] = useState('')
  const [brandDraft, setBrandDraft] = useState('')
  const [sizeDrafts, setSizeDrafts] = useState<Record<string, string>>({})
  const [images, setImages] = useState<ImageItem[]>(initialImages)
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null)
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(draft.hasDraft)
  const [showMeasures, setShowMeasures] = useState(
    mode === 'edit' && product ? !!(product.weight || product.width || product.height || product.length) : false
  )

  const imagesRef = useRef<ImageItem[]>(initialImages)
  const removedExistingImageIdsRef = useRef<string[]>([])
  const removedExistingStoragePathsRef = useRef<string[]>([])
  const submissionLockRef = useRef(false)
  const saveDraftRef = useRef(draft.saveDraft)
  const mountedRef = useRef(false)
  const isDirtyRef = useRef(false)

  useEffect(() => {
    saveDraftRef.current = draft.saveDraft
  }, [draft.saveDraft])

  const useSizes = productType === 'variant'

  const isDirty =
    form.name.trim() !== '' ||
    form.category.trim() !== '' ||
    form.brand.trim() !== '' ||
    form.shortDescription.trim() !== '' ||
    form.description.trim() !== '' ||
    form.price !== '' ||
    colorGroups.length > 0 ||
    images.length > 0

  useEffect(() => {
    isDirtyRef.current = isDirty
  })

  useUnsavedChanges(isDirty)

  useEffect(() => {
    return () => {
      revokeNewImageUrls(imagesRef.current)
    }
  }, [])

  useEffect(() => {
    if (isSubmitting || hasSubmittedSuccessfully) return
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (!isDirtyRef.current) return
    saveDraftRef.current({
      form,
      step,
      productType,
      colorGroups,
      categoryDraft,
      brandDraft,
      sizeDrafts,
      imageUrlDraft,
      mode,
      showMeasures,
    })
  }, [form, step, productType, colorGroups, categoryDraft, brandDraft, sizeDrafts, imageUrlDraft, mode, showMeasures, isSubmitting, hasSubmittedSuccessfully])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  function restoreDraft() {
    const saved = draft.loadDraft()
    if (!saved) return

    setForm(saved.form)
    setStep(saved.step)
    setProductType(saved.productType)
    setColorGroups(saved.colorGroups)
    setCategoryDraft(saved.categoryDraft)
    setBrandDraft(saved.brandDraft)
    setSizeDrafts(saved.sizeDrafts)
    setImageUrlDraft(saved.imageUrlDraft)
    setShowMeasures(saved.showMeasures ?? false)
    setShowDraftRestoreDialog(false)
    showToast('success', 'Rascunho restaurado com sucesso.')
  }

  function discardDraftDialog() {
    draft.discardDraft()
    setShowDraftRestoreDialog(false)
  }


  const colors = colorGroups.map<ProductColor>((group) => ({ name: group.name, hex: group.hex }))
  const totalStock = colorGroups.reduce(
    (total, group) => total + group.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
    0
  )
  const previewImage = images[0] ?? null
  const previewPrice = parseOptionalNumber(form.price)

  function showToast(type: NonNullable<ToastState>['type'], message: string) {
    setToast({ type, message })
  }

  function updateImages(nextImages: ImageItem[]) {
    imagesRef.current = nextImages
    setImages(nextImages)
  }

  function appendFiles(nextFiles: File[]) {
    if (nextFiles.length === 0) {
      return
    }

    const defaultColor = colors[0] ?? null
    const appendedImages = nextFiles.map((file) => ({
      id: crypto.randomUUID(),
      kind: 'new' as const,
      file,
      url: URL.createObjectURL(file),
      assignedColorName: defaultColor?.name ?? null,
      assignedColorHex: defaultColor?.hex ?? null,
    }))

    updateImages([...imagesRef.current, ...appendedImages])
    showToast('success', `${nextFiles.length} imagem(ns) adicionada(s) a galeria.`)
  }

  async function appendImageUrl() {
    const trimmedUrl = imageUrlDraft.trim()

    if (!trimmedUrl) {
      showToast('error', 'Informe o link da imagem.')
      return
    }

    try {
      const parsed = new URL(trimmedUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        showToast('error', 'Use um link http ou https valido.')
        return
      }

      const validation = await validateRemoteImageUrl(parsed.toString())
      if (!validation.valid) {
        showToast('error', validation.error ?? 'URL de imagem invalida.')
        return
      }

      const defaultColor = colors[0] ?? null
      updateImages([
        ...imagesRef.current,
        {
          id: crypto.randomUUID(),
          kind: 'remote',
          url: parsed.toString(),
          assignedColorName: defaultColor?.name ?? null,
          assignedColorHex: defaultColor?.hex ?? null,
        },
      ])
      setImageUrlDraft('')
      showToast('success', 'Link da imagem adicionado a galeria.')
    } catch {
      showToast('error', 'Informe uma URL valida para a imagem.')
    }
  }

  function handleFileSelection(fileList: FileList | null) {
    appendFiles(Array.from(fileList ?? []))
  }

  function handleImageDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDraggingFiles(false)
    handleFileSelection(event.dataTransfer.files)
  }

  async function removeImage(imageId: string) {
    const image = imagesRef.current.find((item) => item.id === imageId)
    if (!image) {
      return
    }

    const confirmed = await confirm({
      title: 'Remover imagem?',
      description: 'A imagem sera removida da galeria do produto. Salve o produto para aplicar a remocao.',
      confirmLabel: 'Remover imagem',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

    if (image.kind === 'new') {
      URL.revokeObjectURL(image.url)
    } else if (image.kind === 'existing' && image.storagePath) {
      removedExistingImageIdsRef.current.push(image.id)
      removedExistingStoragePathsRef.current.push(image.storagePath)
    } else if (image.kind === 'existing') {
      removedExistingImageIdsRef.current.push(image.id)
    }

    updateImages(imagesRef.current.filter((item) => item.id !== imageId))
    showToast('success', 'Imagem removida da galeria.')
  }

  function setCoverImage(imageId: string) {
    const selected = imagesRef.current.find((item) => item.id === imageId)
    if (!selected) {
      return
    }

    updateImages([selected, ...imagesRef.current.filter((item) => item.id !== imageId)])
    showToast('success', 'Capa atualizada.')
  }

  function assignImageColor(imageId: string, selectedHex: string) {
    const selectedColor = colors.find((color) => color.hex === selectedHex) ?? null
    updateImages(
      imagesRef.current.map((image) =>
        image.id === imageId
          ? {
              ...image,
              assignedColorName: selectedColor?.name ?? null,
              assignedColorHex: selectedColor?.hex ?? null,
            }
          : image
      )
    )
  }

  function handleProductTypeChange(nextType: ProductType) {
    setProductType(nextType)
    setColorGroups((current) => normalizeGroupsForMode(current, form.name, nextType === 'variant'))
  }

  function addColorGroup() {
    const name = newColorName.trim()
    const hex = normalizeHex(newColorHex)

    if (!name) {
      showToast('error', 'Informe o nome da cor.')
      return
    }

    if (!isValidHex(hex)) {
      showToast('error', 'Informe um hexadecimal valido.')
      return
    }

    if (colorGroups.some((group) => group.name.toLowerCase() === name.toLowerCase() || group.hex === hex)) {
      showToast('error', 'Essa cor ja foi cadastrada.')
      return
    }

    setColorGroups((current) => [...current, createEmptyColorGroup(form.name, name, hex, useSizes)])
    setNewColorName('')
    setNewColorHex('#111111')
    showToast('success', `Cor ${name} adicionada.`)
  }

  async function removeColorGroup(groupId: string) {
    const removed = colorGroups.find((group) => group.id === groupId)
    if (!removed) return

    const confirmed = await confirm({
      title: 'Remover grupo de cor?',
      description: `A cor "${removed.name}" e seus ${removed.variants.length} variantes serao removidos. Esta acao nao pode ser desfeita.`,
      confirmLabel: 'Remover cor',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

    setColorGroups((current) => current.filter((group) => group.id !== groupId))

    updateImages(
      imagesRef.current.map((image) =>
        image.assignedColorHex === removed.hex
          ? { ...image, assignedColorHex: null, assignedColorName: null }
          : image
      )
    )
    showToast('success', `Cor ${removed.name} removida.`)
  }

  function addVariantToGroup(groupId: string, forcedSize?: string) {
    const sizeDraft = (forcedSize ?? sizeDrafts[groupId] ?? '').trim()
    const group = colorGroups.find((item) => item.id === groupId)
    if (!group) {
      return
    }

    if (useSizes && !sizeDraft) {
      showToast('error', 'Informe o tamanho antes de adicionar.')
      return
    }

    const nextSize = useSizes ? sizeDraft : 'Unico'
    if (group.variants.some((variant) => variant.size.toLowerCase() === nextSize.toLowerCase())) {
      showToast('error', 'Esse tamanho ja existe para essa cor.')
      return
    }

    setColorGroups((current) =>
      current.map((item) =>
        item.id === groupId
          ? {
              ...item,
              variants: [
                ...item.variants,
                buildVariantRow(form.name, item.name, nextSize, item.variants.length, {
                  price: form.price,
                }),
              ],
            }
          : item
      )
    )
    setSizeDrafts((current) => ({ ...current, [groupId]: '' }))
  }

  async function removeVariantFromGroup(groupId: string, variantId: string) {
    const group = colorGroups.find((g) => g.id === groupId)
    const variant = group?.variants.find((v) => v.id === variantId)
    if (!variant) return

    const confirmed = await confirm({
      title: 'Remover variante?',
      description: `O tamanho "${variant.size}" da cor "${group?.name ?? ''}" sera removido com seu estoque e preco.`,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

    setColorGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, variants: group.variants.filter((v) => v.id !== variantId) }
          : group
      )
    )
  }

  function updateVariant(groupId: string, variantId: string, field: keyof VariantRow, value: string) {
    setColorGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              variants: group.variants.map((variant) =>
                variant.id === variantId ? { ...variant, [field]: value } : variant
              ),
            }
          : group
      )
    )
  }

  function validateStep(targetStep: number) {
    if (targetStep === 0) {
      if (!form.name.trim()) {
        return 'Informe o nome do produto.'
      }
      if (!form.category.trim()) {
        return 'Selecione ou crie uma categoria.'
      }
      if (!form.brand.trim()) {
        return 'Informe a marca.'
      }
      const price = parseOptionalNumber(form.price)
      if (price == null || price < 0) {
        return 'Informe um preco valido.'
      }
    }

    if (targetStep === 1) {
      if (colorGroups.length === 0) {
        return 'Adicione uma cor para comecar.'
      }

      for (const group of colorGroups) {
        if (!group.name.trim()) {
          return 'Existe uma cor sem nome no cadastro.'
        }
        if (!isValidHex(group.hex)) {
          return `A cor ${group.name} esta com hexadecimal invalido.`
        }
        if (group.variants.length === 0) {
          return `Adicione pelo menos um tamanho para a cor ${group.name}.`
        }
        for (const variant of group.variants) {
          if (useSizes && !variant.size.trim()) {
            return `Informe o tamanho da cor ${group.name}.`
          }
          if (!Number.isFinite(Number(variant.stock)) || Number(variant.stock) < 0) {
            return `Informe um estoque valido para ${group.name}.`
          }
        }
      }
    }

    if (targetStep === 2 && images.length === 0) {
      return 'Adicione pelo menos uma imagem ao produto.'
    }

    return null
  }

  function isStepComplete(targetStep: number) {
    switch (targetStep) {
      case 0:
        return validateStep(0) == null
      case 1:
        return validateStep(1) == null
      case 2:
        return validateStep(2) == null
      case 3:
        return hasSubmittedSuccessfully
      default:
        return false
    }
  }

  function goToNextStep() {
    const issue = validateStep(step)
    if (issue) {
      showToast('error', issue)
      return
    }

    setStep((current) => Math.min(current + 1, stepItems.length - 1))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submissionLockRef.current || isSubmitting) {
      return
    }

    if (step < stepItems.length - 1) {
      return
    }

    const reviewIssue = validateStep(0) ?? validateStep(1) ?? validateStep(2)
    if (reviewIssue) {
      showToast('error', reviewIssue)
      return
    }

    submissionLockRef.current = true
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Nao foi possivel identificar o usuario autenticado.')
      }

      const price = parseOptionalNumber(form.price)
      if (!form.name.trim()) {
        throw new Error('Informe o nome do produto.')
      }
      if (price == null || price < 0) {
        throw new Error('Informe um preco valido.')
      }
      if (colorGroups.length === 0) {
        throw new Error('Cadastre pelo menos uma cor.')
      }
      if (imagesRef.current.length === 0) {
        throw new Error('Adicione pelo menos uma imagem ao produto.')
      }

      const preparedGroups = colorGroups.map((group) => {
        if (!group.name.trim()) {
          throw new Error('Existe uma cor sem nome no cadastro.')
        }
        if (!isValidHex(group.hex)) {
          throw new Error(`A cor ${group.name} esta com hexadecimal invalido.`)
        }
        if (group.variants.length === 0) {
          throw new Error(`Adicione pelo menos uma variacao para a cor ${group.name}.`)
        }

        return {
          ...group,
          variants: group.variants.map((variant, index) => {
            const stock = Number(variant.stock)
            const variantPrice = parseOptionalNumber(variant.price)
            const nextSize = useSizes ? variant.size.trim() : 'Unico'

            if (!nextSize) {
              throw new Error(`Informe o tamanho da cor ${group.name}.`)
            }
            if (!Number.isFinite(stock) || stock < 0) {
              throw new Error(`Informe um estoque valido para ${group.name} / ${nextSize}.`)
            }

            return {
              ...variant,
              size: nextSize,
              stock: String(stock),
              price: variantPrice == null ? '' : String(variantPrice),
              sku: variant.sku.trim() || createVariantSku(form.name, group.name, nextSize, index),
            }
          }),
        }
      })

      const preparedVariants = preparedGroups.flatMap((group) =>
        group.variants.map((variant, index) => ({
          id: variant.id,
          color_name: group.name,
          color_hex: group.hex,
          size: variant.size,
          sku: variant.sku,
          stock: Number(variant.stock),
          price: parseOptionalNumber(variant.price),
          compare_at_price: parseOptionalNumber(variant.compare_at_price),
          cost_price: null,
          status: variant.status,
          position: index,
        }))
      )

      const totalStock = preparedVariants.reduce((total, variant) => total + variant.stock, 0)
      let productId = product?.id ?? null

      const productSku =
        mode === 'edit' && product?.sku
          ? product.sku
          : createSku(form.name, crypto.randomUUID().slice(0, 6).toUpperCase())

      const uniqueSlug = await resolveUniqueProductSlug({
        supabase,
        ownerId: user.id,
        productName: form.name.trim(),
        productId,
      })

      for (const variant of preparedVariants) {
        const skuIsUnique = await checkSkuUniqueness(supabase, user.id, variant.sku, productId)
        if (!skuIsUnique) {
          variant.sku = await resolveUniqueSku(supabase, user.id, variant.sku, productId)
        }
      }

      let skuIsUniqueOnProduct = true
      if (mode === 'create') {
        const { data: existingProductSku } = await supabase
          .from('products')
          .select('id')
          .eq('owner_id', user.id)
          .eq('sku', productSku)
          .limit(1)

        skuIsUniqueOnProduct = (existingProductSku?.length ?? 0) === 0
      }

      const finalProductSku = skuIsUniqueOnProduct
        ? productSku
        : `${productSku}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`

      const productPayload = {
        owner_id: user.id,
        client_request_id: mode === 'create' ? requestId : product?.client_request_id ?? null,
        name: form.name.trim(),
        slug: uniqueSlug,
        sku: finalProductSku,
        colors: preparedGroups.map((group) => ({ name: group.name, hex: group.hex })),
        short_description: form.shortDescription.trim() || null,
        description: form.description.trim() || null,
        price,
        compare_at_price: parseOptionalNumber(form.compare_at_price),
        cost_price: null,
        stock: totalStock,
        status: form.status,
        category: form.category.trim() || null,
        brand: form.brand.trim() || null,
        collection: form.collection.trim() || null,
        audience: form.audience.trim() || null,
        tags: [],
        is_featured: form.is_featured,
        show_specs: form.show_specs,
        is_new: false,
        weight: parseOptionalNumber(form.weight),
        width: parseOptionalNumber(form.width),
        height: parseOptionalNumber(form.height),
        length: parseOptionalNumber(form.length),
        is_active: form.status === 'active',
      }

      if (mode === 'edit' && productId) {
        const { error: updateError } = await supabase.from('products').update(productPayload).eq('id', productId)

        if (updateError) {
          throw new Error(updateError.message)
        }
      } else {
        const { data: createdProduct, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select('id')
          .single()

        if (insertError || !createdProduct) {
          throw new Error(insertError?.message || 'Nao foi possivel cadastrar o produto.')
        }

        productId = createdProduct.id
      }

      if (!productId) {
        throw new Error('Produto invalido para salvar.')
      }

      const oldVariantIds = mode === 'edit' && product?.product_variants
        ? new Set(product.product_variants.map((v) => v.id).filter((id): id is string => Boolean(id)))
        : new Set<string>()

      const variantsToUpsert = preparedVariants.map((variant) => ({
        id: variant.id,
        owner_id: user.id,
        product_id: productId,
        color_name: variant.color_name,
        color_hex: variant.color_hex,
        size: variant.size,
        sku: variant.sku,
        stock: variant.stock,
        price: variant.price,
        compare_at_price: variant.compare_at_price,
        cost_price: variant.cost_price,
        status: variant.status,
        position: variant.position,
      }))

      const { error: upsertVariantsError } = await supabase
        .from('product_variants')
        .upsert(variantsToUpsert, { onConflict: 'id' })

      if (upsertVariantsError) {
        throw new Error(upsertVariantsError.message)
      }

      if (oldVariantIds.size > 0) {
        const newVariantIds = new Set(variantsToUpsert.map((v) => v.id))
        const idsToDelete = [...oldVariantIds].filter((id) => !newVariantIds.has(id))

        if (idsToDelete.length > 0) {
          const { error: deleteRemovedError } = await supabase
            .from('product_variants')
            .delete()
            .in('id', idsToDelete)

          if (deleteRemovedError) {
            throw new Error(deleteRemovedError.message)
          }
        }
      }

      if (mode === 'create') {
        const { data: existingImageRows, error: existingImagesError } = await supabase
          .from('product_images')
          .select('id, storage_path')
          .eq('product_id', productId)

        if (existingImagesError) {
          throw new Error(existingImagesError.message)
        }

        const existingStoragePaths =
          existingImageRows?.map((row) => row.storage_path).filter((value): value is string => Boolean(value)) ?? []

        if ((existingImageRows?.length ?? 0) > 0) {
          const { error: deleteExistingImagesError } = await supabase.from('product_images').delete().eq('product_id', productId)

          if (deleteExistingImagesError) {
            throw new Error(deleteExistingImagesError.message)
          }
        }

        if (existingStoragePaths.length > 0) {
          await supabase.storage.from('product-images').remove(existingStoragePaths)
        }
      }

      if (removedExistingImageIdsRef.current.length > 0) {
        const { error: deleteImagesError } = await supabase
          .from('product_images')
          .delete()
          .in('id', removedExistingImageIdsRef.current)

        if (deleteImagesError) {
          throw new Error(deleteImagesError.message)
        }

        if (removedExistingStoragePathsRef.current.length > 0) {
          await Promise.all(
            removedExistingStoragePathsRef.current.map((storagePath) =>
              supabase.storage.from('product-images').remove([storagePath])
            )
          )
        }
      }

      const existingImages = imagesRef.current.filter((img) => img.kind === 'existing')
      const remoteImages = imagesRef.current.filter((img) => img.kind === 'remote')
      const newImages = imagesRef.current.filter((img) => img.kind === 'new')

      for (const [index, image] of existingImages.entries()) {
        const { error: sortOrderError } = await supabase
          .from('product_images')
          .update({
            sort_order: index,
            alt_text: form.name.trim(),
            assigned_color_name: image.assignedColorName,
            assigned_color_hex: image.assignedColorHex,
          })
          .eq('id', image.id)

        if (sortOrderError) {
          throw new Error(sortOrderError.message)
        }
      }

      const remoteStartIndex = existingImages.length
      for (const [index, image] of remoteImages.entries()) {
        const { error: imageInsertError } = await supabase.from('product_images').insert({
          owner_id: user.id,
          product_id: productId,
          storage_path: null,
          public_url: image.url,
          alt_text: form.name.trim(),
          assigned_color_name: image.assignedColorName,
          assigned_color_hex: image.assignedColorHex,
          sort_order: remoteStartIndex + index,
        })

        if (imageInsertError) {
          throw new Error(imageInsertError.message || 'Nao foi possivel salvar o link da imagem.')
        }
      }

      const newStartIndex = existingImages.length + remoteImages.length
      const totalNewImages = newImages.length

      if (totalNewImages > 0) {
        setUploadProgress({ completed: 0, total: totalNewImages })
      }

      const uploadedPaths: string[] = []
      const uploadedImageIds: string[] = []

      try {
        const CONCURRENCY = 3

        for (let batchStart = 0; batchStart < newImages.length; batchStart += CONCURRENCY) {
          const batch = newImages.slice(batchStart, batchStart + CONCURRENCY)

          const batchResults = await Promise.allSettled(
            batch.map(async (image, batchIndex) => {
              const globalIndex = newStartIndex + batchStart + batchIndex
              const optimized = await imageCompression(image.file, {
                maxSizeMB: 0.3,
                maxWidthOrHeight: 1600,
                useWebWorker: true,
              })

              const extension = optimized.name.split('.').pop()?.toLowerCase() || 'jpg'
              const path = `${user.id}/${productId}/${crypto.randomUUID()}.${extension}`

              const { error: uploadError } = await supabase.storage.from('product-images').upload(path, optimized, {
                cacheControl: '3600',
                upsert: false,
                contentType: optimized.type || image.file.type || 'image/jpeg',
              })

              if (uploadError) {
                throw new Error(uploadError.message)
              }

              uploadedPaths.push(path)

              const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)

              const { error: imageInsertError } = await supabase.from('product_images').insert({
                owner_id: user.id,
                product_id: productId,
                storage_path: path,
                public_url: publicUrlData.publicUrl,
                alt_text: form.name.trim(),
                assigned_color_name: image.assignedColorName,
                assigned_color_hex: image.assignedColorHex,
                sort_order: globalIndex,
              })

              if (imageInsertError) {
                throw new Error(imageInsertError.message || 'Nao foi possivel salvar as imagens.')
              }

              return { path, globalIndex }
            })
          )

          setUploadProgress({
            completed: Math.min(batchStart + CONCURRENCY, totalNewImages),
            total: totalNewImages,
          })

          const failed = batchResults.filter((r) => r.status === 'rejected')
          if (failed.length > 0) {
            const firstError = (failed[0] as PromiseRejectedResult).reason
            throw new Error(firstError instanceof Error ? firstError.message : 'Falha ao processar imagens.')
          }
        }
      } catch (uploadError) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from('product-images').remove(uploadedPaths)
        }

        if (uploadedImageIds.length > 0) {
          await supabase.from('product_images').delete().in('id', uploadedImageIds)
        }

        throw uploadError
      } finally {
        setUploadProgress(null)
      }

      removedExistingImageIdsRef.current = []
      removedExistingStoragePathsRef.current = []
      if (mode === 'create') {
        setRequestId(crypto.randomUUID())
      }
      setHasSubmittedSuccessfully(true)
      draft.clearDraft()
      showToast('success', mode === 'edit' ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.')

      if (mode === 'create') {
        setTimeout(() => {
          startTransition(() => {
            setForm(initialState)
            setStep(0)
            setProductType('variant')
            setColorGroups([])
            setImages(initialImages)
            imagesRef.current = initialImages
            setCategoryDraft('')
            setBrandDraft('')
            setSizeDrafts({})
            setImageUrlDraft('')
            setHasSubmittedSuccessfully(false)
            setIsSubmitting(false)
            submissionLockRef.current = false
            window.scrollTo({ top: 0, behavior: 'smooth' })
          })
        }, 1500)
      } else {
        startTransition(() => {
          router.refresh()
        })
        submissionLockRef.current = false
        setIsSubmitting(false)
      }
    } catch (submitError) {
      submissionLockRef.current = false
      setIsSubmitting(false)
      setUploadProgress(null)
      showToast('error', submitError instanceof Error ? submitError.message : 'Falha ao salvar o produto.')
    }
  }

  return (
    <>
      {showDraftRestoreDialog && mode === 'create' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">Rascunho encontrado</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Voce tem um rascunho salvo. Deseja restaura-lo ou comecar um novo cadastro?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={discardDraftDialog}>
                Novo cadastro
              </Button>
              <Button type="button" size="sm" className="rounded-xl" onClick={restoreDraft}>
                Restaurar rascunho
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] sm:p-6 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.18),transparent_48%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.09),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(148,163,184,0.12),transparent_26%)]"
        />

        <div className="relative space-y-6">
          <div className="grid gap-3 xl:grid-cols-5">
            {stepItems.map((item, index) => {
              const Icon = item.icon
              const isActive = step === index
              const isCompleted = isStepComplete(index)

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Etapa ${index + 1}: ${item.title}${isCompleted ? ' (concluida)' : isActive ? ' (atual)' : ''}`}
                  className={cn(
                    'group rounded-[1.5rem] border p-4 text-left transition-all',
                    isActive
                      ? 'border-slate-300 bg-white shadow-md ring-1 ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-600'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : 'border-slate-200 bg-white/90 text-slate-600 dark:border-slate-800 dark:bg-slate-900/85 dark:text-slate-300',
                    isActive
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      : isCompleted
                        ? 'hover:border-emerald-200 hover:bg-emerald-50/70 dark:hover:border-emerald-500/35 dark:hover:bg-emerald-500/15'
                        : 'hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-2xl ring-1',
                        isActive
                          ? 'bg-slate-900 text-white ring-slate-900 dark:bg-blue-500 dark:ring-blue-500'
                          : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20'
                            : 'bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:ring-slate-700'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                        isActive
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                          : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-4 text-sm font-semibold',
                      isActive
                        ? 'text-slate-950 dark:text-slate-50'
                        : isCompleted
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : 'text-slate-900 dark:text-slate-100'
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      isActive
                        ? 'text-slate-600 dark:text-slate-300'
                        : isCompleted
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {item.description}
                  </p>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 0 ? (
              <StepShell
                title="Informacoes basicas do produto"
                description="Preencha os dados essenciais para o cadastro."
              >
                <div className="space-y-5">
                  <FieldGroup label="Nome do produto" hint="Campo principal usado em listagens, buscas e SKU.">
                    <Input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ex.: Camiseta oversized premium"
                      className="h-11"
                    />
                  </FieldGroup>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <FieldGroup label="Descricao resumida" hint="Texto curto usado em cards, listas e destaques.">
                      <Textarea
                        value={form.shortDescription}
                        onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))}
                        placeholder="Resumo curto para lista e card."
                        className="min-h-28 bg-white dark:bg-slate-950"
                      />
                    </FieldGroup>
                    <FieldGroup label="Descricao completa" hint="Detalhes, materiais, modelagem e cuidados.">
                      <Textarea
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Descreva o produto com mais profundidade."
                        className="min-h-28"
                      />
                    </FieldGroup>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <CreatableField
                      label="Categoria"
                      hint="Use as categorias criadas em Produtos > Categorias."
                      value={form.category}
                      draft={categoryDraft}
                      options={options.categories}
                      placeholder="Ex.: Camisetas"
                      onDraftChange={setCategoryDraft}
                      onSelect={(value) => setForm((current) => ({ ...current, category: value }))}
                    />
                    <CreatableField
                      label="Marca"
                      value={form.brand}
                      draft={brandDraft}
                      options={options.brands}
                      placeholder="Ex.: Pow jeans"
                      onDraftChange={setBrandDraft}
                      onSelect={(value) => setForm((current) => ({ ...current, brand: value }))}
                    />
                    <FieldGroup label="Colecao" hint="Nome da colecao a que pertence.">
                      <Input
                        value={form.collection}
                        onChange={(event) => setForm((current) => ({ ...current, collection: event.target.value }))}
                        placeholder="Ex.: Verao 2025"
                        className="h-11"
                      />
                    </FieldGroup>
                    <FieldGroup label="Publico" hint="Segmento de publico-alvo.">
                      <select
                        value={form.audience}
                        onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-slate-700 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:border-slate-600 dark:focus-visible:ring-slate-800"
                      >
                        <option value="">Nenhum</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Infantil">Infantil</option>
                        <option value="Unissex">Unissex</option>
                      </select>
                    </FieldGroup>
                  </div>

                  <Card className="border-0 bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-950/70 dark:ring-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Preco</CardTitle>
                      <CardDescription>Defina o valor de venda e, opcionalmente, um preco anterior para promocao.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                      <FieldGroup label="Preco de venda" hint="Valor que o cliente pagara.">
                        <Input
                          inputMode="decimal"
                          value={form.price}
                          onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                          placeholder="89.90"
                          className="h-11 bg-white text-lg font-semibold dark:bg-slate-900"
                        />
                      </FieldGroup>
                      <div className="hidden items-center pt-6 text-sm text-slate-400 dark:text-slate-500 sm:flex">ou</div>
                      <FieldGroup label="Preco promocional (De/Por)" hint="Preco anterior para destacar desconto. Opcional.">
                        <Input
                          inputMode="decimal"
                          value={form.compare_at_price}
                          onChange={(event) => setForm((current) => ({ ...current, compare_at_price: event.target.value }))}
                          placeholder="119.90"
                          className="h-11 bg-white dark:bg-slate-900"
                        />
                      </FieldGroup>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Deseja informar medidas do produto?</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Peso, altura, largura e comprimento para calculo de frete.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMeasures((current) => !current)}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                          showMeasures ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={showMeasures}
                        aria-label="Informar medidas"
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            showMeasures ? 'translate-x-[22px]' : 'translate-x-[2px]'
                          }`}
                        />
                      </button>
                    </CardContent>
                    {showMeasures ? (
                      <CardContent className="grid gap-4 border-t border-slate-100 px-5 pb-5 sm:grid-cols-2 dark:border-slate-800">
                        <FieldGroup label="Peso (kg)">
                          <Input type="number" step="0.01" min="0" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.30" className="h-11" />
                        </FieldGroup>
                        <FieldGroup label="Largura (cm)">
                          <Input type="number" step="0.1" min="0" value={form.width} onChange={(e) => setForm(f => ({ ...f, width: e.target.value }))} placeholder="20" className="h-11" />
                        </FieldGroup>
                        <FieldGroup label="Altura (cm)">
                          <Input type="number" step="0.1" min="0" value={form.height} onChange={(e) => setForm(f => ({ ...f, height: e.target.value }))} placeholder="30" className="h-11" />
                        </FieldGroup>
                        <FieldGroup label="Comprimento (cm)">
                          <Input type="number" step="0.1" min="0" value={form.length} onChange={(e) => setForm(f => ({ ...f, length: e.target.value }))} placeholder="5" className="h-11" />
                        </FieldGroup>
                      </CardContent>
                    ) : null}
                  </Card>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldGroup label="Destaque na Loja" hint="Exibe na secao principal de destaques da Home.">
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/80">
                        <input
                          type="checkbox"
                          checked={form.is_featured}
                          onChange={(e) => setForm(current => ({...current, is_featured: e.target.checked}))}
                          className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-950"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Sim, destacar este produto</span>
                      </label>
                    </FieldGroup>

                    <FieldGroup label="Status" hint="Como o produto entra no catalogo.">
                      <select
                        value={form.status}
                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-slate-700 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:border-slate-600 dark:focus-visible:ring-slate-800"
                      >
                        <option value="draft">Rascunho</option>
                        <option value="active">Ativo</option>
                        <option value="out_of_stock">Esgotado</option>
                        <option value="hidden">Oculto</option>
                      </select>
                    </FieldGroup>
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-950/70 dark:hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={form.show_specs}
                      onChange={(e) => setForm((f) => ({ ...f, show_specs: e.target.checked }))}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Exibir especificacoes tecnicas na pagina do produto</span>
                  </label>
                </div>
              </StepShell>
            ) : null}

            {step === 1 ? (
              <StepShell
                title="Variacoes por cor e tamanho"
                description="Defina o tipo de produto primeiro. Se houver variacoes, a estrutura segue produto, cor e tamanhos."
              >
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleProductTypeChange('simple')}
                      className={cn(
                        'rounded-[1.5rem] border p-5 text-left transition-all',
                        productType === 'simple'
                          ? 'border-slate-400 bg-slate-50 shadow-sm ring-1 ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:ring-slate-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                      )}
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Produto simples</p>
                      <p className={cn('mt-2 text-sm', productType === 'simple' ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400')}>
                        Cadastro mais direto, com uma linha unica por cor.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProductTypeChange('variant')}
                      className={cn(
                        'rounded-[1.5rem] border p-5 text-left transition-all',
                        productType === 'variant'
                          ? 'border-slate-400 bg-slate-50 shadow-sm ring-1 ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:ring-slate-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                      )}
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Produto com variacoes</p>
                      <p className={cn('mt-2 text-sm', productType === 'variant' ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400')}>
                        Organize por cor e cadastre os tamanhos P, M, G, GG ou outros necessarios.
                      </p>
                    </button>
                  </div>

                  <Card className="border-0 bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-950/70 dark:ring-slate-800">
                    <CardHeader>
                      <CardTitle>Adicionar cor</CardTitle>
                      <CardDescription>Crie um bloco independente para cada cor do produto.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 px-5 pb-5">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
                        <FieldGroup label="Nome da cor">
                          <Input
                            value={newColorName}
                            onChange={(event) => setNewColorName(event.target.value)}
                            placeholder="Ex.: Azul royal"
                            className="h-11 bg-white dark:bg-slate-900"
                          />
                        </FieldGroup>

                        <FieldGroup label="Cor (hexadecimal)">
                          <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
                            <input
                              type="color"
                              value={newColorHex}
                              onChange={(event) => setNewColorHex(normalizeHex(event.target.value))}
                              className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0"
                            />
                            <Input
                              value={newColorHex}
                              onChange={(event) => setNewColorHex(normalizeHex(event.target.value))}
                              className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
                            />
                          </div>
                        </FieldGroup>

                        <Button type="button" size="lg" className="h-11 rounded-xl" onClick={addColorGroup}>
                          <Plus className="h-4 w-4" />
                          Adicionar cor
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Cores rapidas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {commonColors.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => {
                                setNewColorName(color.name)
                                setNewColorHex(color.hex)
                              }}
                              className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-slate-200 shadow-sm dark:border-slate-600"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                                {color.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {colorGroups.length === 0 ? (
                    <Card className="border-dashed bg-slate-50/80 text-center ring-1 ring-slate-200 dark:bg-slate-950/60 dark:ring-slate-800">
                      <CardContent className="px-6 py-12">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-100">Adicione uma cor para comecar</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Cada cor vira um bloco proprio para facilitar manutencao e leitura.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {colorGroups.map((group) => (
                        <Card
                          key={group.id}
                          className="overflow-visible border-0 bg-white ring-1 ring-slate-200 shadow-[0_16px_50px_-38px_rgba(15,23,42,0.4)] dark:bg-slate-900 dark:ring-slate-800"
                        >
                          <CardHeader className="gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                            <div className="flex items-start gap-3">
                              <span
                                className="mt-0.5 h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600"
                                style={{ backgroundColor: group.hex }}
                              />
                              <div>
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>
                                  {group.hex} • {group.variants.length} item(ns) nessa cor
                                </CardDescription>
                              </div>
                            </div>
                            <CardAction>
                              <Button type="button" variant="destructive" size="sm" onClick={() => removeColorGroup(group.id)}>
                                <Trash2 className="h-4 w-4" />
                                Remover
                              </Button>
                            </CardAction>
                          </CardHeader>

                          <CardContent className="space-y-4 px-5 pb-5">
                            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950/80 dark:ring-slate-800">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                    {useSizes ? 'Tamanhos dessa cor' : 'Configuracao dessa cor'}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {useSizes
                                      ? 'Adicione tamanhos predefinidos ou crie um tamanho personalizado.'
                                      : 'Cada cor fica com uma unica linha de estoque, preco e SKU.'}
                                  </p>
                                </div>

                                {useSizes ? (
                                  <div className="flex flex-col gap-3 lg:items-end">
                                    <div className="flex flex-wrap gap-2">
                                      {suggestedSizes.map((size) => (
                                        <button
                                          key={size}
                                          type="button"
                                          onClick={() => addVariantToGroup(group.id, size)}
                                          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
                                        >
                                          {size}
                                        </button>
                                      ))}
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                      <Input
                                        value={sizeDrafts[group.id] ?? ''}
                                        onChange={(event) =>
                                          setSizeDrafts((current) => ({ ...current, [group.id]: event.target.value }))
                                        }
                                        placeholder="Outro tamanho"
                                        className="h-10 w-full bg-white dark:bg-slate-900 sm:w-40"
                                      />
                                      <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => addVariantToGroup(group.id)}>
                                        <Plus className="h-4 w-4" />
                                        Adicionar tamanho
                                      </Button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <div className="mt-4 space-y-3">
                                {group.variants.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                    Adicione um tamanho para esta cor.
                                  </div>
                                ) : (
                                  group.variants.map((variant, index) => (
                                    <div
                                      key={variant.id}
                                      className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2 xl:grid-cols-[100px_100px_120px_120px_120px_minmax(0,1fr)_auto]"
                                    >
                                      <FieldGroup label={useSizes ? 'Tamanho' : 'Variacao'}>
                                        {useSizes ? (
                                          <Input
                                            value={variant.size}
                                            onChange={(event) => updateVariant(group.id, variant.id, 'size', event.target.value)}
                                            placeholder="Ex.: M"
                                            className="h-10"
                                          />
                                        ) : (
                                          <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                            Unico
                                          </div>
                                        )}
                                      </FieldGroup>

                                      <FieldGroup label="Estoque">
                                        <Input
                                          type="number"
                                          min="0"
                                          value={variant.stock}
                                          onChange={(event) => updateVariant(group.id, variant.id, 'stock', event.target.value)}
                                          className="h-10"
                                        />
                                      </FieldGroup>

                                      <FieldGroup label="Preco">
                                        <Input
                                          inputMode="decimal"
                                          value={variant.price}
                                          onChange={(event) => updateVariant(group.id, variant.id, 'price', event.target.value)}
                                          placeholder={form.price || '89.90'}
                                          className="h-10"
                                        />
                                      </FieldGroup>

                                      <FieldGroup label="Preco Antigo">
                                        <Input
                                          inputMode="decimal"
                                          value={variant.compare_at_price}
                                          onChange={(event) => updateVariant(group.id, variant.id, 'compare_at_price', event.target.value)}
                                          placeholder={form.compare_at_price || '119.90'}
                                          className="h-10"
                                        />
                                      </FieldGroup>

                                      <FieldGroup label="Status">
                                        <select
                                          value={variant.status}
                                          onChange={(event) =>
                                            updateVariant(group.id, variant.id, 'status', event.target.value as ProductVariantStatus)
                                          }
                                          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-slate-700 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:border-slate-600 dark:focus-visible:ring-slate-800"
                                        >
                                          <option value="active">Ativa</option>
                                          <option value="inactive">Inativa</option>
                                        </select>
                                      </FieldGroup>

                                      <FieldGroup label="SKU">
                                        <Input
                                          value={variant.sku}
                                          onChange={(event) => updateVariant(group.id, variant.id, 'sku', event.target.value)}
                                          placeholder={createVariantSku(form.name, group.name, useSizes ? variant.size : 'Unico', index)}
                                          className="h-10"
                                        />
                                      </FieldGroup>

                                      <div className="flex items-end">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon-lg"
                                          className="rounded-xl"
                                          disabled={!useSizes && group.variants.length === 1}
                                          onClick={() => removeVariantFromGroup(group.id, variant.id)}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </StepShell>
            ) : null}

            {step === 2 ? (
              <StepShell
                title="Galeria de imagens do produto"
                description="Mantenha o upload separado das variacoes, com drag and drop, preview e ordenacao por arraste."
              >
                <div className="space-y-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => handleFileSelection(event.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDraggingFiles(true)
                    }}
                    onDragLeave={() => setIsDraggingFiles(false)}
                    onDrop={handleImageDrop}
                    className={cn(
                      'w-full rounded-[1.75rem] border-2 border-dashed px-5 py-8 text-left transition-colors',
                      isDraggingFiles
                        ? 'border-slate-900 bg-slate-100 dark:border-blue-400 dark:bg-blue-500/10'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-950/70 dark:hover:border-slate-600 dark:hover:bg-slate-900'
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-100">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Upload multiplo com drag and drop</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Arraste imagens para ca ou clique para selecionar os arquivos.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                        {images.length} arquivo(s)
                      </span>
                    </div>
                  </button>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Adicionar imagem por link</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Cole uma URL publica da imagem para usar na galeria sem fazer upload do arquivo.
                        </p>
                        <input
                          type="url"
                          value={imageUrlDraft}
                          onChange={(event) => setImageUrlDraft(event.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              appendImageUrl()
                            }
                          }}
                          placeholder="https://exemplo.com/minha-imagem.webp"
                          className="mt-3 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-slate-700 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:border-slate-600 dark:focus-visible:ring-slate-800"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" className="h-11 rounded-xl px-5" onClick={appendImageUrl}>
                          Adicionar link
                        </Button>
                      </div>
                    </div>
                  </div>

                  {images.length === 0 ? (
                    <Card className="border-dashed bg-slate-50/80 text-center ring-1 ring-slate-200 dark:bg-slate-950/60 dark:ring-slate-800">
                      <CardContent className="px-6 py-12">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-100">Nenhuma imagem adicionada ainda</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Envie a galeria do produto para continuar com a revisao final.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {images.map((image, index) => (
                        <Card
                          key={image.id}
                          draggable
                          onDragStart={() => setDraggedImageId(image.id)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (!draggedImageId) {
                              return
                            }
                            updateImages(moveItem(imagesRef.current, draggedImageId, image.id, (item) => item.id))
                            setDraggedImageId(null)
                          }}
                          onDragEnd={() => setDraggedImageId(null)}
                          className={cn(
                            'overflow-hidden border-0 bg-white ring-1 ring-slate-200 transition-shadow dark:bg-slate-900 dark:ring-slate-800',
                            draggedImageId === image.id && 'shadow-lg shadow-slate-300/60'
                          )}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image.url} alt={`Imagem ${index + 1}`} className="h-full w-full object-cover" />
                            <div className="absolute left-3 top-3 flex items-center gap-2">
                              <span className="rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                                {index === 0 ? 'Capa' : `#${index + 1}`}
                              </span>
                              <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                                Arraste para ordenar
                              </span>
                            </div>
                          </div>

                          <CardContent className="space-y-4 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                                  {image.kind === 'new'
                                    ? image.file.name
                                    : image.kind === 'remote'
                                      ? `Link externo ${index + 1}`
                                      : `Imagem ${index + 1}`}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {image.assignedColorName ? `Vinculada a ${image.assignedColorName}` : 'Sem cor vinculada'}
                                </p>
                                {image.kind === 'remote' ? (
                                  <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">{image.url}</p>
                                ) : null}
                              </div>
                              <GripVertical className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>

                            <FieldGroup label="Cor da imagem">
                              <select
                                value={image.assignedColorHex ?? ''}
                                onChange={(event) => assignImageColor(image.id, event.target.value)}
                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-slate-700 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:border-slate-600 dark:focus-visible:ring-slate-800"
                              >
                                <option value="">Sem cor vinculada</option>
                                {colors.map((color) => (
                                  <option key={color.hex} value={color.hex}>
                                    {color.name}
                                  </option>
                                ))}
                              </select>
                            </FieldGroup>
                          </CardContent>

                          <CardFooter className="justify-between gap-3 border-t border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/80">
                            <Button type="button" variant="outline" size="sm" onClick={() => setCoverImage(image.id)}>
                              Definir capa
                            </Button>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(image.id)}>
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </StepShell>
            ) : null}

            {step === 3 ? (
              <StepShell
                title="Revisao final"
                description="Verifique como o produto sera exibido na sua loja online."
              >
                <div className="grid gap-4">
                  <Card className="border-0 bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <CardHeader>
                      <CardTitle>Preview na loja</CardTitle>
                      <CardDescription>
                        Simulacao da vitrine com imagem principal, galeria, preco e variacoes.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
                        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)] ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                          <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-950">
                            {previewImage ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewImage.url} alt={form.name || 'Preview do produto'} className="h-full w-full object-cover" />
                              </>
                            ) : (
                              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400 dark:text-slate-500">
                                A imagem de capa aparecera aqui.
                              </div>
                            )}
                            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
                              {form.category || 'Categoria'}
                            </div>
                          </div>
                          <div className="space-y-4 p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                  Improve Styles
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Preview do Card</p>
                              </div>
                              <div className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700 ring-1 ring-cyan-100">
                                {form.status === 'active' ? 'Ativo' : 'Rascunho'}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                                {form.name || 'Nome do produto'}
                              </h4>
                              <p className="line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {form.shortDescription || 'Resumo curto aparecerá aqui.'}
                              </p>
                            </div>

                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Preco</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">{formatCurrency(previewPrice)}</p>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{totalStock} em estoque</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Variacoes disponiveis</p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              {colorGroups.map((group) => (
                                <div key={group.id} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                                  <span className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-600" style={{ backgroundColor: group.hex }} />
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{group.name}</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              {colorGroups.flatMap((group) => group.variants).map((variant) => (
                                <span
                                  key={variant.id}
                                  className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                                >
                                  {variant.size}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Galeria ({images.length})</p>
                            {images.length > 0 ? (
                              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {images.map((image, index) => (
                                  <div key={image.id} className="overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                                    <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={image.url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Nenhuma imagem na galeria.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </StepShell>
            ) : null}

            <Card className="border-0 bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {uploadProgress ? (
                    <span className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Enviando imagens: {uploadProgress.completed} de {uploadProgress.total}
                    </span>
                  ) : step < stepItems.length - 1
                    ? 'Avance etapa por etapa para reduzir erros no cadastro.'
                    : 'Revise os dados e finalize o cadastro do produto.'}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="rounded-xl"
                    disabled={step === 0 || isSubmitting}
                    onClick={() => setStep((current) => Math.max(current - 1, 0))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </Button>

                  {step < stepItems.length - 1 ? (
                    <Button key="btn-next" type="button" size="lg" className="rounded-xl" disabled={isSubmitting} onClick={goToNextStep}>
                      Proxima etapa
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button key="btn-submit" type="submit" size="lg" className="rounded-xl" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {mode === 'edit' ? 'Salvar alteracoes' : 'Cadastrar produto'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

      {toast ? (
        <div className="fixed right-4 top-4 z-50 w-[min(360px,calc(100vw-2rem))]">
          <div
            className={cn(
              'rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur',
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200'
                : 'border-red-200 bg-red-50/95 text-red-900 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200'
            )}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}
