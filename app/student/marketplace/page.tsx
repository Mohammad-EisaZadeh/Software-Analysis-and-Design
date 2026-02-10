'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { marketplaceApi } from '@/lib/api';

export default function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await marketplaceApi.getProducts();
        if (Array.isArray(response.data)) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: number) => {
    try {
      const response = await marketplaceApi.addToCart({ productId, quantity: 1 });
      if (response.error) {
        alert(response.error);
      } else {
        alert('Added to cart!');
      }
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h1>
        <p className="text-gray-600">Reserve food, dormitory, and event tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: any) => (
          <Card key={product.id} hover>
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-4">
                <p className="text-xl font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Stock: {product.stock || 0}</span>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={!product.stock || product.stock <= 0}
                  >
                    <Plus size={16} className="mr-1" />
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No items available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




