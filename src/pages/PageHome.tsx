/**
 * Home Page - Dashboard with metrics
 */

import { useMemo } from 'react';
import { useGristData } from '@api/hooks/useGristData';
import { StatsCard } from '@templates';
import type { ClientRecord, ProductRecord, SaleRecord } from '@core/types';

export default function PageHome() {
  const { data: clients } = useGristData<ClientRecord>('Clients');
  const { data: products } = useGristData<ProductRecord>('Produits');
  const { data: sales } = useGristData<SaleRecord>('Ventes');

  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.montant_total || 0), 0);
    const activeClients = clients.filter((c) => c.statut === 'Actif').length;

    return {
      clients: clients.length,
      activeClients,
      products: products.length,
      sales: sales.length,
      revenue: totalRevenue,
    };
  }, [clients, products, sales]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <span>🏠</span>
        <span>Dashboard</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clients"
          value={metrics.clients}
          icon="👥"
          color="blue"
          trend={12}
        />

        <StatsCard
          title="Clients Actifs"
          value={metrics.activeClients}
          icon="✅"
          color="green"
          trend={5}
        />

        <StatsCard title="Produits" value={metrics.products} icon="📦" color="orange" />

        <StatsCard
          title="Chiffre d'Affaires"
          value={`${metrics.revenue.toLocaleString('fr-FR')} €`}
          icon="💵"
          color="purple"
          trend={18}
        />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
        <p className="text-gray-600">
          {metrics.sales} ventes enregistrées pour un total de{' '}
          {metrics.revenue.toLocaleString('fr-FR')} €
        </p>
      </div>
    </div>
  );
}
