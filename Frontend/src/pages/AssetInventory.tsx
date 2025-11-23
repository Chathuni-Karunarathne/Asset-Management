import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

interface ApiAsset {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  status: string;
  purchaseDate?: string | null;
  purchase_date?: string | null;
  purchasePrice?: number | null;
  purchase_price?: number | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
}

interface Asset {
  id: number;
  name: string;
  department: string | null;
  category: string;
  status: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const tableColumns: { key: keyof Asset; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'purchaseDate', label: 'Purchase Date' },
  { key: 'purchasePrice', label: 'Purchase Price' },
];

const AssetInventory = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/assets`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const normalized = Array.isArray(data) ? data.map(mapAssetFromApi) : [];
      const sorted = normalized.sort((a, b) => getComparableTime(b) - getComparableTime(a));
      setAssets(sorted);
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Failed to connect to server. Make sure the backend is running on port 4000.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(
    async (assetId: number) => {
      const confirmed = window.confirm('Delete this asset? This action cannot be undone.');
      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(assetId);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete asset (status ${response.status}).`);
        }

        setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
      } catch (deleteError) {
        console.error('Error deleting asset:', deleteError);
        setError('Unable to delete the asset. Please try again.');
      } finally {
        setDeletingId(null);
      }
    },
    [],
  );

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  return (
    <div className="App">
      <main className="table-container">
        <div className="table-header">
          <h1 className="table-title">Asset inventory</h1>
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate('/assets/new')}
          >
            Add New
          </button>
        </div>

        {loading && <p className="status">Loading assets…</p>}
        {error && !loading && <p className="status status-error">{error}</p>}

        <div className="table-card">
          <div className="table-wrapper" aria-live="polite">
            <table>
              <thead>
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th className="action-column">Action</th>
                </tr>
              </thead>
              <tbody>
                {!assets.length ? (
                  <tr>
                    {tableColumns.map((column) => (
                      <td key={column.key} className="cell-muted">
                        -
                      </td>
                    ))}
                    <td className="cell-muted action-column">-</td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id}>
                      {tableColumns.map((column) => (
                        <td key={column.key}>{renderCell(asset, column.key)}</td>
                      ))}
                      <td className="action-column">
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="table-action-icon"
                            aria-label={`Edit asset ${asset.id}`}
                            onClick={() => navigate(`/assets/${asset.id}/edit`)}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            className="table-action-icon delete"
                            aria-label={`Delete asset ${asset.id}`}
                            onClick={() => handleDelete(asset.id)}
                            disabled={deletingId === asset.id}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-footer">
          <span className="label">Records shown:</span>
          <span className="value">{assets.length}</span>
        </div>
      </main>
    </div>
  );
};

function renderCell(asset: Asset, column: keyof Asset) {
  switch (column) {
    case 'purchasePrice':
      return formatPrice(asset.purchasePrice);
    case 'purchaseDate':
      return formatDate(asset.purchaseDate);
    case 'status':
      return (
        <span className={`status-pill ${getStatusClass(asset.status)}`}>
          {formatStatus(asset.status)}
        </span>
      );
    case 'department':
      return asset.department ?? '-';
    default:
      return asset[column] ?? '-';
  }
}

function getStatusClass(status: string) {
  const classMap: Record<string, string> = {
    available: 'status-available',
    in_use: 'status-inuse',
    assigned: 'status-inuse',
    maintenance: 'status-maintenance',
  };
  return classMap[status] ?? 'status-default';
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function formatStatus(status: string) {
  const statusMap: Record<string, string> = {
    available: 'Available',
    in_use: 'In Use',
    assigned: 'Assigned',
    maintenance: 'Maintenance',
  };
  return statusMap[status] ?? status;
}

function getComparableTime(asset: Asset): number {
  const date = asset.updatedAt || asset.createdAt;
  const timestamp = date ? new Date(date).getTime() : NaN;
  if (!Number.isNaN(timestamp)) {
    return timestamp;
  }
  return asset.id;
}

function mapAssetFromApi(input: ApiAsset): Asset {
  return {
    id: input.id,
    name: input.name,
    department: input.description ?? null,
    category: input.category,
    status: input.status,
    purchaseDate: input.purchaseDate ?? input.purchase_date ?? null,
    purchasePrice: input.purchasePrice ?? input.purchase_price ?? null,
    createdAt: input.createdAt ?? input.created_at ?? null,
    updatedAt: input.updatedAt ?? input.updated_at ?? null,
  };
}

const PencilIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M13.75 2.29297L17.707 6.25L6.457 17.5H2.5V13.543L13.75 2.29297Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M11.875 4.16797L15.832 8.125"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4.167 5.83398H15.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M6.25 5.83398V3.95898H13.75V5.83398"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M5.417 5.83398L6.083 16.459C6.124 17.115 6.673 17.639 7.33 17.639H12.67C13.327 17.639 13.876 17.115 13.917 16.459L14.583 5.83398"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8.333 9.16602V14.166" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M11.667 9.16602V14.166" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default AssetInventory;
