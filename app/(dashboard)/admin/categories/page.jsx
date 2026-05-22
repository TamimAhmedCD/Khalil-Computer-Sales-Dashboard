'use client'

import { useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Shadcn UI Components
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Icons
import { 
  Plus, Edit, Trash2, Search, Eye, 
  Layers, TrendingUp, Package, Loader2, Save 
} from 'lucide-react'
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// 1. Validation Schema
const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  commission: z.coerce.number().min(0, 'Min 0%').max(100, 'Max 100%'),
  description: z.string().optional(),
  status: z.boolean().default(true),
})

export default function CategoriesPage() {
const fetchCategories = async () => {
  const res = await axios.get('/api/products/categories')
  return res.data?.data || []
}

const { data: categoryData = [], isLoading, error, refetch } = useQuery({
  queryKey: ['categories'],
  queryFn: fetchCategories,
})
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 2. React Hook Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      commission: '',
      description: '',
      status: true,
    }
  })

  const statusValue = watch('status')

  // 3. Handle Form Submission with Axios
const onSubmit = async (data) => {
  setIsSubmitting(true)

  try {
    const response = await axios.post('/api/admin/shop/products/category', data)

    toast.success(response.data.message)

    refetch()

    reset()

    setIsDialogOpen(false)
  } catch (error) {
    toast.error('Failed to save category')
  } finally {
    setIsSubmitting(false)
  }
}

const statCards = [
  {
    title: 'Total Categories',
    value: categoryData?.length || 0,
    icon: <Layers className="w-5 h-5 md:w-6 md:h-6" />,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    title: 'Active Categories',
    value: categoryData?.filter(c => c.status).length || 0,
    icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
    color: 'bg-green-500/10 text-green-600',
  },
  {
    title: 'Highest Commission',
    value: categoryData?.length
      ? Math.max(...categoryData.map(c => c.commission)) + '%'
      : '0%',
    icon: <Package className="w-5 h-5 md:w-6 md:h-6" />,
    color: 'bg-purple-500/10 text-purple-600',
  },
{
  title: "Most Used Category",
  value:
    categoryData.length > 0
      ? categoryData.reduce((max, c) =>
          (c.saleCount || 0) > (max.saleCount || 0) ? c : max
        ).name
      : "N/A",
  icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
  color: "bg-orange-500/10 text-orange-600",
}
]

const filteredCategories = (categoryData || []).filter((cat) =>
  (cat?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
)

if (isLoading) return <div>Loading categories...</div>

if (error) return <div>Failed to load categories</div>
  return (
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your product taxonomy and global commissions</p>
        </div>

        {/* Shadcn Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md rounded-xl px-6 h-11">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-120 rounded-2xl border-border p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 bg-muted/20 border-b border-border">
              <DialogTitle className="text-xl font-bold">New Category</DialogTitle>
              <DialogDescription>Create a new product group and set commission rates.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground ml-1">Category Name</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Home Appliances"
                  className={`w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                    errors.name ? 'border-red-500' : 'border-border focus:border-primary'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground ml-1">Global Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('commission')}
                  placeholder="0.0"
                  className={`w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                    errors.commission ? 'border-red-500' : 'border-border focus:border-primary'
                  }`}
                />
                {errors.commission && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{errors.commission.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground ml-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Describe the types of products in this category..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-foreground">Activate Category</label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Available to vendors immediately</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('status', !statusValue)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    statusValue ? 'bg-green-600' : 'bg-zinc-400'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    statusValue ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="rounded-xl flex-1 bg-primary shadow-lg shadow-primary/20 h-11">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-card border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>{stat.icon}</div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Categories Table Container */}
      <Card className="bg-card border-border shadow-sm overflow-hidden rounded-2xl">
        <div className="p-4 md:p-6 border-b border-border bg-muted/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Commission</th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Sales</th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Revenue</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
<tbody className="divide-y divide-border">
  {filteredCategories.map((category) => (
    <tr key={category._id} className="group hover:bg-muted/30 transition-colors">

      {/* Name */}
      <td className="px-6 py-5">
        <span className="text-sm font-bold text-foreground">
          {category.name}
        </span>
        <p className="text-[10px] text-muted-foreground md:hidden">
          Created: {new Date(category.createdAt).toLocaleDateString()}
        </p>
      </td>

      {/* Commission */}
      <td className="px-6 py-5 text-sm font-medium">
        {(category.commission || 0).toFixed(1)}%
      </td>

      {/* TOTAL SALES */}
      <td className="hidden sm:table-cell px-6 py-5 text-sm text-muted-foreground">
        {category.totalSales || 0}
      </td>

      {/* PROFIT */}
      <td className="hidden sm:table-cell px-6 py-5 text-sm font-bold">
        ${Number(category.totalProfit || 0).toLocaleString()}
      </td>

      {/* STATUS */}
      <td className="px-6 py-5">
        <span
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
            category?.status
              ? "bg-green-500/10 text-green-600"
              : "bg-zinc-500/10 text-zinc-500"
          }`}
        >
          {category?.status ? "active" : "inactive"}
        </span>
      </td>

      {/* ACTIONS */}
      <td className="px-6 py-5 text-right">
        <div className="flex justify-end gap-1">
          <button className="p-2 rounded-lg hover:bg-background">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}