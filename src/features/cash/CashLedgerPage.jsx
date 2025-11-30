import React from 'react'
import { formatDisplayDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

function CashLedgerPage({
  cashLedgerComputed,
  cashLedgerSearch,
  setCashLedgerSearch,
  cashLedgerFilterMode,
  setCashLedgerFilterMode,
  cashLedgerDateFrom,
  setCashLedgerDateFrom,
  cashLedgerDateTo,
  setCashLedgerDateTo,
  cashOpeningBalance,
  setCashOpeningBalance,
}) {
  return (

            <section id="view-cash-ledger" className="view active">
              <div className="card">
                <div className="card-header">
                  <h3>
                    <i className="fa-solid fa-sack-dollar" /> Cash ledger
                  </h3>
                </div>
                <div className="card-body">
                  <div className="summary-grid">
                    <div className="summary-card">
                      <div className="summary-icon">
                        <i className="fa-solid fa-coins" />
                      </div>
                      <div className="summary-text">
                        <span>Opening balance</span>
                        <strong>{cashLedgerComputed.openingBalance}</strong>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon">
                        <i className="fa-solid fa-arrow-down-long" />
                      </div>
                      <div className="summary-text">
                        <span>Cash in</span>
                        <strong>{cashLedgerComputed.totalIn}</strong>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon">
                        <i className="fa-solid fa-arrow-up-long" />
                      </div>
                      <div className="summary-text">
                        <span>Cash out</span>
                        <strong>{cashLedgerComputed.totalOut}</strong>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon">
                        <i className="fa-solid fa-sack-dollar" />
                      </div>
                      <div className="summary-text">
                        <span>Closing balance</span>
                        <strong>{cashLedgerComputed.closingBalance}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="toolbar">
                    <div className="search-box">
                      <i className="fa-solid fa-magnifying-glass" />
                      <input
                        type="text"
                        placeholder="Search description…"
                        value={cashLedgerSearch}
                        onChange={(e) => setCashLedgerSearch(e.target.value)}
                      />
                    </div>
                    <div className="filter-group">
                      {['all', 'today', 'week', 'month'].map((mode) => (
                        <button
                          key={mode}
                          className={`chip ${
                            cashLedgerFilterMode === mode ? 'chip-filled' : ''
                          }`}
                          onClick={() => {
                            setCashLedgerFilterMode(mode)
                            setCashLedgerDateFrom('')
                            setCashLedgerDateTo('')
                          }}
                          type="button"
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
                          value={cashLedgerDateFrom}
                          onChange={(e) => {
                            setCashLedgerDateFrom(e.target.value)
                            setCashLedgerFilterMode('all')
                          }}
                          placeholder="From"
                        />
                      </div>
                      <div className="date-filter">
                        <i className="fa-solid fa-calendar-day" />
                        <input
                          type="date"
                          value={cashLedgerDateTo}
                          onChange={(e) => {
                            setCashLedgerDateTo(e.target.value)
                            setCashLedgerFilterMode('all')
                          }}
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Opening cash balance</label>
                      <div className="input-with-icon">
                        <i className="fa-solid fa-coins" />
                        <input
                          type="number"
                          value={cashOpeningBalance}
                          onChange={(e) =>
                            setCashOpeningBalance(e.target.value)
                          }
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Cash in</th>
                          <th>Cash out</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashLedgerComputed.rows.map((row) => (
                          <tr key={row.id}>
                            <td>{formatDisplayDate(row.date)}</td>
                            <td>{row.type}</td>
                            <td>{row.description}</td>
                            <td>{row.amountIn ? formatMoney(row.amountIn) : ''}</td>
                            <td>{row.amountOut ? formatMoney(row.amountOut) : ''}</td>
                            <td>{formatMoney(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {cashLedgerComputed.rows.length === 0 && (
                      <div className="empty-state">
                        <i className="fa-regular fa-folder-open" />
                        <p>No cash movements for this filter.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

  )
}

export default CashLedgerPage
