/**
 * Clients Page - Client management
 */

import { useGristData } from '@api/hooks/useGristData';
import { DataTable, StatsCard } from '@templates';
import type { ClientRecord } from '@core/types';

export default function PageClients() {
  const { data: clients, loading } = useGristData<ClientRecord>('Clients');

  const activeClients = clients.filter((c) => c.statut === 'Actif').length;
  const inactiveClients = clients.length - activeClients;

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'entreprise', label: 'Entreprise' },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            value === 'Actif'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value === 'Actif' ? '✅' : '⏸️'} {value}
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
        <span>👥</span>
        <span>Gestion des Clients</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Clients"
          value={clients.length}
          icon="👥"
          color="blue"
        />
        <StatsCard
          title="Clients Actifs"
          value={activeClients}
          icon="✅"
          color="green"
        />
        <StatsCard
          title="Clients Inactifs"
          value={inactiveClients}
          icon="⏸️"
          color="gray"
        />
      </div>

      <DataTable data={clients} columns={columns} />
    </div>
  );
}
