import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './styles.scss';

export const BidDetailEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const fetchBid = async () => {
      if (!user || !id) return;
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching bid:', error);
        alert('Could not load bid details.');
        navigate('/');
      } else {
        setFormData(data);
      }
      setLoading(false);
    };

    fetchBid();
  }, [id, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData((prev: any) => ({
      ...prev,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [name]: isCheckbox ? (e.target as any).checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('bids').update(formData).eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      alert('Bid details saved!');
      navigate('/');
    }
    setSaving(false);
  };

  if (loading) return <div className="loading-state">Loading bid data...</div>;
  if (!formData) return <div className="error-state">Bid not found.</div>;

  return (
    <div className="bid-detail-wrapper">
      <header className="detail-header">
        <div className="title-group">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1>{formData.job_name || 'Unnamed Project'}</h1>
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </header>

      <form className="detail-form" onSubmit={handleSave}>
        {/* SECTION 1: Core Details */}
        <section className="form-section">
          <h3>Core Details</h3>

          <div className="input-group full-width mb-md">
            <label>Project Summary / Notes</label>
            <textarea
              name="summary"
              value={formData.summary || ''}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={handleChange as any}
              rows={4}
              placeholder="Enter a brief summary of the scope or project..."
            />
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label>Job Name</label>
              <input
                type="text"
                name="job_name"
                value={formData.job_name || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>General Contractor</label>
              <input
                type="text"
                name="general_contractor"
                value={formData.general_contractor || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>GC Contact Name</label>
              <input
                type="text"
                name="gc_contact"
                value={formData.gc_contact || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>GC Contact Email</label>
              <input
                type="email"
                name="gc_contact_email"
                value={formData.gc_contact_email || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid-3">
              <div className="input-group">
                <label>Distance</label>
                <input
                  type="text"
                  name="distance"
                  value={formData.distance || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label>SqFt</label>
                <input
                  type="text"
                  name="sqft"
                  value={formData.sqft || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label>Labor Type</label>
                <input
                  type="text"
                  name="labor_type"
                  value={formData.labor_type || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Status & Financials */}
        <section className="form-section">
          <h3>Status & Financials</h3>
          <div className="grid-3">
            <div className="input-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status || 'Needs Review'}
                onChange={handleChange}
              >
                <option value="Needs Review">Needs Review</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div className="input-group">
              <label>Final Bid Amount ($)</label>
              <input
                type="number"
                name="final_bid_amount"
                value={formData.final_bid_amount || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Bid Result</label>
              <input
                type="text"
                name="bid_result"
                value={formData.bid_result || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid-2 mt-sm">
            <div className="checkbox-group">
              <input
                type="checkbox"
                name="send_invite"
                checked={formData.send_invite || false}
                onChange={handleChange}
                id="send_invite"
              />
              <label htmlFor="send_invite">Send Invite / Actively Bidding</label>
            </div>
            <div className="checkbox-group">
              <input
                type="checkbox"
                name="due_soon"
                checked={formData.due_soon || false}
                onChange={handleChange}
                id="due_soon"
              />
              <label htmlFor="due_soon">Flag as Due Soon</label>
            </div>
          </div>
        </section>

        {/* SECTION 3: Dates */}
        <section className="form-section">
          <h3>Dates & Deadlines</h3>
          <div className="grid-3">
            <div className="input-group">
              <label>Bid Due Date</label>
              <input
                type="text"
                name="bid_due_date"
                value={formData.bid_due_date || ''}
                onChange={handleChange}
                placeholder="e.g. April 20, 2026"
              />
            </div>
            <div className="input-group">
              <label>RFI Due Date</label>
              <input
                type="text"
                name="rfi_due_date"
                value={formData.rfi_due_date || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Email Date</label>
              <input
                type="text"
                name="email_date"
                value={formData.email_date || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Bid Submitted Date</label>
              <input
                type="text"
                name="bid_submitted_date"
                value={formData.bid_submitted_date || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Award Date</label>
              <input
                type="text"
                name="award_date"
                value={formData.award_date || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: Links & Metadata */}
        <section className="form-section">
          <h3>Links & Metadata</h3>
          <div className="grid-2">
            <div className="input-group">
              <label>Portal Link</label>
              <input
                type="url"
                name="portal_link"
                value={formData.portal_link || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Drive Folder Link</label>
              <input
                type="url"
                name="drive_folder_link"
                value={formData.drive_folder_link || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Addendum</label>
              <input
                type="text"
                name="addendum"
                value={formData.addendum || ''}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Search Keywords</label>
              <input
                type="text"
                name="search_keywords"
                value={formData.search_keywords || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label>Row Helper</label>
                <input
                  type="text"
                  name="row_helper"
                  value={formData.row_helper || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label>Heal Status</label>
                <input
                  type="text"
                  name="heal_status"
                  value={formData.heal_status || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};
