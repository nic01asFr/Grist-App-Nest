/**
 * Sales Page - Sales history and analytics
 */

import { useMemo } from 'react';
import { useGristData } from '@api/hooks/useGristData';
import { DataTable, StatsCard, LineChart, BarChart, Badge } from '@templates';
import type { SaleRecord, ClientRecord, ProductRecord } from '@core/types';

export default function PageSales() {
  const { data: sales, loading: loadingSales } = useGristData<SaleRecord>('Ventes');
  const { data: clients, loading: loadingClients } = useGristData<ClientRecord>('Clients');
  const { data: products, loading: loadingProducts } = useGristData<ProductRecord>('Produits');

  const loading = loadingSales || loadingClients || loadingProducts;

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + (s.montant_total || 0), 0);
    const totalQuantity = sales.reduce((sum, s) => sum + (s.quantite || 0), 0);
    const averageOrder = sales.length > 0 ? totalRevenue / sales.length : 0;

    return { totalRevenue, totalQuantity, averageOrder };
  }, [sales]);

  // Sales over time for line chart
  const salesOverTime = useMemo(() => {
    const salesByDate = sales.reduce((acc: Record<string, number>, sale) => {
      const date = sale.date || 'N/A';
      acc[date] = (acc[date] || 0) + (sale.montant_total || 0);
      return acc;
    }, {});

    return Object.entries(salesByDate)
      .map(([date, montant]) => ({ date, montant }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sales]);

  // Sales by product for bar chart
  const salesByProduct = useMemo(() => {
    const productSales: Record<number, { nom: string; montant: number; quantite: number }> = {};

    sales.forEach((sale) => {
      const productId = sale.produit_id;
      if (!productSales[productId]) {
        const product = products.find((p) => p.id === productId);
        productSales[productId] = {
          nom: product?.nom || 'Produit inconnu',
          montant: 0,
          quantite: 0,
        };
      }
      productSales[productId].montant += sale.montant_total || 0;
      productSales[productId].quantite += sale.quantite || 0;
    });

    return Object.values(productSales).sort((a, b) => b.montant - a.montant);
  }, [sales, products]);

  // Table columns
  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
    },
    {
      key: 'client_id',
      label: 'Client',
      render: (value: number) => {
        const client = clients.find((c) => c.id === value);
        return client?.nom || 'Client inconnu';
      },
    },
    {
      key: 'produit_id',
      label: 'Produit',
      render: (value: number) => {
        const product = products.find((p) => p.id === value);
        return product?.nom || 'Produit inconnu';
      },
    },
    {
      key: 'quantite',
      label: 'Quantité',
      render: (value: number) => (
        <Badge variant="info" icon="📦">
          {value}
        </Badge>
      ),
    },
    {
      key: 'prix_unitaire',
      label: 'Prix unitaire',
      render: (value: number) => `${value.toLocaleString('fr-FR')} €`,
    },
    {
      key: 'montant_total',
      label: 'Montant total',
      render: (value: number) => (
        <span className="font-bold text-green-600">
          {value.toLocaleString('fr-FR')} €
        </span>
      ),
    },
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
        <span>💰</span>
        <span>Ventes et Chiffre d'Affaires</span>
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Ventes"
          value={sales.length}
          icon="📊"
          color="blue"
          trend={15}
        />
        <StatsCard
          title="Chiffre d'Affaires"
          value={`${metrics.totalRevenue.toLocaleString('fr-FR')} €`}
          icon="💵"
          color="green"
          trend={18}
        />
        <StatsCard
          title="Articles Vendus"
          value={metrics.totalQuantity}
          icon="📦"
          color="purple"
        />
        <StatsCard
          title="Panier Moyen"
          value={`${Math.round(metrics.averageOrder).toLocaleString('fr-FR')} €`}
          icon="🛒"
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <LineChart
          data={salesOverTime}
          xKey="date"
          yKeys={[
            { key: 'montant', label: 'Chiffre d\'Affaires (€)', color: '#10b981' },
          ]}
          title="Évolution du Chiffre d'Affaires"
          height={300}
        />

        <BarChart
          data={salesByProduct}
          xKey="nom"
          yKeys={[
            { key: 'montant', label: 'Montant (€)', color: '#3b82f6' },
            { key: 'quantite', label: 'Quantité', color: '#f59e0b' },
          ]}
          title="Ventes par Produit"
          height={300}
        />
      </div>

      {/* Data Table */}
      <DataTable data={sales} columns={columns} />
    </div>
  );
}
