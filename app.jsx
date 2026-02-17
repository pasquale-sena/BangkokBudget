import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  TrendingUp, 
  Cat,
  Utensils,
  Home,
  Zap,
  Heart,
  Music,
  Bus,
  Wifi,
  Stethoscope,
  ShoppingBag,
  Pencil,
  Check,
  RotateCcw,
  Save,
  Upload,
  Database,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  RefreshCw,
  BarChart3,
  ListTodo,
  X,
  Plus,
  Trash2,
  Coins
} from 'lucide-react';

// Default budget configuration
const INITIAL_BUDGET = {
  rent: { label: 'Rent', target: 35000, icon: Home, fixed: true, subCategories: [] },
  food: { 
    label: 'Food', 
    target: 9600, 
    icon: Utensils, 
    subCategories: [
      { id: 'water_delivery', label: 'Drinking Water', cost: 600 }
    ] 
  },
  cat: { 
    label: 'Cat Care', 
    target: 2450, 
    icon: Cat,
    subCategories: [
      { id: 'cat1', label: 'Dry Food (Royal Canin)', cost: 1350 },
      { id: 'cat2', label: 'Wet Food (Pouches)', cost: 850 },
      { id: 'cat3', label: 'Tofu Litter', cost: 250 }
    ]
  },
  massage: { label: 'Wellness', target: 5500, icon: Heart, subCategories: [] },
  utilities: { label: 'Utilities', target: 3500, icon: Zap, subCategories: [] },
  dates: { label: 'Date Nights', target: 5000, icon: Heart, subCategories: [] },
  nightsOut: { label: 'Nights Out', target: 4000, icon: Music, subCategories: [] },
  transport: { label: 'Transport', target: 1500, icon: Bus, subCategories: [] },
  internet: { 
    label: 'Tech Bills', 
    target: 1200, 
    icon: Wifi, 
    fixed: true,
    subCategories: [
      { id: 'int1', label: 'Fiber Internet', cost: 500 },
      { id: 'int2', label: '5G Mobile', cost: 400 },
      { id: 'int3', label: 'Netflix', cost: 169 },
      { id: 'int4', label: 'Spotify', cost: 139 }
    ]
  },
  health: { label: 'Health', target: 2500, icon: Stethoscope, fixed: true, subCategories: [] },
};

const CATEGORY_KEYS = Object.keys(INITIAL_BUDGET);

// Default fallback rates
const DEFAULT_RATES = {
  THB: 1,
  USD: 0.029,
  EUR: 0.027
};

export default function App() {
  // State for current date view
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for budget configuration
  const [budgetConfig, setBudgetConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bangkok_budget_config');
      if (saved) {
        // Smart Merge: Ensure new code-defined keys exist in saved config
        const parsed = JSON.parse(saved);
        return { ...INITIAL_BUDGET, ...parsed };
      }
    }
    return INITIAL_BUDGET;
  });

  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  
  // Persist Currency
  const [currency, setCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bangkok_budget_currency') || 'THB';
    }
    return 'THB';
  });

  const [exchangeRates, setExchangeRates] = useState(DEFAULT_RATES);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const fileInputRef = useRef(null);
  
  // UI States for expansions
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [expandedChecklist, setExpandedChecklist] = useState(null);
  
  // New Item Input State
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCost, setNewItemCost] = useState('');

  // State for financial data (Totals)
  const [financialData, setFinancialData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bangkok_budget_data');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // State for Checklist Details (which items are checked)
  const [checklistData, setChecklistData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bangkok_budget_checklists');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // State for Variable Costs (Manual spending separate from checklists)
  // Structure: { "YYYY-MM": { "food": 1500, "transport": 200 } }
  const [variableCosts, setVariableCosts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bangkok_budget_variable');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Effects for localStorage persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bangkok_budget_config', JSON.stringify(budgetConfig));
      localStorage.setItem('bangkok_budget_currency', currency);
    }
  }, [budgetConfig, currency]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bangkok_budget_data', JSON.stringify(financialData));
    }
  }, [financialData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bangkok_budget_checklists', JSON.stringify(checklistData));
    }
  }, [checklistData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bangkok_budget_variable', JSON.stringify(variableCosts));
    }
  }, [variableCosts]);

  // Fetch Exchange Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/THB');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates({
            THB: 1,
            USD: data.rates.USD,
            EUR: data.rates.EUR
          });
          setLastRefreshed(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch rates, using fallbacks", error);
      }
    };
    fetchRates();
    const intervalId = setInterval(fetchRates, 15 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Helpers
  const getCurrencySymbol = (curr) => {
    switch(curr) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '฿';
    }
  };

  const formatMoney = (amountInTHB) => {
    const rate = exchangeRates[currency];
    const value = amountInTHB * rate;
    
    return new Intl.NumberFormat(currency === 'THB' ? 'th-TH' : 'en-US', { 
      style: 'currency', 
      currency: currency,
      maximumFractionDigits: currency === 'THB' ? 0 : 2
    }).format(value);
  };

  const getMonthKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentKey = getMonthKey(currentDate);
  
  const getPacingPercent = () => {
    const now = new Date();
    const isCurrentMonth = now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();
    if (!isCurrentMonth) return null;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    return (now.getDate() / daysInMonth) * 100;
  };

  const pacingPercent = getPacingPercent();

  // Helper to get historical data for charts
  const getHistoryForCategory = (categoryKey) => {
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      const k = getMonthKey(d);
      const val = financialData[k]?.[categoryKey] || 0;
      history.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        value: val,
        isCurrent: i === 0
      });
    }
    return history;
  };

  // Helper to sync Total (Variable + Checklist)
  const syncTotalCost = (key, newVariableCost = null, newCheckedItems = null) => {
    // 1. Get Variable Cost
    const currentVar = newVariableCost !== null 
      ? newVariableCost 
      : (variableCosts[currentKey]?.[key] || 0);

    // 2. Get Checklist Cost
    const checked = newCheckedItems !== null 
      ? newCheckedItems 
      : (checklistData[currentKey]?.[key] || []);
    
    const subCategories = budgetConfig[key].subCategories || [];
    let checklistTotal = 0;
    subCategories.forEach(sub => {
      if (checked.includes(sub.label)) {
        checklistTotal += sub.cost;
      }
    });

    // 3. Update Financial Data (The source of truth for the dashboard)
    const grandTotal = currentVar + checklistTotal;
    setFinancialData(prev => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {}),
        [key]: grandTotal
      }
    }));
  };

  // Computed Data
  const currentMonthData = useMemo(() => {
    const data = financialData[currentKey] || {};
    let totalTarget = 0;
    let totalActual = 0;

    const categories = CATEGORY_KEYS.map(key => {
      const config = budgetConfig[key];
      const actual = data[key] !== undefined ? data[key] : 0;
      
      totalTarget += config.target;
      totalActual += actual;

      const percent = config.target > 0 ? Math.min((actual / config.target) * 100, 100) : (actual > 0 ? 100 : 0);
      
      let statusColor = 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      if (percent > 100) statusColor = 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
      else if (percent > 85) statusColor = 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]';

      return {
        key,
        ...config,
        actual,
        percent,
        statusColor,
        isOver: actual > config.target,
        hasChecklist: config.subCategories && config.subCategories.length > 0
      };
    });

    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevKey = getMonthKey(prevDate);
    const prevData = financialData[prevKey];
    
    let trend = null;
    if (prevData) {
      const prevTotal = Object.values(prevData).reduce((a, b) => a + b, 0);
      if (prevTotal > 0) {
        const diff = totalActual - prevTotal;
        const percentDiff = (diff / prevTotal) * 100;
        trend = { diff, percentDiff };
      }
    }

    return {
      categories,
      totalTarget,
      totalActual,
      remaining: totalTarget - totalActual,
      trend
    };
  }, [financialData, currentKey, budgetConfig]);

  // Handlers
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setExpandedHistory(null);
    setExpandedChecklist(null);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setExpandedHistory(null);
    setExpandedChecklist(null);
  };

  // Main input handler - updates Variable costs if checklist exists, or total if not
  const handleMainInput = (key, value) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    const config = budgetConfig[key];

    // If no checklist, this input is the total
    if (!config.subCategories || config.subCategories.length === 0) {
      setFinancialData(prev => ({
        ...prev,
        [currentKey]: {
          ...(prev[currentKey] || {}),
          [key]: numValue
        }
      }));
      // Also update variable cost for consistency
      setVariableCosts(prev => ({
        ...prev,
        [currentKey]: { ...(prev[currentKey] || {}), [key]: numValue }
      }));
    } else {
      // If checklist exists, main input is ReadOnly, so this shouldn't trigger usually,
      // but if we enable editing, it would technically be updating the total.
      // Ideally we use the "Variable" input in the drawer for mixed categories.
    }
  };

  const handleVariableInput = (key, value) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    
    setVariableCosts(prev => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {}),
        [key]: numValue
      }
    }));

    syncTotalCost(key, numValue, null);
  };

  const handleQuickFill = (key, amount) => {
    setFinancialData(prev => ({
      ...prev,
      [currentKey]: { ...(prev[currentKey] || {}), [key]: amount }
    }));
    setVariableCosts(prev => ({
      ...prev,
      [currentKey]: { ...(prev[currentKey] || {}), [key]: amount }
    }));
  };

  const handleTargetChange = (key, value) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setBudgetConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        target: numValue
      }
    }));
  };

  // CHECKLIST MANAGEMENT
  const addChecklistItem = (categoryKey) => {
    if (!newItemLabel || !newItemCost) return;
    const cost = parseInt(newItemCost, 10) || 0;
    const newItem = { id: Date.now().toString(), label: newItemLabel, cost };

    setBudgetConfig(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        subCategories: [...(prev[categoryKey].subCategories || []), newItem]
      }
    }));
    setNewItemLabel('');
    setNewItemCost('');
  };

  const removeChecklistItem = (categoryKey, itemId, itemLabel, itemCost) => {
    setBudgetConfig(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        subCategories: prev[categoryKey].subCategories.filter(item => item.id !== itemId)
      }
    }));
    
    // Uncheck if checked
    const currentChecked = checklistData[currentKey]?.[categoryKey] || [];
    if (currentChecked.includes(itemLabel)) {
      const newChecked = currentChecked.filter(label => label !== itemLabel);
      setChecklistData(prev => ({
        ...prev,
        [currentKey]: { ...(prev[currentKey] || {}), [categoryKey]: newChecked }
      }));
      syncTotalCost(categoryKey, null, newChecked);
    }
  };

  const toggleChecklistItem = (categoryKey, itemLabel, itemCost) => {
    const currentChecked = checklistData[currentKey]?.[categoryKey] || [];
    const isChecked = currentChecked.includes(itemLabel);
    
    let newChecked;
    if (isChecked) {
      newChecked = currentChecked.filter(i => i !== itemLabel);
    } else {
      newChecked = [...currentChecked, itemLabel];
    }

    setChecklistData(prev => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {}),
        [categoryKey]: newChecked
      }
    }));

    syncTotalCost(categoryKey, null, newChecked);
  };

  const handleResetTargets = () => {
    if (window.confirm('Reset all targets to original defaults?')) {
      setBudgetConfig(INITIAL_BUDGET);
      setIsEditingTargets(false);
    }
  };

  const handleExport = () => {
    const exportData = { config: budgetConfig, history: financialData, checklists: checklistData, variable: variableCosts };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `bangkok_budget_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowDataMenu(false);
  };

  const handleImport = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.config) setBudgetConfig(parsed.config);
        if (parsed.history) setFinancialData(parsed.history);
        if (parsed.checklists) setChecklistData(parsed.checklists);
        if (parsed.variable) setVariableCosts(parsed.variable);
        alert("Data restored successfully!");
      } catch (err) {
        alert("Invalid file format");
      }
      setShowDataMenu(false);
    };
  };

  const toggleCurrency = () => {
    const cycle = ['THB', 'USD', 'EUR'];
    const next = cycle[(cycle.indexOf(currency) + 1) % cycle.length];
    setCurrency(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 font-sans p-3 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-lg">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/20 backdrop-blur-md">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              Bangkok Monthly Budget
            </h1>
            
            <button 
              onClick={toggleCurrency}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-blue-300 active:scale-95"
            >
              <Globe className="w-3 h-3" />
              {currency}
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={toggleCurrency}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-blue-300 transition-all active:scale-95"
              title={`Refreshed: ${lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Just now'}`}
            >
              <Globe className="w-4 h-4" />
              {currency}
            </button>

            <div className="flex-1 flex items-center justify-between gap-2 bg-white/5 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-xl">
              <button onClick={handlePrevMonth} className="p-3 md:p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 text-slate-300 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="flex-1 md:w-32 text-center font-semibold text-slate-200 select-none tracking-wide text-sm">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={handleNextMonth} className="p-3 md:p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 text-slate-300 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`bg-white/5 backdrop-blur-xl p-5 rounded-2xl border transition-all duration-300 flex flex-row md:flex-col items-center justify-between md:justify-center group hover:bg-white/10 ${isEditingTargets ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'border-white/10 shadow-lg'}`}>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest md:mb-2">Target Budget</span>
            <div className="text-right md:text-center">
              <span className="block text-xl md:text-3xl font-bold text-slate-100 drop-shadow-md">{formatMoney(currentMonthData.totalTarget)}</span>
              {isEditingTargets && <span className="block text-[10px] text-blue-400 font-medium tracking-wider animate-pulse mt-1">EDITING</span>}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex flex-row md:flex-col items-center justify-between md:justify-center group hover:bg-white/10 transition-colors relative overflow-hidden">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest md:mb-2">Actual Spent</span>
            <div className="text-right md:text-center relative z-10">
              <span className={`block text-xl md:text-3xl font-bold drop-shadow-md transition-colors duration-500 ${currentMonthData.totalActual > currentMonthData.totalTarget ? 'text-rose-400' : 'text-blue-400'}`}>
                {formatMoney(currentMonthData.totalActual)}
              </span>
              {currentMonthData.trend && (
                <div className={`flex items-center justify-end md:justify-center gap-1 mt-1 text-[10px] font-bold ${currentMonthData.trend.diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentMonthData.trend.diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(currentMonthData.trend.percentDiff).toFixed(1)}% vs last month
                </div>
              )}
            </div>
          </div>

          <div className={`p-5 rounded-2xl border backdrop-blur-xl shadow-lg flex flex-row md:flex-col items-center justify-between md:justify-center transition-all duration-500 group hover:bg-opacity-20 ${
            currentMonthData.remaining < 0 ? 'bg-rose-900/20 border-rose-500/30' : 'bg-emerald-900/20 border-emerald-500/30'
          }`}>
            <span className={`text-xs font-medium uppercase tracking-widest md:mb-2 ${
              currentMonthData.remaining < 0 ? 'text-rose-300' : 'text-emerald-300'
            }`}>Remaining</span>
            <span className={`text-xl md:text-3xl font-bold drop-shadow-md ${
              currentMonthData.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {formatMoney(currentMonthData.remaining)}
            </span>
          </div>
        </div>

        {/* Main List */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2 tracking-wide">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Expenses
            </h3>
            <div className="flex items-center gap-3">
              {pacingPercent && (
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                   <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Today</span>
                </div>
              )}
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Spent</span>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {currentMonthData.categories.map((cat) => (
              <React.Fragment key={cat.key}>
                <div className="p-4 hover:bg-white/5 transition-colors group relative">
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-3">
                    
                    {/* Icon & Label */}
                    <div className="flex items-center gap-4 order-1 flex-1 min-w-0 md:w-72 md:flex-none">
                      <div className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all border border-white/5 group-hover:border-blue-500/20 shadow-inner">
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-2 min-w-0 pr-4">
                        <div className="font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                          {cat.label}
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Checklist Toggle Button */}
                          <button 
                            onClick={() => setExpandedChecklist(expandedChecklist === cat.key ? null : cat.key)}
                            className={`p-1 rounded-md transition-colors ${expandedChecklist === cat.key ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-blue-300 hover:bg-white/5'}`}
                            title="Manage Checklist & Variable Costs"
                          >
                            <ListTodo className="w-3.5 h-3.5" />
                          </button>

                          {/* History Graph Toggle Button */}
                          <button 
                            onClick={() => setExpandedHistory(expandedHistory === cat.key ? null : cat.key)}
                            className={`p-1 rounded-md transition-colors ${expandedHistory === cat.key ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-purple-300 hover:bg-white/5'}`}
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Input Field Group */}
                    <div className="flex flex-col items-end gap-1.5 order-2 md:order-3 ml-auto md:ml-0 flex-shrink-0 md:w-48">
                      {isEditingTargets ? (
                        <div className="flex items-center gap-2 justify-end w-full">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Target</span>
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={cat.target}
                            onChange={(e) => handleTargetChange(cat.key, e.target.value)}
                            className="w-20 text-right text-xs font-bold text-blue-300 bg-blue-900/20 border border-blue-500/30 rounded px-2 py-1 focus:outline-none focus:border-blue-400 focus:bg-blue-900/40 transition-all"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-slate-400 transition-colors">
                          Target: {formatMoney(cat.target)}
                        </span>
                      )}

                      <div className="flex items-center justify-end gap-2 w-full">
                        {/* Quick Fill */}
                        {cat.fixed && !isEditingTargets && (!cat.subCategories || cat.subCategories.length === 0) ? (
                          <button
                            onClick={() => handleQuickFill(cat.key, cat.target)}
                            className="p-1.5 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all active:scale-95 flex-shrink-0"
                            title={`Mark as paid (${formatMoney(cat.target)})`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <div className="w-8 h-8 flex-shrink-0"></div>
                        )}
                        
                        <div className="relative w-32 md:w-32 flex-shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                            {getCurrencySymbol(currency)}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            // If user types in box, we assume they are editing the TOTAL if no checklist exists.
                            // If checklist exists, this box is read-only (calculated).
                            value={cat.actual > 0 ? (currency === 'THB' ? cat.actual : (cat.actual * exchangeRates[currency]).toFixed(2)) : ''}
                            onChange={(e) => {
                              // If using checklist, editing main box is disabled or redirects to variable
                              if (cat.hasChecklist) return;
                              const val = parseFloat(e.target.value) || 0;
                              const thbVal = Math.round(val / exchangeRates[currency]);
                              handleMainInput(cat.key, thbVal.toString());
                            }}
                            placeholder="0"
                            readOnly={cat.hasChecklist} 
                            className={`w-full pl-8 pr-3 py-2 md:py-1.5 text-right text-base md:text-sm font-semibold rounded-lg border outline-none transition-all bg-black/20 focus:bg-black/40 backdrop-blur-sm shadow-inner ${
                              cat.isOver 
                                ? 'border-rose-500/30 text-rose-400 focus:border-rose-500 placeholder-rose-900/50' 
                                : 'border-white/5 text-white focus:border-blue-500/50 placeholder-slate-700'
                            } ${cat.hasChecklist ? 'cursor-default opacity-80' : ''}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full order-3 md:order-2 md:flex-1 md:px-8 relative pt-2">
                      {pacingPercent && (
                        <div 
                          className="absolute top-0 bottom-0 w-px bg-white/20 z-10 flex flex-col items-center group/pacing"
                          style={{ left: `${pacingPercent}%` }}
                        >
                          <div className="w-1.5 h-1.5 -mt-0.5 rounded-full bg-slate-400 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
                        </div>
                      )}
                      
                      <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden w-full shadow-inner border border-white/5 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out ${cat.statusColor}`}
                          style={{ width: `${Math.min(cat.percent, 100)}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* EXPANSION PANEL: CHECKLIST + VARIABLE */}
                {expandedChecklist === cat.key && (
                  <div className="px-4 pb-4 md:px-16 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-slate-900/50 rounded-xl border border-white/10 p-4 shadow-inner space-y-4">
                      
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-blue-300 flex items-center gap-2">
                          <ListTodo className="w-4 h-4" />
                          Manage Items
                        </h4>
                        <button onClick={() => setExpandedChecklist(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
                      </div>

                      {/* VARIABLE SPENDING SECTION - NEW */}
                      <div className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-emerald-500/20 rounded-md text-emerald-400">
                             <Coins className="w-4 h-4" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-slate-200">Variable / Cash</span>
                             <span className="text-[10px] text-slate-500">Daily spending, meals, unlisted items</span>
                           </div>
                         </div>
                         <div className="relative w-32">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">THB</span>
                           <input 
                             type="number"
                             value={variableCosts[currentKey]?.[cat.key] || ''}
                             onChange={(e) => handleVariableInput(cat.key, e.target.value)}
                             placeholder="0"
                             className="w-full bg-slate-800 border border-white/10 rounded-md py-1.5 pl-8 pr-2 text-right text-sm text-white focus:outline-none focus:border-emerald-500/50"
                           />
                         </div>
                      </div>
                      
                      {/* Existing Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.subCategories && cat.subCategories.length > 0 ? (
                          cat.subCategories.map((item, idx) => {
                            const isChecked = checklistData[currentKey]?.[cat.key]?.includes(item.label);
                            return (
                              <div key={idx} className="flex gap-2">
                                <button
                                  onClick={() => toggleChecklistItem(cat.key, item.label, item.cost)}
                                  className={`flex-1 flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    isChecked 
                                      ? 'bg-blue-500/20 border-blue-500/30 text-white' 
                                      : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium">{item.label}</span>
                                  </div>
                                  <span className="text-xs font-semibold opacity-70">{formatMoney(item.cost)}</span>
                                </button>
                                {/* Delete Item Button */}
                                <button 
                                  onClick={() => removeChecklistItem(cat.key, item.id, item.label, item.cost)}
                                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full text-center py-2 text-slate-500 text-xs">
                            No fixed items. Use "Variable / Cash" above or add items below.
                          </div>
                        )}
                      </div>

                      {/* Add New Item Form */}
                      <div className="pt-3 border-t border-white/5">
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                           <div className="flex-1 w-full">
                             <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Item Name</label>
                             <input 
                               type="text" 
                               value={newItemLabel}
                               onChange={(e) => setNewItemLabel(e.target.value)}
                               placeholder="e.g. Monthly Sub"
                               className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                             />
                           </div>
                           <div className="w-full md:w-32">
                             <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Cost (THB)</label>
                             <input 
                               type="number" 
                               value={newItemCost}
                               onChange={(e) => setNewItemCost(e.target.value)}
                               placeholder="0"
                               className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                             />
                           </div>
                           <button 
                             onClick={() => addChecklistItem(cat.key)}
                             disabled={!newItemLabel || !newItemCost}
                             className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                           >
                             <Plus className="w-4 h-4" />
                             Add
                           </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* EXPANSION PANEL: HISTORY GRAPH */}
                {expandedHistory === cat.key && (
                  <div className="px-4 pb-4 md:px-16 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-slate-900/50 rounded-xl border border-white/10 p-4 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-purple-300 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          6-Month Trend
                        </h4>
                        <button onClick={() => setExpandedHistory(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
                      </div>
                      <div className="flex items-end justify-between h-32 gap-2 pt-4">
                        {getHistoryForCategory(cat.key).map((data, i) => {
                           const maxVal = Math.max(cat.target * 1.2, ...getHistoryForCategory(cat.key).map(d => d.value));
                           const barHeight = (data.value / maxVal) * 100;
                           return (
                             <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                               <div className="text-[10px] text-white opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -mt-5 font-bold">
                                 {formatMoney(data.value)}
                               </div>
                               <div className="w-full bg-slate-800/50 rounded-t-sm relative h-full flex items-end overflow-hidden">
                                  <div 
                                    className={`w-full transition-all duration-500 ${data.isCurrent ? 'bg-purple-500' : 'bg-slate-600 group-hover/bar:bg-slate-500'}`}
                                    style={{ height: `${Math.max(barHeight, 2)}%` }}
                                  ></div>
                               </div>
                               <span className={`text-[10px] font-medium uppercase ${data.isCurrent ? 'text-purple-300' : 'text-slate-500'}`}>
                                 {data.month}
                               </span>
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-end pt-2">
           <div className="relative z-10">
             {!showDataMenu ? (
               <button 
                 onClick={() => setShowDataMenu(true)}
                 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all active:scale-95 backdrop-blur-sm"
               >
                 <Database className="w-4 h-4" />
                 Data
               </button>
             ) : (
               <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                 <button 
                   onClick={handleExport}
                   className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                 >
                   <Save className="w-4 h-4" />
                   Backup
                 </button>
                 <div className="w-px h-4 bg-white/10 mx-1"></div>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                 >
                   <Upload className="w-4 h-4" />
                   Restore
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   onChange={handleImport} 
                   className="hidden" 
                   accept=".json" 
                 />
                 <button 
                   onClick={() => setShowDataMenu(false)}
                   className="ml-1 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                 >
                   <ChevronRight className="w-4 h-4 rotate-90" />
                 </button>
               </div>
             )}
           </div>

           {!isEditingTargets ? (
             <button 
               onClick={() => setIsEditingTargets(true)}
               className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all active:scale-95 backdrop-blur-sm touch-manipulation"
             >
               <Pencil className="w-4 h-4" />
               Edit Targets
             </button>
           ) : (
             <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-xl">
               <button 
                 onClick={handleResetTargets}
                 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors active:scale-95 touch-manipulation"
               >
                 <RotateCcw className="w-4 h-4" />
                 Reset
               </button>
               <div className="w-px h-6 bg-white/10"></div>
               <button 
                 onClick={() => setIsEditingTargets(false)}
                 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all active:scale-95 touch-manipulation"
               >
                 <Check className="w-4 h-4" />
                 Done
               </button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
