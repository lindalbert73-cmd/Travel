import React, { useEffect, useMemo, useState, useRef } from 'react'
import jsPDF from 'jspdf'
import AuthScreen from './features/auth/AuthScreen'
import SalesPage from './features/sales/SalesPage'
import ReportsPage from './features/reports/ReportsPage'
import DashboardPage from './features/dashboard/DashboardPage'
import ReturnsPage from './features/returns/ReturnsPage'
import ExpensesPage from './features/expenses/ExpensesPage'
import CashLedgerPage from './features/cash/CashLedgerPage'
import SuppliersPage from './features/suppliers/SuppliersPage'
import SupplierDetailPage from './features/suppliers/SupplierDetailPage'
import CustomersReceivablePage from './features/customers/CustomersReceivablePage'
import CustomersPayablePage from './features/customers/CustomersPayablePage'
import { getTodayISO, formatDisplayDate, withinLastDays } from './utils/dates'
import { formatMoney } from './utils/money'
import { STORAGE_KEYS } from './config/storageKeys'
import { loadAuthConfig, saveAuthConfig } from './utils/authConfig'


const COMMON_PRODUCTS = [
  'Ticket Flight',
  'Ticket Bus',
  'Ticket Bahn',
  'Ticket Change',
  'Visa Iran',
  'Visa Turkey',
  'Visa Pakistan',
  'Filling Form',
  'Passport Apply',
  'Book Appointment',
  'Translate Tazkira',
  'Translate Nikah Khat',
  'Translate School Documents',
  'Translate Car license',
  'Translate Others',
]




function App() {
  const [user, setUser] = useState(null)
  const [programName, setProgramName] = useState('Control console')
  const [profileForm, setProfileForm] = useState({
    programName: 'Control console',
    email: '',
  })

  const [activeView, setActiveView] = useState('dashboard')
  const [sales, setSales] = useState([])
  const [refunds, setRefunds] = useState([])
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1)
  const [nextCustomerNumber, setNextCustomerNumber] = useState(1)

  const [suppliers, setSuppliers] = useState([])
  const [supplierOrders, setSupplierOrders] = useState([])

  // Expenses
  const [expenses, setExpenses] = useState([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    date: getTodayISO(),
    description: '',
    note: '',
    cash: '',
  })
  const [expenseFilterMode, setExpenseFilterMode] = useState('all') // all | today | week | month
  const [expenseFilterFrom, setExpenseFilterFrom] = useState('')
  const [expenseFilterTo, setExpenseFilterTo] = useState('')
  const [expenseSearch, setExpenseSearch] = useState('')
  const [cashOpeningBalance, setCashOpeningBalance] = useState('')
  const [changeLog, setChangeLog] = useState([])
  const [historyModal, setHistoryModal] = useState({ open: false, entityType: null, entityId: null, title: '' })

  const [cashLedgerFilterMode, setCashLedgerFilterMode] = useState('all') // all | today | week | month
  const [cashLedgerDateFrom, setCashLedgerDateFrom] = useState('')
  const [cashLedgerDateTo, setCashLedgerDateTo] = useState('')
  const [cashLedgerSearch, setCashLedgerSearch] = useState('')


  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    note: '',
    debit: '',
    credit: '',
  })
  const [supplierFilterMode, setSupplierFilterMode] = useState('all') // all | credit | debit
  const [supplierSearch, setSupplierSearch] = useState('')

  const [selectedSupplierId, setSelectedSupplierId] = useState(null)
  const [editingSupplier, setEditingSupplier] = useState(null)

  const [showSupplierOrderForm, setShowSupplierOrderForm] = useState(false)
  const [supplierOrderForm, setSupplierOrderForm] = useState({
    date: getTodayISO(),
    customerName: '',
    product: '',
    transactionType: 'invoice',
    amountCredit: '',
    amountDebit: '',
  })
  const [supplierOrderFilterMode, setSupplierOrderFilterMode] = useState('all') // all | credit | debit
  const [supplierOrderSearch, setSupplierOrderSearch] = useState('')
  const [editingSupplierOrder, setEditingSupplierOrder] = useState(null)

  const [editingSale, setEditingSale] = useState(null)
  const [editingRefund, setEditingRefund] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)

  const [showSalesForm, setShowSalesForm] = useState(false)
  const [showRefundForm, setShowRefundForm] = useState(false)

  const [salesFilterMode, setSalesFilterMode] = useState('all')
  const [salesSearch, setSalesSearch] = useState('')
  const [salesDateFrom, setSalesDateFrom] = useState('')
  const [salesDateTo, setSalesDateTo] = useState('')

  const [refundFilterMode, setRefundFilterMode] = useState('all')
  const [refundSearch, setRefundSearch] = useState('')
  const [refundDateFrom, setRefundDateFrom] = useState('')
  const [refundDateTo, setRefundDateTo] = useState('')

  const [salesForm, setSalesForm] = useState({
    invoiceNo: '',
    customerNo: '',
    date: getTodayISO(),
    customerName: '',
    product: '',
    total: '',
    cash: '',
    unpaid: '',
    note: '',
  })

  const [refundForm, setRefundForm] = useState({
    invoiceNo: '',
    date: getTodayISO(),
    customerNo: '',
    customerName: '',
    product: '',
    total: '',
    cash: '',
    unpaid: '',
    note: '',
  })

  const salesFileInputRef = useRef(null)

  const [showSalesImport, setShowSalesImport] = useState(false)
  const [salesImportPreview, setSalesImportPreview] = useState(null)

  // load persisted data
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(STORAGE_KEYS.sales)
      const r = window.localStorage.getItem(STORAGE_KEYS.refunds)
      const inv = window.localStorage.getItem(STORAGE_KEYS.invoiceCounter)
      const cust = window.localStorage.getItem(STORAGE_KEYS.customerCounter)
      const sup = window.localStorage.getItem(STORAGE_KEYS.suppliers)
      const supOrders = window.localStorage.getItem(STORAGE_KEYS.supplierOrders)
      const exp = window.localStorage.getItem(STORAGE_KEYS.expenses)
      const opening = window.localStorage.getItem(STORAGE_KEYS.cashOpening)
      const authRaw = window.localStorage.getItem(STORAGE_KEYS.auth)

      setSales(s ? JSON.parse(s) : [])
      setRefunds(r ? JSON.parse(r) : [])
      setNextInvoiceNumber(inv ? Number(inv) : 1)
      setNextCustomerNumber(cust ? Number(cust) : 1)
      setSuppliers(sup ? JSON.parse(sup) : [])
      setSupplierOrders(supOrders ? JSON.parse(supOrders) : [])
      setExpenses(exp ? JSON.parse(exp) : [])
      setCashOpeningBalance(opening ? String(Number(opening) || 0) : '')
      const log = window.localStorage.getItem(STORAGE_KEYS.changeLog)
      setChangeLog(log ? JSON.parse(log) : [])

      if (authRaw) {
        try {
          const authCfg = JSON.parse(authRaw)
          if (authCfg.programName) {
            setProgramName(authCfg.programName)
          }
          if (authCfg.email) {
            setProfileForm((prev) => ({
              ...prev,
              email: authCfg.email,
              programName: authCfg.programName || prev.programName,
            }))
          }
        } catch (err) {
          console.error('Failed to parse auth config', err)
        }
      }
    } catch (e) {
      console.error('Failed to load state', e)
    }
  }, [])

  // persist
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales))
  }, [sales])
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.refunds, JSON.stringify(refunds))
  }, [refunds])
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.invoiceCounter, String(nextInvoiceNumber))
  }, [nextInvoiceNumber])
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.customerCounter, String(nextCustomerNumber))
  }, [nextCustomerNumber])
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers))
  }, [suppliers])
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.supplierOrders, JSON.stringify(supplierOrders))
  }, [supplierOrders])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses))
  }, [expenses])
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.changeLog, JSON.stringify(changeLog))
  }, [changeLog])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.cashOpening,
      String(Number(cashOpeningBalance) || 0),
    )
  }, [cashOpeningBalance])

  // helpers
  function recalcSalesUnpaid(form) {
    const total = Number(form.total) || 0
    const cash = Number(form.cash) || 0
    const unpaid = total - cash
    return { ...form, unpaid: unpaid.toFixed(2) }
  }

  function recalcRefundUnpaid(form) {
    const total = Number(form.total) || 0
    const cash = Number(form.cash) || 0
    const unpaid = total - cash
    return { ...form, unpaid: unpaid.toFixed(2) }
  }
  function getSupplierTotals(supplier, allOrders) {
    if (!supplier) {
      return { totalCredit: 0, totalDebit: 0, balance: 0 }
    }

    const baseCredit = Number(supplier.credit) || 0
    const baseDebit = Number(supplier.debit) || 0

    let ordersCredit = 0
    let ordersDebit = 0

    for (const o of allOrders) {
      if (o.supplierId !== supplier.id) continue
      ordersCredit += Number(o.amountCredit) || 0
      ordersDebit += Number(o.amountDebit) || 0
    }

    const totalCredit = baseCredit + ordersCredit
    const totalDebit = baseDebit + ordersDebit
    const balance = totalCredit - totalDebit

    return { totalCredit, totalDebit, balance }
  }


  // navigation helpers (sidebar)
  function handleAuthSuccess(info) {
    setUser({ email: info.email })
    setProgramName(info.programName || 'Control console')
    setProfileForm((prev) => ({
      ...prev,
      email: info.email,
      programName: info.programName || prev.programName,
    }))
    setActiveView('dashboard')
  }

  function handleLogout() {
    setUser(null)
    setActiveView('dashboard')
  }

  function goDashboard() {
    setActiveView('dashboard')
    setShowSalesForm(false)
    setShowRefundForm(false)
    setShowSalesImport(false)
    setEditingSale(null)
    setEditingRefund(null)
  }

  function goSalesOverview() {
    setActiveView('sales')
    setShowSalesForm(false)
    setShowSalesImport(false)
    setEditingSale(null)
  }

  function goSalesNew() {
    setEditingSale(null)
    setShowSalesImport(false)
    const invoiceNo = `INV-${String(nextInvoiceNumber).padStart(4, '0')}`
    const customerNo = `C-${String(nextCustomerNumber).padStart(4, '0')}`
    setSalesForm(
      recalcSalesUnpaid({
        invoiceNo,
        customerNo,
        date: getTodayISO(),
        customerName: '',
        product: '',
        total: '',
        cash: '',
        unpaid: '',
      }),
    )
    setActiveView('sales')
    setShowSalesForm(true)
  }

  function goSalesImport() {
    setActiveView('sales')
    setShowSalesForm(false)
    setShowSalesImport(true)
    setEditingSale(null)
  }

  function goReturnsOverview() {
    setActiveView('returns')
    setShowRefundForm(false)
    setEditingRefund(null)
  }

  function goSuppliersOverview() {
    setActiveView('suppliers')
    setSelectedSupplierId(null)
    setShowSupplierForm(false)
    setShowSupplierOrderForm(false)
    setEditingSupplier(null)
    setEditingSupplierOrder(null)
  }

  function openSupplierDetail(id) {
    setSelectedSupplierId(id)
    setActiveView('supplierDetail')
    setShowSupplierOrderForm(false)
    setSupplierOrderSearch('')
    setSupplierOrderFilterMode('all')
    setEditingSupplierOrder(null)
  }

  function goReturnsNew() {
    setEditingRefund(null)
    setRefundForm(
      recalcRefundUnpaid({
        invoiceNo: '',
        date: getTodayISO(),
        customerNo: '',
        customerName: '',
        product: '',
        total: '',
        cash: '',
        unpaid: '',
      }),
    )
    setActiveView('returns')
    setShowRefundForm(true)
  }

  // editing helpers

  function openHistory(entityType, entity, title) {
    if (!entity || entity.id == null) return
    setHistoryModal({
      open: true,
      entityType,
      entityId: entity.id,
      title: title || 'Change history',
    })
  }

  function closeHistoryModal() {
    setHistoryModal({ open: false, entityType: null, entityId: null, title: '' })
  }

  function openEditSalesForm(sale) {
    setEditingSale(sale)
    setSalesForm({
      invoiceNo: sale.invoiceNo,
      customerNo: sale.customerNo,
      date: sale.date,
      customerName: sale.customerName,
      product: sale.product,
      total: String(sale.total),
      cash: String(sale.cash),
      unpaid: String(sale.unpaid),
      note: sale.note || '',
    })
    setActiveView('sales')
    setShowSalesForm(true)
  }

  function closeSalesForm() {
    setShowSalesForm(false)
    setEditingSale(null)
  }

  function openEditRefundForm(refund) {
    setEditingRefund(refund)
    setRefundForm({
      invoiceNo: refund.invoiceNo,
      date: refund.date,
      customerNo: refund.customerNo,
      customerName: refund.customerName,
      product: refund.product || '',
      total: String(refund.total),
      cash: String(refund.cash),
      unpaid: String(refund.unpaid),
      note: refund.note || '',
    })
    setActiveView('returns')
    setShowRefundForm(true)
  }

  function closeRefundForm() {
    setShowRefundForm(false)
    setEditingRefund(null)
  }

  // submit handlers
  function handleSalesSubmit(e) {
    e.preventDefault()
    const { invoiceNo, customerNo, date, customerName, product, total, cash, unpaid, note } =
      salesForm

    if (!customerName.trim() || !product.trim() || !date) {
      alert('Please fill in all required fields.')
      return
    }

    const saleData = {
      invoiceNo,
      customerNo,
      date,
      customerName: customerName.trim(),
      product: product.trim(),
      total: Number(total) || 0,
      cash: Number(cash) || 0,
      unpaid: Number(unpaid) || 0,
      note: note ? note.trim() : '',
    }

    if (editingSale) {
      // update existing + track changes
      const oldSale = editingSale
      const updatedSale = { ...oldSale, ...saleData }

      const fieldsToTrack = ['date', 'customerName', 'product', 'total', 'cash', 'unpaid', 'note']
      const changes = []

      fieldsToTrack.forEach((field) => {
        const oldValue = oldSale[field]
        const newValue = updatedSale[field]
        if (String(oldValue ?? '') !== String(newValue ?? '')) {
          changes.push({ field, oldValue, newValue })
        }
      })

      if (changes.length) {
        setChangeLog((prev) => {
          const nextId = prev.length ? Math.max(...prev.map((l) => l.id || 0)) + 1 : 1
          return [
            ...prev,
            {
              id: nextId,
              entityType: 'sale',
              entityId: oldSale.id,
              invoiceNo: oldSale.invoiceNo,
              changedAt: new Date().toISOString(),
              changes,
            },
          ]
        })
      }

      setSales((prev) => prev.map((s) => (s.id === editingSale.id ? { ...s, ...saleData } : s)))
      setEditingSale(null)
      return
    }

    // create new sale
    const id = sales.length ? Math.max(...sales.map((s) => s.id || 0)) + 1 : 1
    setSales((prev) => [...prev, { id, ...saleData }])

    const newNextInvoice = nextInvoiceNumber + 1
    const newNextCustomer = nextCustomerNumber + 1
    setNextInvoiceNumber(newNextInvoice)
    setNextCustomerNumber(newNextCustomer)

    const newInvoice = `INV-${String(newNextInvoice).padStart(4, '0')}`
    const newCustomer = `C-${String(newNextCustomer).padStart(4, '0')}`

    setSalesForm(
      recalcSalesUnpaid({
        invoiceNo: newInvoice,
        customerNo: newCustomer,
        date: getTodayISO(),
        customerName: '',
        product: '',
        total: '',
        cash: '',
        unpaid: '',
        note: '',
      }),
    )
  }

  function handleRefundInvoiceChange(invoiceNo) {
    const sale = sales.find((s) => s.invoiceNo === invoiceNo)
    setRefundForm((prev) =>
      recalcRefundUnpaid({
        ...prev,
        invoiceNo,
        customerNo: sale ? sale.customerNo : '',
        customerName: sale ? sale.customerName : '',
        product: sale ? sale.product : '',
        note: '',
      }),
    )
  }

  function handleRefundSubmit(e) {
    e.preventDefault()
    const { invoiceNo, date, customerNo, customerName, product, total, cash, unpaid, note } = refundForm
    if (!invoiceNo || !date) {
      alert('Please select an invoice and date.')
      return
    }

    const relatedSale = sales.find((s) => s.invoiceNo === invoiceNo)
    const finalProduct = product && product.trim()
      ? product.trim()
      : relatedSale
      ? relatedSale.product
      : ''

    const refundData = {
      invoiceNo,
      date,
      customerNo,
      customerName,
      product: finalProduct,
      total: Number(total) || 0,
      cash: Number(cash) || 0,
      unpaid: Number(unpaid) || 0,
      note: note ? note.trim() : '',
    }

    if (editingRefund) {
      const oldRefund = editingRefund
      const updatedRefund = { ...oldRefund, ...refundData }

      const fieldsToTrack = ['date', 'customerName', 'product', 'total', 'cash', 'unpaid', 'note']
      const changes = []

      fieldsToTrack.forEach((field) => {
        const oldValue = oldRefund[field]
        const newValue = updatedRefund[field]
        if (String(oldValue ?? '') !== String(newValue ?? '')) {
          changes.push({ field, oldValue, newValue })
        }
      })

      if (changes.length) {
        setChangeLog((prev) => {
          const nextId = prev.length ? Math.max(...prev.map((l) => l.id || 0)) + 1 : 1
          return [
            ...prev,
            {
              id: nextId,
              entityType: 'refund',
              entityId: oldRefund.id,
              invoiceNo: oldRefund.invoiceNo,
              changedAt: new Date().toISOString(),
              changes,
            },
          ]
        })
      }

      setRefunds((prev) =>
        prev.map((r) => (r.id === editingRefund.id ? { ...r, ...refundData } : r)),
      )
    } else {
      const id = refunds.length ? Math.max(...refunds.map((r) => r.id || 0)) + 1 : 1
      setRefunds((prev) => [...prev, { id, ...refundData }])
    }

    setEditingRefund(null)
    setRefundForm(
      recalcRefundUnpaid({
        invoiceNo: '',
        date: getTodayISO(),
        customerNo: '',
        customerName: '',
        product: '',
        total: '',
        cash: '',
        unpaid: '',
        note: '',
      }),
    )
  }

  function deleteSale(id) {
    if (!window.confirm('Delete this sales entry?')) return
    setSales((prev) => prev.filter((s) => s.id !== id))
  }

  function deleteRefund(id) {
    if (!window.confirm('Delete this refund entry?')) return
    setRefunds((prev) => prev.filter((r) => r.id !== id))
  }

  function openEditExpense(exp) {
    setEditingExpense(exp)
    setExpenseForm({
      date: exp.date || getTodayISO(),
      description: exp.description || '',
      note: exp.note || '',
      cash: String(exp.cash ?? '0'),
    })
    setShowExpenseForm(true)
  }

  function deleteExpense(id) {
    if (!window.confirm('Delete this expense entry?')) return
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  function deleteSupplier(id) {
    const hasOrders = supplierOrders.some((o) => o.supplierId === id)
    if (hasOrders) {
      alert('Cannot delete supplier with existing orders.')
      return
    }
    if (!window.confirm('Delete this supplier?')) return
    setSuppliers((prev) => prev.filter((s) => s.id !== id))
  }

  function openEditSupplierForm(supplier) {
    const hasOrders = supplierOrders.some((o) => o.supplierId === supplier.id)
    if (hasOrders) {
      alert('Cannot edit supplier that has orders.')
      return
    }
    setEditingSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      note: supplier.note || '',
      debit: String(supplier.debit ?? 0),
      credit: String(supplier.credit ?? 0),
    })
    setShowSupplierForm(true)
  }

  function closeSupplierForm() {
    setShowSupplierForm(false)
    setEditingSupplier(null)
  }

  function handleSupplierSubmit(e) {
    e.preventDefault()
    const { name, note, debit, credit } = supplierForm

    if (!name.trim()) {
      alert('Please enter supplier name.')
      return
    }

    const base = {
      name: name.trim(),
      note: note.trim(),
      debit: Number(debit) || 0,
      credit: Number(credit) || 0,
    }

    if (editingSupplier) {
      const oldSupplier = editingSupplier
      const updatedSupplier = { ...oldSupplier, ...base }

      const fieldsToTrack = ['name', 'note', 'debit', 'credit']
      const changes = []

      fieldsToTrack.forEach((field) => {
        const oldValue = oldSupplier[field]
        const newValue = updatedSupplier[field]
        if (String(oldValue ?? '') !== String(newValue ?? '')) {
          changes.push({ field, oldValue, newValue })
        }
      })

      if (changes.length) {
        setChangeLog((prev) => {
          const nextId = prev.length ? Math.max(...prev.map((l) => l.id || 0)) + 1 : 1
          return [
            ...prev,
            {
              id: nextId,
              entityType: 'supplier',
              entityId: oldSupplier.id,
              changedAt: new Date().toISOString(),
              changes,
            },
          ]
        })
      }

      setSuppliers((prev) =>
        prev.map((s) => (s.id === editingSupplier.id ? { ...s, ...base } : s)),
      )
    } else {
      const id = suppliers.length ? Math.max(...suppliers.map((s) => s.id || 0)) + 1 : 1
      setSuppliers((prev) => [...prev, { id, ...base }])
    }

    setEditingSupplier(null)
    setSupplierForm({
      name: '',
      note: '',
      debit: '',
      credit: '',
    })
    setShowSupplierForm(false)
  }

  function openSupplierOrderForm() {
    if (!selectedSupplierId) return
    setEditingSupplierOrder(null)
    setSupplierOrderForm({
      date: getTodayISO(),
      customerName: '',
      product: '',
      transactionType: 'invoice',
      amountCredit: '',
      amountDebit: '',
    })
    setShowSupplierOrderForm(true)
  }

  function openEditSupplierOrder(order) {
    setEditingSupplierOrder(order)
    setSupplierOrderForm({
      date: order.date,
      customerName: order.customerName,
      product: order.product || '',
      transactionType: order.transactionType || 'invoice',
      amountCredit: String(order.amountCredit ?? 0),
      amountDebit: String(order.amountDebit ?? 0),
    })
    setShowSupplierOrderForm(true)
  }

  function closeSupplierOrderForm() {
    setShowSupplierOrderForm(false)
    setEditingSupplierOrder(null)
  }

  function deleteSupplierOrder(id) {
    if (!window.confirm('Delete this order?')) return
    setSupplierOrders((prev) => prev.filter((o) => o.id !== id))
  }

  function handleSupplierOrderSubmit(e) {
    e.preventDefault()
    if (!selectedSupplierId) return

    const { date, customerName, product, amountCredit, amountDebit, transactionType } = supplierOrderForm

    if (!date || !customerName.trim()) {
      alert('Please fill date and customer name.')
      return
    }

    const data = {
      supplierId: selectedSupplierId,
      date,
      customerName: customerName.trim(),
      product: product.trim(),
      transactionType: transactionType || 'invoice',
      amountCredit: Number(amountCredit) || 0,
      amountDebit: Number(amountDebit) || 0,
    }

    if (editingSupplierOrder) {
      const oldOrder = editingSupplierOrder
      const updatedOrder = { ...oldOrder, ...data }

      const fieldsToTrack = ['date', 'customerName', 'product', 'transactionType', 'amountCredit', 'amountDebit']
      const changes = []

      fieldsToTrack.forEach((field) => {
        const oldValue = oldOrder[field]
        const newValue = updatedOrder[field]
        if (String(oldValue ?? '') !== String(newValue ?? '')) {
          changes.push({ field, oldValue, newValue })
        }
      })

      if (changes.length) {
        setChangeLog((prev) => {
          const nextId = prev.length ? Math.max(...prev.map((l) => l.id || 0)) + 1 : 1
          return [
            ...prev,
            {
              id: nextId,
              entityType: 'supplierOrder',
              entityId: oldOrder.id,
              supplierId: oldOrder.supplierId,
              changedAt: new Date().toISOString(),
              changes,
            },
          ]
        })
      }

      setSupplierOrders((prev) =>
        prev.map((o) => (o.id === editingSupplierOrder.id ? { ...o, ...data } : o)),
      )
    } else {
      const id = supplierOrders.length ? Math.max(...supplierOrders.map((o) => o.id || 0)) + 1 : 1
      setSupplierOrders((prev) => [...prev, { id, ...data }])
    }

    // keep form open for continuous entry
    setEditingSupplierOrder(null)
    setSupplierOrderForm({
      date: getTodayISO(),
      customerName: '',
      product: '',
      transactionType: 'invoice',
      amountCredit: '',
      amountDebit: '',
    })
  }

  function handleExportSupplierPDF() {
    const supplier = suppliers.find((s) => s.id === selectedSupplierId)
    if (!supplier) return

    const orders = supplierOrders.filter((o) => o.supplierId === selectedSupplierId)
    const { totalCredit, totalDebit, balance } = getSupplierTotals(supplier, supplierOrders)

    let runningBalance = 0

    const rowsHtml = orders
      .sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0))
      .map((o) => {
        const debit = Number(o.amountDebit) || 0
        const credit = Number(o.amountCredit) || 0
        runningBalance += credit - debit
        return `
          <tr>
            <td>${formatDisplayDate(o.date)}</td>
            <td>${o.customerName}</td>
            <td>${o.product || ''}</td>
            <td>${debit.toFixed(2)}</td>
            <td>${credit.toFixed(2)}</td>
            <td>${runningBalance.toFixed(2)}</td>
          </tr>
        `
      })
      .join('')

    const html = `
      <html>
      <head>
        <title>Supplier report - ${supplier.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 16px; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; text-align: left; }
          th { background: #f3f4f6; }
          .summary { margin-top: 8px; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>Supplier: ${supplier.name}</h1>
        <div class="summary">
          <div><strong>Total credit:</strong> ${totalCredit.toFixed(2)}</div>
          <div><strong>Total debit:</strong> ${totalDebit.toFixed(2)}</div>
          <div><strong>Balance:</strong> ${balance.toFixed(2)}</div>
        </div>
        <h2>Orders</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6">No orders yet.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }



  // ---- sales CSV import helpers ----
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (!lines.length) return []
    const delimiter = lines[0].includes(';') ? ';' : ','
    const rows = lines.map(line => line.split(delimiter).map(c => c.trim()))
    return rows
  }

  function normaliseHeaderName(name) {
    return name.toLowerCase().replace(/\s+/g, '')
  }

  function parseDMYToISO(value) {
  if (value === undefined || value === null) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''

  // Excel serial date support (e.g. 45238 -> days since 1899-12-30)
  if (/^\d+(\.0+)?$/.test(trimmed)) {
    const serial = parseInt(trimmed, 10)
    if (!Number.isNaN(serial)) {
      const base = new Date(Date.UTC(1899, 11, 30))
      base.setUTCDate(base.getUTCDate() + serial)
      const y = base.getUTCFullYear()
      const m = String(base.getUTCMonth() + 1).padStart(2, '0')
      const d = String(base.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }

  const norm = trimmed.replace(/[-\/]/g, '.')
  const parts = norm.split('.').map(p => p.trim()).filter(Boolean)
  if (parts.length < 3) return ''
  let [d, m, y] = parts
  if (y.length === 2) {
    y = Number(y) >= 70 ? '19' + y : '20' + y
  }
  if (d.length === 1) d = '0' + d
  if (m.length === 1) m = '0' + m
  if (!y || !m || !d) return ''
  return `${y}-${m}-${d}`
}


  
  function importSalesFromCSV(text) {
    const rows = parseCSV(text)
    if (!rows.length) {
      alert('File is empty.')
      setSalesImportPreview(null)
      return
    }

    const header = rows[0]
    const body = rows.slice(1)

    const nameIdx = header.findIndex((h) =>
      ['name', 'customer', 'customername'].includes(normaliseHeaderName(h)),
    )
    const productIdx = header.findIndex((h) =>
      ['product'].includes(normaliseHeaderName(h)),
    )
    const totalIdx = header.findIndex((h) =>
      ['totalamount', 'total'].includes(normaliseHeaderName(h)),
    )
    const cashIdx = header.findIndex((h) =>
      ['cash'].includes(normaliseHeaderName(h)),
    )
    const unpaidIdx = header.findIndex((h) =>
      ['unpaid', 'outstanding'].includes(normaliseHeaderName(h)),
    )
    let dateIdx = header.findIndex((h) =>
      ['datum', 'date', 'salesdate'].includes(normaliseHeaderName(h)),
    )

    // Fallback: auto-detect date column by looking for first cell that looks like a date
    if (dateIdx === -1) {
      for (let col = 0; col < header.length; col++) {
        const sampleRow = body.find((row) => row[col] && String(row[col]).trim())
        if (!sampleRow) continue
        const val = String(sampleRow[col]).trim()
        if (/^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$/.test(val)) {
          dateIdx = col
          break
        }
      }
    }

    if (nameIdx === -1 || productIdx === -1 || totalIdx === -1) {
      alert('Header row must contain at least: name, product, total amount.')
      setSalesImportPreview(null)
      return
    }

    const today = getTodayISO()
    const previewEntries = []
    let created = 0

    let baseId = sales.length ? Math.max(...sales.map((s) => s.id || 0)) : 0
    let nextInv = nextInvoiceNumber
    let nextCust = nextCustomerNumber

    body.forEach((cols) => {
      if (!cols.length || cols.every((c) => !c)) return

      const rawDate = dateIdx >= 0 ? cols[dateIdx] : ''
      const isoDate = rawDate ? parseDMYToISO(rawDate) : ''
      const effectiveDate = isoDate || today

      const customerName = cols[nameIdx] || ''
      const product = cols[productIdx] || ''
      const total = Number(cols[totalIdx] || 0) || 0
      const cash = cashIdx >= 0 ? Number(cols[cashIdx] || 0) || 0 : 0
      const unpaidRaw = unpaidIdx >= 0 ? Number(cols[unpaidIdx] || 0) || 0 : null
      const unpaid = unpaidRaw !== null ? unpaidRaw : Math.max(total - cash, 0)

      if (!customerName && !product && !total) return

      baseId += 1
      const id = baseId

      const invoiceNo = `INV-${String(nextInv).padStart(4, '0')}`
      const customerNo = `C-${String(nextCust).padStart(4, '0')}`
      nextInv += 1
      nextCust += 1

      previewEntries.push({
        id,
        invoiceNo,
        customerNo,
        date: effectiveDate,
        customerName,
        product,
        total,
        cash,
        unpaid,
      })
      created += 1
    })

    if (!created) {
      alert('No valid rows found in file.')
      setSalesImportPreview(null)
      return
    }

    setSalesImportPreview({
      rows: previewEntries,
      created,
    })
  }

  function confirmSalesImport() {
    if (!salesImportPreview || !salesImportPreview.rows?.length) return

    setSales((prev) => [...prev, ...salesImportPreview.rows])

    const created = salesImportPreview.created || salesImportPreview.rows.length
    setNextInvoiceNumber((n) => n + created)
    setNextCustomerNumber((n) => n + created)

    setSalesImportPreview(null)
    alert(`Imported ${created} sales rows.`)
  }

  function cancelSalesImport() {
    if (!salesImportPreview) return
    const ok = window.confirm('Discard this imported file preview? Nothing will be saved.')
    if (!ok) return
    setSalesImportPreview(null)
  }

  function handleSalesImportClick() {
    if (salesFileInputRef.current) {
      salesFileInputRef.current.value = ''
      salesFileInputRef.current.click()
    }
  }

  function handleSalesFileSelected(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      importSalesFromCSV(text)
    }
    reader.readAsText(file)
  }

// summaries
  const salesSummary = useMemo(() => {
    // apply the same filters as the sales list (search, date range, quick filters)
    let list = [...sales]
    const search = salesSearch.toLowerCase()

    list = list.filter((s) => {
      let ok = true
      if (search) {
        const combined = `${s.customerName} ${s.product} ${s.invoiceNo}`.toLowerCase()
        ok = combined.includes(search)
      }
      if (!ok) return false

      if (salesDateFrom && s.date < salesDateFrom) {
        ok = false
      }
      if (salesDateTo && s.date > salesDateTo) {
        ok = false
      }
      if (!ok) return false

      if (salesFilterMode === 'today') {
        ok = s.date === getTodayISO()
      } else if (salesFilterMode === 'week') {
        ok = withinLastDays(s.date, 7)
      } else if (salesFilterMode === 'month') {
        ok = withinLastDays(s.date, 31)
      }
      return ok
    })

    const totalOrders = list.length
    let totalAmount = 0
    let totalUnpaid = 0
    for (const s of list) {
      totalAmount += Number(s.total) || 0
      const bal = Number(s.unpaid) || 0
      if (bal > 0) totalUnpaid += bal
    }
    return {
      totalOrders,
      totalAmount: formatMoney(totalAmount),
      totalUnpaid: formatMoney(totalUnpaid),
    }
  }, [sales, salesSearch, salesDateFrom, salesDateTo, salesFilterMode])

  const customerNameSuggestions = useMemo(() => {
    const names = new Set()

    sales.forEach((s) => {
      if (s.customerName) names.add(s.customerName.trim())
    })
    refunds.forEach((r) => {
      if (r.customerName) names.add(r.customerName.trim())
    })
    supplierOrders.forEach((o) => {
      if (o.customerName) names.add(o.customerName.trim())
    })

    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [sales, refunds, supplierOrders])

  const refundSummary = useMemo(() => {
    // apply same filters as the refund list
    let list = [...refunds]
    const search = refundSearch.toLowerCase()

    list = list.filter((r) => {
      let ok = true
      if (search) {
        const combined = `${r.customerName} ${r.product} ${r.invoiceNo}`.toLowerCase()
        ok = combined.includes(search)
      }
      if (!ok) return false

      if (refundDateFrom && r.date < refundDateFrom) {
        ok = false
      }
      if (refundDateTo && r.date > refundDateTo) {
        ok = false
      }
      if (!ok) return false

      if (refundFilterMode === 'today') {
        ok = r.date === getTodayISO()
      } else if (refundFilterMode === 'week') {
        ok = withinLastDays(r.date, 7)
      } else if (refundFilterMode === 'month') {
        ok = withinLastDays(r.date, 31)
      }
      return ok
    })

    const totalCount = list.length
    let totalRefunded = 0
    let totalStillOwe = 0
    for (const r of list) {
      const cash = Number(r.cash) || 0
      const unpaid = Number(r.unpaid) || 0
      totalRefunded += cash
      if (unpaid > 0) totalStillOwe += unpaid
    }
    return {
      totalCount,
      totalRefunded: formatMoney(totalRefunded),
      totalStillOwe: formatMoney(totalStillOwe),
    }
  }, [refunds, refundSearch, refundDateFrom, refundDateTo, refundFilterMode])


  const expenseSummary = useMemo(() => {
    // apply same filters as the expense list
    let list = [...expenses]

    const todayISO = getTodayISO()
    const today = new Date(todayISO)

    // Quick date filters: today / week / month
    if (expenseFilterMode === 'today' || expenseFilterMode === 'week' || expenseFilterMode === 'month') {
      const maxDays =
        expenseFilterMode === 'today' ? 0 : expenseFilterMode === 'week' ? 7 : 30

      list = list.filter((e) => {
        if (!e.date) return false
        const d = new Date(e.date)
        const diffDays = (today - d) / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays <= maxDays
      })
    }

    // Manual date range
    if (expenseFilterFrom) {
      list = list.filter((e) => {
        if (!e.date) return false
        return e.date >= expenseFilterFrom
      })
    }
    if (expenseFilterTo) {
      list = list.filter((e) => {
        if (!e.date) return false
        return e.date <= expenseFilterTo
      })
    }

    // Text search in description / note
    if (expenseSearch) {
      const q = expenseSearch.toLowerCase()
      list = list.filter((e) => {
        const combined = `${e.description || ''} ${e.note || ''}`.toLowerCase()
        return combined.includes(q)
      })
    }

    let total = 0
    for (const e of list) {
      const cash = Number(e.cash) || 0
      total += cash
    }
    return {
      total: formatMoney(total),
    }
  }, [expenses, expenseFilterMode, expenseFilterFrom, expenseFilterTo, expenseSearch])



  const profitValue = useMemo(() => {
    // total sales amount
    let totalSalesAmount = 0
    for (const s of sales) {
      totalSalesAmount += Number(s.total) || 0
    }

    // TOTAL REFUNDS = cash + unpaid (alles, was ich bezahlt habe oder noch bezahlen werde)
    let totalRefundsAll = 0
    for (const r of refunds) {
      const cash = Number(r.cash) || 0
      const unpaid = Number(r.unpaid) || 0
      totalRefundsAll += cash + unpaid
    }

    // SupplierBalance = invoice purchase - return no cash
    let supplierBalance = 0
    for (const o of supplierOrders) {
      const txType = o.transactionType || 'invoice'
      if (txType === 'invoice') {
        supplierBalance += Number(o.amountCredit) || 0
      } else if (txType === 'return') {
        supplierBalance -= Number(o.amountDebit) || 0
      }
      // payment / refund vom Supplier sind nur Cashflow, nicht Teil der Balance hier
    }

    // expenses (alle Ausgaben)
    let totalExpenses = 0
    for (const e of expenses) {
      totalExpenses += Number(e.cash) || 0
    }

    const profit =
      totalSalesAmount -
      totalRefundsAll -
      supplierBalance -
      totalExpenses

    return formatMoney(profit)
  }, [sales, refunds, supplierOrders, expenses])


  const netSalesValue = useMemo(() => {
    const totalSales = Number(salesSummary.totalAmount) || 0
    const totalRefunds = Number(refundSummary.totalRefunded) || 0
    return formatMoney(totalSales - totalRefunds)
  }, [salesSummary, refundSummary])

  const cashLedgerBaseRows = useMemo(() => {
    const rows = []

    // Sales: cash in
    for (const s of sales) {
      const cash = Number(s.cash) || 0
      if (cash > 0) {
        rows.push({
          id: `sale-${s.id}`,
          date: s.date,
          type: 'SALE',
          description: `${s.invoiceNo} ${s.customerName}`.trim(),
          amountIn: cash,
          amountOut: 0,
        })
      }
    }

    // Refunds: cash out
    for (const r of refunds) {
      const cash = Number(r.cash) || 0
      if (cash > 0) {
        rows.push({
          id: `refund-${r.id}`,
          date: r.date,
          type: 'REFUND',
          description: `${r.invoiceNo} ${r.customerName}`.trim(),
          amountIn: 0,
          amountOut: cash,
        })
      }
    }

    // Supplier orders: only payment/refund affect cash
    for (const o of supplierOrders) {
      const supplier = suppliers.find((s) => s.id === o.supplierId)
      const supplierName = supplier ? supplier.name : ''
      const labelParts = [supplierName, o.customerName, o.product].filter(Boolean)
      const txType = o.transactionType || 'invoice'

      if (txType === 'payment') {
        const debit = Number(o.amountDebit) || 0
        if (debit > 0) {
          rows.push({
            id: `suporder-${o.id}`,
            date: o.date,
            type: 'SUPPLIER_PAYMENT',
            description: labelParts.join(' · '),
            amountIn: 0,
            amountOut: debit,
          })
        }
      } else if (txType === 'refund') {
        const credit = Number(o.amountCredit) || 0
        if (credit > 0) {
          rows.push({
            id: `suporder-${o.id}`,
            date: o.date,
            type: 'SUPPLIER_REFUND',
            description: labelParts.join(' · '),
            amountIn: credit,
            amountOut: 0,
          })
        }
      }
    }

    // Expenses: cash out
    for (const e of expenses) {
      const cash = Number(e.cash) || 0
      if (cash > 0) {
        const labelParts = [e.description, e.note].filter(Boolean)
        rows.push({
          id: `exp-${e.id}`,
          date: e.date,
          type: 'EXPENSE',
          description: labelParts.join(' · '),
          amountIn: 0,
          amountOut: cash,
        })
      }
    }

    return rows.filter((r) => !!r.date)
  }, [sales, refunds, supplierOrders, suppliers, expenses])

  
  // Global cash ledger totals for dashboard (ignore cash ledger filters)
  const cashLedgerTotalsAll = useMemo(() => {
    let rows = [...cashLedgerBaseRows]

    // sort ASC by date + id (same as in cashLedgerComputed)
    rows.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return String(a.id).localeCompare(String(b.id))
    })

    let running = Number(cashOpeningBalance) || 0
    let totalIn = 0
    let totalOut = 0

    for (const row of rows) {
      const amtIn = Number(row.amountIn) || 0
      const amtOut = Number(row.amountOut) || 0
      totalIn += amtIn
      totalOut += amtOut
      running += amtIn - amtOut
    }

    return {
      openingBalance: formatMoney(cashOpeningBalance || 0),
      totalIn: formatMoney(totalIn),
      totalOut: formatMoney(totalOut),
      closingBalance: formatMoney(running),
    }
  }, [cashLedgerBaseRows, cashOpeningBalance])

const cashLedgerComputed = useMemo(() => {
    let rows = [...cashLedgerBaseRows]

    // Quick date filters
    rows = rows.filter((row) => {
      if (!row.date) return false
      if (cashLedgerFilterMode === 'today') {
        return row.date === getTodayISO()
      }
      if (cashLedgerFilterMode === 'week') {
        return withinLastDays(row.date, 7)
      }
      if (cashLedgerFilterMode === 'month') {
        return withinLastDays(row.date, 31)
      }
      return true
    })

    // Manual date range
    if (cashLedgerDateFrom) {
      rows = rows.filter((row) => row.date >= cashLedgerDateFrom)
    }
    if (cashLedgerDateTo) {
      rows = rows.filter((row) => row.date <= cashLedgerDateTo)
    }

    // Text search
    if (cashLedgerSearch) {
      const q = cashLedgerSearch.toLowerCase()
      rows = rows.filter((row) => row.description.toLowerCase().includes(q))
    }

    // Sort ascending by date, then id (for correct running balance)
    rows.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return String(a.id).localeCompare(String(b.id))
    })

    let running = Number(cashOpeningBalance) || 0
    let totalIn = 0
    let totalOut = 0

    const withBalance = rows.map((row) => {
      const amtIn = Number(row.amountIn) || 0
      const amtOut = Number(row.amountOut) || 0
      totalIn += amtIn
      totalOut += amtOut
      running += amtIn - amtOut
      return { ...row, balance: running }
    })

    // Display newest transactions first, but keep running balance calculation correct
    const displayRows = [...withBalance].reverse()

    return {
      rows: displayRows,
      totalIn: formatMoney(totalIn),
      totalOut: formatMoney(totalOut),
      closingBalance: formatMoney(running),
      openingBalance: formatMoney(Number(cashOpeningBalance) || 0),
    }
  }, [
    cashLedgerBaseRows,
    cashLedgerFilterMode,
    cashLedgerDateFrom,
    cashLedgerDateTo,
    cashLedgerSearch,
    cashOpeningBalance,
  ])
  // filters
  const filteredSales = useMemo(() => {
    let list = [...sales]
    const search = salesSearch.toLowerCase()

    list = list.filter((s) => {
      let ok = true
      if (search) {
        const combined = `${s.customerName} ${s.product} ${s.invoiceNo}`.toLowerCase()
        ok = combined.includes(search)
      }
      if (!ok) return false

      if (salesDateFrom && s.date < salesDateFrom) {
        ok = false
      }
      if (salesDateTo && s.date > salesDateTo) {
        ok = false
      }
      if (!ok) return false

      if (salesFilterMode === 'today') {
        ok = s.date === getTodayISO()
      } else if (salesFilterMode === 'week') {
        ok = withinLastDays(s.date, 7)
      } else if (salesFilterMode === 'month') {
        ok = withinLastDays(s.date, 31)
      }
      return ok
    })

    // required sort: unpaid > 0 first, then overpaid, then Nil
    list.sort((a, b) => {
      const ua = Number(a.unpaid) || 0
      const ub = Number(b.unpaid) || 0
      const groupA = ua > 0 ? 0 : ua < 0 ? 1 : 2
      const groupB = ub > 0 ? 0 : ub < 0 ? 1 : 2
      if (groupA !== groupB) return groupA - groupB
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return (b.id || 0) - (a.id || 0)
    })

    return list
  }, [sales, salesSearch, salesDateFrom, salesDateTo, salesFilterMode])

  const filteredRefunds = useMemo(() => {
    let list = [...refunds]
    const search = refundSearch.toLowerCase()

    list = list.filter((r) => {
      let ok = true
      if (search) {
        const combined = `${r.customerName} ${r.product} ${r.invoiceNo}`.toLowerCase()
        ok = combined.includes(search)
      }
      if (!ok) return false

      if (refundDateFrom && r.date < refundDateFrom) {
        ok = false
      }
      if (refundDateTo && r.date > refundDateTo) {
        ok = false
      }
      if (!ok) return false

      if (refundFilterMode === 'today') {
        ok = r.date === getTodayISO()
      } else if (refundFilterMode === 'week') {
        ok = withinLastDays(r.date, 7)
      } else if (refundFilterMode === 'month') {
        ok = withinLastDays(r.date, 31)
      }
      return ok
    })

    // first negative (amount to pay to customer), then settled (Nil)
    list.sort((a, b) => {
      const cashA = Number(a.cash) || 0
      const unpaidA = Number(a.unpaid) || 0
      const balanceA = -(cashA + unpaidA)

      const cashB = Number(b.cash) || 0
      const unpaidB = Number(b.unpaid) || 0
      const balanceB = -(cashB + unpaidB)

      const settledA = Number(a.total) === cashA && unpaidA === 0
      const settledB = Number(b.total) === cashB && unpaidB === 0

      if (settledA && !settledB) return 1
      if (!settledA && settledB) return -1

      if (!settledA && !settledB) {
        return balanceA - balanceB
      }
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return (b.id || 0) - (a.id || 0)
    })

    return list
  }, [refunds, refundSearch, refundDateFrom, refundDateTo, refundFilterMode])



  // Customers receivable (open customer balances) based on current sales filters
  const receivableInvoices = useMemo(
    () =>
      filteredSales.filter((s) => {
        const balance = Number(s.unpaid) || 0
        return balance > 0
      }),
    [filteredSales],
  )

  const receivableSummary = useMemo(() => {
    let totalOutstanding = 0
    for (const s of receivableInvoices) {
      totalOutstanding += Number(s.unpaid) || 0
    }
    return {
      totalCount: receivableInvoices.length,
      totalOutstanding: formatMoney(totalOutstanding),
    }
  }, [receivableInvoices])

  // Customers payable (amounts still payable back to customers) based on current refund filters
  const payableRefunds = useMemo(
    () =>
      filteredRefunds.filter((r) => {
        const unpaid = Number(r.unpaid) || 0
        return unpaid > 0
      }),
    [filteredRefunds],
  )

  const customerPayablesSummary = useMemo(() => {
    let totalOutstanding = 0
    for (const r of payableRefunds) {
      totalOutstanding += Number(r.unpaid) || 0
    }
    return {
      totalCount: payableRefunds.length,
      totalOutstanding: formatMoney(totalOutstanding),
    }
  }, [payableRefunds])


  // --- GLOBAL totals for dashboard (ignore sales/refund filters) ---

  // All open receivables across ALL sales (no filters)
  const allReceivableInvoices = useMemo(
    () =>
      sales.filter((s) => {
        const balance = Number(s.unpaid) || 0
        return balance > 0
      }),
    [sales],
  )

  const dashboardReceivableTotal = useMemo(() => {
    let total = 0
    for (const s of allReceivableInvoices) {
      total += Number(s.unpaid) || 0
    }
    return formatMoney(total)
  }, [allReceivableInvoices])

  // All still payable amounts across ALL refunds (no filters)
  const allPayableRefunds = useMemo(
    () =>
      refunds.filter((r) => {
        const unpaid = Number(r.unpaid) || 0
        return unpaid > 0
      }),
    [refunds],
  )

  const dashboardCustomerPayablesTotal = useMemo(() => {
    let total = 0
    for (const r of allPayableRefunds) {
      total += Number(r.unpaid) || 0
    }
    return formatMoney(total)
  }, [allPayableRefunds])
  const exportReceivablesPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Customers receivable', 14, 20)
    doc.setFontSize(10)

    const headers = ['Date', 'Invoice', 'Customer', 'Product', 'Outstanding']
    const rows = receivableInvoices.map((s) => [
      formatDisplayDate(s.date),
      s.invoiceNo || '',
      s.customerName || '',
      s.product || '',
      formatMoney(Number(s.unpaid) || 0),
    ])

    let y = 30
    const lineHeight = 7

    const drawRow = (cols) => {
      const xPositions = [14, 40, 80, 120, 170]
      cols.forEach((col, idx) => {
        const text = String(col)
        doc.text(text, xPositions[idx], y)
      })
      y += lineHeight
      if (y > 280) {
        doc.addPage()
        y = 20
      }
    }

    drawRow(headers)
    y += 2
    rows.forEach(drawRow)

    doc.save('customers_receivable.pdf')
  }

  const exportCustomerPayablesPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Customers payable', 14, 20)
    doc.setFontSize(10)

    const headers = ['Date', 'Invoice', 'Customer', 'Product', 'Still payable']
    const rows = payableRefunds.map((r) => [
      formatDisplayDate(r.date),
      r.invoiceNo || '',
      r.customerName || '',
      r.product || '',
      formatMoney(Number(r.unpaid) || 0),
    ])

    let y = 30
    const lineHeight = 7

    const drawRow = (cols) => {
      const xPositions = [14, 40, 80, 120, 170]
      cols.forEach((col, idx) => {
        const text = String(col)
        doc.text(text, xPositions[idx], y)
      })
      y += lineHeight
      if (y > 280) {
        doc.addPage()
        y = 20
      }
    }

    drawRow(headers)
    y += 2
    rows.forEach(drawRow)

    doc.save('customers_payable.pdf')
  }

    const refundInvoiceOptions = useMemo(
    () => sales.map((s) => ({ value: s.invoiceNo, label: `${s.invoiceNo} – ${s.customerName}` })),
    [sales],
  )

  const recentSales = useMemo(
    () =>
      [...sales]
        .sort((a, b) => b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0))
        .slice(0, 5),
    [sales],
  )

  const recentRefunds = useMemo(
    () =>
      [...refunds]
        .sort((a, b) => b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0))
        .slice(0, 5),
    [refunds],
  )

  // header meta
  
  const supplierSummary = useMemo(() => {
    const totalSuppliers = suppliers.length
    let totalCredit = 0
    let totalDebit = 0

    for (const sup of suppliers) {
      const { totalCredit: c, totalDebit: d } = getSupplierTotals(sup, supplierOrders)
      totalCredit += c
      totalDebit += d
    }

    return {
      totalSuppliers,
      totalCredit: formatMoney(totalCredit),
      totalDebit: formatMoney(totalDebit),
      balance: formatMoney(totalCredit - totalDebit),
    }
  }, [suppliers, supplierOrders])

  const filteredSuppliers = useMemo(() => {
    const search = supplierSearch.toLowerCase()
    let list = [...suppliers]

    list = list.filter((sup) => {
      const { balance } = getSupplierTotals(sup, supplierOrders)
      let ok = true

      if (search) {
        const combined = `${sup.name} ${sup.note || ''}`.toLowerCase()
        ok = combined.includes(search)
      }
      if (!ok) return false

      if (supplierFilterMode === 'credit') {
        ok = balance > 0
      } else if (supplierFilterMode === 'debit') {
        ok = balance < 0
      }

      return ok
    })

    list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [suppliers, supplierOrders, supplierSearch, supplierFilterMode])

  const supplierOrdersForSelected = useMemo(() => {
    if (!selectedSupplierId) return []
    return supplierOrders
      .filter((o) => o.supplierId === selectedSupplierId)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0))
  }, [supplierOrders, selectedSupplierId])

  const filteredSupplierOrders = useMemo(() => {
    let list = [...supplierOrdersForSelected]
    const search = supplierOrderSearch.toLowerCase()

    list = list.filter((o) => {
      let ok = true
      const diff = (Number(o.amountCredit) || 0) - (Number(o.amountDebit) || 0)

      if (search) {
        const combined = `${o.customerName} ${o.product}`.toLowerCase()
        ok = combined.includes(search)
      }
      if (!ok) return false

      if (supplierOrderFilterMode === 'credit') {
        ok = diff > 0
      } else if (supplierOrderFilterMode === 'debit') {
        ok = diff < 0
      }

      return ok
    })

    return list
  }, [supplierOrdersForSelected, supplierOrderSearch, supplierOrderFilterMode])


  const currentHistoryLogs = useMemo(() => {
    if (!historyModal.open || !historyModal.entityType || historyModal.entityId == null) {
      return []
    }
    const list = changeLog.filter(
      (log) =>
        log.entityType === historyModal.entityType &&
        log.entityId === historyModal.entityId,
    )
    return [...list].sort(
      (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
    )
  }, [changeLog, historyModal])

  const filteredExpenses = useMemo(() => {
    let list = [...expenses]

    const todayISO = getTodayISO()
    const today = new Date(todayISO)

    // Quick date filters: today / week / month
    if (expenseFilterMode === 'today' || expenseFilterMode === 'week' || expenseFilterMode === 'month') {
      const maxDays =
        expenseFilterMode === 'today' ? 0 : expenseFilterMode === 'week' ? 7 : 30

      list = list.filter((e) => {
        if (!e.date) return false
        const d = new Date(e.date)
        const diffDays = (today - d) / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays <= maxDays
      })
    }

    // Manual date range
    if (expenseFilterFrom) {
      list = list.filter((e) => {
        if (!e.date) return false
        return e.date >= expenseFilterFrom
      })
    }
    if (expenseFilterTo) {
      list = list.filter((e) => {
        if (!e.date) return false
        return e.date <= expenseFilterTo
      })
    }

    // Text search in description / note
    if (expenseSearch) {
      const q = expenseSearch.toLowerCase()
      list = list.filter((e) => {
        const combined = `${e.description || ''} ${e.note || ''}`.toLowerCase()
        return combined.includes(q)
      })
    }

    return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }, [expenses, expenseFilterMode, expenseFilterFrom, expenseFilterTo, expenseSearch])


const headerMeta =
    activeView === 'dashboard'
      ? {
          icon: 'fa-grid-2',
          title: 'Dashboard',
          subtitle: 'High-level overview of sales and refunds.',
        }
      : activeView === 'sales'
      ? {
          icon: 'fa-receipt',
          title: 'Sales',
          subtitle: 'Capture and manage all sales transactions.',
        }
      : activeView === 'customersReceivable'
      ? {
          icon: 'fa-user-check',
          title: 'Customers receivable',
          subtitle: 'Read-only list of open customer balances.',
        }
      : activeView === 'customersPayable'
      ? {
          icon: 'fa-user-minus',
          title: 'Customers payable',
          subtitle: 'Read-only list of amounts still payable to customers.',
        }
      : activeView === 'returns'
      ? {
          icon: 'fa-rotate-left',
          title: 'Returns',
          subtitle: 'Record refunds against existing invoices.',
        }
      : activeView === 'expenses'
      ? {
          icon: 'fa-wallet',
          title: 'Expenses',
          subtitle: 'Track and review outgoing cash expenses.',
        }
: activeView === 'cashLedger'
? {
    icon: 'fa-sack-dollar',
    title: 'Cash ledger',
    subtitle: 'Cash movements from sales, refunds, expenses and suppliers.',
  }
: activeView === 'reports'
? {
    icon: 'fa-file-lines',
    title: 'Reports',
    subtitle: 'Generate PDF reports for customers and suppliers.',
  }
: activeView === 'suppliers'
? {
    icon: 'fa-truck',
    title: 'Suppliers',
    subtitle: 'Manage supplier balances and orders.',
  }
      : {
          icon: 'fa-truck',
          title: 'Supplier details',
          subtitle: 'Orders and balance for the selected supplier.',
        }


  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR LEFT */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="fa-solid fa-chart-line" />
          </div>
          <div className="sidebar-title">
            <span>SALES OPERATIONS</span>
            <span>{programName}</span>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={goDashboard}
          >
            <i className="fa-solid fa-grid-2" />
            <span>Dashboard</span>
          </button>
        </nav>

<div className="sidebar-section-label">Sales</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'sales' ? 'active' : ''}`}
    onClick={goSalesOverview}
  >
    <i className="fa-solid fa-receipt" />
    <span>Sales overview</span>
  </button>
</nav>

<div className="sidebar-section-label">Returns</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'returns' ? 'active' : ''}`}
    onClick={goReturnsOverview}
  >
    <i className="fa-solid fa-rotate-left" />
    <span>Returns overview</span>
  </button>
</nav>

<div className="sidebar-section-label">Customers</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'customersReceivable' ? 'active' : ''}`}
    onClick={() => setActiveView('customersReceivable')}
  >
    <i className="fa-solid fa-user-check" />
    <span>Customers receivable</span>
  </button>
  <button
    className={`sidebar-item ${activeView === 'customersPayable' ? 'active' : ''}`}
    onClick={() => setActiveView('customersPayable')}
  >
    <i className="fa-solid fa-user-minus" />
    <span>Customers payable</span>
  </button>
</nav>

<div className="sidebar-section-label">Expenses</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'expenses' ? 'active' : ''}`}
    onClick={() => setActiveView('expenses')}
  >
    <i className="fa-solid fa-wallet" />
    <span>Expenses</span>
  </button>
</nav>

<div className="sidebar-section-label">Cash</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'cashLedger' ? 'active' : ''}`}
    onClick={() => setActiveView('cashLedger')}
  >
    <i className="fa-solid fa-sack-dollar" />
    <span>Cash ledger</span>
  </button>
</nav>

<div className="sidebar-section-label">Reports</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'reports' ? 'active' : ''}`}
    onClick={() => setActiveView('reports')}
  >
    <i className="fa-solid fa-file-pdf" />
    <span>Reports / PDF</span>
  </button>
</nav>

<div className="sidebar-section-label">Suppliers</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${
      activeView === 'suppliers' || activeView === 'supplierDetail' ? 'active' : ''
    }`}
    onClick={goSuppliersOverview}
  >
    <i className="fa-solid fa-truck" />
    <span>Suppliers</span>
  </button>
</nav>

<div className="sidebar-section-label">Account</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'profile' ? 'active' : ''}`}
    onClick={() => setActiveView('profile')}
  >
    <i className="fa-solid fa-user" />
    <span>Profile</span>
  </button>
  <button className="sidebar-item" onClick={handleLogout}>
    <i className="fa-solid fa-right-from-bracket" />
    <span>Log out</span>
  </button>
</nav>

    <div className="sidebar-section-label">Future modules</div>
        <nav className="sidebar-nav">
          <button className="sidebar-item" disabled>
            <i className="fa-regular fa-circle-dot" />
            <span>Coming soon…</span>
          </button>
        </nav>

        <div className="sidebar-footer">v1.2 · Local data stored in your browser</div>
      </aside>

      {/* MAIN CONTENT RIGHT */}
      <div className="main-area">
        <header className="page-header">
          <h1>
            <i className={`fa-solid ${headerMeta.icon}`} /> {headerMeta.title}
          </h1>
          <p>{headerMeta.subtitle}</p>
        </header>

        <main className="app-main">

          {showExpenseForm && (
            <section className="view">
              <div className="card form-card">
                <div className="card-header">
                  <h3>
                    <i className="fa-solid fa-wallet" /> New expense
                  </h3>
                </div>
                <div className="card-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const cash = Number(expenseForm.cash) || 0
                      const date = expenseForm.date || getTodayISO()

                      if (editingExpense) {
                        // update existing expense + track changes
                        const oldExpense = editingExpense
                        const updatedExpense = {
                          ...oldExpense,
                          date,
                          description: expenseForm.description.trim(),
                          note: expenseForm.note.trim(),
                          cash,
                        }

                        const fieldsToTrack = ['date', 'description', 'note', 'cash']
                        const changes = []

                        fieldsToTrack.forEach((field) => {
                          const oldValue = oldExpense[field]
                          const newValue = updatedExpense[field]
                          if (String(oldValue ?? '') !== String(newValue ?? '')) {
                            changes.push({ field, oldValue, newValue })
                          }
                        })

                        if (changes.length) {
                          setChangeLog((prev) => {
                            const nextId = prev.length ? Math.max(...prev.map((l) => l.id || 0)) + 1 : 1
                            return [
                              ...prev,
                              {
                                id: nextId,
                                entityType: 'expense',
                                entityId: oldExpense.id,
                                changedAt: new Date().toISOString(),
                                changes,
                              },
                            ]
                          })
                        }

                        setExpenses((prev) =>
                          prev.map((ex) =>
                            ex.id === editingExpense.id ? updatedExpense : ex,
                          ),
                        )
                      } else {
                        // create new expense
                        const id = expenses.length
                          ? Math.max(...expenses.map((x) => x.id || 0)) + 1
                          : 1
                        setExpenses((prev) => [
                          ...prev,
                          {
                            id,
                            date,
                            description: expenseForm.description.trim(),
                            note: expenseForm.note.trim(),
                            cash,
                          },
                        ])
                      }

                      setEditingExpense(null)
                      setShowExpenseForm(false)
                    }}
                  >
                    <div className="form-row">
                      <div className="form-field">
                        <label>Date</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-calendar-day" />
                          <input
                            type="date"
                            value={expenseForm.date}
                            onChange={(e) =>
                              setExpenseForm((prev) => ({ ...prev, date: e.target.value }))
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Description</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-file-lines" />
                          <input
                            type="text"
                            value={expenseForm.description}
                            onChange={(e) =>
                              setExpenseForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Note</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-note-sticky" />
                          <input
                            type="text"
                            value={expenseForm.note}
                            onChange={(e) =>
                              setExpenseForm((prev) => ({ ...prev, note: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Cash</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-sack-dollar" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={expenseForm.cash}
                            onChange={(e) =>
                              setExpenseForm((prev) => ({ ...prev, cash: e.target.value }))
                            }
                            required
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
                        onClick={() => setShowExpenseForm(false)}
                      >
                        <i className="fa-solid fa-xmark" />
                        <span>Close</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* DASHBOARD VIEW */}
                    {activeView === 'dashboard' && (
  <DashboardPage
    cashLedgerTotalsAll={cashLedgerTotalsAll}
    dashboardReceivableTotal={dashboardReceivableTotal}
    dashboardCustomerPayablesTotal={dashboardCustomerPayablesTotal}
    profitValue={profitValue}
    supplierSummary={supplierSummary}
  />
)}

          {/* EXPENSES VIEW */}
          {activeView === 'expenses' && (
  <ExpensesPage
    expenses={expenses}
    filteredExpenses={filteredExpenses}
    expenseSummary={expenseSummary}
    expenseSearch={expenseSearch}
    setExpenseSearch={setExpenseSearch}
    expenseFilterMode={expenseFilterMode}
    setExpenseFilterMode={setExpenseFilterMode}
    expenseFilterFrom={expenseFilterFrom}
    setExpenseFilterFrom={setExpenseFilterFrom}
    expenseFilterTo={expenseFilterTo}
    setExpenseFilterTo={setExpenseFilterTo}
    showExpenseForm={showExpenseForm}
    setShowExpenseForm={setShowExpenseForm}
    setExpenseForm={setExpenseForm}
    openEditExpense={openEditExpense}
    deleteExpense={deleteExpense}
    openHistory={openHistory}
  />
)}

          {/* CASH LEDGER VIEW */}
          {activeView === 'cashLedger' && (
  <CashLedgerPage
    cashLedgerComputed={cashLedgerComputed}
    cashLedgerSearch={cashLedgerSearch}
    setCashLedgerSearch={setCashLedgerSearch}
    cashLedgerFilterMode={cashLedgerFilterMode}
    setCashLedgerFilterMode={setCashLedgerFilterMode}
    cashLedgerDateFrom={cashLedgerDateFrom}
    setCashLedgerDateFrom={setCashLedgerDateFrom}
    cashLedgerDateTo={cashLedgerDateTo}
    setCashLedgerDateTo={setCashLedgerDateTo}
    cashOpeningBalance={cashOpeningBalance}
    setCashOpeningBalance={setCashOpeningBalance}
  />
)}

        {/* REPORTS VIEW */}
        {activeView === 'reports' && (
          <ReportsPage
            exportReceivablesPdf={exportReceivablesPdf}
            exportCustomerPayablesPdf={exportCustomerPayablesPdf}
            handleExportSupplierPDF={handleExportSupplierPDF}
          />
        )}

{/* SALES VIEW */}
          {activeView === 'sales' && (
  <SalesPage
    sales={sales}
    filteredSales={filteredSales}
    salesForm={salesForm}
    setSalesForm={setSalesForm}
    salesSearch={salesSearch}
    setSalesSearch={setSalesSearch}
    salesDateFrom={salesDateFrom}
    setSalesDateFrom={setSalesDateFrom}
    salesDateTo={salesDateTo}
    setSalesDateTo={setSalesDateTo}
    salesFilterMode={salesFilterMode}
    setSalesFilterMode={setSalesFilterMode}
    showSalesForm={showSalesForm}
    editingSale={editingSale}
    closeSalesForm={closeSalesForm}
    openEditSalesForm={openEditSalesForm}
    goSalesNew={goSalesNew}
    goSalesImport={goSalesImport}
    showSalesImport={showSalesImport}
    salesImportPreview={salesImportPreview}
    handleSalesFileSelected={handleSalesFileSelected}
    handleSalesImportClick={handleSalesImportClick}
    salesFileInputRef={salesFileInputRef}
    confirmSalesImport={confirmSalesImport}
    cancelSalesImport={cancelSalesImport}
    handleSalesSubmit={handleSalesSubmit}
    deleteSale={deleteSale}
    recalcSalesUnpaid={recalcSalesUnpaid}
    openHistory={openHistory}
    salesSummary={salesSummary}
  />
)}


          {/* CUSTOMERS RECEIVABLE VIEW (read-only) */}
          {activeView === 'customersReceivable' && (
  <CustomersReceivablePage
    receivableSummary={receivableSummary}
    receivableInvoices={receivableInvoices}
    salesSearch={salesSearch}
    setSalesSearch={setSalesSearch}
    salesFilterMode={salesFilterMode}
    setSalesFilterMode={setSalesFilterMode}
    salesDateFrom={salesDateFrom}
    setSalesDateFrom={setSalesDateFrom}
    salesDateTo={salesDateTo}
    setSalesDateTo={setSalesDateTo}
    exportReceivablesPdf={exportReceivablesPdf}
  />
)}


          {/* CUSTOMERS PAYABLE VIEW (read-only) */}
          {activeView === 'customersPayable' && (
  <CustomersPayablePage
    customerPayablesSummary={customerPayablesSummary}
    payableRefunds={payableRefunds}
    refundSearch={refundSearch}
    setRefundSearch={setRefundSearch}
    refundFilterMode={refundFilterMode}
    setRefundFilterMode={setRefundFilterMode}
    refundDateFrom={refundDateFrom}
    setRefundDateFrom={setRefundDateFrom}
    refundDateTo={refundDateTo}
    setRefundDateTo={setRefundDateTo}
    exportCustomerPayablesPdf={exportCustomerPayablesPdf}
  />
)}

          {/* RETURNS VIEW */}
          {activeView === 'returns' && (
  <ReturnsPage
    refunds={refunds}
    filteredRefunds={filteredRefunds}
    refundSummary={refundSummary}
    refundSearch={refundSearch}
    setRefundSearch={setRefundSearch}
    refundDateFrom={refundDateFrom}
    setRefundDateFrom={setRefundDateFrom}
    refundDateTo={refundDateTo}
    setRefundDateTo={setRefundDateTo}
    refundFilterMode={refundFilterMode}
    setRefundFilterMode={setRefundFilterMode}
    showRefundForm={showRefundForm}
    closeRefundForm={closeRefundForm}
    goReturnsNew={goReturnsNew}
    refundForm={refundForm}
    setRefundForm={setRefundForm}
    editingRefund={editingRefund}
    refundInvoiceOptions={refundInvoiceOptions}
    handleRefundInvoiceChange={handleRefundInvoiceChange}
    handleRefundSubmit={handleRefundSubmit}
    recalcRefundUnpaid={recalcRefundUnpaid}
    openEditRefundForm={openEditRefundForm}
    deleteRefund={deleteRefund}
    openHistory={openHistory}
  />
)}

          {/* SUPPLIERS VIEW */}
          {activeView === 'suppliers' && (
  <SuppliersPage
    suppliers={suppliers}
    supplierOrders={supplierOrders}
    supplierSummary={supplierSummary}
    supplierSearch={supplierSearch}
    setSupplierSearch={setSupplierSearch}
    supplierFilterMode={supplierFilterMode}
    setSupplierFilterMode={setSupplierFilterMode}
    filteredSuppliers={filteredSuppliers}
    showSupplierForm={showSupplierForm}
    setShowSupplierForm={setShowSupplierForm}
    supplierForm={supplierForm}
    setSupplierForm={setSupplierForm}
    editingSupplier={editingSupplier}
    setEditingSupplier={setEditingSupplier}
    handleSupplierSubmit={handleSupplierSubmit}
    closeSupplierForm={closeSupplierForm}
    openSupplierDetail={openSupplierDetail}
    openEditSupplierForm={openEditSupplierForm}
    deleteSupplier={deleteSupplier}
    getSupplierTotals={getSupplierTotals}
    openHistory={openHistory}
  />
)}

          {/* SUPPLIER DETAIL VIEW */}
          {activeView === 'supplierDetail' && (
  <SupplierDetailPage
    suppliers={suppliers}
    supplierOrders={supplierOrders}
    selectedSupplierId={selectedSupplierId}
    supplierOrderForm={supplierOrderForm}
    setSupplierOrderForm={setSupplierOrderForm}
    supplierOrderSearch={supplierOrderSearch}
    setSupplierOrderSearch={setSupplierOrderSearch}
    supplierOrderFilterMode={supplierOrderFilterMode}
    setSupplierOrderFilterMode={setSupplierOrderFilterMode}
    filteredSupplierOrders={filteredSupplierOrders}
    showSupplierOrderForm={showSupplierOrderForm}
    editingSupplierOrder={editingSupplierOrder}
    getSupplierTotals={getSupplierTotals}
    goSuppliersOverview={goSuppliersOverview}
    handleExportSupplierPDF={handleExportSupplierPDF}
    openSupplierOrderForm={openSupplierOrderForm}
    closeSupplierOrderForm={closeSupplierOrderForm}
    handleSupplierOrderSubmit={handleSupplierOrderSubmit}
    deleteSupplierOrder={deleteSupplierOrder}
    openEditSupplierOrder={openEditSupplierOrder}
    openHistory={openHistory}
  />
)}


        {historyModal.open && historyModal.entityType && historyModal.entityId != null && (
          <div className="modal-backdrop" onClick={closeHistoryModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <i className="fa-solid fa-clock-rotate-left" />{' '}
                  {historyModal.title || 'Change history'}
                </h3>
                <button
                  type="button"
                  className="icon-btn close"
                  onClick={closeHistoryModal}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="modal-body">
                {currentHistoryLogs.length === 0 ? (
                  <p>No changes recorded yet.</p>
                ) : (
                  <div className="history-list">
                    {currentHistoryLogs.map((log) => (
                      <div key={log.id} className="history-item">
                        <div className="history-item-meta">
                          <span>{formatDisplayDate(log.changedAt.slice(0, 10))}</span>
                          <span>
                            {new Date(log.changedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <ul>
                          {log.changes.map((ch, idx) => (
                            <li key={idx}>
                              <strong>{ch.field}</strong>: {String(ch.oldValue ?? '')} →{' '}
                              {String(ch.newValue ?? '')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
          {activeView === 'profile' && (
            <section className="view active">
              <div className="card form-card">
                <div className="card-header">
                  <h3>
                    <i className="fa-solid fa-user-gear" /> Profile &amp; settings
                  </h3>
                </div>
                <div className="card-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const cfg = loadAuthConfig()
                      if (!cfg) {
                        alert('No auth configuration found.')
                        return
                      }
                      const nextCfg = {
                        ...cfg,
                        email: profileForm.email.trim() || cfg.email,
                        programName: profileForm.programName.trim() || cfg.programName || 'Control console',
                      }
                      saveAuthConfig(nextCfg)
                      setProgramName(nextCfg.programName)
                      setUser({ email: nextCfg.email })
                      alert('Profile updated.')
                    }}
                  >
                    <div className="form-row">
                      <div className="form-field">
                        <label>Program name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-signature" />
                          <input
                            type="text"
                            value={profileForm.programName}
                            onChange={(e) =>
                              setProfileForm((prev) => ({ ...prev, programName: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Owner email</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-envelope" />
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) =>
                              setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        <i className="fa-solid fa-floppy-disk" />
                        <span>Save profile</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}
          <datalist id="customer-options">
            {customerNameSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <datalist id="product-options">
            {COMMON_PRODUCTS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
</main>
      </div>
    </div>
  )
}

export default App