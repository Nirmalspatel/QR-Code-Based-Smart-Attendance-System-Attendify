import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/DomainManager.css";

const DomainManager = ({ token }) => {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingDomain, setRemovingDomain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };
  const showError = (msg) => {
    setError(msg);
    setSuccess("");
    setTimeout(() => setError(""), 4000);
  };

  const fetchDomains = async () => {
    try {
      const res = await axios.get("/admin/domain-settings", cfg);
      setDomains(res.data.allowedDomains || []);
    } catch (err) {
      showError("Failed to load domain settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async () => {
    const raw = newDomain.trim().replace(/^@/, "").toLowerCase();
    if (!raw) return;
    setSaving(true);
    try {
      const res = await axios.post("/admin/domain-settings", { domain: raw }, cfg);
      setDomains(res.data.allowedDomains);
      setNewDomain("");
      showSuccess(`✓ Domain "@${raw}" added successfully.`);
    } catch (err) {
      showError(err.response?.data?.message || "Error adding domain.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (domain) => {
    if (!window.confirm(`Remove "@${domain}" from allowed domains?\nUsers with this domain will no longer be able to sign up or log in.`)) return;
    setRemovingDomain(domain);
    try {
      const res = await axios.delete(`/admin/domain-settings/${domain}`, cfg);
      setDomains(res.data.allowedDomains);
      showSuccess(`✓ Domain "@${domain}" removed.`);
    } catch (err) {
      showError(err.response?.data?.message || "Error removing domain.");
    } finally {
      setRemovingDomain("");
    }
  };

  return (
    <div className="dm-container">
      <div className="dm-header">
        <div className="dm-header-icon">🔒</div>
        <div>
          <h2 className="dm-title">Email Domain Restrictions</h2>
          <p className="dm-subtitle">
            Control which email domains can register and log in. Leave <strong>empty</strong> to allow <strong>all</strong> domains.
          </p>
        </div>
      </div>

      {/* Status messages */}
      {success && <div className="dm-alert dm-alert-success">{success}</div>}
      {error   && <div className="dm-alert dm-alert-error">{error}</div>}

      {/* Add domain */}
      <div className="dm-add-bar">
        <div className="dm-input-wrapper">
          <span className="dm-at-prefix">@</span>
          <input
            type="text"
            className="dm-input"
            placeholder="nirmauni.ac.in"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value.replace(/^@/, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={saving}
          />
        </div>
        <button
          className="dm-add-btn"
          onClick={handleAdd}
          disabled={saving || !newDomain.trim()}
        >
          {saving ? "Adding..." : "+ Add Domain"}
        </button>
      </div>

      {/* Domains list */}
      <div className="dm-list-section">
        {loading ? (
          <div className="dm-loading">Loading domain settings…</div>
        ) : domains.length === 0 ? (
          <div className="dm-empty">
            <div className="dm-empty-icon">🌐</div>
            <p>No domain restrictions configured.</p>
            <p className="dm-empty-hint">All email domains are currently allowed to sign up.</p>
          </div>
        ) : (
          <>
            <div className="dm-list-label">
              Allowed domains <span className="dm-badge">{domains.length}</span>
            </div>
            <ul className="dm-list">
              {domains.map((domain) => (
                <li key={domain} className="dm-item">
                  <div className="dm-item-left">
                    <span className="dm-item-icon">✉️</span>
                    <span className="dm-item-domain">@{domain}</span>
                  </div>
                  <button
                    className="dm-remove-btn"
                    onClick={() => handleRemove(domain)}
                    disabled={removingDomain === domain}
                    title={`Remove @${domain}`}
                  >
                    {removingDomain === domain ? "Removing…" : "🗑 Remove"}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="dm-info-box">
        <span className="dm-info-icon">ℹ️</span>
        <div>
          <strong>How it works:</strong> When domains are listed above, only users whose email ends in
          one of those domains can sign up or log in. Admins are always exempt from this restriction.
        </div>
      </div>
    </div>
  );
};

export default DomainManager;
