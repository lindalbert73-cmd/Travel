import React from 'react'
import { formatDisplayDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

function SalesPage({
  sales,
  filteredSales,
  salesForm,
  setSalesForm,
  salesSearch,
  setSalesSearch,
  salesDateFrom,
  setSalesDateFrom,
  salesDateTo,
  setSalesDateTo,
  salesFilterMode,
  setSalesFilterMode,
  showSalesForm,
  editingSale,
  closeSalesForm,
  openEditSalesForm,
  goSalesNew,
  goSalesImport,
  showSalesImport,
  salesImportPreview,
  handleSalesFileSelected,
  handleSalesImportClick,
  salesFileInputRef,
  confirmSalesImport,
  cancelSalesImport,
  handleSalesSubmit,
  deleteSale,
  recalcSalesUnpaid,
  openHistory,
  salesSummary,
}) {
  return (

            <section id="view-sales" className="view active">
              {showSalesForm && (
                <div className="card form-card">
                  <div className="card-header">
                    <h3>
                      <i className="fa-solid fa-file-circle-plus" />{' '}
                      {editingSale ? 'Edit sales entry' : 'New sales entry'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSalesSubmit} autoComplete="off">
                      <div className="form-row">
                        <div className="form-field">
                          <label>Invoice no.</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-hashtag" />
                            <input type="text" value={salesForm.invoiceNo} readOnly />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Customer no.</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-id-card" />
                            <input type="text" value={salesForm.customerNo} readOnly />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar-day" />
                            <input
                              type="date"
                              value={salesForm.date}
                              onChange={(e) =>
                                setSalesForm((prev) => ({ ...prev, date: e.target.value }))
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>Customer name</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-user" />
                            <input
                              type="text"
                              list="customer-options"
                              value={salesForm.customerName}
                              onChange={(e) =>
                                setSalesForm((prev) => ({
                                  ...prev,
                                  customerName: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label>Product</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-box" />
                            <input
                              type="text"
                              list="product-options"
                              value={salesForm.product}
                              onChange={(e) =>
                                setSalesForm((prev) => ({ ...prev, product: e.target.value }))
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
                              value={salesForm.note}
                              onChange={(e) =>
                                setSalesForm((prev) => ({
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
                          <label>Total amount</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-sack-dollar" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={salesForm.total}
                              onChange={(e) =>
                                setSalesForm((prev) =>
                                  recalcSalesUnpaid({ ...prev, total: e.target.value }),
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
                              value={salesForm.cash}
                              onChange={(e) =>
                                setSalesForm((prev) =>
                                  recalcSalesUnpaid({ ...prev, cash: e.target.value }),
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="form-field">

                        </div>
                        <div className="form-field">
                          <label>Outstanding (auto)</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-scale-unbalanced" />
                            <input type="number" step="0.01" value={salesForm.unpaid} readOnly />
                          </div>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          <i className="fa-solid fa-floppy-disk" />
                          <span>Save</span>
                        </button>
                        <button type="button" className="btn-ghost" onClick={closeSalesForm}>
                          <i className="fa-solid fa-xmark" />
                          <span>Close</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {showSalesImport && (
                <div className="card">
                  <div className="card-header">
                    <h3>
                      <i className="fa-solid fa-file-arrow-up" /> Bulk import sales
                    </h3>
                  </div>
                  <div className="card-body">
                    <p style={{ fontSize: '13px', marginBottom: '10px' }}>
                      Upload a CSV file exported from Excel. Expected columns:{" "}
                      <strong>name, product, total amount, cash, unpaid</strong>.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSalesImportClick}
                    >
                      <i className="fa-solid fa-file-arrow-up" />
                      <span>Upload CSV file</span>
                    </button>
                    <input
                      type="file"
                      accept=".csv"
                      ref={salesFileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleSalesFileSelected}
                    />

                    {salesImportPreview && (
                      <>
                        <hr style={{ margin: '16px 0' }} />
                        <p style={{ fontSize: '13px', marginBottom: '10px' }}>
                          Preview of <strong>{salesImportPreview.rows.length}</strong> imported rows.
                          Check the data before saving it permanently.
                        </p>
                        <div className="table-wrapper small">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Invoice</th>
                                <th>Customer no.</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Total</th>
                                <th>Cash</th>
                                <th>Unpaid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesImportPreview.rows.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.invoiceNo}</td>
                                  <td>{row.customerNo}</td>
                                  <td>{row.date}</td>
                                  <td>{row.customerName}</td>
                                  <td>{row.product}</td>
                                  <td>{row.total}</td>
                                  <td>{row.cash}</td>
                                  <td>{row.unpaid}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="form-actions" style={{ marginTop: '12px' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={confirmSalesImport}
                          >
                            <i className="fa-solid fa-check" />
                            <span>Confirm import</span>
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={cancelSalesImport}
                          >
                            <i className="fa-solid fa-xmark" />
                            <span>Discard preview</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}


{!showSalesForm && !showSalesImport && (
  <div className="top-actions-row">
    <button type="button" className="btn-primary" onClick={goSalesNew}>
      <i className="fa-solid fa-plus" />
      <span>Add sale</span>
    </button>
    <button type="button" className="btn-primary" onClick={goSalesImport}>
      <i className="fa-solid fa-file-arrow-up" />
      <span>Import sales</span>
    </button>
  </div>
)}

              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-file-invoice" />
                  </div>
                  <div className="summary-text">
                    <span>Total orders</span>
                    <strong>{salesSummary.totalOrders}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-sack-dollar" />
                  </div>
                  <div className="summary-text">
                    <span>Total sales amount</span>
                    <strong>{salesSummary.totalAmount}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-circle-exclamation" />
                  </div>
                  <div className="summary-text">
                    <span>Total outstanding</span>
                    <strong>{salesSummary.totalUnpaid}</strong>
                  </div>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    type="text"
                    placeholder="Search (customer, product, invoice)…"
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  {['all', 'today', 'week', 'month'].map((mode) => (
                    <button
                      key={mode}
                      className={`chip ${salesFilterMode === mode ? 'chip-filled' : ''}`}
                      onClick={() => {
                        setSalesFilterMode(mode)
                        setSalesDateFrom('')
                        setSalesDateTo('')
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
                      value={salesDateFrom}
                      onChange={(e) => {
                        setSalesDateFrom(e.target.value)
                        setSalesFilterMode('all')
                      }}
                      placeholder="From"
                    />
                  </div>
                  <div className="date-filter">
                    <i className="fa-solid fa-calendar-day" />
                    <input
                      type="date"
                      value={salesDateTo}
                      onChange={(e) => {
                        setSalesDateTo(e.target.value)
                        setSalesFilterMode('all')
                      }}
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              <div className="card table-card">
                <div className="card-header">
                  <h3>
                    <i className="fa-solid fa-list" /> Sales list
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
                          <th>Balance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((s) => {
                          const balance = Number(s.unpaid) || 0
                          const isNil = balance === 0
                          const display = isNil ? 'Nil' : formatMoney(balance)
                          const className =
                            balance > 0
                              ? 'tag tag-unpaid'
                              : balance < 0
                              ? 'tag tag-overpaid'
                              : 'badge-nil'

                          return (
                            <tr key={s.id}>
                              <td>{formatDisplayDate(s.date)}</td>
                              <td>{s.invoiceNo}</td>
                              <td>{s.customerName}</td>
                              <td>{s.product}</td>
                              <td>
                                <span className={className}>{display}</span>
                              </td>
                              <td className="actions">
                                <button
                                  className="icon-btn info"
                                  type="button"
                                  title="View change history"
                                  onClick={() => openHistory('sale', s, `Sales changes – ${s.invoiceNo}`)}
                                >
                                  <i className="fa-solid fa-clock-rotate-left" />
                                </button>
                                <button
                                  className="icon-btn edit"
                                  title="Edit"
                                  onClick={() => openEditSalesForm(s)}
                                >
                                  <i className="fa-solid fa-pen" />
                                </button>
                                <button
                                  className="icon-btn delete"
                                  title="Delete"
                                  onClick={() => deleteSale(s.id)}
                                >
                                  <i className="fa-solid fa-trash" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filteredSales.length === 0 && (
                      <div className="empty-state">
                        <i className="fa-regular fa-folder-open" />
                        <p>No sales records yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

  )
}

export default SalesPage
