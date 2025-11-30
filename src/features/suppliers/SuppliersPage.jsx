import React from 'react'
import { formatMoney } from '../../utils/money'

function SuppliersPage({
  suppliers,
  supplierOrders,
  supplierSummary,
  supplierSearch,
  setSupplierSearch,
  supplierFilterMode,
  setSupplierFilterMode,
  filteredSuppliers,
  showSupplierForm,
  setShowSupplierForm,
  supplierForm,
  setSupplierForm,
  editingSupplier,
  setEditingSupplier,
  handleSupplierSubmit,
  closeSupplierForm,
  openSupplierDetail,
  openEditSupplierForm,
  deleteSupplier,
  getSupplierTotals,
  openHistory,
}) {
  return (

            <section id="view-suppliers" className="view active">
              <div className="top-actions-row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setEditingSupplier(null)
                    setSupplierForm({
                      name: '',
                      note: '',
                      debit: '',
                      credit: '',
                    })
                    setShowSupplierForm(true)
                  }}
                >
                  <i className="fa-solid fa-plus" />
                  <span>Add supplier</span>
                </button>
              </div>

              {showSupplierForm && (
                <div className="card form-card">
                  <div className="card-header">
                    <h3>
                      <i className="fa-solid fa-truck" />{' '}
                      {editingSupplier ? 'Edit supplier' : 'Add supplier'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSupplierSubmit} autoComplete="off">
                      <div className="form-row">
                        <div className="form-field">
                          <label>Supplier name</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-user-tie" />
                            <input
                              type="text"
                              value={supplierForm.name}
                              onChange={(e) =>
                                setSupplierForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Note</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-note-sticky" />
                            <input
                              type="text"
                              value={supplierForm.note}
                              onChange={(e) =>
                                setSupplierForm((prev) => ({
                                  ...prev,
                                  note: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>Debit</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-arrow-down" />
                            <input
                              type="number"
                              step="0.01"
                              value={supplierForm.debit}
                              onChange={(e) =>
                                setSupplierForm((prev) => ({
                                  ...prev,
                                  debit: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Credit</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-arrow-up" />
                            <input
                              type="number"
                              step="0.01"
                              value={supplierForm.credit}
                              onChange={(e) =>
                                setSupplierForm((prev) => ({
                                  ...prev,
                                  credit: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          <i className="fa-solid fa-floppy-disk" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={closeSupplierForm}
                        >
                          <i className="fa-solid fa-xmark" />
                          <span>Close</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-users" />
                  </div>
                  <div className="summary-text">
                    <span>Suppliers</span>
                    <strong>{supplierSummary.totalSuppliers}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-arrow-up" />
                  </div>
                  <div className="summary-text">
                    <span>Total credit</span>
                    <strong>{supplierSummary.totalCredit}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-arrow-down" />
                  </div>
                  <div className="summary-text">
                    <span>Total debit</span>
                    <strong>{supplierSummary.totalDebit}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-scale-unbalanced" />
                  </div>
                  <div className="summary-text">
                    <span>Total balance</span>
                    <strong>{supplierSummary.balance}</strong>
                  </div>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    type="text"
                    placeholder="Search supplier…"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  {['all', 'credit', 'debit'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`chip ${supplierFilterMode === mode ? 'chip-filled' : ''}`}
                      onClick={() => setSupplierFilterMode(mode)}
                    >
                      {mode === 'all'
                        ? 'All'
                        : mode === 'credit'
                        ? 'Credit'
                        : 'Debit'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card table-card">
                <div className="card-header">
                  <h3>
                    <i className="fa-solid fa-truck" /> Suppliers
                  </h3>
                </div>
                <div className="card-body">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Supplier</th>
                          <th>Note</th>
                          <th>Balance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuppliers.map((sup) => {
                          const { balance } = getSupplierTotals(sup, supplierOrders)
                          const isNil = balance === 0
                          const display = isNil ? 'Nil' : formatMoney(balance)
                          const className =
                            balance > 0
                              ? 'tag tag-unpaid'
                              : balance < 0
                              ? 'tag tag-overpaid'
                              : 'badge-nil'
                          const hasOrders = supplierOrders.some((o) => o.supplierId === sup.id)

                          return (
                            <tr key={sup.id}>
                              <td>
                                <span
                                  style={{
                                    cursor: 'pointer',
                                    color: '#059669',
                                    textDecoration: 'underline',
                                  }}
                                  onClick={() => openSupplierDetail(sup.id)}
                                >
                                  {sup.name}
                                </span>
                              </td>
                              <td>{sup.note || '-'}</td>
                              <td>
                                <span className={className}>{display}</span>
                              </td>
                              <td className="actions">
                                <button
                                  className="icon-btn info"
                                  type="button"
                                  title="View change history"
                                  onClick={() => openHistory('supplier', sup, `Supplier changes – ${sup.name}`)}
                                >
                                  <i className="fa-solid fa-clock-rotate-left" />
                                </button>
                                {!hasOrders && (
                                  <>
                                    <button
                                      className="icon-btn edit"
                                      title="Edit supplier"
                                      onClick={() => openEditSupplierForm(sup)}
                                    >
                                      <i className="fa-solid fa-pen" />
                                    </button>
                                    <button
                                      className="icon-btn delete"
                                      title="Delete supplier"
                                      onClick={() => deleteSupplier(sup.id)}
                                    >
                                      <i className="fa-solid fa-trash" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filteredSuppliers.length === 0 && (
                      <div className="empty-state">
                        <i className="fa-regular fa-folder-open" />
                        <p>No suppliers yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

  )
}

export default SuppliersPage
