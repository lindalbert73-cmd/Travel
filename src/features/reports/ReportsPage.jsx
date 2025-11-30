import React from 'react'

function ReportsPage({
  exportReceivablesPdf,
  exportCustomerPayablesPdf,
  handleExportSupplierPDF,
}) {
  return (
    <section className="view active" id="view-reports">
      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-user-check" /> Customers receivable report
            </h3>
          </div>
          <div className="card-body">
            <p>
              Export a PDF report of all open customer balances (customers receivable) based on the
              current filters on the customers receivable view.
            </p>
            <button type="button" className="btn-primary" onClick={exportReceivablesPdf}>
              <i className="fa-solid fa-file-pdf" /> Export customers receivable PDF
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-user-minus" /> Customers payable report
            </h3>
          </div>
          <div className="card-body">
            <p>
              Export a PDF report of all amounts still payable to customers (customers payable)
              based on the current filters on the customers payable view.
            </p>
            <button type="button" className="btn-primary" onClick={exportCustomerPayablesPdf}>
              <i className="fa-solid fa-file-pdf" /> Export customers payable PDF
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-truck" /> Supplier ledger report
            </h3>
          </div>
          <div className="card-body">
            <p>
              Export a PDF ledger report for the currently selected supplier. Choose a supplier from
              the suppliers view, then run the export from here.
            </p>
            <button type="button" className="btn-primary" onClick={handleExportSupplierPDF}>
              <i className="fa-solid fa-file-pdf" /> Export supplier PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
