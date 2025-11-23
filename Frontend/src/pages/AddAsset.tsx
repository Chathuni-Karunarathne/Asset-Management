import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const statusOptions = ['available', 'assigned', 'in_use', 'maintenance'] as const;

type FormState = {
  name: string;
  department: string;
  category: string;
  status: (typeof statusOptions)[number];
  purchase_date: string;
  purchase_price: string;
};

const initialFormState: FormState = {
  name: '',
  department: '',
  category: '',
  status: 'available',
  purchase_date: '',
  purchase_price: '',
};

const AddAsset = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const assetId = routeId ? Number(routeId) : null;
  const isEditMode = assetId !== null && !Number.isNaN(assetId);

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pageTitle = isEditMode ? 'Update Asset' : 'Add New Asset';
  const pageDescription = isEditMode
    ? 'Update the fields below to modify this asset.'
    : 'Provide the complete asset details below. Required fields are marked with an asterisk.';
  const submitLabel = isEditMode ? 'Update Asset' : 'Save Asset';
  const isFormDisabled = submitting || loadingAsset || Boolean(loadError);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!isEditMode || assetId === null) {
      setLoadingAsset(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const fetchAsset = async () => {
      try {
        setLoadingAsset(true);
        setLoadError(null);

        const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load asset (status ${response.status})`);
        }

        const data = await response.json();
        if (!isActive) return;

        setFormData({
          name: data.name ?? '',
          department: data.description ?? '',
          category: data.category ?? '',
          status: data.status ?? 'available',
          purchase_date: toDateInputValue(data.purchaseDate ?? data.purchase_date ?? null),
          purchase_price: toPriceInputValue(data.purchasePrice ?? data.purchase_price),
        });
        setError(null);
        setSuccessMessage(null);
      } catch (fetchError) {
        if (!isActive || (fetchError as Error).name === 'AbortError') return;
        console.error('Error loading asset:', fetchError);
        setLoadError('Unable to load the asset. Please return to the list and try again.');
      } finally {
        if (isActive) {
          setLoadingAsset(false);
        }
      }
    };

    fetchAsset();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isEditMode, assetId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (loadingAsset) {
      setError('Please wait until the asset details finish loading.');
      return;
    }

    if (loadError) {
      setError('Cannot submit because the asset details failed to load.');
      return;
    }

    if (!formData.name.trim() || !formData.category.trim()) {
      setError('Please provide at least a name and category before saving.');
      return;
    }

    if (isEditMode && (assetId === null || Number.isNaN(assetId))) {
      setError('Missing asset identifier. Please use the update action again.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.department.trim() || null,
      category: formData.category.trim(),
      status: formData.status,
      purchaseDate: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null,
      purchasePrice: formData.purchase_price ? Number(formData.purchase_price) : null,
    };

    if (payload.purchasePrice !== null && Number.isNaN(payload.purchasePrice)) {
      setError('Purchase price must be a valid number.');
      return;
    }

    const actionVerb = isEditMode ? 'update' : 'create';
    const confirmMessage = `Are you sure you want to ${actionVerb} this asset?`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = isEditMode ? `${API_BASE_URL}/assets/${assetId}` : `${API_BASE_URL}/assets`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const successText = isEditMode
        ? 'Asset updated successfully! Redirecting…'
        : 'Asset created successfully! Redirecting…';
      setSuccessMessage(successText);
      if (!isEditMode) {
        setFormData(initialFormState);
      }
      setTimeout(() => navigate('/'), 1200);
    } catch (submitError) {
      const defaultMessage = isEditMode ? 'Failed to update asset.' : 'Failed to create asset.';
      setError((submitError as Error).message ?? defaultMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="App add-page">
      <main className="add-card">
        <header className="add-card__header">
          <h1>{pageTitle}</h1>
          <p>{pageDescription}</p>
        </header>

        {loadError && <p className="status status-error">{loadError}</p>}
        {loadingAsset && !loadError && <p className="status">Loading asset details…</p>}
        {error && <p className="status status-error">{error}</p>}
        {successMessage && <p className="status">{successMessage}</p>}

        <form className="asset-form" onSubmit={handleSubmit}>
          <fieldset className="form-grid" disabled={isFormDisabled}>
            <div className="form-field">
              <label htmlFor="name">
                Name<span aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Dell Latitude 5520"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                placeholder="e.g., Finance"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="category">
                Category<span aria-hidden="true">*</span>
              </label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="e.g., Laptop"
                value={formData.category}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="purchase_date">Purchase Date</label>
              <input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="purchase_price">Purchase Price</label>
              <input
                id="purchase_price"
                name="purchase_price"
                type="number"
                placeholder="e.g., 1250"
                min="0"
                step="0.01"
                value={formData.purchase_price}
                onChange={handleChange}
              />
            </div>
          </fieldset>

          <div className="form-actions">
            <Link className="secondary-btn" to="/">
              Cancel
            </Link>
            <button type="submit" className="primary-btn" disabled={isFormDisabled}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddAsset;

function toDateInputValue(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toPriceInputValue(value: number | null | undefined) {
  if (value === null || value === undefined) return '';
  return String(value);
}
