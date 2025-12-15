import React from 'react'

function DashboardPage({
  cashLedgerTotalsAll,
  dashboardReceivableTotal,
  dashboardCustomerPayablesTotal,
  profitValue,
  supplierSummary,

  dashboardFilterMode,
  setDashboardFilterMode,
  dashboardYear,
  setDashboardYear,
  dashboardMonth,
  setDashboardMonth,
  dashboardRangeLabel,
}) {
  return (

            <section className="view active" id="view-dashboard">

              {/* Dashboard filter */}
              <div className="card" style={{ marginBottom: 12 }}>
                <div
                  className="card-body"
                  style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
                >
                  <strong>Dashboard filter:</strong>

                  <select value={dashboardFilterMode} onChange={(e) => setDashboardFilterMode(e.target.value)}>
                    <option value="all">All</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>

                  {dashboardFilterMode !== 'all' && (
                    <>
                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={dashboardYear}
                        onChange={(e) => setDashboardYear(e.target.value)}
                        style={{ width: 100 }}
                      />

                      {dashboardFilterMode === 'month' && (
                        <select value={dashboardMonth} onChange={(e) => setDashboardMonth(e.target.value)}>
                          {Array.from({ length: 12 }).map((_, i) => {
                            const mm = String(i + 1).padStart(2, '0')
                            return (
                              <option key={mm} value={mm}>
                                {mm}
                              </option>
                            )
                          })}
                        </select>
                      )}

                      <span style={{ opacity: 0.7 }}>Showing: {dashboardRangeLabel}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Row 1: Cash + customers */}
              <div className="summary-grid">
                {/* Total cash = CLOSING BALANCE (global) */}
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-sack-dollar" />
                  </div>
                  <div className="summary-text">
                    <span>Total cash </span>
                    <strong>{cashLedgerTotalsAll.closingBalance}</strong>
                  </div>
                </div>

                {/* Customers receivable = TOTAL OUTSTANDING (global) */}
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-user-check" />
                  </div>
                  <div className="summary-text">
                    <span>Customers receivable </span>
                    <strong>{dashboardReceivableTotal}</strong>
                  </div>
                </div>

                {/* Customers payable = TOTAL STILL PAYABLE (global) */}
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-user-minus" />
                  </div>
                  <div className="summary-text">
                    <span>Customers payable </span>
                    <strong>{dashboardCustomerPayablesTotal}</strong>
                  </div>
                </div>
              </div>

              {/* Row 2: Profit + suppliers */}
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-coins" />
                  </div>
                  <div className="summary-text">
                    <span>Total profit</span>
                    <strong>{profitValue}</strong>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-truck" />
                  </div>
                  <div className="summary-text">
                    <span>Suppliers total balance</span>
                    <strong>{supplierSummary.balance}</strong>
                  </div>
                </div>
              </div>
            </section>

  )
}

export default DashboardPage
