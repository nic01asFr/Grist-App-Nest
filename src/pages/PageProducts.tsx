/**
 * Products Page - Product catalog management
 */

import { useMemo } from 'react';
import { useGristData } from '@api/hooks/useGristData';
import { DataTable, StatsCard, PieChart, Badge } from '@templates';
import type { ProductRecord } from '@core/types';

export default function PageProducts() {
  const { data: products, loading } = useGristData<ProductRecord>('Produits');

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce(
      (sum, p) => sum + (p.prix || 0) * (p.stock || 0),
      0
    );
    const lowStock = products.filter((p) => (p.stock || 0) < 10).length;

    return { totalStock, totalValue, lowStock };
  }, [products]);

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    const categories = products.reduce((acc: Record<string, number>, p) => {
      const cat = p.categorie || 'Non catégorisé';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  }, [products]);

  // Table columns
  const columns = [
    { key: 'nom', label: 'Nom' },
    {
      key: 'prix',
      label: 'Prix',
      render: (value: number) => `${value.toLocaleString('fr-FR')} €`,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value: number) => (
        <Badge
          variant={value < 10 ? 'error' : value < 20 ? 'warning' : 'success'}
          icon={value < 10 ? '⚠️' : value < 20 ? '📦' : '✅'}
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'categorie',
      label: 'Catégorie',
      render: (value: string) => (
        <Badge variant="info" icon="🏷️">
          {value}
        </Badge>
      ),
    },
    { key: 'description', label: 'Description' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <span>📦</span>
        <span>Catalogue Produits</span>
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Produits"
          value={products.length}
          icon="📦"
          color="blue"
        />
        <StatsCard
          title="Stock Total"
          value={metrics.totalStock}
          icon="📊"
          color="green"
        />
        <StatsCard
          title="Valeur Stock"
          value={`${metrics.totalValue.toLocaleString('fr-FR')} €`}
          icon="💰"
          color="purple"
        />
        <StatsCard
          title="Stock Faible"
          value={metrics.lowStock}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PieChart
          data={categoryData}
          title="Distribution par Catégorie"
          height={300}
        />
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Produits à Faible Stock
          </h3>
          <div className="space-y-3">
            {products
              .filter((p) => (p.stock || 0) < 10)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                >
                  <span className="font-medium text-gray-800">
                    {product.nom}
                  </span>
                  <Badge variant="error" icon="⚠️">
                    {product.stock} en stock
                  </Badge>
                </div>
              ))}
            {products.filter((p) => (p.stock || 0) < 10).length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Aucun produit à faible stock
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable data={products} columns={columns} />
    </div>
  );
}
