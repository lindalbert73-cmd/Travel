import React from 'react'
import { formatDisplayDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

function CustomersPayablePage({
  customerPayablesSummary,
  payableRefunds,
  refundSearch,
  setRefundSearch,
  refundFilterMode,
  setRefundFilterMode,
  refundDateFrom,
  setRefundDateFrom,
  refundDateTo,
  setRefundDateTo,
  exportCustomerPayablesPdf,
}) {
  return (

            <section id="view-customers-payable" className="view active">
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-user-minus" />
                  </div>
                  <div className="summary-text">
                    <span>Open refunds</span>
                    <strong>{customerPayablesSummary.totalCount}</strong>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-circle-exclamation" />
                  </div>
                  <div className="summary-text">
                    <span>Total still payable</span>
                    <strong>{customerPayablesSummary.totalOutstanding}</strong>
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
                <div className="toolbar-actions">
                  <button className="btn btn-outline" onClick={exportCustomerPayablesPdf}>
                    <i className="fa-regular fa-file-pdf" /> Export PDF
                  </button>
                </div>
                <div className="filter-group">
                  {['all', 'today', 'week', 'month'].map((mode) => (
                    <button
                      key={mode}
                      className={`chip ${
                        refundFilterMode === mode ? 'chip-filled' : ''
                      }`}
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
                    <i className="fa-solid fa-list" /> Customers payable (read-only)
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
                          <th>Still payable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payableRefunds.map((r) => {
                          const unpaid = Number(r.unpaid) || 0
                          const display = formatMoney(unpaid)
                          return (
                            <tr key={r.id}>
                              <td>{formatDisplayDate(r.date)}</td>
                              <td>{r.invoiceNo}</td>
                              <td>{r.customerName}</td>
                              <td>{r.product || '-'}</td>
                              <td>
                                <span className="tag tag-unpaid">{display}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {payableRefunds.length === 0 && (
                      <div className="empty-state">
                        <i className="fa-regular fa-folder-open" />
                        <p>No open customer refunds for this filter.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

  )
}

export default CustomersPayablePage
