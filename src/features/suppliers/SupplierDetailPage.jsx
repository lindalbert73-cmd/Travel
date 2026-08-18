import React, { useState } from 'react'
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
  onReorder,
}) {
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e, id) => {
    e.preventDefault() 
    if (dragOverId !== id) {
      setDragOverId(id)
    }
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    // 1. Sort the raw array to match the visual "Newest First" order on the screen
    const visualOrder = [...filteredSupplierOrders].sort((a, b) => {
      if ((a.sortOrder || 0) !== 0 || (b.sortOrder || 0) !== 0) {
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      }
      return b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0)
    })

    const visualIds = visualOrder.map((o) => String(o.id))
    const draggedIndex = visualIds.indexOf(String(draggedId))
    const targetIndex = visualIds.indexOf(String(targetId))

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newVisualIds = [...visualIds]
      const [movedItem] = newVisualIds.splice(draggedIndex, 1)
      newVisualIds.splice(targetIndex, 0, movedItem)

      if (onReorder) {
        onReorder(newVisualIds)
      }
    }

    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

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

                      <div className="form-field">
                        <label>Note</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-note-sticky" />
                          <input
                            type="text"
                            value={supplierOrderForm.note || ''}
                            onChange={(e) =>
                              setSupplierOrderForm((prev) => ({
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
                        <label>Credit side</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-list" />
                          <select
                            value={supplierOrderForm.creditSideType || ''}
                            onChange={(e) =>
                              setSupplierOrderForm((prev) => ({
                                ...prev,
                                creditSideType: e.target.value,
                              }))
                            }
                          >
                            <option value="">-- Select --</option>
                            <option value="credit">Credit (invoice)</option>
                            <option value="cashIn">
                              Cash in (receive from supplier)
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Amount credit / cash in</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-arrow-up" />
                          <input
                            type="number"
                            step="0.01"
                            value={supplierOrderForm.amountCredit || ''}
                            onChange={(e) =>
                              setSupplierOrderForm((prev) => ({
                                ...prev,
                                amountCredit: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Debit side</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-list" />
                          <select
                            value={supplierOrderForm.debitSideType || ''}
                            onChange={(e) =>
                              setSupplierOrderForm((prev) => ({
                                ...prev,
                                debitSideType: e.target.value,
                              }))
                            }
                          >
                            <option value="">-- Select --</option>
                            <option value="debit">Debit (return)</option>
                            <option value="cashOut">
                              Cash out (payment to supplier)
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Amount debit / cash out</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-arrow-down" />
                          <input
                            type="number"
                            step="0.01"
                            value={supplierOrderForm.amountDebit || ''}
                            onChange={(e) =>
                              setSupplierOrderForm((prev) => ({
                                ...prev,
                                amountDebit: e.target.value,
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
                        <th style={{ width: '30px' }}></th>
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
                        // 1. Sort Oldest -> Newest to calculate math
                        const chronologicalOrders = [...filteredSupplierOrders].sort((a, b) => {
                          return a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0)
                        });

                        // 2. Calculate balance forward
                        let runningBalance = 0;
                        const ordersWithBalance = chronologicalOrders.map((o) => {
                          const debit = Number(o.amountDebit) || 0;
                          const credit = Number(o.amountCredit) || 0;
                          runningBalance += credit - debit;
                          return { ...o, debit, credit, balanceRow: runningBalance };
                        });

                        // 3. Sort for Display (Newest -> Oldest, OR by Drag-and-Drop)
                        const displayOrders = ordersWithBalance.sort((a, b) => {
                          if ((a.sortOrder || 0) !== 0 || (b.sortOrder || 0) !== 0) {
                            return (a.sortOrder || 0) - (b.sortOrder || 0)
                          }
                          return b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0)
                        });

                        return displayOrders.map((o) => {
                          const isNil = o.balanceRow === 0
                          const display = isNil ? 'Nil' : formatMoney(o.balanceRow)
                          const className =
                            o.balanceRow > 0
                              ? 'tag tag-unpaid'
                              : o.balanceRow < 0
                              ? 'tag tag-overpaid'
                              : 'badge-nil'

                          return (
                            <tr 
                              key={o.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, o.id)}
                              onDragOver={(e) => handleDragOver(e, o.id)}
                              onDrop={(e) => handleDrop(e, o.id)}
                              onDragEnd={handleDragEnd}
                              style={{
                                cursor: 'grab',
                                opacity: draggedId === o.id ? 0.4 : 1,
                                borderBottom: dragOverId === o.id && draggedId !== o.id ? '2px solid #3b82f6' : 'none'
                              }}
                            >
                              <td style={{ color: '#9ca3af', cursor: 'grab' }}>
                                <i className="fa-solid fa-grip-vertical"></i> 
                              </td>
                              <td>{formatDisplayDate(o.date)}</td>
                              <td>{o.customerName}</td>
                              <td>{o.product || '-'}</td>
                              <td>{formatMoney(o.debit)}</td>
                              <td>{formatMoney(o.credit)}</td>
                              <td>
                                <span className={className}>{display}</span>
                              </td>
                              <td className="actions">
                                <button
                                  className="icon-btn info"
                                  type="button"
                                  title="View change history"
                                  onClick={() =>
                                    openHistory(
                                      'supplierOrder',
                                      o,
                                      'Order changes'
                                    )
                                  }
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