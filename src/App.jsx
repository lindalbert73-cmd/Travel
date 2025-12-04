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
import { supabase } from './supabaseClient'
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
  const SESSION_TIMEOUT_SECONDS = 10 * 60
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TIMEOUT_SECONDS)
  const lastActiveRef = useRef(Date.now());

  const [user, setUser] = useState(null)
  const [role, setRole] = useState('user')       // NEU
  const isAdmin = role === 'admin'               // NEU

  const [authInitializing, setAuthInitializing] = useState(true)
  const [programName, setProgramName] = useState('Control console')
  const [profileForm, setProfileForm] = useState({
    programName: 'Control console',
    email: '',
    businessName: '',
    phone: '',
    address: '',
    timezone: 'Europe/Berlin',
    logoUrl: '',
  })

  

  const [activeView, setActiveView] = useState('dashboard')
  const [sales, setSales] = useState([])
  const [refunds, setRefunds] = useState([])
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1)
  const [nextCustomerNumber, setNextCustomerNumber] = useState(1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)


  // Counters (Invoice / Customer) aus Supabase laden
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function syncCounters() {
      try {
        const { data, error } = await supabase
          .from('counters')
          .select('invoice_counter, customer_counter')
          .eq('user_id', user.id)
          .limit(1)

        if (error) {
          console.error('Error loading counters from Supabase', error)
          return
        }

        if (cancelled) return

        const row = data && data[0]

        if (!row) {
          // noch keine Zeile für diesen User → anlegen
          const { data: inserted, error: insertError } = await supabase
            .from('counters')
            .insert({
              user_id: user.id,
              invoice_counter: 1,
              customer_counter: 1,
            })
            .select('invoice_counter, customer_counter')
            .single()

          if (insertError) {
            console.error('Error creating initial counters in Supabase', insertError)
            return
          }

          if (cancelled) return

          setNextInvoiceNumber(inserted.invoice_counter || 1)
          setNextCustomerNumber(inserted.customer_counter || 1)
        } else {
          // vorhandene Werte aus DB nehmen
          setNextInvoiceNumber(row.invoice_counter || 1)
          setNextCustomerNumber(row.customer_counter || 1)
        }
      } catch (e) {
        console.error('Unexpected error loading counters from Supabase', e)
      }
    }

    syncCounters()

    return () => {
      cancelled = true
    }
  }, [user])

    // Hilfsfunktion: Zähler in State + Supabase updaten
  async function updateCountersInSupabase(newInvoiceCounter, newCustomerCounter) {
    setNextInvoiceNumber(newInvoiceCounter)
    setNextCustomerNumber(newCustomerCounter)

    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('counters')
        .update({
          invoice_counter: newInvoiceCounter,
          customer_counter: newCustomerCounter,
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating counters in Supabase', error)
      }
    } catch (e) {
      console.error('Unexpected error updating counters in Supabase', e)
    }
  }

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
  const [historyModal, setHistoryModal] = useState({
    open: false,
    entityType: null,
    entityId: null,
    title: '',
  })

  // Opening Balance aus Supabase laden, sobald der User bekannt ist
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function loadOpeningBalance() {
      try {
        const { data, error } = await supabase
          .from('opening_balance')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Fehler beim Laden der Opening Balance', error)
          return
        }

        if (cancelled) return

        if (!data) {
          // Noch kein Eintrag in DB → leer lassen
          setCashOpeningBalance('')
        } else {
          setCashOpeningBalance(String(data.balance ?? 0))
        }
      } catch (e) {
        console.error('Unerwarteter Fehler beim Laden der Opening Balance', e)
      }
    }

    loadOpeningBalance()

    return () => {
      cancelled = true
    }
  }, [user])

  // Opening Balance in Supabase speichern, sobald sie sich ändert
  useEffect(() => {
    if (!user?.id) return

    const num = Number(cashOpeningBalance) || 0

    async function persistOpeningBalance() {
      try {
        const { error } = await supabase
          .from('opening_balance')
          .upsert(
            { user_id: user.id, balance: num },
            { onConflict: 'user_id' },
          )

        if (error) {
          console.error('Fehler beim Speichern der Opening Balance', error)
        }
      } catch (e) {
        console.error('Unerwarteter Fehler beim Speichern der Opening Balance', e)
      }
    }

    persistOpeningBalance()
  }, [cashOpeningBalance, user])

  const [cashLedgerFilterMode, setCashLedgerFilterMode] = useState('all') // all | today | week | month
  const [cashLedgerDateFrom, setCashLedgerDateFrom] = useState('')
  const [cashLedgerDateTo, setCashLedgerDateTo] = useState('')
  const [cashLedgerSearch, setCashLedgerSearch] = useState('')


  const [suppliers, setSuppliers] = useState([])
  const [supplierOrders, setSupplierOrders] = useState([])


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

  
// check auth session on initial load to avoid login flicker
useEffect(() => {
  let isMounted = true

  async function loadSession() {
    try {
      const { data } = await supabase.auth.getUser()
      // Wenn keine Session existiert, ist das ok – wir lassen user einfach null
      if (isMounted && data && data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' })
      }
    } catch (e) {
      // Auth-Fehler beim Laden der Session ignorieren, um Konsole sauber zu halten
    } finally {
      if (isMounted) {
        setAuthInitializing(false)
      }
    }
  }

  loadSession()

  return () => {
    isMounted = false
  }
}, [])



  // Robuster Auto-Logout basierend auf Zeitstempeln (funktioniert auch auf Handy)
useEffect(() => {
  if (!user) return;

  const TIMEOUT = 10 * 60 * 1000; // 10 Minuten
  const activityEvents = [
    'touchstart', 'touchmove', 'scroll',
    'click', 'keydown', 'mousemove'
  ];

  const updateActivity = () => {
    lastActiveRef.current = Date.now();
  };

  // Activity registrieren
  activityEvents.forEach(evt =>
    window.addEventListener(evt, updateActivity)
  );

  // Alle 3 Sekunden prüfen
  const interval = setInterval(() => {
    if (Date.now() - lastActiveRef.current > TIMEOUT) {
      handleLogout();
    }
  }, 3000);

  // Wenn Tab/App reaktiviert wird
  const visHandler = () => {
    if (document.visibilityState === 'visible') {
      if (Date.now() - lastActiveRef.current > TIMEOUT) {
        handleLogout();
      }
    }
  };
  document.addEventListener('visibilitychange', visHandler);

  return () => {
    activityEvents.forEach(evt =>
      window.removeEventListener(evt, updateActivity)
    );
    clearInterval(interval);
    document.removeEventListener('visibilitychange', visHandler);
  };
}, [user]);

// Sichtbarer Countdown basierend auf lastActiveRef
useEffect(() => {
  if (!user) {
    setSecondsLeft(0);
    return;
  }

  const TIMEOUT = 10 * 60 * 1000; // 10 Minuten in ms

  const id = setInterval(() => {
    const diffMs = Date.now() - lastActiveRef.current;
    const remainingMs = TIMEOUT - diffMs;
    const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
    setSecondsLeft(remainingSec);
  }, 1000);

  return () => clearInterval(id);
}, [user]);





// load profile from Supabase whenever we have a logged-in user
useEffect(() => {
  if (!user || !user.id) {
    setRole('user')          // NEU: wenn kein User, sicherheitshalber wieder user
    return
  }

  let cancelled = false

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile from Supabase', error)
        return
      }

      if (cancelled) return

      if (!data) {
        setRole('user')      // NEU: kein Profil -> keine Admin-Rechte
        setProfileForm((prev) => ({
          ...prev,
          programName: 'Control console',
          email: user.email || '',
          businessName: '',
          phone: '',
          address: '',
          timezone: 'Europe/Berlin',
          logoUrl: '',
        }))
        setProgramName('Control console')
      } else {
        setRole(data.role || 'user')   // NEU: Rolle aus DB übernehmen

        setProfileForm({
          programName: data.program_name || 'Control console',
          email: data.owner_email || user.email || '',
          businessName: data.business_name || '',
          phone: data.phone || '',
          address: data.address || '',
          timezone: data.timezone || 'Europe/Berlin',
          logoUrl: data.logo_url || '',
        })
        setProgramName(data.program_name || 'Control console')
      }
    } catch (err) {
      console.error('Unexpected error loading profile', err)
    }
  }

  loadProfile()

  return () => {
    cancelled = true
  }
}, [user])


 // sync sales with Supabase (cloud) when user is known
useEffect(() => {
  if (!user?.id) return

  async function syncSalesWithSupabase() {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading sales from Supabase', error)
        return
      }

      if (!data) {
        setSales([])
        return
      }

      const mapped = data.map((row) => ({
        id: row.id,
        invoiceNo: row.invoice_no || '',
        customerNo: row.customer_no || '',
        date: row.date || '',
        customerName: row.customer_name || '',
        product: row.product || '',
        note: row.note || '',
        total: String(row.total_amount ?? ''),
        cash: String(row.cash ?? ''),
        unpaid: String(row.outstanding ?? ''),
      }))
      setSales(mapped)
    } catch (e) {
      console.error('Failed to sync sales with Supabase', e)
    }
  }

  syncSalesWithSupabase()
}, [user])

  // sync refunds with Supabase (cloud) when user is known
useEffect(() => {
  if (!user?.id) return

  async function syncRefundsWithSupabase() {
    try {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading refunds from Supabase', error)
        return
      }

      if (!data) {
        setRefunds([])
        return
      }

      const mapped = data.map((row) => ({
        id: row.id,
        invoiceNo: row.invoice_no || '',
        customerNo: row.customer_no || '',
        date: row.date || '',
        customerName: row.customer_name || '',
        product: row.product || '',
        note: row.note || '',
        total: Number(row.total_amount ?? 0),
        cash: Number(row.cash ?? 0),
        unpaid: Number(row.unpaid ?? 0),
      }))

      setRefunds(mapped)
    } catch (e) {
      console.error('Failed to sync refunds with Supabase', e)
    }
  }

  syncRefundsWithSupabase()
}, [user])



  // sync expenses with Supabase (cloud) when user is known
useEffect(() => {
  if (!user?.id) return

  async function syncExpensesWithSupabase() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error loading expenses from Supabase', error)
        return
      }

      if (!data) {
        setExpenses([])
        return
      }

      const mapped = data.map((row) => ({
        id: row.id,
        date: row.date || '',
        description: row.description || '',
        note: row.note || '',
        cash: String(row.cash ?? ''),
        category: row.category || '',
      }))

      setExpenses(mapped)
    } catch (e) {
      console.error('Failed to sync expenses with Supabase', e)
    }
  }

  syncExpensesWithSupabase()
}, [user])





  // sync suppliers and supplier orders with Supabase (cloud) when user is known
useEffect(() => {
  if (!user?.id) return

  async function syncSuppliersAndOrders() {
    try {
      const [{ data: supData, error: supError }, { data: orderData, error: orderError }] =
        await Promise.all([
          supabase
            .from('suppliers')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('order')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true }),
        ])

      if (supError) {
        console.error('Error loading suppliers from Supabase', supError)
      }
      if (orderError) {
        console.error('Error loading supplier orders from Supabase', orderError)
      }

      const suppliersRows = supData || []
      const ordersRows = orderData || []

      const mappedSuppliers = suppliersRows.map((row) => ({
        id: row.id,
        name: row.supplier_name || '',
        note: row.note || '',
        debit: Number(row.debit ?? 0),
        credit: Number(row.credit ?? 0),
      }))

      const mappedOrders = ordersRows.map((row) => ({
        id: row.id,
        supplierId: row.supplier_id,
        date: row.date || '',
        customerName: row.customer_name || '',
        product: row.product || '',
        transactionType: row.transaction_type || 'invoice',
        amountCredit: Number(row.amount_credit ?? 0),
        amountDebit: Number(row.amount_debit ?? 0),
      }))

      setSuppliers(mappedSuppliers)
      setSupplierOrders(mappedOrders)
    } catch (e) {
      console.error('Failed to sync suppliers/orders with Supabase', e)
    }
  }

  syncSuppliersAndOrders()
}, [user])

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
    // info is expected to be { id, email } from AuthScreen
    setUser({ id: info.id, email: info.email })
    setActiveView('dashboard')
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error signing out from Supabase', err)
    }
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
     setIsSidebarOpen(false)
  }

  function goSalesOverview() {
    setActiveView('sales')
    setShowSalesForm(false)
    setShowSalesImport(false)
    setEditingSale(null)
     setIsSidebarOpen(false)
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
     setIsSidebarOpen(false)
  }

  function goSuppliersOverview() {
    setActiveView('suppliers')
    setSelectedSupplierId(null)
    setShowSupplierForm(false)
    setShowSupplierOrderForm(false)
    setEditingSupplier(null)
    setEditingSupplierOrder(null)
     setIsSidebarOpen(false)
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
async function handleSalesSubmit(e) {
  e.preventDefault()
  const { date, customerName, product, total, cash, unpaid, note } =
    salesForm

  let invoiceNo = salesForm.invoiceNo
  let customerNo = salesForm.customerNo

  if (!editingSale) {
    invoiceNo = `INV-${String(nextInvoiceNumber).padStart(4, '0')}`
    customerNo = `C-${String(nextCustomerNumber).padStart(4, '0')}`
  }

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

  try {
    if (editingSale) {
      // UPDATE in Supabase
      const payload = {
        user_id: user.id,
        invoice_no: saleData.invoiceNo,
        customer_no: saleData.customerNo,
        date: saleData.date,
        customer_name: saleData.customerName,
        product: saleData.product,
        note: saleData.note,
        total_amount: saleData.total,
        cash: saleData.cash,
        outstanding: saleData.unpaid,
      }

      const { error } = await supabase
        .from('sales')
        .update(payload)
        .eq('id', editingSale.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Fehler beim Aktualisieren der Sale in Supabase', error)
        alert('Fehler beim Speichern der Änderung (Supabase). Details in der Konsole.')
        return
      }

      // Change-Log behalten
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

    // NEUE Sale in Supabase
    const payload = {
      user_id: user.id,
      invoice_no: saleData.invoiceNo,
      customer_no: saleData.customerNo,
      date: saleData.date,
      customer_name: saleData.customerName,
      product: saleData.product,
      note: saleData.note,
      total_amount: saleData.total,
      cash: saleData.cash,
      outstanding: saleData.unpaid,
    }

    const { data, error } = await supabase
      .from('sales')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Speichern der Sale in Supabase', error)
      alert('Fehler beim Speichern. Details in der Konsole.')
      return
    }

    const newSale = {
      id: data.id,
      invoiceNo: data.invoice_no || '',
      customerNo: data.customer_no || '',
      date: data.date || '',
      customerName: data.customer_name || '',
      product: data.product || '',
      note: data.note || '',
      total: String(data.total_amount ?? ''),
      cash: String(data.cash ?? ''),
      unpaid: String(data.outstanding ?? ''),
    }

    setSales((prev) => [...prev, newSale])

    const newNextInvoice = nextInvoiceNumber + 1
    const newNextCustomer = nextCustomerNumber + 1
    await updateCountersInSupabase(newNextInvoice, newNextCustomer)

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
  } catch (err) {
    console.error('Unerwarteter Fehler in handleSalesSubmit', err)
    alert('Unerwarteter Fehler beim Speichern. Details in der Konsole.')
  }
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

  
  async function handleRefundSubmit(e) {
    e.preventDefault()
    const { invoiceNo, date, customerNo, customerName, product, total, cash, unpaid, note } =
      refundForm

    if (!invoiceNo || !date) {
      alert('Please select an invoice and date.')
      return
    }

    const relatedSale = sales.find((s) => s.invoiceNo === invoiceNo)
    const finalProduct =
      product && product.trim()
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

    try {
      if (editingRefund) {
        const payload = {
          user_id: user.id,
          invoice_no: refundData.invoiceNo,
          customer_no: refundData.customerNo,
          date: refundData.date,
          customer_name: refundData.customerName,
          product: refundData.product,
          note: refundData.note,
          total_amount: refundData.total,
          cash: refundData.cash,
          unpaid: refundData.unpaid,
        }

        const { error } = await supabase
          .from('refunds')
          .update(payload)
          .eq('id', editingRefund.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Fehler beim Aktualisieren der Refund in Supabase', error)
          alert('Fehler beim Speichern der Änderung (Supabase). Details in der Konsole.')
          return
        }

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
        const payload = {
          user_id: user.id,
          invoice_no: refundData.invoiceNo,
          customer_no: refundData.customerNo,
          date: refundData.date,
          customer_name: refundData.customerName,
          product: refundData.product,
          note: refundData.note,
          total_amount: refundData.total,
          cash: refundData.cash,
          unpaid: refundData.unpaid,
        }

        const { data, error } = await supabase
          .from('refunds')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error('Fehler beim Speichern der Refund in Supabase', error)
          alert('Fehler beim Speichern. Details in der Konsole.')
          return
        }

        const newRefund = {
          id: data.id,
          invoiceNo: data.invoice_no || refundData.invoiceNo,
          customerNo: data.customer_no || refundData.customerNo,
          date: data.date || refundData.date,
          customerName: data.customer_name || refundData.customerName,
          product: data.product || refundData.product,
          note: data.note || refundData.note,
          total: Number(data.total_amount ?? refundData.total),
          cash: Number(data.cash ?? refundData.cash),
          unpaid: Number(data.unpaid ?? refundData.unpaid),
        }

        setRefunds((prev) => [...prev, newRefund])
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
    } catch (err) {
      console.error('Unerwarteter Fehler in handleRefundSubmit', err)
      alert('Unerwarteter Fehler beim Speichern. Details in der Konsole.')
    }
  }



  async function handleExpenseSubmit(e) {
  e.preventDefault()

  if (!user?.id) {
    alert('Kein Benutzer eingeloggt – bitte neu einloggen.')
    return
  }

  const cash = Number(expenseForm.cash) || 0
  const date = expenseForm.date || getTodayISO()

    const baseData = {
      date,
      description: expenseForm.description.trim(),
      note: expenseForm.note.trim(),
      cash,
    }

    try {
      if (editingExpense) {
        const payload = {
          user_id: user.id,
          date: baseData.date,
          description: baseData.description,
          note: baseData.note,
          cash: baseData.cash,
        }

        const { error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', editingExpense.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Fehler beim Aktualisieren der Expense in Supabase', error)
          alert('Fehler beim Speichern der Änderung (Supabase). Details in der Konsole.')
          return
        }

        const oldExpense = editingExpense
        const updatedExpense = { ...oldExpense, ...baseData }

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
          prev.map((ex) => (ex.id === editingExpense.id ? updatedExpense : ex)),
        )
      } else {
        const payload = {
          user_id: user.id,
          date: baseData.date,
          description: baseData.description,
          note: baseData.note,
          cash: baseData.cash,
        }

        const { data, error } = await supabase
          .from('expenses')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error('Fehler beim Speichern der Expense in Supabase', error)
          alert('Fehler beim Speichern. Details in der Konsole.')
          return
        }

        const newExpense = {
          id: data.id,
          date: data.date || baseData.date,
          description: data.description || baseData.description,
          note: data.note || baseData.note,
          cash: Number(data.cash ?? baseData.cash),
        }

        setExpenses((prev) => [...prev, newExpense])
      }

      setEditingExpense(null)
      setShowExpenseForm(false)
      setExpenseForm({
        date: getTodayISO(),
        description: '',
        note: '',
        cash: '',
      })
    } catch (err) {
      console.error('Unerwarteter Fehler in handleExpenseSubmit', err)
      alert('Unerwarteter Fehler beim Speichern. Details in der Konsole.')
    }
  }

  async function deleteSale(id) {
    if (!window.confirm('Delete this sales entry?')) return

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Fehler beim Löschen der Sale in Supabase', error)
        alert('Fehler beim Löschen. Details in der Konsole.')
        return
      }

      setSales((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Unerwarteter Fehler beim Löschen der Sale', err)
      alert('Unerwarteter Fehler beim Löschen. Details in der Konsole.')
    }
  }

  
  async function deleteRefund(id) {
    if (!window.confirm('Delete this refund entry?')) return

    try {
      const { error } = await supabase
        .from('refunds')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Fehler beim Löschen der Refund in Supabase', error)
        alert('Fehler beim Löschen. Details in der Konsole.')
        return
      }

      setRefunds((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Unerwarteter Fehler beim Löschen der Refund', err)
      alert('Unerwarteter Fehler beim Löschen. Details in der Konsole.')
    }
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

  async function deleteExpense(id) {
    if (!window.confirm('Delete this expense entry?')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Fehler beim Löschen der Expense in Supabase', error)
        alert('Fehler beim Löschen. Details in der Konsole.')
        return
      }

      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Unerwarteter Fehler beim Löschen der Expense', err)
      alert('Unerwarteter Fehler beim Löschen. Details in der Konsole.')
    }
  }

    async function deleteSupplier(id) {
    const hasOrders = supplierOrders.some((o) => o.supplierId === id)
    if (hasOrders) {
      alert('Cannot delete supplier with existing orders.')
      return
    }
    if (!window.confirm('Delete this supplier?')) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Fehler beim Löschen des Suppliers in Supabase', error)
        alert('Fehler beim Löschen. Details in der Konsole.')
        return
      }

      setSuppliers((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Unerwarteter Fehler beim Löschen des Suppliers', err)
      alert('Unerwarteter Fehler beim Löschen. Details in der Konsole.')
    }
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

    async function handleSupplierSubmit(e) {
  e.preventDefault()

  if (!user?.id) {
    alert('Kein Benutzer eingeloggt – bitte neu einloggen.')
    return
  }
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

    try {
      if (editingSupplier) {
        const oldSupplier = editingSupplier
        const payload = {
          user_id: user.id,
          supplier_name: base.name,
          note: base.note,
          debit: base.debit,
          credit: base.credit,
        }

        const { error } = await supabase
          .from('suppliers')
          .update(payload)
          .eq('id', editingSupplier.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Fehler beim Aktualisieren des Suppliers in Supabase', error)
          alert('Fehler beim Speichern der Änderung (Supabase). Details in der Konsole.')
          return
        }

        const updatedSupplier = {
          ...oldSupplier,
          ...base,
        }

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
        const payload = {
          user_id: user.id,
          supplier_name: base.name,
          note: base.note,
          debit: base.debit,
          credit: base.credit,
        }

        const { data, error } = await supabase
          .from('suppliers')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error('Fehler beim Speichern des Suppliers in Supabase', error)
          alert('Fehler beim Speichern. Details in der Konsole.')
          return
        }

        const newSupplier = {
          id: data.id,
          name: data.supplier_name || base.name,
          note: data.note || base.note,
          debit: Number(data.debit ?? base.debit),
          credit: Number(data.credit ?? base.credit),
        }

        setSuppliers((prev) => [...prev, newSupplier])
      }

      setEditingSupplier(null)
      setSupplierForm({
        name: '',
        note: '',
        debit: '',
        credit: '',
      })
      setShowSupplierForm(false)
    } catch (err) {
      console.error('Unerwarteter Fehler in handleSupplierSubmit', err)
      alert('Unerwarteter Fehler beim Speichern. Details in der Konsole.')
    }
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

    async function deleteSupplierOrder(id) {
    if (!window.confirm('Delete this order?')) return

    try {
      const { error } = await supabase
        .from('order')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Fehler beim Löschen des Supplier-Orders in Supabase', error)
        alert('Fehler beim Löschen. Details in der Konsole.')
        return
      }

      setSupplierOrders((prev) => prev.filter((o) => o.id !== id))
    } catch (err) {
      console.error('Unerwarteter Fehler beim Löschen des Supplier-Orders', err)
      alert('Unerwarteter Fehler beim Löschen. Details in der Konsole.')
    }
  }

  async function handleSupplierOrderSubmit(e) {
  e.preventDefault()

  if (!user?.id) {
    alert('Kein Benutzer eingeloggt – bitte neu einloggen.')
    return
  }
    if (!selectedSupplierId) return

    const { date, customerName, product, amountCredit, amountDebit, transactionType } =
      supplierOrderForm

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

    try {
      if (editingSupplierOrder) {
        const oldOrder = editingSupplierOrder
        const payload = {
          user_id: user.id,
          supplier_id: selectedSupplierId,
          date: data.date,
          customer_name: data.customerName,
          product: data.product,
          transaction_type: data.transactionType,
          amount_credit: data.amountCredit,
          amount_debit: data.amountDebit,
        }

        const { error } = await supabase
          .from('order')
          .update(payload)
          .eq('id', editingSupplierOrder.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Fehler beim Aktualisieren des Supplier-Orders in Supabase', error)
          alert('Fehler beim Speichern der Änderung (Supabase). Details in der Konsole.')
          return
        }

        const updatedOrder = { ...oldOrder, ...data }

        const fieldsToTrack = [
          'date',
          'customerName',
          'product',
          'transactionType',
          'amountCredit',
          'amountDebit',
        ]
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
        const payload = {
          user_id: user.id,
          supplier_id: selectedSupplierId,
          date: data.date,
          customer_name: data.customerName,
          product: data.product,
          transaction_type: data.transactionType,
          amount_credit: data.amountCredit,
          amount_debit: data.amountDebit,
        }

        const { data: inserted, error } = await supabase
          .from('order')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error('Fehler beim Speichern des Supplier-Orders in Supabase', error)
          alert('Fehler beim Speichern. Details in der Konsole.')
          return
        }

        const newOrder = {
          id: inserted.id,
          supplierId: inserted.supplier_id,
          date: inserted.date || data.date,
          customerName: inserted.customer_name || data.customerName,
          product: inserted.product || data.product,
          transactionType: inserted.transaction_type || data.transactionType,
          amountCredit: Number(inserted.amount_credit ?? data.amountCredit),
          amountDebit: Number(inserted.amount_debit ?? data.amountDebit),
        }

        setSupplierOrders((prev) => [...prev, newOrder])
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
    } catch (err) {
      console.error('Unerwarteter Fehler in handleSupplierOrderSubmit', err)
      alert('Unerwarteter Fehler beim Speichern. Details in der Konsole.')
    }
  }

function handleExportSupplierPDF() {
  const supplier = suppliers.find((s) => s.id === selectedSupplierId);
  if (!supplier) {
    alert('Please select a supplier first.');
    return;
  }

  const orders = supplierOrders
    .filter((o) => o.supplierId === selectedSupplierId)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));

  const { totalCredit, totalDebit, balance } = getSupplierTotals(
    supplier,
    supplierOrders
  );

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginLeft = 10;
  const marginTop = 10;
  const lineHeight = 6;

  const truncate = (str, maxLen) => {
    if (!str) return '';
    const s = String(str);
    return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
  };

  doc.setFontSize(16);
  doc.text('Supplier report', marginLeft, marginTop);

  doc.setFontSize(12);
  let y = marginTop + lineHeight;
  doc.text(`Supplier: ${supplier.name || ''}`, marginLeft, y);

  y += lineHeight;
  doc.text(`Total credit: ${totalCredit.toFixed(2)}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Total debit:  ${totalDebit.toFixed(2)}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Balance:      ${balance.toFixed(2)}`, marginLeft, y);

  y += lineHeight * 2;
  doc.setFontSize(13);
  doc.text('Orders', marginLeft, y);

  y += lineHeight;
  doc.setFontSize(10);

  const xDate = marginLeft;
  const xCustomer = 35;
  const xProduct = 85;
  const xDebit = 130;
  const xCredit = 155;
  const xBalance = 180;

  const drawTableHeader = () => {
    doc.setFont(undefined, 'bold');
    doc.text('Date', xDate, y);
    doc.text('Customer', xCustomer, y);
    doc.text('Product', xProduct, y);
    doc.text('Debit', xDebit, y);
    doc.text('Credit', xCredit, y);
    doc.text('Balance', xBalance, y);
    doc.setFont(undefined, 'normal');
    y += lineHeight;
  };

  drawTableHeader();

  let runningBalance = 0;

  const ensureSpaceForRow = () => {
    if (y > pageHeight - 15) {
      doc.addPage();
      y = marginTop;
      doc.setFontSize(13);
      doc.text('Orders (cont.)', marginLeft, y);
      y += lineHeight;
      doc.setFontSize(10);
      drawTableHeader();
    }
  };

  if (!orders.length) {
    ensureSpaceForRow();
    doc.text('No orders yet.', marginLeft, y);
  } else {
    for (const o of orders) {
      const debit = Number(o.amountDebit) || 0;
      const credit = Number(o.amountCredit) || 0;
      runningBalance += credit - debit;

      ensureSpaceForRow();

      doc.text(formatDisplayDate(o.date), xDate, y);
      doc.text(truncate(o.customerName, 20), xCustomer, y);
      doc.text(truncate(o.product || '', 25), xProduct, y);
      doc.text(debit.toFixed(2), xDebit, y, { align: 'right' });
      doc.text(credit.toFixed(2), xCredit, y, { align: 'right' });
      doc.text(runningBalance.toFixed(2), xBalance, y, { align: 'right' });

      y += lineHeight;
    }
  }

  const safeName = (supplier.name || 'supplier')
    .toString()
    .replace(/[^a-z0-9_\-]+/gi, '_');

  doc.save(`supplier-report-${safeName}.pdf`);
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

  async function confirmSalesImport() {
  // Wenn keine Preview vorhanden ist, abbrechen
  if (!salesImportPreview || !salesImportPreview.rows?.length) return

  const rows = salesImportPreview.rows

  // Lokale Zähler aus den globalen Countern
  let invoiceCounter = nextInvoiceNumber
  let customerCounter = nextCustomerNumber

  // Für jede Zeile im Import NEUE Nummern vergeben
  const payloads = rows.map((row) => {
    const invoiceNo = `INV-${String(invoiceCounter).padStart(4, '0')}`
    const customerNo = `C-${String(customerCounter).padStart(4, '0')}`
    invoiceCounter += 1
    customerCounter += 1

    return {
      user_id: user.id,
      invoice_no: invoiceNo,
      customer_no: customerNo,
      date: row.date,
      customer_name: row.customerName,
      product: row.product,
      note: row.note || '',
      total_amount: Number(row.total) || 0,
      cash: Number(row.cash) || 0,
      outstanding: Number(row.unpaid) || 0,
    }
  })

  try {
    const { data, error } = await supabase
      .from('sales')
      .insert(payloads)
      .select()

    if (error) {
      console.error('Fehler beim Import der Sales in Supabase', error)
      alert('Fehler beim Import in die Datenbank. Details in der Konsole.')
      return
    }

    const importedSales = data.map((row) => ({
      id: row.id,
      invoiceNo: row.invoice_no || '',
      customerNo: row.customer_no || '',
      date: row.date || '',
      customerName: row.customer_name || '',
      product: row.product || '',
      note: row.note || '',
      total: String(row.total_amount ?? ''),
      cash: String(row.cash ?? ''),
      unpaid: String(row.outstanding ?? ''),
    }))

    setSales((prev) => [...prev, ...importedSales])

    // Counter um die Anzahl der importierten Zeilen erhöhen
    const created = rows.length
    const newNextInvoice = nextInvoiceNumber + created
    const newNextCustomer = nextCustomerNumber + created
    await updateCountersInSupabase(newNextInvoice, newNextCustomer)

    // Preview schließen
    setSalesImportPreview(null)
  } catch (e) {
    console.error('Unerwarteter Fehler beim Import der Sales', e)
    alert('Unerwarteter Fehler beim Import. Details in der Konsole.')
  }
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
          subtitle: 'High-level financial overview.',
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

const effectiveHeaderMeta =
  activeView === 'profile'
    ? {
        icon: 'fa-user-gear',
        title: 'Profile & settings',
        subtitle: 'Manage program name, business details and logo.',
      }
    : headerMeta

function formatSecondsToMMSS(totalSeconds) {
  const s = Math.max(0, totalSeconds || 0)
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

if (authInitializing) {
  return null
}


if (!user) {
  return <AuthScreen onAuthSuccess={handleAuthSuccess} />
}

return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : ''}`}>
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
    onClick={() => {
    setActiveView('customersReceivable')
    setIsSidebarOpen(false)
  }}
  >
    <i className="fa-solid fa-user-check" />
    <span>Customers receivable</span>
  </button>
  <button
    className={`sidebar-item ${activeView === 'customersPayable' ? 'active' : ''}`}
    onClick={() => {
    setActiveView('customersPayable')
    setIsSidebarOpen(false)
  }}
  >
    <i className="fa-solid fa-user-minus" />
    <span>Customers payable</span>
  </button>
</nav>

<div className="sidebar-section-label">Expenses</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'expenses' ? 'active' : ''}`}
    onClick={() => {
    setActiveView('expenses')
    setIsSidebarOpen(false)
  }}
  >
    <i className="fa-solid fa-wallet" />
    <span>Expenses</span>
  </button>
</nav>

<div className="sidebar-section-label">Cash</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'cashLedger' ? 'active' : ''}`}
    onClick={() => {
    setActiveView('cashLedger')
    setIsSidebarOpen(false)
  }}
  >
    <i className="fa-solid fa-sack-dollar" />
    <span>Cash ledger</span>
  </button>
</nav>

<div className="sidebar-section-label">Reports</div>
<nav className="sidebar-nav">
  <button
    className={`sidebar-item ${activeView === 'reports' ? 'active' : ''}`}
    onClick={() => {
    setActiveView('reports')
    setIsSidebarOpen(false)
  }}
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
    onClick={() => {
    setActiveView('profile')
    setIsSidebarOpen(false)
  }}
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

      {/* CLICK OUTSIDE BACKDROP (mobile) */}
      <div
        className="sidebar-backdrop"
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* MAIN CONTENT RIGHT */}
<div className="main-area">
  <header className="page-header">
    {/* Mobile sidebar toggle */}
    <button
      type="button"
      className="sidebar-toggle"
      onClick={() => setIsSidebarOpen((prev) => !prev)}
    >
      <i className="fa-solid fa-bars" />
    </button>

    {/* Titel & Untertitel */}
    <div className="page-header-main">
      <h1>
        <i className={`fa-solid ${effectiveHeaderMeta.icon}`} /> {effectiveHeaderMeta.title}
      </h1>
      <p>{effectiveHeaderMeta.subtitle}</p>
    </div>

    {/* Sichtbarer Session-Timer */}
    {user && (
      <div
        className="session-timer"
        style={{
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          border: '1px solid #e5e7eb',
          fontSize: '0.85rem',
          fontWeight: 500,
          backgroundColor: '#f9fafb',
        }}
      >
        <i className="fa-solid fa-clock" />
        <span>Session</span>
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 'bold',
            color: secondsLeft <= 60 ? '#b91c1c' : '#111827',
          }}
        >
          {formatSecondsToMMSS(secondsLeft)}
        </span>
      </div>
    )}
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
            <form onSubmit={handleExpenseSubmit}>
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
                        setExpenseForm((prev) => ({...prev,description: e.target.value, }))
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

          {/* HISTORY MODAL */}
          {historyModal.open &&
            historyModal.entityType &&
            historyModal.entityId != null && (
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
                              <span>
                                {formatDisplayDate(log.changedAt.slice(0, 10))}
                              </span>
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
                                  <strong>{ch.field}</strong>:{' '}
                                  {String(ch.oldValue ?? '')} →{' '}
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

          {/* PROFILE VIEW */}
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
                    onSubmit={async (e) => {
                      e.preventDefault()

                      if (!isAdmin) {
                        alert('Only admin can update profile.')
                        return
                      }

                      if (!user?.id) {
                        alert('No logged in user.')
                        return
                      }

                      const payload = {
                        user_id: user.id,
                        program_name:
                          profileForm.programName.trim() || 'Control console',
                        owner_email: profileForm.email.trim() || user.email,
                        business_name:
                          profileForm.businessName.trim() || null,
                        phone: profileForm.phone.trim() || null,
                        address: profileForm.address.trim() || null,
                        timezone: profileForm.timezone || 'Europe/Berlin',
                        logo_url: profileForm.logoUrl.trim() || null,
                      }

                      try {
                        const { data, error } = await supabase
                          .from('profiles')
                          .upsert(payload, { onConflict: 'user_id' })
                          .select()
                          .single()

                        if (error) {
                          console.error(
                            'Error saving profile to Supabase',
                            error,
                          )
                          alert(
                            'Failed to save profile. See console for details.',
                          )
                          return
                        }

                        setProgramName(
                          data.program_name || 'Control console',
                        )
                        setUser((prev) =>
                          prev
                            ? {
                                ...prev,
                                email: data.owner_email || prev.email,
                              }
                            : prev,
                        )
                        alert('Profile updated.')
                      } catch (err) {
                        console.error(
                          'Unexpected error saving profile',
                          err,
                        )
                        alert('Unexpected error while saving profile.')
                      }
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
                            readOnly={!isAdmin}
                            onChange={(e) => {
                              if (!isAdmin) return
                              setProfileForm((prev) => ({
                                ...prev,
                                programName: e.target.value,
                              }))
                            }}
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
                            readOnly={!isAdmin}
                            onChange={(e) => {
                              if (!isAdmin) return
                              setProfileForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Business name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-building" />
                          <input
                            type="text"
                            value={profileForm.businessName}
                            readOnly={!isAdmin}
                            onChange={(e) => {
                              if (!isAdmin) return
                              setProfileForm((prev) => ({
                                ...prev,
                                businessName: e.target.value,
                              }))
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>Phone</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-phone" />
                          <input
                            type="tel"
                            value={profileForm.phone}
                            readOnly={!isAdmin}
                            onChange={(e) => {
                              if (!isAdmin) return
                              setProfileForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Address</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-location-dot" />
                          <input
                            type="text"
                            value={profileForm.address}
                            readOnly={!isAdmin}
                            onChange={(e) => {
                              if (!isAdmin) return
                              setProfileForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>Timezone</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-globe" />
                          <input
                            type="text"
                            value={profileForm.timezone}
                            readOnly={!isAdmin}
                            onChange={(e) => {
                              if (!isAdmin) return
                              setProfileForm((prev) => ({
                                ...prev,
                                timezone: e.target.value,
                              }))
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>Logo URL (optional)</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-image" />
                          <input
                            type="text"
                            value={profileForm.logoUrl}
                            readOnly={!isAdmin}
                            onChange={(e) => {
                              if (!isAdmin) return
                              setProfileForm((prev) => ({
                                ...prev,
                                logoUrl: e.target.value,
                              }))
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          <i className="fa-solid fa-floppy-disk" />
                          <span>Save profile</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* DATALISTS */}
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
