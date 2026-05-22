'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Eye, Edit2, Trash2, Plus, X, Grid3X3, List, Image as ImageIcon, Package, AlertCircle, TrendingUp, DollarSign, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from '@/components/Admin/Producct/Header';
import SummaryCards from '@/components/Admin/Producct/SummaryCards';
import FilterSection from '@/components/Admin/Producct/FilterSection';
import TableView from '@/components/Admin/Producct/TableView';
import InventoryGrid from '@/components/Admin/Producct/GridView';


const mockProducts = [
    { id: '1', name: 'Laptop Pro', category: 'Electronics', costPrice: 45000, sellingPrice: 65000, profit: 20000, stock: 12, status: 'In Stock' },
    { id: '2', name: 'Wireless Mouse', category: 'Electronics', costPrice: 1200, sellingPrice: 1800, profit: 600, stock: 45, status: 'In Stock' },
    { id: '3', name: 'USB-C Cable', category: 'Electronics', costPrice: 300, sellingPrice: 500, profit: 200, stock: 3, status: 'Low Stock' },
    { id: '4', name: 'Designer T-Shirt', category: 'Clothing', costPrice: 800, sellingPrice: 1500, profit: 700, stock: 28, status: 'In Stock' },
    { id: '5', name: 'Running Shoes', category: 'Sports & Outdoors', costPrice: 2500, sellingPrice: 4500, profit: 2000, stock: 15, status: 'In Stock' },
    { id: '6', name: 'Coffee Machine', category: 'Home & Garden', costPrice: 8000, sellingPrice: 12000, profit: 4000, stock: 0, status: 'Out of Stock' },
    { id: '7', name: 'Novel Book', category: 'Books', costPrice: 400, sellingPrice: 650, profit: 250, stock: 50, status: 'In Stock' },
    { id: '8', name: 'Yoga Mat', category: 'Sports & Outdoors', costPrice: 1500, sellingPrice: 2500, profit: 1000, stock: 5, status: 'Low Stock' },
];

const ITEMS_PER_PAGE = 8;

export default function Products({ onNavigate }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        description: '',
        commission: '',
    });

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = mockProducts.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            const matchesStock =
                stockFilter === 'all' ||
                (stockFilter === 'low' && product.status === 'Low Stock') ||
                (stockFilter === 'out' && product.status === 'Out of Stock');
            return matchesSearch && matchesCategory && matchesStock;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return b.sellingPrice - a.sellingPrice;
                case 'stock':
                    return b.stock - a.stock;
                case 'profit':
                    return b.profit - a.profit;
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }, [searchTerm, categoryFilter, stockFilter, sortBy]);

    const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredAndSortedProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalProducts = mockProducts.length;
    const lowStockProducts = mockProducts.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
    const topSellingProduct = mockProducts.reduce((max, p) => (p.sellingPrice * p.stock > max.sellingPrice * max.stock ? p : max));
    const totalInventoryValue = mockProducts.reduce((sum, p) => sum + p.sellingPrice * p.stock, 0);
    const avgProfit = mockProducts.length > 0 ? mockProducts.reduce((sum, p) => sum + p.profit, 0) / mockProducts.length : 0;

    const handleAddProduct = () => {
        if (newProduct.name && newProduct.category && newProduct.costPrice && newProduct.sellingPrice) {
            setShowModal(false);
            setNewProduct({ name: '', category: '', costPrice: '', sellingPrice: '', stock: '', description: '', commission: '' });
        }
    };

    const handleBulkDelete = () => {
        if (selectedProducts.length > 0) {
            alert(`Deleted ${selectedProducts.length} products`);
            setSelectedProducts([]);
        }
    };

    const handleExport = () => {
        const csv = [
            ['Name', 'Category', 'Cost Price', 'Selling Price', 'Profit', 'Stock', 'Status'],
            ...filteredAndSortedProducts.map(p => [
                p.name, p.category, p.costPrice, p.sellingPrice, p.profit, p.stock, p.status
            ])
        ].map(row => row.join(',')).join('\n');

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', 'products.csv');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <>
            <div className="space-y-8">
                {/* --- Header Section --- */}
                <Header setShowModal={setShowModal} selectedProducts={selectedProducts} handleBulkDelete={handleBulkDelete} handleExport={handleExport} />
                {/* Summary Cards */}
                <SummaryCards totalProducts={totalProducts} lowStockProducts={lowStockProducts} topSellingProduct={topSellingProduct} totalInventoryValue={totalInventoryValue} />

                {/* Filters Section */}
                <FilterSection
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    stockFilter={stockFilter}
                    setStockFilter={setStockFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onPageReset={setCurrentPage}
                    totalResults={filteredAndSortedProducts.length}
                    startIndex={filteredAndSortedProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                    endIndex={Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProducts.length)}
                />
            </div>

            <div className="mt-8">
                {viewMode === 'table' ? (
                    <TableView
                        products={paginatedProducts}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                        setSelectedProduct={setSelectedProduct}
                    />
                ) : (
                    <InventoryGrid
                        products={paginatedProducts}
                        setSelectedProduct={setSelectedProduct}
                    />
                )}
            </div>

            {/* Add Product Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <Card className="bg-card w-full max-w-md rounded-lg shadow-lg border border-border max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
                                <h2 className="text-xl font-bold text-foreground">Add New Product</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowModal(false)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                                    <Input
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="Enter product name"
                                        className="bg-input border-border text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                                        <SelectTrigger className="bg-input border-border text-foreground">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Electronics">Electronics</SelectItem>
                                            <SelectItem value="Clothing">Clothing</SelectItem>
                                            <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                                            <SelectItem value="Sports & Outdoors">Sports & Outdoors</SelectItem>
                                            <SelectItem value="Books">Books</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Cost Price</label>
                                    <Input
                                        type="number"
                                        value={newProduct.costPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                                        placeholder="Enter cost price"
                                        className="bg-input border-border text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Selling Price</label>
                                    <Input
                                        type="number"
                                        value={newProduct.sellingPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                                        placeholder="Enter selling price"
                                        className="bg-input border-border text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Stock Quantity</label>
                                    <Input
                                        type="number"
                                        value={newProduct.stock}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                        placeholder="Enter stock quantity"
                                        className="bg-secondary/50 border-border/50 text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Commission % (Optional)</label>
                                    <Input
                                        type="number"
                                        value={newProduct.commission}
                                        onChange={(e) => setNewProduct({ ...newProduct, commission: e.target.value })}
                                        placeholder="Enter commission percentage"
                                        className="bg-secondary/50 border-border/50 text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                                    <textarea
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        placeholder="Enter product description"
                                        className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Product Image</label>
                                    <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        <input type="file" className="hidden" accept="image/*" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleAddProduct}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        Add Product
                                    </Button>
                                    <Button
                                        onClick={() => setShowModal(false)}
                                        variant="outline"
                                        className="flex-1 border-border text-foreground"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* Product Quick View Modal */}
            {
                selectedProduct && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <Card className="bg-card w-full max-w-2xl rounded-lg shadow-lg border border-border max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
                                <h2 className="text-xl font-bold text-foreground">{selectedProduct.name}</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedProduct(null)}
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="h-48 bg-muted/40 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                                        <p className="text-sm font-semibold text-foreground">{selectedProduct.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                                        <span className={cn(
                                            'px-3 py-1 rounded-full text-xs font-medium inline-block',
                                            selectedProduct.status === 'In Stock' && 'bg-green-100/50 text-green-700',
                                            selectedProduct.status === 'Low Stock' && 'bg-amber-100/50 text-amber-700',
                                            selectedProduct.status === 'Out of Stock' && 'bg-red-100/50 text-red-700'
                                        )}>
                                            {selectedProduct.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/30 p-4 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Cost Price</p>
                                        <p className="text-lg font-bold text-foreground">₹{selectedProduct.costPrice.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Selling Price</p>
                                        <p className="text-lg font-bold text-foreground">₹{selectedProduct.sellingPrice.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-green-100/20 p-4 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Profit</p>
                                        <p className="text-lg font-bold text-green-600">₹{selectedProduct.profit.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Stock Available</p>
                                        <p className="text-lg font-bold text-foreground">{selectedProduct.stock} units</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-border">
                                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                                        <Edit2 className="h-4 w-4" />
                                        Edit Product
                                    </Button>
                                    <Button variant="destructive" className="flex-1 gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => setSelectedProduct(null)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

        </>
    );
}
