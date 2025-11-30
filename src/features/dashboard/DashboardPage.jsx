import React from 'react'

function DashboardPage({
  cashLedgerTotalsAll,
  dashboardReceivableTotal,
  dashboardCustomerPayablesTotal,
  profitValue,
  supplierSummary,
}) {
  return (

            <section className="view active" id="view-dashboard">
              {/* Row 1: Cash + customers */}
              <div className="summary-grid">
                {/* Total cash = CLOSING BALANCE (global) */}
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-sack-dollar" />
                  </div>
                  <div className="summary-text">
                    <span>Total cash (closing balance)</span>
                    <strong>{cashLedgerTotalsAll.closingBalance}</strong>
                  </div>
                </div>

                {/* Customers receivable = TOTAL OUTSTANDING (global) */}
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-user-check" />
                  </div>
                  <div className="summary-text">
                    <span>Customers receivable (total outstanding)</span>
                    <strong>{dashboardReceivableTotal}</strong>
                  </div>
                </div>

                {/* Customers payable = TOTAL STILL PAYABLE (global) */}
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa-solid fa-user-minus" />
                  </div>
                  <div className="summary-text">
                    <span>Customers payable (still payable)</span>
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
