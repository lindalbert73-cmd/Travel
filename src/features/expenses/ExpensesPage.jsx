import React from 'react'
import { getTodayISO, formatDisplayDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

function ExpensesPage({
  expenses,
  filteredExpenses,
  expenseSummary,
  expenseSearch,
  setExpenseSearch,
  expenseFilterMode,
  setExpenseFilterMode,
  expenseFilterFrom,
  setExpenseFilterFrom,
  expenseFilterTo,
  setExpenseFilterTo,
  showExpenseForm,
  setShowExpenseForm,
  setExpenseForm,
  openEditExpense,
  deleteExpense,
  openHistory,
}) {
  return (

            <section id="view-expenses" className="view active">
              {!showExpenseForm && (
                <div className="top-actions-row">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setExpenseForm({
                        date: getTodayISO(),
                        description: '',
                        note: '',
                        cash: '',
                      })
                      setShowExpenseForm(true)
                    }}
                  >
                    <i className="fa-solid fa-plus" />
                    <span>Add expense</span>
                  </button>
                </div>
              )}

              <div className="card">
                <div className="card-header flex-between">
                  <h3>
                    <i className="fa-solid fa-wallet" /> Expenses
                  </h3>
                  <div className="expense-header-right">
                    <span className="badge badge-total-expense">
                      Total expense: {expenseSummary.total}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="toolbar">
                    <div className="search-box">
                      <i className="fa-solid fa-magnifying-glass" />
                      <input
                        type="text"
                        placeholder="Search (description, note)…"
                        value={expenseSearch}
                        onChange={(e) => setExpenseSearch(e.target.value)}
                      />
                    </div>
                    <div className="filter-group">
                      {['all', 'today', 'week', 'month'].map((mode) => (
                        <button
                          key={mode}
                          className={`chip ${expenseFilterMode === mode ? 'chip-filled' : ''}`}
                          onClick={() => {
                            setExpenseFilterMode(mode)
                            setExpenseFilterFrom('')
                            setExpenseFilterTo('')
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
                          value={expenseFilterFrom}
                          onChange={(e) => {
                            setExpenseFilterFrom(e.target.value)
                            setExpenseFilterMode('all')
                          }}
                          placeholder="From"
                        />
                      </div>
                      <div className="date-filter">
                        <i className="fa-solid fa-calendar-day" />
                        <input
                          type="date"
                          value={expenseFilterTo}
                          onChange={(e) => {
                            setExpenseFilterTo(e.target.value)
                            setExpenseFilterMode('all')
                          }}
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Note</th>
                          <th>Cash</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((e) => (
                          <tr key={e.id}>
                            <td>{formatDisplayDate(e.date)}</td>
                            <td>{e.description}</td>
                            <td>{e.note}</td>
                            <td>{formatMoney(e.cash)}</td>
                            <td className="actions">
                              <button
                                className="icon-btn info"
                                title="View change history"
                                type="button"
                                onClick={() => openHistory('expense', e, 'Expense changes')}
                              >
                                <i className="fa-solid fa-clock-rotate-left" />
                              </button>
                              <button
                                className="icon-btn edit"
                                title="Edit"
                                type="button"
                                onClick={() => openEditExpense(e)}
                              >
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button
                                className="icon-btn delete"
                                title="Delete"
                                type="button"
                                onClick={() => deleteExpense(e.id)}
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredExpenses.length === 0 && (
                      <div className="empty-state">
                        <i className="fa-regular fa-folder-open" />
                        <p>No expenses yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

  )
}

export default ExpensesPage
