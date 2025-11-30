import React from 'react'
import { formatDisplayDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

function SupplierDetailPage({
  suppliers,
  supplierOrders,
  selectedSupplierId,
  supplierOrderForm,
  setSupplierOrderForm,
  supplierOrderSearch,
  setSupplierOrderSearch,
  supplierOrderFilterMode,
  setSupplierOrderFilterMode,
  filteredSupplierOrders,
  showSupplierOrderForm,
  editingSupplierOrder,
  getSupplierTotals,
  goSuppliersOverview,
  handleExportSupplierPDF,
  openSupplierOrderForm,
  closeSupplierOrderForm,
  handleSupplierOrderSubmit,
  deleteSupplierOrder,
  openEditSupplierOrder,
  openHistory,
}) {
  return (

            <section id="view-supplier-detail" className="view active">
              {(() => {
                const supplier = suppliers.find((s) => s.id === selectedSupplierId)
                if (!supplier) {
                  return (
                    <div className="card">
                      <div className="card-body">
                        <p style={{ fontSize: '13px' }}>Supplier not found.</p>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={goSuppliersOverview}
                        >
                          <i className="fa-solid fa-arrow-left" />
                          <span>Back to suppliers</span>
                        </button>
                      </div>
                    </div>
                  )
                }

                const { totalCredit, totalDebit, balance } = getSupplierTotals(
                  supplier,
                  supplierOrders,
                )

                return (
                  <>
                    <div className="top-actions-row">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={goSuppliersOverview}
                      >
                        <i className="fa-solid fa-arrow-left" />
                        <span>Back to suppliers</span>
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={handleExportSupplierPDF}
                      >
                        <i className="fa-solid fa-file-pdf" />
                        <span>Export as PDF</span>
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={openSupplierOrderForm}
                      >
                        <i className="fa-solid fa-plus" />
                        <span>Add order</span>
                      </button>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <h3>
                          <i className="fa-solid fa-truck" /> Supplier details
                        </h3>
                      </div>
                      <div className="card-body">
                        <p style={{ fontSize: '13px', marginBottom: '6px' }}>
                          <strong>{supplier.name}</strong>
                          {supplier.note ? ` – ${supplier.note}` : ''}
                        </p>
                      </div>
                    </div>

                    {showSupplierOrderForm && (
                      <div className="card form-card">
                        <div className="card-header">
                          <h3>
                            <i className="fa-solid fa-file-invoice-dollar" />{' '}
                            {editingSupplierOrder ? 'Edit order' : 'Add order'}
                          </h3>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handleSupplierOrderSubmit} autoComplete="off">
                            <div className="form-row">
                              <div className="form-field">
                                <label>Date</label>
                                <div className="input-with-icon">
                                  <i className="fa-solid fa-calendar-day" />
                                  <input
                                    type="date"
                                    value={supplierOrderForm.date}
                                    onChange={(e) =>
                                      setSupplierOrderForm((prev) => ({
                                        ...prev,
                                        date: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                              </div>
                              <div className="form-field">
                                <label>Customer name</label>
                                <div className="input-with-icon">
                                  <i className="fa-solid fa-user" />
                                  <input
                                    type="text"
                                    list="customer-options"
                                    value={supplierOrderForm.customerName}
                                    onChange={(e) =>
                                      setSupplierOrderForm((prev) => ({
                                        ...prev,
                                        customerName: e.target.value,
                                      }))
                                    }
                                    required
                                  />
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
                                    value={supplierOrderForm.product}
                                    onChange={(e) =>
                                      setSupplierOrderForm((prev) => ({
                                        ...prev,
                                        product: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="form-row">
                              <div className="form-field">
                                <label>Type</label>
                                <div className="input-with-icon">
                                  <i className="fa-solid fa-receipt" />
                                  <select
                                    value={supplierOrderForm.transactionType}
                                    onChange={(e) =>
                                      setSupplierOrderForm((prev) => ({
                                        ...prev,
                                        transactionType: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="invoice">Credit</option>
                                    <option value="return">Debit</option>
                                    <option value="payment">Payment to supplier (cash out)</option>
                                    <option value="refund">Receive from supplier (cash in)</option>
                                  </select>
                                </div>
                              </div>
                              <div className="form-field">
                                <label>
                                  {['invoice', 'refund'].includes(supplierOrderForm.transactionType)
                                    ? 'Amount credit'
                                    : 'Amount debit'}
                                </label>
                                <div className="input-with-icon">
                                  <i className="fa-solid fa-arrow-up" />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={
                                      ['invoice', 'refund'].includes(
                                        supplierOrderForm.transactionType,
                                      )
                                        ? supplierOrderForm.amountCredit
                                        : supplierOrderForm.amountDebit
                                    }
                                    onChange={(e) =>
                                      setSupplierOrderForm((prev) => {
                                        const value = e.target.value
                                        if (
                                          ['invoice', 'refund'].includes(
                                            prev.transactionType || 'invoice',
                                          )
                                        ) {
                                          return {
                                            ...prev,
                                            amountCredit: value,
                                            // keep debit as-is
                                          }
                                        } else {
                                          return {
                                            ...prev,
                                            amountDebit: value,
                                            // keep credit as-is
                                          }
                                        }
                                      })
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
                                onClick={closeSupplierOrderForm}
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
                          <i className="fa-solid fa-arrow-up" />
                        </div>
                        <div className="summary-text">
                          <span>Total credit</span>
                          <strong>{formatMoney(totalCredit)}</strong>
                        </div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-icon">
                          <i className="fa-solid fa-arrow-down" />
                        </div>
                        <div className="summary-text">
                          <span>Total debit</span>
                          <strong>{formatMoney(totalDebit)}</strong>
                        </div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-icon">
                          <i className="fa-solid fa-scale-unbalanced" />
                        </div>
                        <div className="summary-text">
                          <span>Balance</span>
                          <strong>{formatMoney(balance)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="toolbar">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input
                          type="text"
                          placeholder="Search transaction…"
                          value={supplierOrderSearch}
                          onChange={(e) => setSupplierOrderSearch(e.target.value)}
                        />
                      </div>
                      <div className="filter-group">
                        {['all', 'credit', 'debit'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            className={`chip ${
                              supplierOrderFilterMode === mode ? 'chip-filled' : ''
                            }`}
                            onClick={() => setSupplierOrderFilterMode(mode)}
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
                          <i className="fa-solid fa-list" /> Orders
                        </h3>
                      </div>
                      <div className="card-body">
                        <div className="table-wrapper">
                          <table>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Balance</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                let runningBalance = 0
                                return filteredSupplierOrders.map((o) => {
                                  const debit = Number(o.amountDebit) || 0
                                  const credit = Number(o.amountCredit) || 0
                                  runningBalance += credit - debit
                                  const balanceRow = runningBalance
                                  const isNil = balanceRow === 0
                                  const display = isNil ? 'Nil' : formatMoney(balanceRow)
                                  const className =
                                    balanceRow > 0
                                      ? 'tag tag-unpaid'
                                      : balanceRow < 0
                                      ? 'tag tag-overpaid'
                                      : 'badge-nil'

                                  return (
                                    <tr key={o.id}>
                                      <td>{formatDisplayDate(o.date)}</td>
                                      <td>{o.customerName}</td>
                                      <td>{o.product || '-'}</td>
                                      <td>{formatMoney(debit)}</td>
                                      <td>{formatMoney(credit)}</td>
                                      <td>
                                        <span className={className}>{display}</span>
                                      </td>
                                      <td className="actions">
                                        <button
                                          className="icon-btn info"
                                          type="button"
                                          title="View change history"
                                          onClick={() => openHistory('supplierOrder', o, 'Order changes')}
                                        >
                                          <i className="fa-solid fa-clock-rotate-left" />
                                        </button>
                                        <button
                                          className="icon-btn edit"
                                          title="Edit order"
                                          onClick={() => openEditSupplierOrder(o)}
                                        >
                                          <i className="fa-solid fa-pen" />
                                        </button>
                                        <button
                                          className="icon-btn delete"
                                          title="Delete order"
                                          onClick={() => deleteSupplierOrder(o.id)}
                                        >
                                          <i className="fa-solid fa-trash" />
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                          {filteredSupplierOrders.length === 0 && (
                            <div className="empty-state">
                              <i className="fa-regular fa-folder-open" />
                              <p>No orders yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </section>

  )
}

export default SupplierDetailPage
