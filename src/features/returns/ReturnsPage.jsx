import React from 'react'
import { formatDisplayDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

function ReturnsPage({
  refunds,
  filteredRefunds,
  refundSummary,
  refundSearch,
  setRefundSearch,
  refundDateFrom,
  setRefundDateFrom,
  refundDateTo,
  setRefundDateTo,
  refundFilterMode,
  setRefundFilterMode,
  showRefundForm,
  closeRefundForm,
  goReturnsNew,
  refundForm,
  setRefundForm,
  editingRefund,
  refundInvoiceOptions,
  handleRefundInvoiceChange,
  handleRefundSubmit,
  recalcRefundUnpaid,
  openEditRefundForm,
  deleteRefund,
  openHistory,
}) {
  return (

            <section id="view-returns" className="view active">
              {showRefundForm && (
                <div className="card form-card">
                  <div className="card-header">
                    <h3>
                      <i className="fa-solid fa-file-circle-minus" />{' '}
                      {editingRefund ? 'Edit refund entry' : 'New refund entry'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleRefundSubmit} autoComplete="off">
                      <div className="form-row">
                        <div className="form-field">
                          <label>Invoice no. (search)</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-magnifying-glass" />
                            <select
                              value={refundForm.invoiceNo}
                              onChange={(e) => handleRefundInvoiceChange(e.target.value)}
                            >
                              <option value="">Select invoice…</option>
                              {refundInvoiceOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar-day" />
                            <input
                              type="date"
                              value={refundForm.date}
                              onChange={(e) =>
                                setRefundForm((prev) => ({ ...prev, date: e.target.value }))
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Customer no.</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-id-card" />
                            <input type="text" value={refundForm.customerNo} readOnly />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Customer name</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-user" />
                            <input type="text" value={refundForm.customerName} readOnly />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>Product</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-box" />
                            <input
                              type="text"
                              list="product-options"
                              value={refundForm.product}
                              onChange={(e) =>
                                setRefundForm((prev) => ({ ...prev, product: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Note</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-note-sticky" />
                            <input
                              type="text"
                              value={refundForm.note}
                              onChange={(e) =>
                                setRefundForm((prev) => ({
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
                          <label>Total refund amount</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-sack-xmark" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={refundForm.total}
                              onChange={(e) =>
                                setRefundForm((prev) =>
                                  recalcRefundUnpaid({ ...prev, total: e.target.value }),
                                )
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Cash</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-coins" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={refundForm.cash}
                              onChange={(e) =>
                                setRefundForm((prev) =>
                                  recalcRefundUnpaid({ ...prev, cash: e.target.value }),
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Still payable (auto)</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-scale-unbalanced" />
                            <input type="number" step="0.01" value={refundForm.unpaid} readOnly />
                          </div>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          <i className="fa-solid fa-floppy-disk" />
                          <span>Save</span>
                        </button>
                        <button type="button" className="btn-ghost" onClick={closeRefundForm}>
                          <i className="fa-solid fa-xmark" />
                          <span>Close</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}


{!showRefundForm && (
  <div className="top-actions-row">
    <button type="button" className="btn-primary" onClick={goReturnsNew}>
      <i className="fa-solid fa-plus" />
      <span>Add refund</span>
    </button>
  </div>
)}

              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-arrow-rotate-left" />
                  </div>
                  <div className="summary-text">
                    <span>Total refunds</span>
                    <strong>{refundSummary.totalCount}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-sack-xmark" />
                  </div>
                  <div className="summary-text">
                    <span>Refunded amount</span>
                    <strong>{refundSummary.totalRefunded}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-circle-exclamation" />
                  </div>
                  <div className="summary-text">
                    <span>Still payable</span>
                    <strong>{refundSummary.totalStillOwe}</strong>
                  </div>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    type="text"
                    placeholder="Search (customer, product, invoice)…"
                    value={refundSearch}
                    onChange={(e) => setRefundSearch(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  {['all', 'today', 'week', 'month'].map((mode) => (
                    <button
                      key={mode}
                      className={`chip ${refundFilterMode === mode ? 'chip-filled' : ''}`}
                      onClick={() => {
                        setRefundFilterMode(mode)
                        setRefundDateFrom('')
                        setRefundDateTo('')
                      }}
                    >
                      {mode === 'all'
                        ? 'All'
                        : mode === 'today'
                        ? 'Today'
                        : mode === 'week'
                        ? 'Last week'
                        : 'Last month'}
                    </button>
                  ))}
                  <div className="date-filter">
                    <i className="fa-solid fa-calendar-day" />
                    <input
                      type="date"
                      value={refundDateFrom}
                      onChange={(e) => {
                        setRefundDateFrom(e.target.value)
                        setRefundFilterMode('all')
                      }}
                      placeholder="From"
                    />
                  </div>
                  <div className="date-filter">
                    <i className="fa-solid fa-calendar-day" />
                    <input
                      type="date"
                      value={refundDateTo}
                      onChange={(e) => {
                        setRefundDateTo(e.target.value)
                        setRefundFilterMode('all')
                      }}
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              <div className="card table-card">
                <div className="card-header">
                  <h3>
                    <i className="fa-solid fa-list" /> Refund list
                  </h3>
                </div>
                <div className="card-body">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice</th>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Amount / Nil</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRefunds.map((r) => {
                          const unpaid = Number(r.unpaid) || 0
                          const settled = unpaid === 0
                          const display = settled ? 'Nil' : formatMoney(unpaid)
                          const className = settled ? 'badge-nil' : 'tag tag-unpaid'

                          return (
                            <tr key={r.id}>
                              <td>{formatDisplayDate(r.date)}</td>
                              <td>{r.invoiceNo}</td>
                              <td>{r.customerName}</td>
                              <td>{r.product || '-'}</td>
                              <td>
                                <span className={className}>{display}</span>
                              </td>
                              <td className="actions">
                                <button
                                  className="icon-btn info"
                                  type="button"
                                  title="View change history"
                                  onClick={() => openHistory('refund', r, `Refund changes – ${r.invoiceNo}`)}
                                >
                                  <i className="fa-solid fa-clock-rotate-left" />
                                </button>
                                <button
                                  className="icon-btn edit"
                                  title="Edit"
                                  onClick={() => openEditRefundForm(r)}
                                >
                                  <i className="fa-solid fa-pen" />
                                </button>
                                <button
                                  className="icon-btn delete"
                                  title="Delete"
                                  onClick={() => deleteRefund(r.id)}
                                >
                                  <i className="fa-solid fa-trash" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filteredRefunds.length === 0 && (
                      <div className="empty-state">
                        <i className="fa-regular fa-folder-open" />
                        <p>No refund records yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

  )
}

export default ReturnsPage
