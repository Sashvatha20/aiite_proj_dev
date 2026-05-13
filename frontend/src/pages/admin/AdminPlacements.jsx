import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const PAGE_SIZE = 15;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const S = {
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #f0f0f0', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f5f5f5', color: '#333', verticalAlign: 'middle' },
  input: { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' },
  inputFull: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 500 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 },
  field: { marginBottom: 12 },
  btnP: { padding: '9px 20px', borderRadius: 9, border: 'none', background: G, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnS: { padding: '9px 16px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#333' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: 16, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  panel: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000 },
  panelBox: { background: '#fff', width: 440, maxWidth: '95vw', height: '100vh', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', padding: 28 }
};

const BLANK = {
  student_id: '',
  company_name: '',
  role: '',
  package_lpa: '',
  placed_date: new Date().toISOString().split('T')[0],
  placed_status: 'placed',
  notes: ''
};

function getSafeErrorMessage(err, fallback) {
  if (
    err &&
    err.response &&
    err.response.data &&
    err.response.data.error
  ) {
    return err.response.data.error;
  }
  return fallback;
}

function getRoleValue(p) {
  if (!p) return '';
  return p.role || p.role_offered || p.placed_as || '';
}

function getPackageRaw(p) {
  if (!p) return null;
  if (p.package_lpa !== undefined && p.package_lpa !== null && p.package_lpa !== '') return p.package_lpa;
  if (p.package !== undefined && p.package !== null && p.package !== '') return p.package;
  if (p.salary_package !== undefined && p.salary_package !== null && p.salary_package !== '') return p.salary_package;
  if (p.ctc !== undefined && p.ctc !== null && p.ctc !== '') return p.ctc;
  return null;
}

function getPackageValue(p) {
  var raw = getPackageRaw(p);
  var num = parseFloat(raw);
  return Number.isFinite(num) ? num : 0;
}

function hasPackageValue(p) {
  var raw = getPackageRaw(p);
  return raw !== null && raw !== undefined && raw !== '' && Number.isFinite(parseFloat(raw));
}

export default function AdminPlacements() {
  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const setFormField = function (k, v) {
    setForm(function (f) {
      return { ...f, [k]: v };
    });
  };

  const setEditField = function (k, v) {
    setEditForm(function (f) {
      return { ...f, [k]: v };
    });
  };

  function normalizePlacement(p) {
    return {
      ...p,
      role: getRoleValue(p),
      package_lpa: hasPackageValue(p) ? getPackageValue(p) : ''
    };
  }

  async function load() {
    setLoading(true);
    try {
      var r = await api.get('/placements');
      return (r.data.placements || []).map(normalizePlacement);
    } catch (err) {
      toast.error('Failed to load placements');
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function reloadPlacements() {
    var next = await load();
    setPlacements(next);
    return next;
  }

  useEffect(function () {
    reloadPlacements();
    api.get('/students')
      .then(function (r) {
        setStudents(r.data.students || []);
      })
      .catch(function () {
        setStudents([]);
      });
  }, []);

  async function handleSync() {
    try {
      setSyncing(true);
      await api.post('/placements/sync');
      toast.success('Placements synced successfully');
      await reloadPlacements();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Failed to sync placements'));
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreate() {
    if (!form.student_id) return toast.error('Select a student');
    if (!form.company_name.trim()) return toast.error('Company name is required');
    if (!form.placed_date) return toast.error('Placed date is required');

    setSaving(true);
    try {
      var payload = {
        student_id: form.student_id,
        company_name: form.company_name.trim(),
        role_offered: form.role.trim() || null,
        placed_as: form.role.trim() || null,
        package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : null,
        placed_status: form.placed_status || 'placed',
        placed_date: form.placed_date,
        notes: form.notes.trim() || null
      };

      await api.post('/placements', payload);
      toast.success('Placement recorded! 🏆');
      setShowAdd(false);
      setForm(BLANK);
      await reloadPlacements();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Failed to add placement'));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    try {
      var payload = {
        company_name: editForm.company_name ? editForm.company_name.trim() : null,
        role_offered: editForm.role ? editForm.role.trim() : null,
        placed_as: editForm.role ? editForm.role.trim() : null,
        package_lpa: editForm.package_lpa !== '' && editForm.package_lpa != null ? parseFloat(editForm.package_lpa) : null,
        placed_status: editForm.placed_status || null,
        placed_date: editForm.placed_date || null,
        notes: editForm.notes ? editForm.notes.trim() : null
      };

      await api.put('/placements/' + detail.id, payload);
      toast.success('Placement updated!');
      setEditing(false);

      var next = await reloadPlacements();
      var refreshed = next.find(function (x) {
        return x.id === detail.id;
      });

      if (refreshed) {
        setDetail(refreshed);
        setEditForm({ ...refreshed });
      }
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Failed to update'));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this placement record?')) return;
    try {
      await api.delete('/placements/' + id);
      toast.success('Placement deleted');
      setDetail(null);
      await reloadPlacements();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Failed to delete'));
    }
  }

  function openView(p, edit) {
    var normalized = normalizePlacement(p);
    setDetail(normalized);
    setEditing(!!edit);
    setEditForm({ ...normalized });
  }

  const filtered = placements.filter(function (p) {
    var q = search.toLowerCase();
    var role = getRoleValue(p).toLowerCase();

    var mQ = !search
      || ((p.candidate_name || '').toLowerCase().indexOf(q) !== -1)
      || ((p.company_name || '').toLowerCase().indexOf(q) !== -1)
      || role.indexOf(q) !== -1;

    var placedDate = p.placed_date || '';
    var mM = !filterMonth || placedDate.slice(5, 7) === String(filterMonth).padStart(2, '0');
    var mY = !filterYear || placedDate.slice(0, 4) === String(filterYear);

    return mQ && mM && mY;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const placed = placements.filter(function (p) {
    return (p.placed_status || '').toLowerCase() === 'placed';
  });

  const packagePlaced = placed.filter(function (p) {
    return hasPackageValue(p);
  });

  const avgPackage = packagePlaced.length
    ? packagePlaced.reduce(function (s, p) {
        return s + getPackageValue(p);
      }, 0) / packagePlaced.length
    : 0;

  const topPackage = packagePlaced.length
    ? Math.max.apply(null, packagePlaced.map(function (p) {
        return getPackageValue(p);
      }))
    : 0;

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const thisMonth = placed.filter(function (p) {
    return (p.placed_date || '').indexOf(currentMonthPrefix) === 0;
  }).length;

  const monthlyData = MONTHS.map(function (m, i) {
    return {
      label: m,
      count: placed.filter(function (p) {
        if (!p.placed_date) return false;
        var d = new Date(p.placed_date);
        return d.getFullYear() === new Date().getFullYear() && d.getMonth() === i;
      }).length
    };
  });

  const maxBar = Math.max.apply(null, monthlyData.map(function (d) {
    return d.count;
  }).concat([1]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Placements</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {filtered.length} of {placements.length} records
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleSync} disabled={syncing} style={S.btnS}>
              {syncing ? 'Syncing…' : '🔄 Sync'}
            </button>
            <button
              onClick={function () {
                setShowAdd(true);
                setForm(BLANK);
              }}
              style={S.btnP}
            >
              ➕ Add Placement
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Placed', value: placed.length, color: '#0891B2', bg: '#E0F2FE' },
            { label: 'Avg Package', value: avgPackage ? avgPackage.toFixed(1) + ' LPA' : '—', color: G, bg: '#E1F5EE' },
            { label: 'Top Package', value: topPackage ? topPackage.toFixed(1) + ' LPA' : '—', color: '#D97706', bg: '#FEF3C7' },
            { label: 'This Month', value: thisMonth, color: '#7C3AED', bg: '#F5F3FF' }
          ].map(function (k, i) {
            return (
              <div key={i} style={{ background: k.bg, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{k.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            📊 {new Date().getFullYear()} Monthly Placements
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
            {monthlyData.map(function (d, i) {
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ fontSize: 9, color: d.count > 0 ? '#0891B2' : 'transparent', fontWeight: 700 }}>
                    {d.count}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '3px 3px 0 0',
                      height: Math.max((d.count / maxBar) * 44, d.count > 0 ? 6 : 2) + 'px',
                      background: d.count > 0 ? 'linear-gradient(180deg,#0891B2,#0e7490)' : '#e5e5e5',
                      transition: 'height 0.3s'
                    }}
                  />
                  <div style={{ fontSize: 8, color: '#bbb' }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            style={{ ...S.input, minWidth: 220 }}
            placeholder="🔍 Search student / company / role..."
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            style={S.input}
            value={filterMonth}
            onChange={function (e) {
              setFilterMonth(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Months</option>
            {MONTHS.map(function (m, i) {
              return <option key={i + 1} value={i + 1}>{m}</option>;
            })}
          </select>
          <select
            style={S.input}
            value={filterYear}
            onChange={function (e) {
              setFilterYear(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Years</option>
            {[2024, 2025, 2026].map(function (y) {
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          {(search || filterMonth || filterYear) && (
            <button
              onClick={function () {
                setSearch('');
                setFilterMonth('');
                setFilterYear('');
                setPage(1);
              }}
              style={{ ...S.btnS, color: '#DC2626', borderColor: '#fecaca', fontSize: 11 }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#aaa', fontSize: 13 }}>⏳ Loading…</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#bbb', fontSize: 13 }}>
            {placements.length === 0 ? '🏆 No placements recorded yet' : '🔍 No records match your filters'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Company</th>
                    <th style={S.th}>Role</th>
                    <th style={S.th}>Package</th>
                    <th style={S.th}>Placed Date</th>
                    <th style={S.th}>Batch</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(function (p, i) {
                    var role = getRoleValue(p);
                    var hasPkg = hasPackageValue(p);
                    var pkg = getPackageValue(p);

                    return (
                      <tr
                        key={p.id}
                        onMouseEnter={function (e) {
                          e.currentTarget.style.background = '#f0faf5';
                        }}
                        onMouseLeave={function (e) {
                          e.currentTarget.style.background = '';
                        }}
                      >
                        <td style={{ ...S.td, color: '#ccc', fontSize: 11 }}>
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: 'linear-gradient(135deg,#0891B2,#0e7490)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              {p.candidate_name && p.candidate_name[0] ? p.candidate_name[0].toUpperCase() : '?'}
                            </div>
                            <div>
                              <div
                                style={{ fontWeight: 700, color: '#111', cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
                                onClick={function () {
                                  openView(p, false);
                                }}
                              >
                                {p.candidate_name || '—'}
                              </div>
                              <div style={{ fontSize: 10, color: '#aaa' }}>{p.phone || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 700, color: '#111' }}>{p.company_name}</div>
                        </td>
                        <td style={S.td}>
                          {role ? (
                            <span style={{ background: '#F5F3FF', color: '#7C3AED', fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>
                              {role}
                            </span>
                          ) : (
                            <span style={{ color: '#ccc' }}>—</span>
                          )}
                        </td>
                        <td style={S.td}>
                          {hasPkg ? (
                            <span style={{ background: '#E1F5EE', color: G, fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                              {pkg.toFixed(1)} LPA
                            </span>
                          ) : (
                            <span style={{ color: '#ccc' }}>—</span>
                          )}
                        </td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap', fontSize: 11, color: '#888' }}>
                          {p.placed_date ? p.placed_date.split('T')[0] : '—'}
                        </td>
                        <td style={S.td}>
                          {p.batch_name ? (
                            <span style={{ background: '#EFF6FF', color: '#185FA5', fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>
                              {p.batch_name}
                            </span>
                          ) : (
                            <span style={{ color: '#ccc' }}>—</span>
                          )}
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={function () {
                                openView(p, false);
                              }}
                              style={{ fontSize: 10, padding: '5px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            >
                              👁 View
                            </button>
                            <button
                              onClick={function () {
                                openView(p, true);
                              }}
                              style={{ fontSize: 10, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#FEF3C7', color: '#92400E', cursor: 'pointer', fontWeight: 600 }}
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                <button
                  onClick={function () {
                    setPage(function (p) {
                      return Math.max(1, p - 1);
                    });
                  }}
                  disabled={page === 1}
                  style={{ ...S.btnS, padding: '5px 12px', opacity: page === 1 ? 0.4 : 1 }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, function (_, i) {
                  return i + 1;
                }).map(function (p) {
                  return (
                    <button
                      key={p}
                      onClick={function () {
                        setPage(p);
                      }}
                      style={{
                        ...S.btnS,
                        padding: '5px 10px',
                        minWidth: 32,
                        background: p === page ? G : '#fff',
                        color: p === page ? '#fff' : '#333',
                        border: '1px solid ' + (p === page ? G : '#ddd'),
                        fontWeight: p === page ? 700 : 400
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={function () {
                    setPage(function (p) {
                      return Math.min(totalPages, p + 1);
                    });
                  }}
                  disabled={page === totalPages}
                  style={{ ...S.btnS, padding: '5px 12px', opacity: page === totalPages ? 0.4 : 1 }}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <div
          style={S.modal}
          onClick={function (e) {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div style={S.modalBox}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0891B2', marginBottom: 4 }}>🏆 Add Placement</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>Record a new student placement</div>

            <div style={S.field}>
              <label style={S.label}>Student *</label>
              <select
                style={S.select}
                value={form.student_id}
                onChange={function (e) {
                  setFormField('student_id', e.target.value);
                }}
              >
                <option value="">Select student</option>
                {students.map(function (s) {
                  return (
                    <option key={s.id} value={s.id}>
                      {s.candidate_name} — {s.phone}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Company Name *</label>
                <input
                  style={S.inputFull}
                  value={form.company_name}
                  onChange={function (e) {
                    setFormField('company_name', e.target.value);
                  }}
                  placeholder="e.g. TCS, Infosys"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Role / Designation</label>
                <input
                  style={S.inputFull}
                  value={form.role}
                  onChange={function (e) {
                    setFormField('role', e.target.value);
                  }}
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Package (LPA)</label>
                <input
                  style={S.inputFull}
                  type="number"
                  step="0.1"
                  value={form.package_lpa}
                  onChange={function (e) {
                    setFormField('package_lpa', e.target.value);
                  }}
                  placeholder="e.g. 4.5"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Placed Date *</label>
                <input
                  style={S.inputFull}
                  type="date"
                  value={form.placed_date}
                  onChange={function (e) {
                    setFormField('placed_date', e.target.value);
                  }}
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Status</label>
                <select
                  style={S.select}
                  value={form.placed_status}
                  onChange={function (e) {
                    setFormField('placed_status', e.target.value);
                  }}
                >
                  <option value="placed">Placed</option>
                  <option value="not_placed">Not Placed</option>
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Notes</label>
              <textarea
                style={{ ...S.inputFull, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }}
                value={form.notes}
                onChange={function (e) {
                  setFormField('notes', e.target.value);
                }}
                placeholder="Any additional details..."
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btnP} onClick={handleCreate} disabled={saving}>
                {saving ? 'Saving…' : '✅ Record Placement'}
              </button>
              <button style={S.btnS} onClick={function () { setShowAdd(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div
          style={S.panel}
          onClick={function (e) {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div style={S.panelBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#0891B2,#0e7490)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 17,
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  {detail.candidate_name && detail.candidate_name[0] ? detail.candidate_name[0].toUpperCase() : '?'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{detail.candidate_name || '—'}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {detail.company_name} · {getRoleValue(detail) || 'No role'}
                  </div>
                </div>
              </div>
              <button
                onClick={function () { setDetail(null); }}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={function () { setEditing(false); }}
                style={{
                  ...S.btnS,
                  fontSize: 11,
                  flex: 1,
                  background: !editing ? '#f0f0f0' : '#fff',
                  fontWeight: !editing ? 700 : 400
                }}
              >
                👁 View
              </button>
              <button
                onClick={function () { setEditing(true); }}
                style={{
                  ...S.btnS,
                  fontSize: 11,
                  flex: 1,
                  background: editing ? '#FEF3C7' : '#fff',
                  color: editing ? '#92400E' : '#333',
                  fontWeight: editing ? 700 : 400
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={function () { handleDelete(detail.id); }}
                style={{ ...S.btnS, fontSize: 11, color: '#DC2626', borderColor: '#fecaca' }}
              >
                🗑
              </button>
            </div>

            {!editing && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Company', value: detail.company_name },
                    { label: 'Role', value: getRoleValue(detail) || '—' },
                    { label: 'Package', value: hasPackageValue(detail) ? getPackageValue(detail).toFixed(1) + ' LPA' : '—' },
                    { label: 'Placed Date', value: detail.placed_date ? detail.placed_date.split('T')[0] : '—' },
                    { label: 'Status', value: detail.placed_status },
                    { label: 'Batch', value: detail.batch_name || '—' }
                  ].map(function (r, i) {
                    return (
                      <div key={i} style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{r.value}</div>
                      </div>
                    );
                  })}
                </div>

                {hasPackageValue(detail) && (
                  <div style={{ background: 'linear-gradient(135deg,#E1F5EE,#d0f0e5)', borderRadius: 12, padding: '16px 20px', textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: G, lineHeight: 1 }}>
                      {getPackageValue(detail).toFixed(1)} LPA
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Annual Package</div>
                  </div>
                )}

                {detail.notes && (
                  <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                      Notes
                    </div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{detail.notes}</div>
                  </div>
                )}
              </>
            )}

            {editing && (
              <>
                <div style={S.row2}>
                  <div style={S.field}>
                    <label style={S.label}>Company Name *</label>
                    <input
                      style={S.inputFull}
                      value={editForm.company_name || ''}
                      onChange={function (e) {
                        setEditField('company_name', e.target.value);
                      }}
                    />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Role</label>
                    <input
                      style={S.inputFull}
                      value={editForm.role || ''}
                      onChange={function (e) {
                        setEditField('role', e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div style={S.row2}>
                  <div style={S.field}>
                    <label style={S.label}>Package (LPA)</label>
                    <input
                      style={S.inputFull}
                      type="number"
                      step="0.1"
                      value={editForm.package_lpa || ''}
                      onChange={function (e) {
                        setEditField('package_lpa', e.target.value);
                      }}
                    />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Placed Date</label>
                    <input
                      style={S.inputFull}
                      type="date"
                      value={editForm.placed_date ? editForm.placed_date.split('T')[0] : ''}
                      onChange={function (e) {
                        setEditField('placed_date', e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Status</label>
                  <select
                    style={S.select}
                    value={editForm.placed_status || 'placed'}
                    onChange={function (e) {
                      setEditField('placed_status', e.target.value);
                    }}
                  >
                    <option value="placed">Placed</option>
                    <option value="not_placed">Not Placed</option>
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Notes</label>
                  <textarea
                    style={{ ...S.inputFull, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
                    value={editForm.notes || ''}
                    onChange={function (e) {
                      setEditField('notes', e.target.value);
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={S.btnP} onClick={handleEdit}>💾 Save Changes</button>
                  <button style={S.btnS} onClick={function () { setEditing(false); }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}