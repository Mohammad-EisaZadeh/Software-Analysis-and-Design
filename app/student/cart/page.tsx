'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { marketplaceApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: Cart endpoint not implemented in backend yet
    // This is a placeholder - you may need to implement cart retrieval
    setLoading(false);
  }, []);

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const handleCheckout = async () => {
    try {
      const response = await marketplaceApi.checkout();
      if (response.error) {
        alert(response.error);
      } else {
        alert('Order placed successfully!');
        router.push('/student/marketplace');
      }
    } catch (error) {
      alert('Checkout failed');
    }
  };

  const total = cartItems.reduce((sum: number, item: any) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cart</h1>
        <p className="text-gray-600">Review and manage your reservations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Reserved Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.reservedDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Calendar size={12} />
                              <span>{formatDate(item.reservedDate)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status) as any} className="capitalize">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full mt-6" size="lg" onClick={handleCheckout}>
                  Confirm Reservation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {cartItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <Button asChild>
              <a href="/student/marketplace">Browse Marketplace</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




