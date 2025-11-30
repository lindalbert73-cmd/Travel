import React from 'react'
import { formatDisplayDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

function CustomersReceivablePage({
  receivableSummary,
  receivableInvoices,
  salesSearch,
  setSalesSearch,
  salesFilterMode,
  setSalesFilterMode,
  salesDateFrom,
  setSalesDateFrom,
  salesDateTo,
  setSalesDateTo,
  exportReceivablesPdf,
}) {
  return (

            <section id="view-customers-receivable" className="view active">
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-user-check" />
                  </div>
                  <div className="summary-text">
                    <span>Open invoices</span>
                    <strong>{receivableSummary.totalCount}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-circle-exclamation" />
                  </div>
                  <div className="summary-text">
                    <span>Total outstanding</span>
                    <strong>{receivableSummary.totalOutstanding}</strong>
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
                <div className="toolbar-actions">
                  <button className="btn btn-outline" onClick={exportReceivablesPdf}>
                    <i className="fa-regular fa-file-pdf" /> Export PDF
                  </button>
                </div>
                <div className="filter-group">
                  {['all', 'today', 'week', 'month'].map((mode) => (
                    <button
                      key={mode}
                      className={`chip ${
                        salesFilterMode === mode ? 'chip-filled' : ''
                      }`}
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
                    <i className="fa-solid fa-list" /> Customers receivable (read-only)
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
                          <th>Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivableInvoices.map((s) => {
                          const balance = Number(s.unpaid) || 0
                          const display = formatMoney(balance)
                          return (
                            <tr key={s.id}>
                              <td>{formatDisplayDate(s.date)}</td>
                              <td>{s.invoiceNo}</td>
                              <td>{s.customerName}</td>
                              <td>{s.product}</td>
                              <td>
                                <span className="tag tag-unpaid">{display}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {receivableInvoices.length === 0 && (
                      <div className="empty-state">
                        <i className="fa-regular fa-folder-open" />
                        <p>No open customer balances for this filter.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

  )
}

export default CustomersReceivablePage
