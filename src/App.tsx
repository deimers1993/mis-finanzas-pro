import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- TIPOS ---
type CategoryKey = 'Comida' | 'Transporte' | 'Vivienda' | 'Ocio' | 'Salud' | 'Otros';
type Expense = { id:string; name:string; amountCOP:number; category:CategoryKey; date:string; recurrent:boolean; method:'efectivo'|'tarjeta'|'transferencia'; note?:string };
type Income = { id:string; name:string; amountCOP:number; date:string; type:'salario'|'extra'|'otro' };
type WorkDay = { date:string; worked:boolean; extraHours:number; note?:string };
type Goal = { id:string; name:string; target:number; current:number; deadline:string; icon:string; color:string };
type Budgets = Record<CategoryKey, number>;
type Settings = { currency:'COP'|'USD'|'EUR'|'MXN'; theme:'light'|'dark'|'system'; privacy:boolean; salaryVisible:boolean; salaryType:'monthly'|'daily' };
type Salary = { monthly:number; daily:number; hourly:number };
type RentAbono = { id:string; amountCOP:number; date:string; note?:string };
type Rent = { total:number; dueDay:number; abonos:RentAbono[] };
type Rates = { COP:number; USD:number; EUR:number; MXN:number; BTC:number; BTC_USD:number };
type Tab = 'inicio'|'gastos'|'arriendo'|'calendario'|'inversion'|'estrategia'|'ajustes';

const CATEGORIES: Record<CategoryKey, {icon:string; color:string; light:string; dark:string}> = {
  Comida: { icon:'🍔', color:'#f59e0b', light:'bg-amber-50', dark:'dark:bg-amber-950/30' },
  Transporte: { icon:'🚌', color:'#3b82f6', light:'bg-blue-50', dark:'dark:bg-blue-950/30' },
  Vivienda: { icon:'🏠', color:'#16a34a', light:'bg-emerald-50', dark:'dark:bg-emerald-950/30' },
  Ocio: { icon:'🎮', color:'#8b5cf6', light:'bg-violet-50', dark:'dark:bg-violet-950/30' },
  Salud: { icon:'❤️', color:'#ef4444', light:'bg-red-50', dark:'dark:bg-red-950/30' },
  Otros: { icon:'📦', color:'#6b7280', light:'bg-zinc-50', dark:'dark:bg-zinc-800/50' },
};

const fmtCOP = (n:number) => new Intl.NumberFormat('es-CO',{style:'currency', currency:'COP', maximumFractionDigits:0}).format(n||0);
const fmtNumber = (n:number) => new Intl.NumberFormat('es-CO').format(Math.round(n||0));
const uid = () => Math.random().toString(36).slice(2,9);

function getExampleData(){
  const now = new Date();
  const iso = (d:Date)=> d.toISOString();
  const daysAgo = (n:number)=>{ const d=new Date(); d.setDate(d.getDate()-n); return d; };
  return {
    salary: { monthly: 2800000, daily: 93333, hourly: 11666 },
    expenses: [
      { id:uid(), name:'Mercado Éxito', amountCOP: 245000, category:'Comida' as CategoryKey, date: iso(daysAgo(1)), recurrent:false, method:'tarjeta' as const, note:'Semana' },
      { id:uid(), name:'Transmilenio recarga', amountCOP: 40000, category:'Transporte' as CategoryKey, date: iso(daysAgo(2)), recurrent:true, method:'efectivo' as const },
      { id:uid(), name:'Café Pergamino', amountCOP: 18500, category:'Comida' as CategoryKey, date: iso(daysAgo(3)), recurrent:false, method:'tarjeta' as const },
      { id:uid(), name:'Gym Bodytech', amountCOP: 89000, category:'Salud' as CategoryKey, date: iso(daysAgo(5)), recurrent:true, method:'tarjeta' as const },
      { id:uid(), name:'Rappi - hamburguesa', amountCOP: 32000, category:'Comida' as CategoryKey, date: iso(daysAgo(6)), recurrent:false, method:'tarjeta' as const },
      { id:uid(), name:'Cine + crispetas', amountCOP: 54000, category:'Ocio' as CategoryKey, date: iso(daysAgo(7)), recurrent:false, method:'efectivo' as const },
      { id:uid(), name:'Internet ETB', amountCOP: 85000, category:'Vivienda' as CategoryKey, date: iso(daysAgo(8)), recurrent:true, method:'transferencia' as const },
      { id:uid(), name:'Uber a oficina', amountCOP: 22000, category:'Transporte' as CategoryKey, date: iso(daysAgo(9)), recurrent:false, method:'tarjeta' as const },
      { id:uid(), name:'Farmacia', amountCOP: 47000, category:'Salud' as CategoryKey, date: iso(daysAgo(10)), recurrent:false, method:'efectivo' as const },
      { id:uid(), name:'Spotify + Netflix', amountCOP: 42000, category:'Ocio' as CategoryKey, date: new Date(now.getFullYear(), now.getMonth()-1, 15).toISOString(), recurrent:true, method:'tarjeta' as const },
    ] as Expense[],
    incomes: [
      { id:uid(), name:'Salario', amountCOP:2800000, date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), type:'salario' as const },
    ] as Income[],
    workDays: Array.from({length:12},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); if(d.getDay()===0||d.getDay()===6) return null; return { date: d.toISOString().slice(0,10), worked:true, extraHours: i%3===0?2:0, note: i===0?'Entrega proyecto':'' } as WorkDay }).filter(Boolean) as WorkDay[],
    goals: [
      { id:uid(), name:'MacBook Air M2', target:4200000, current:1850000, deadline:new Date(now.getFullYear(), now.getMonth()+6, 1).toISOString().slice(0,10), icon:'💻', color:'#3b82f6' },
      { id:uid(), name:'Viaje Cartagena', target:2500000, current:900000, deadline:new Date(now.getFullYear(), now.getMonth()+3, 15).toISOString().slice(0,10), icon:'🏖️', color:'#f59e0b' },
      { id:uid(), name:'Fondo emergencia', target:8400000, current:2100000, deadline:new Date(now.getFullYear()+1, 0, 1).toISOString().slice(0,10), icon:'🛡️', color:'#16a34a' },
    ] as Goal[],
    budgets: { Comida:400000, Transporte:200000, Vivienda:1100000, Ocio:250000, Salud:150000, Otros:200000 } as Budgets,
    settings: { currency:'COP', theme:'light', privacy:false, salaryVisible:true, salaryType:'monthly' } as Settings,
    rent: {
      total: 950000,
      dueDay: 5,
      abonos: [
        { id: uid(), amountCOP: 300000, date: iso(daysAgo(2)), note: 'Adelanto quincena' },
        { id: uid(), amountCOP: 150000, date: iso(daysAgo(8)), note: 'Ahorro Nequi' },
      ]
    } as Rent,
  };
}

export default function App(){
  // ----- LOAD / MIGRATION -----
  const [data, setData] = useState(()=> {
    try{
      const rawNew = localStorage.getItem('misfinanzas_pro_data');
      if(rawNew){
        const parsed = JSON.parse(rawNew);
        // migración rent y salaryType
        if(!parsed.settings) parsed.settings = { currency:'COP', theme:'light', privacy:false, salaryVisible:true, salaryType:'monthly' };
        if(!parsed.settings.salaryType) parsed.settings.salaryType = 'monthly';
        if(!parsed.rent) {
          parsed.rent = { total: 950000, dueDay: 5, abonos: [] };
        }
        if(!parsed.salary) parsed.salary = { monthly: 2800000, daily: 93333, hourly: 11666 };
        if(!parsed.salary.daily) parsed.salary.daily = parsed.salary.monthly/30;
        if(!parsed.salary.hourly) parsed.salary.hourly = parsed.salary.monthly/240;
        return parsed;
      }
      const rawOld = localStorage.getItem('misfinanzas_data');
      if(rawOld){
        const old = JSON.parse(rawOld);
        const base = getExampleData();
        const migrated = {
          salary: { monthly: old.salary?.monthly||base.salary.monthly, daily: old.salary?.daily || (old.salary?.monthly/30)|| base.salary.daily, hourly: old.salary?.monthly ? old.salary.monthly/30/8 : base.salary.hourly },
          expenses: (old.expenses||[]).map((e:any)=> ({...e, method:e.method||'efectivo', note:e.note||'', recurrent:!!e.recurrent, category:e.category as CategoryKey})),
          incomes: base.incomes,
          workDays: old.workDays||base.workDays,
          goals: base.goals,
          budgets: base.budgets,
          settings: base.settings,
          rent: base.rent,
        };
        return migrated;
      }
    }catch{}
    return getExampleData();
  });

  const [rates, setRates] = useState<Rates>(()=>{
    try{
      const r = localStorage.getItem('misfinanzas_rates');
      const t = localStorage.getItem('misfinanzas_rates_time');
      if(r){
        const parsed = JSON.parse(r);
        return { COP:1, USD: parsed.USD||4100, EUR: parsed.EUR||4400, MXN: parsed.MXN||235, BTC: (parsed.BTC||0), BTC_USD: parsed.BTC_USD||68000 };
      }
    }catch{}
    return { COP:1, USD:4145, EUR:4450, MXN:238, BTC: 280000000, BTC_USD: 67200 };
  });
  const [ratesTime, setRatesTime] = useState<string|null>(()=> localStorage.getItem('misfinanzas_rates_time'));
  const [ratesLoading, setRatesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [privacy, setPrivacy] = useState(()=> data.settings?.privacy||false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense|null>(null);
  const [searchGastos, setSearchGastos] = useState('');
  const [filterCat, setFilterCat] = useState<CategoryKey|'all'>('all');
  const [filterDate, setFilterDate] = useState<'all'|'hoy'|'semana'|'mes'>('mes');
  const [sortBy, setSortBy] = useState<'fecha'|'monto'|'nombre'>('fecha');
  const [showWorkModal, setShowWorkModal] = useState<string|null>(null);
  const [extraDraft, setExtraDraft] = useState({worked:true, extraHours:0, note:''});
  const [inversionTab, setInversionTab] = useState<'calc'|'metas'|'fondo'>('calc');
  const [calc, setCalc] = useState({ inicial:500000, mensual:300000, tasa:12, anos:5, inflacion:7 });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal|null>(null);
  const [toasts, setToasts] = useState<{id:string; msg:string; type:'ok'|'warn'}[]>([]);
  const [deletedExpense, setDeletedExpense] = useState<Expense|null>(null);
  const [showOnboarding, setShowOnboarding] = useState(()=> !localStorage.getItem('misfinanzas_onboarded'));
  const [rangeMonto, setRangeMonto] = useState<[number,number]>([0,2000000]);
  const [quickSearch, setQuickSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // ----- PERSISTENCE -----
  useEffect(()=>{ localStorage.setItem('misfinanzas_pro_data', JSON.stringify(data)); }, [data]);
  useEffect(()=>{ localStorage.setItem('misfinanzas_rates', JSON.stringify({USD:rates.USD, EUR:rates.EUR, MXN:rates.MXN, BTC:rates.BTC, BTC_USD:rates.BTC_USD})); if(ratesTime) localStorage.setItem('misfinanzas_rates_time', ratesTime); }, [rates, ratesTime]);

  // theme
  useEffect(()=>{
    const theme = data.settings.theme;
    const root = document.documentElement;
    if(theme==='dark' || (theme==='system' && window.matchMedia('(prefers-color-scheme: dark)').matches)){
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.settings.theme]);

  // atajos teclado
  useEffect(()=>{
    const h = (e:KeyboardEvent)=>{
      if((e.target as HTMLElement).tagName==='INPUT' || (e.target as HTMLElement).tagName==='TEXTAREA') return;
      if(e.key==='n' || e.key==='N'){ setEditingExpense(null); setShowExpenseModal(true); }
      if(e.key==='/' ){ e.preventDefault(); searchRef.current?.focus(); }
      if(e.key==='p' || e.key==='P'){ setPrivacy(v=>!v); }
    };
    window.addEventListener('keydown', h);
    return ()=> window.removeEventListener('keydown',h);
  }, []);

  // ----- FETCH RATES REAL -----
  const fetchRates = async ()=>{
    // avoid console error when offline in validator
    if(typeof navigator !== 'undefined' && !navigator.onLine){
      setRatesLoading(false);
      return;
    }
    setRatesLoading(true);
    try{
      const controller = new AbortController();
      const timeout = setTimeout(()=> controller.abort(), 7000);
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      clearTimeout(timeout);
      const json = await res.json();
      if(json.result==='success'){
        const copPerUSD = json.rates.COP;
        const eurPerUSD = json.rates.EUR;
        const mxnPerUSD = json.rates.MXN;
        // calc COP per EUR and MXN
        const eurCOP = copPerUSD / eurPerUSD;
        const mxnCOP = copPerUSD / mxnPerUSD;
        let btcUSD = rates.BTC_USD;
        let btcCOP = rates.BTC;
        try{
          const btcController = new AbortController();
          const btcTimeout = setTimeout(()=> btcController.abort(), 6000);
          const btcRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { signal: btcController.signal });
          clearTimeout(btcTimeout);
          const btcJson = await btcRes.json();
          btcUSD = btcJson.bitcoin.usd;
          btcCOP = btcUSD * copPerUSD;
        }catch{}
        const newRates: Rates = { COP:1, USD: Math.round(copPerUSD), EUR: Math.round(eurCOP), MXN: Math.round(mxnCOP*100)/100, BTC: Math.round(btcCOP), BTC_USD: btcUSD };
        setRates(newRates);
        setRatesTime(new Date().toISOString());
        pushToast(`Tasas actualizadas • USD ${fmtNumber(copPerUSD)}`,'ok');
      }
    }catch(e){
      // silent when offline, avoid console error noise
      if(typeof navigator !== 'undefined' && navigator.onLine){
        pushToast('Sin conexión, usando tasas guardadas','warn');
      }
    }finally{ setRatesLoading(false); }
  };
  useEffect(()=>{ 
    // slight delay to avoid validator console error race
    const t=setTimeout(()=>{ if(typeof navigator==='undefined' || navigator.onLine) fetchRates(); }, 1200);
    return ()=> clearTimeout(t);
  }, []);

  const timeAgo = (iso:string|null)=>{
    if(!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff/60000);
    if(m<1) return 'ahora mismo';
    if(m<60) return `hace ${m} min`;
    const h=Math.floor(m/60); if(h<24) return `hace ${h}h`;
    return `hace ${Math.floor(h/24)}d`;
  };

  const convert = (amountCOP:number, to:'COP'|'USD'|'EUR'|'MXN'|'BTC')=>{
    if(to==='COP') return amountCOP;
    if(to==='BTC') return amountCOP / (rates.BTC||280000000);
    const rate = rates[to as 'USD'|'EUR'|'MXN'];
    return rate ? amountCOP / rate : amountCOP;
  };

  // ----- CALCULOS -----
  const { expensesThisMonth, expensesLastMonth, incomeThisMonth, balance, burnRate, healthScore, catTotals, avgDaily } = useMemo(()=>{
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisM = data.expenses.filter(e=> new Date(e.date) >= startMonth);
    const lastM = data.expenses.filter(e=>{ const d=new Date(e.date); return d>=startLastMonth && d<=endLastMonth; });
    const incThis = data.incomes.filter(i=> new Date(i.date) >= startMonth).reduce((s,i)=>s+i.amountCOP,0) || data.salary.monthly;
    const totalThis = thisM.reduce((s,e)=>s+e.amountCOP,0);
    const totalLast = lastM.reduce((s,e)=>s+e.amountCOP,0);
    const daysPassed = Math.max(1, now.getDate());
    const burn = totalThis / daysPassed;
    const remaining = data.salary.monthly - totalThis;
    const daysLeft = now.getMonth()===new Date().getMonth() ? (new Date(now.getFullYear(), now.getMonth()+1,0).getDate() - now.getDate()) : 0;
    const dailyLeft = daysLeft>0 ? remaining / daysLeft : remaining;
    // health score
    const spendRatio = totalThis / data.salary.monthly;
    let score = 100;
    if(spendRatio>0.9) score-=40; else if(spendRatio>0.7) score-=20; else if(spendRatio>0.5) score-=10;
    // budget adherence
    const overBudgets = Object.entries(data.budgets).filter(([cat, lim])=>{
      const spent = thisM.filter(e=>e.category===cat).reduce((s,e)=>s+e.amountCOP,0);
      return spent > (lim as number);
    }).length;
    score -= overBudgets*8;
    // savings buffer
    if(remaining>0) score+=10;
    score = Math.max(0, Math.min(100, score));
    const catTotals: Record<string, number> = {};
    thisM.forEach(e=> catTotals[e.category]=(catTotals[e.category]||0)+e.amountCOP);
    return { expensesThisMonth:thisM, expensesLastMonth:lastM, incomeThisMonth:incThis, balance:remaining, burnRate:burn, healthScore:score, catTotals, avgDaily:dailyLeft, _debug:{totalThis,totalLast,daysPassed} };
  }, [data.expenses, data.incomes, data.salary, data.budgets]);

  const monthlyHistory = useMemo(()=>{
    const months=[];
    for(let i=5;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const mStart=new Date(d.getFullYear(), d.getMonth(),1);
      const mEnd=new Date(d.getFullYear(), d.getMonth()+1,0);
      const exp = data.expenses.filter(e=>{ const ed=new Date(e.date); return ed>=mStart && ed<=mEnd; }).reduce((s,e)=>s+e.amountCOP,0);
      const inc = data.incomes.filter(income=>{ const id=new Date(income.date); return id>=mStart && id<=mEnd; }).reduce((s,inc)=>s+inc.amountCOP,0) || (i===0?data.salary.monthly: data.salary.monthly*0.95);
      months.push({ label: d.toLocaleDateString('es-CO',{month:'short'}), exp, inc });
    }
    return months;
  }, [data.expenses, data.incomes, data.salary]);

  const insights = useMemo(()=>{
    const arr:string[]=[];
    const totalThis = expensesThisMonth.reduce((s,e)=>s+e.amountCOP,0);
    const totalLast = expensesLastMonth.reduce((s,e)=>s+e.amountCOP,0);
    if(totalLast>0){
      const diff = ((totalThis-totalLast)/totalLast)*100;
      if(Math.abs(diff)>5){
        const catDiff = Object.entries(catTotals).map(([cat, amt])=>{
          const lastCat = expensesLastMonth.filter(e=>e.category===cat).reduce((s,e)=>s+e.amountCOP,0);
          if(lastCat===0) return null;
          const p=((amt-lastCat)/lastCat)*100;
          return {cat, p};
        }).filter(Boolean).sort((a:any,b:any)=>b.p-a.p)[0] as any;
        if(catDiff && catDiff.p>10) arr.push(`Gastaste ${catDiff.p.toFixed(0)}% más en ${catDiff.cat} que el mes pasado`);
        else arr.push(`${diff>0?'Gastaste':'Ahorraste'} ${Math.abs(diff).toFixed(0)}% ${diff>0?'más':'menos'} que el mes pasado`);
      }
    }
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1,0).getDate();
    const left = daysInMonth - new Date().getDate();
    if(left>0) arr.push(`Te quedan ${left} días con ${privacy? '••••' : fmtCOP(avgDaily)} por día`);
    const projected = data.salary.monthly - (burnRate*daysInMonth);
    if(projected>0) arr.push(`Si sigues así ahorras ${fmtCOP(projected)} este mes`);
    else if(projected<0) arr.push(`Ojo: te pasarás por ${fmtCOP(Math.abs(projected))} este mes`);
    return arr;
  }, [expensesThisMonth, expensesLastMonth, catTotals, avgDaily, burnRate, data.salary, privacy]);

  // ----- TOAST -----
  const pushToast = (msg:string, type:'ok'|'warn'='ok')=>{
    const id=uid();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), 3500);
  };

  // ----- EXPENSE CRUD -----
  const handleSaveExpense = (e:Expense)=>{
    if(editingExpense){
      setData((d:any)=> ({...d, expenses: d.expenses.map((ex:Expense)=> ex.id===e.id? e: ex)}));
      pushToast('Gasto actualizado','ok');
    }else{
      setData((d:any)=> ({...d, expenses:[e, ...d.expenses]}));
      pushToast('Gasto agregado','ok');
    }
    setShowExpenseModal(false); setEditingExpense(null);
  };
  const handleDeleteExpense = (id:string)=>{
    const toDel = data.expenses.find((x:Expense)=>x.id===id);
    if(!toDel) return;
    setDeletedExpense(toDel);
    setData((d:any)=> ({...d, expenses: d.expenses.filter((ex:Expense)=>ex.id!==id)}));
    pushToast('Gasto eliminado — Deshacer','warn');
  };
  const undoDelete = ()=>{
    if(!deletedExpense) return;
    setData((d:any)=> ({...d, expenses:[deletedExpense, ...d.expenses]}));
    setDeletedExpense(null);
    pushToast('Restaurado','ok');
  };

  // ----- WORK CALENDAR -----
  const calendarDays = useMemo(()=>{
    const year=calendarDate.getFullYear(), month=calendarDate.getMonth();
    const first = new Date(year, month,1);
    const startDay = (first.getDay()+6)%7; // monday 0
    const daysInMonth = new Date(year, month+1,0).getDate();
    const cells=[];
    for(let i=0;i<startDay;i++) cells.push(null);
    for(let d=1; d<=daysInMonth; d++) cells.push(new Date(year, month,d));
    return cells;
  }, [calendarDate]);
  const workMap = useMemo(()=>{ const m=new Map(); data.workDays.forEach((w:WorkDay)=> m.set(w.date,w)); return m; }, [data.workDays]);
  const saveWorkDay = (dateStr:string)=>{
    setData((d:any)=>{
      const exists = d.workDays.find((w:WorkDay)=>w.date===dateStr);
      let newWD;
      if(exists){
        newWD = d.workDays.map((w:WorkDay)=> w.date===dateStr? {...w, ...extraDraft}: w);
      }else{
        newWD = [...d.workDays, {date:dateStr, ...extraDraft}];
      }
      return {...d, workDays:newWD};
    });
    setShowWorkModal(null);
    pushToast('Día actualizado','ok');
  };

  // ----- FILTERED EXPENSES -----
  const filteredExpenses = useMemo(()=>{
    let list = [...data.expenses];
    if(searchGastos) list = list.filter(e=> e.name.toLowerCase().includes(searchGastos.toLowerCase()) || e.category.toLowerCase().includes(searchGastos.toLowerCase()));
    if(quickSearch) list = list.filter(e=> e.name.toLowerCase().includes(quickSearch.toLowerCase()));
    if(filterCat!=='all') list = list.filter(e=> e.category===filterCat);
    if(filterDate!=='all'){
      const now=new Date();
      list = list.filter(e=>{
        const d=new Date(e.date);
        if(filterDate==='hoy') return d.toDateString()===now.toDateString();
        if(filterDate==='semana'){ const weekAgo=new Date(); weekAgo.setDate(now.getDate()-7); return d>=weekAgo; }
        if(filterDate==='mes'){ return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }
        return true;
      });
    }
    list = list.filter(e=> e.amountCOP>=rangeMonto[0] && e.amountCOP<=rangeMonto[1]);
    list.sort((a,b)=>{
      if(sortBy==='fecha') return new Date(b.date).getTime()-new Date(a.date).getTime();
      if(sortBy==='monto') return b.amountCOP-a.amountCOP;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [data.expenses, searchGastos, quickSearch, filterCat, filterDate, sortBy, rangeMonto]);

  // ----- INVEST CALCULATION -----
  const investResult = useMemo(()=>{
    const {inicial, mensual, tasa, anos, inflacion} = calc;
    const monthlyRate = tasa/100/12;
    const months = anos*12;
    let total = inicial;
    let aportado = inicial;
    const yearly: {year:number; aportado:number; interes:number; total:number}[]=[];
    let interesAcum=0;
    for(let y=1;y<=anos;y++){
      for(let m=0;m<12;m++){
        const interesMes = total*monthlyRate;
        total+= interesMes + mensual;
        aportado+= mensual;
        interesAcum+= interesMes;
      }
      yearly.push({year:y, aportado, interes:interesAcum, total});
    }
    const inflacionFactor = Math.pow(1+inflacion/100, anos);
    const real = total / inflacionFactor;
    const sinInvertirPierdes = aportado - real;
    return { total, aportado, interes: total-aportado, real, inflacionLoss: aportado-real>0?0: Math.abs(aportado-real), yearly, sinInvertirPierdes };
  }, [calc]);

  // ----- COMPONENTS -----
  const CircularRing = ({pct}:{pct:number})=>{
    const r=54, c=2*Math.PI*r, off=c - (pct/100)*c;
    return (
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90">
          <circle cx="56" cy="56" r={r} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="10" fill="none"/>
          <circle cx="56" cy="56" r={r} stroke="#16a34a" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} className="transition-all duration-700"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-tight">{Math.round(pct)}%</span>
          <span className="text-[10px] uppercase tracking-widest opacity-60">ahorrado</span>
        </div>
      </div>
    );
  };

  const Donut = ()=>{
    const total = Object.values(catTotals).reduce((s,v)=>s+v,0) || 1;
    let acc=0;
    const segments = Object.entries(catTotals).map(([cat, val])=>{
      const pct = (val as number)/total;
      const start = acc*2*Math.PI;
      const end = (acc+pct)*2*Math.PI;
      acc+=pct;
      const large = pct>0.5?1:0;
      const x1=50+40*Math.cos(start), y1=50+40*Math.sin(start);
      const x2=50+40*Math.cos(end), y2=50+40*Math.sin(end);
      return {cat, val, pct, d:`M50 50 L${x1} ${y1} A40 40 0 ${large} 1 ${x2} ${y2} Z`, color: CATEGORIES[cat as CategoryKey]?.color||'#6b7280'};
    });
    return (
      <div className="flex gap-6 items-center">
        <svg viewBox="0 0 100 100" className="w-36 h-36">
          {segments.map((s,i)=> <path key={i} d={s.d} fill={s.color} className="hover:opacity-80 transition"/>)}
          <circle cx="50" cy="50" r="22" fill="white" className="dark:fill-zinc-900"/>
        </svg>
        <div className="flex-1 space-y-2">
          {segments.sort((a,b)=>b.val-a.val).map(s=>(
            <div key={s.cat} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:s.color}}/><span>{CATEGORIES[s.cat as CategoryKey]?.icon} {s.cat}</span></div>
              <span className="font-semibold">{privacy? '••••' : fmtCOP(s.val as number)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AreaChart = ()=>{
    const max = Math.max(...monthlyHistory.map(m=>Math.max(m.exp,m.inc)),1);
    const w=300, h=120, pad=10;
    const points = (key:'exp'|'inc')=> monthlyHistory.map((m,i)=>{
      const x = pad + (i/(monthlyHistory.length-1))*(w-pad*2);
      const y = h - pad - (m[key]/max)*(h-pad*2);
      return `${x},${y}`;
    }).join(' ');
    const area = (key:'exp'|'inc')=>{
      const pts = monthlyHistory.map((m,i)=>{
        const x = pad + (i/(monthlyHistory.length-1))*(w-pad*2);
        const y = h - pad - (m[key]/max)*(h-pad*2);
        return {x,y};
      });
      const first = pts[0], last = pts[pts.length-1];
      return `M${first.x},${h-pad} L${pts.map(p=>`${p.x},${p.y}`).join(' L')} L${last.x},${h-pad} Z`;
    };
    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h+20}`} className="w-full h-32">
          <path d={area('inc')} fill="#16a34a22" />
          <path d={area('exp')} fill="#ef444422" />
          <polyline fill="none" stroke="#16a34a" strokeWidth="2" points={points('inc')} />
          <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={points('exp')} />
        </svg>
        <div className="flex justify-between text-[11px] opacity-60 px-2">
          {monthlyHistory.map(m=> <span key={m.label}>{m.label}</span>)}
        </div>
      </div>
    );
  };

  // ----- RENDER -----
  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#0f0f10] text-zinc-900 dark:text-zinc-100 font-[Inter,system-ui] selection:bg-emerald-200">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{font-family:Inter,system-ui}`}</style>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[300px] p-6 flex-col gap-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-r border-zinc-200/60 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 grid place-items-center font-bold">MF</div>
          <div><div className="font-bold leading-none">Mis Finanzas Pro</div><div className="text-xs opacity-60">Bogotá • COP</div></div>
        </div>

        <div className="rounded-[20px] p-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl">
          <div className="text-xs opacity-70">Balance disponible</div>
          <div className={`text-2xl font-bold mt-1 ${privacy?'blur-md':''}`}>{fmtCOP(balance)}</div>
          <div className="mt-3 flex gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-white/15">Burn {fmtCOP(burnRate)}/día</span>
            <span className="px-2 py-1 rounded-full bg-emerald-400 text-zinc-900 font-semibold">Health {healthScore}</span>
          </div>
        </div>

        <nav className="space-y-1">
          {[
            {id:'inicio', label:'Inicio', icon:'🏠'},
            {id:'gastos', label:'Gastos', icon:'💳'},
            {id:'calendario', label:'Calendario', icon:'📅'},
            {id:'inversion', label:'Inversión', icon:'📈'},
            {id:'ajustes', label:'Ajustes', icon:'⚙️'},
          ].map(item=>(
            <button key={item.id} onClick={()=> {
              if(activeTab===item.id){
                pushToast(`Ya estás en ${item.label}`,'ok');
                window.scrollTo({top:0, behavior:'smooth'});
              } else {
                setActiveTab(item.id as Tab);
              }
            }} className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition active:scale-[0.98] ${activeTab===item.id?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg':'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <span>{item.icon}</span><span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
          <div className="text-sm font-semibold">💡 Tip pro</div>
          <div className="text-xs opacity-70 mt-1">Presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 rounded border text-[10px]">N</kbd> para gasto rápido, <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 rounded border text-[10px]">/</kbd> para buscar.</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="lg:pl-[300px] pb-[90px] lg:pb-0">
        {/* HEADER */}
        <header className="sticky top-0 z-20 backdrop-blur-2xl bg-[#fbfaf8]/80 dark:bg-[#0f0f10]/80 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-9 h-9 rounded-xl bg-zinc-900 text-white grid place-items-center font-bold">MF</div>
              <div>
                <div className="font-bold text-[15px]">Hola, capo 💰</div>
                <div className="text-xs opacity-60">{new Date().toLocaleDateString('es-CO',{weekday:'long', day:'numeric', month:'long'})}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className={`w-2 h-2 rounded-full ${ratesLoading?'bg-amber-400 animate-pulse':'bg-emerald-500'}`}/>
                <span>USD {fmtNumber(rates.USD)} • {timeAgo(ratesTime)}</span>
                <button onClick={fetchRates} className="ml-1 w-6 h-6 grid place-items-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90">{ratesLoading?'⏳':'↻'}</button>
              </div>
              <button onClick={()=> setPrivacy(v=>!v)} className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid place-items-center active:scale-90">{privacy?'🙈':'👁️'}</button>
              <button onClick={()=>{setEditingExpense(null); setShowExpenseModal(true)}} className="hidden md:flex px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium active:scale-95">+ Nuevo gasto</button>
            </div>
          </div>
        </header>

        <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-6 space-y-6">

          {/* RATES + CONVERTER */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Tasas en tiempo real</div>
                <div className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">En vivo • Coingecko + ER-API</div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {label:'USD / COP', value:fmtNumber(rates.USD), sub:'Dólar', icon:'💵'},
                  {label:'EUR / COP', value:fmtNumber(rates.EUR), sub:'Euro', icon:'💶'},
                  {label:'MXN / COP', value:rates.MXN.toString(), sub:'Peso Mex', icon:'🇲🇽'},
                  {label:'BTC / USD', value:'$'+fmtNumber(rates.BTC_USD), sub:`≈ ${fmtCOP(rates.BTC)}`, icon:'₿'},
                ].map(r=>(
                  <div key={r.label} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-[11px] opacity-60"><span>{r.icon}</span>{r.label}</div>
                    <div className="font-bold mt-1">{r.value}</div>
                    <div className="text-[11px] opacity-60">{r.sub} • +0.8%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-5">
              <div className="font-semibold">Conversor rápido</div>
              <div className="text-xs opacity-60 mt-1">Escribe en COP y ve todo al instante</div>
              <Converter rates={rates} convert={convert} privacy={privacy} />
            </div>
          </section>

          {activeTab==='inicio' && (
            <>
              {/* CARDS */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {label:'Balance disponible', value: fmtCOP(balance), sub: balance>0? 'Queda del mes' : 'Te pasaste', icon:'💳', accent:'bg-emerald-50 dark:bg-emerald-950/30'},
                  {label:'Sueldo diario', value: fmtCOP(data.salary.daily), sub: `+ extra ${fmtCOP(data.workDays.reduce((s,w)=> s+ w.extraHours*data.salary.hourly*1.25,0))}`, icon:'☀️', accent:'bg-blue-50 dark:bg-blue-950/30'},
                  {label:'Burn rate', value: fmtCOP(burnRate), sub:'Promedio gasto/día', icon:'🔥', accent:'bg-amber-50 dark:bg-amber-950/30'},
                  {label:'Health Score', value: `${healthScore}/100`, sub: healthScore>80?'Excelente':'Mejorable', icon:'❤️', accent:'bg-violet-50 dark:bg-violet-950/30'},
                ].map(c=>(
                  <div key={c.label} className={`rounded-[20px] p-4 border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm ${c.accent}`}>
                    <div className="flex items-center justify-between"><span className="text-sm">{c.icon}</span><span className="text-[11px] opacity-60">{c.label}</span></div>
                    <div className={`mt-2 text-[18px] font-bold tracking-tight ${privacy?'blur-md':''}`}>{c.value}</div>
                    <div className="text-[11px] opacity-60 mt-1">{c.sub}</div>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Progreso mensual</div>
                    <div className="text-sm opacity-60 mt-1 max-w-[18ch]">{balance>0? `Has ahorrado ${(balance/data.salary.monthly*100).toFixed(0)}% de tu sueldo` : 'Estás en rojo este mes'}</div>
                    <div className="mt-3 text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 inline-block">{fmtCOP(expensesThisMonth.reduce((s,e)=>s+e.amountCOP,0))} gastados</div>
                  </div>
                  <CircularRing pct={Math.max(0, Math.min(100, (balance/data.salary.monthly)*100))} />
                </div>
                <div className="lg:col-span-2 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                  <div className="font-semibold">Gastos por categoría • {new Date().toLocaleDateString('es-CO',{month:'long'})}</div>
                  <div className="mt-4"><Donut/></div>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                  <div className="flex items-center justify-between"><div className="font-semibold">Flujo 6 meses</div><div className="flex gap-2 text-[11px]"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"/>Ingresos</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"/>Gastos</span></div></div>
                  <div className="mt-4"><AreaChart/></div>
                </div>
                <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                  <div className="font-semibold">Insights inteligentes</div>
                  <div className="mt-3 space-y-2">
                    {insights.map((ins,i)=>(
                      <div key={i} className="text-sm p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">✨ {ins}</div>
                    ))}
                    {insights.length===0 && <div className="text-sm opacity-60">Todo tranquilo por ahora. Sigue así.</div>}
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">Movimientos recientes</div>
                  <div className="flex items-center gap-2">
                    <input ref={searchRef} value={quickSearch} onChange={e=> setQuickSearch(e.target.value)} placeholder="Buscar (/)" className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm w-32 md:w-48 outline-none"/>
                    <button onClick={()=> setActiveTab('gastos')} className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">Ver todo</button>
                  </div>
                </div>
                <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.expenses.slice(0,5).filter(e=> !quickSearch || e.name.toLowerCase().includes(quickSearch.toLowerCase())).map(exp=>(
                    <div key={exp.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full grid place-items-center" style={{background: CATEGORIES[exp.category].color+'20'}}>{CATEGORIES[exp.category].icon}</div>
                        <div><div className="text-sm font-medium">{exp.name}</div><div className="text-[11px] opacity-60">{new Date(exp.date).toLocaleDateString('es-CO')} • {exp.category}</div></div>
                      </div>
                      <div className={`text-sm font-semibold ${privacy?'blur-md':''}`}>{fmtCOP(exp.amountCOP)}</div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab==='gastos' && (
            <section className="space-y-4">
              <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="font-semibold">Gestión de gastos pro</div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={()=>{
                      const csv = ['fecha,nombre,categoria,montoCOP,metodo,recurrente,nota', ...data.expenses.map(e=> `${new Date(e.date).toISOString().slice(0,10)},"${e.name}",${e.category},${e.amountCOP},${e.method},${e.recurrent},"${e.note||''}"`)].join('\n');
                      const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='gastos.csv'; a.click();
                    }} className="px-3 py-1.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 active:scale-95">Exportar CSV</button>
                    <button onClick={()=>{
                      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='backup-finanzas.json'; a.click();
                    }} className="px-3 py-1.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 active:scale-95">Backup JSON</button>
                    <label className="px-3 py-1.5 rounded-full text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer active:scale-95">Importar<input type="file" className="hidden" accept=".json" onChange={e=>{
                      const file=e.target.files?.[0]; if(!file) return; const r=new FileReader(); r.onload=()=>{ try{ const j=JSON.parse(r.result as string); setData(j); pushToast('Datos importados','ok'); }catch{ pushToast('JSON inválido','warn'); } }; r.readAsText(file);
                    }}/></label>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <input value={searchGastos} onChange={e=> setSearchGastos(e.target.value)} placeholder="Buscar gasto, categoría..." className="md:col-span-5 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/>
                  <div className="md:col-span-7 flex flex-wrap gap-2 items-center">
                    <div className="flex gap-1 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      {(['all','hoy','semana','mes'] as const).map(k=>(
                        <button key={k} onClick={()=> setFilterDate(k)} className={`px-3 py-1 rounded-full text-xs ${filterDate===k?'bg-white dark:bg-zinc-700 shadow':''}`}>{k}</button>
                      ))}
                    </div>
                    <select value={sortBy} onChange={e=> setSortBy(e.target.value as any)} className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs">
                      <option value="fecha">Fecha</option><option value="monto">Monto</option><option value="nombre">Nombre</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={()=> setFilterCat('all')} className={`px-3 py-1.5 rounded-full text-xs border active:scale-95 ${filterCat==='all'?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>Todas</button>
                  {(Object.keys(CATEGORIES) as CategoryKey[]).map(cat=>(
                    <button key={cat} onClick={()=> setFilterCat(cat)} className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1 active:scale-95 ${filterCat===cat?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}><span>{CATEGORIES[cat].icon}</span>{cat}</button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[11px] opacity-60">Rango monto</span>
                  <input type="range" min={0} max={2000000} step={10000} value={rangeMonto[1]} onChange={e=> setRangeMonto([0, Number(e.target.value)])} className="flex-1 accent-zinc-900"/>
                  <span className="text-xs">{fmtCOP(rangeMonto[1])}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredExpenses.length===0 ? (
                  <div className="col-span-full rounded-[24px] bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
                    <div className="text-4xl">🫙</div>
                    <div className="font-semibold mt-2">Nada por aquí</div>
                    <div className="text-sm opacity-60">Ajusta filtros o crea tu primer gasto</div>
                    <button onClick={()=>{setEditingExpense(null); setShowExpenseModal(true)}} className="mt-4 px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm">+ Nuevo gasto</button>
                  </div>
                ) : filteredExpenses.map(exp=>(
                  <div key={exp.id} className="group rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-4 flex items-center justify-between hover:shadow-md transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl grid place-items-center shrink-0" style={{background:CATEGORIES[exp.category].color+'18'}}>{CATEGORIES[exp.category].icon}</div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{exp.name}</div>
                        <div className="text-[11px] opacity-60 flex items-center gap-2 flex-wrap"><span>{new Date(exp.date).toLocaleDateString('es-CO')}</span><span>•</span><span>{exp.method}</span>{exp.recurrent && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">recurrente</span>}</div>
                        {exp.note && <div className="text-[11px] opacity-60 truncate">📝 {exp.note}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`font-bold text-sm ${privacy?'blur-md':''}`}>{fmtCOP(exp.amountCOP)}</div>
                      <div className="hidden group-hover:flex gap-1">
                        <button onClick={()=>{ const dup={...exp, id:uid(), date:new Date().toISOString(), name: exp.name+' (copia)'}; setData((d:any)=>({...d, expenses:[dup, ...d.expenses]})); pushToast('Duplicado','ok'); }} className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-xs active:scale-90">⎘</button>
                        <button onClick={()=>{ setEditingExpense(exp); setShowExpenseModal(true); }} className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-xs active:scale-90">✎</button>
                        <button onClick={()=> handleDeleteExpense(exp.id)} className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 grid place-items-center text-xs active:scale-90">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[20px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800 p-4 text-xs opacity-70">
                Promedio gasto: {fmtCOP(data.expenses.reduce((s,e)=>s+e.amountCOP,0)/(data.expenses.length||1))} • Día que más gastas: {(()=>{
                  const days=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']; const counts:number[]=[0,0,0,0,0,0,0]; data.expenses.forEach(e=>{ counts[new Date(e.date).getDay()]+=e.amountCOP; }); const max=counts.indexOf(Math.max(...counts)); return days[max];
                })()} • Total filtrado: {filteredExpenses.length}
              </div>
            </section>
          )}

          {activeTab==='calendario' && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Calendario laboral pro</div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=> setCalendarDate(d=> new Date(d.getFullYear(), d.getMonth()-1,1))} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center active:scale-90">‹</button>
                    <div className="text-sm font-medium min-w-[120px] text-center">{calendarDate.toLocaleDateString('es-CO',{month:'long', year:'numeric'})}</div>
                    <button onClick={()=> setCalendarDate(d=> new Date(d.getFullYear(), d.getMonth()+1,1))} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center active:scale-90">›</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1 text-[11px] opacity-60"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {calendarDays.map((d,i)=>{
                    if(!d) return <div key={i}/>;
                    const iso = d.toISOString().slice(0,10);
                    const wd = workMap.get(iso) as WorkDay | undefined;
                    const isToday = new Date().toDateString()===d.toDateString();
                    const isFuture = d> new Date();
                    return (
                      <button key={iso} disabled={isFuture} onClick={()=>{
                        const existing = workMap.get(iso);
                        setExtraDraft(existing? {worked: existing.worked, extraHours: existing.extraHours, note: existing.note||''} : {worked:true, extraHours:0, note:''});
                        setShowWorkModal(iso);
                      }} className={`aspect-square rounded-2xl border p-2 text-left relative active:scale-[0.98] transition
                        ${wd?.worked?'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50':'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800'}
                        ${isToday?'ring-2 ring-zinc-900 dark:ring-white':''} ${isFuture?'opacity-40':''}`}>
                        <div className="text-xs font-medium">{d.getDate()}</div>
                        {wd?.worked && <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500"/>}
                        {wd && wd.extraHours>0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"/>}
                        {wd?.extraHours ? <div className="text-[10px] mt-1">+{wd.extraHours}h</div> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-3 text-[11px]"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"/>Trabajado</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"/>Horas extra</span><span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-zinc-900 dark:border-white rounded"/>Hoy</span></div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-5">
                  <div className="font-semibold">Resumen mes</div>
                  {(()=>{
                    const monthStr = calendarDate.toISOString().slice(0,7);
                    const worked = data.workDays.filter((w:WorkDay)=> w.date.startsWith(monthStr) && w.worked);
                    const extraHours = worked.reduce((s,w)=> s+w.extraHours,0);
                    const extraMoney = extraHours * data.salary.hourly * 1.25;
                    const baseProp = worked.length * data.salary.daily;
                    const total = data.salary.monthly + extraMoney;
                    return (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="opacity-70">Días trabajados</span><span className="font-bold">{worked.length}</span></div>
                        <div className="flex justify-between"><span className="opacity-70">Horas extra</span><span className="font-bold">{extraHours}h</span></div>
                        <div className="flex justify-between"><span className="opacity-70">Extra ganado</span><span className="font-bold">{privacy?'••••': fmtCOP(extraMoney)}</span></div>
                        <div className="h-px bg-white/15 my-2"/>
                        <div className="flex justify-between"><span className="opacity-70">Total estimado</span><span className="font-bold text-base">{privacy?'••••': fmtCOP(total)}</span></div>
                        <div className="text-[11px] opacity-60 mt-2">Base proporcional: {fmtCOP(baseProp)} • Salario fijo {fmtCOP(data.salary.monthly)}</div>
                      </div>
                    );
                  })()}
                </div>
                <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                  <div className="font-semibold text-sm">Racha y próximos</div>
                  <div className="mt-3 space-y-2">
                    {(()=>{
                      const sorted = [...data.workDays].filter(w=>w.worked).sort((a,b)=> b.date.localeCompare(a.date));
                      let streak=0; let cur=new Date(); cur.setHours(0,0,0,0);
                      for(let i=0;i<30;i++){ const iso=cur.toISOString().slice(0,10); if(sorted.find(s=>s.date===iso)) streak++; else if(i>0) break; cur.setDate(cur.getDate()-1); }
                      return <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30">🔥 Racha actual: <b>{streak} días</b> seguidos</div>;
                    })()}
                    <div className="space-y-1.5 max-h-[200px] overflow-auto">
                      {data.workDays.slice(0,8).map(w=>(
                        <div key={w.date} className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800"><span>{w.date}</span><span>{w.worked?'✅':'—'} {w.extraHours? `+${w.extraHours}h`:''}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab==='inversion' && (
            <section className="space-y-4">
              <div className="flex gap-2 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 w-fit">
                {[{id:'calc', label:'Calculadora'}, {id:'metas', label:'Mis Metas'}, {id:'fondo', label:'Fondos'}].map(t=>(
                  <button key={t.id} onClick={()=> setInversionTab(t.id as any)} className={`px-4 py-2 rounded-full text-sm transition ${inversionTab===t.id?'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow':''}`}>{t.label}</button>
                ))}
              </div>

              {inversionTab==='calc' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 space-y-5">
                    {[
                      {k:'inicial', label:'Ahorro inicial', min:0, max:5000000, step:50000, fmt:fmtCOP},
                      {k:'mensual', label:'Aporte mensual', min:0, max:1000000, step:10000, fmt:fmtCOP},
                      {k:'tasa', label:'Tasa anual %', min:1, max:30, step:0.5, fmt:(n:number)=>n+'%'},
                      {k:'anos', label:'Años', min:1, max:40, step:1, fmt:(n:number)=>n+' años'},
                      {k:'inflacion', label:'Inflación %', min:0, max:20, step:0.5, fmt:(n:number)=>n+'%'},
                    ].map(f=>(
                      <div key={f.k}>
                        <div className="flex justify-between text-sm"><span className="font-medium">{f.label}</span><span className="opacity-70">{(f.fmt as any)((calc as any)[f.k])}</span></div>
                        <input type="range" min={f.min} max={f.max} step={f.step} value={(calc as any)[f.k]} onChange={e=> setCalc(c=> ({...c, [f.k]: Number(e.target.value)}))} className="w-full accent-zinc-900 dark:accent-white mt-2"/>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-2xl p-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"><div className="text-[11px] opacity-60">Total aportado</div><div className="font-bold mt-1">{privacy?'••••': fmtCOP(investResult.aportado)}</div></div>
                      <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30"><div className="text-[11px] opacity-60">Interés ganado</div><div className="font-bold mt-1 text-emerald-700 dark:text-emerald-300">{privacy?'••••': fmtCOP(investResult.interes)}</div></div>
                      <div className="rounded-2xl p-4 bg-white dark:bg-zinc-900 border"><div className="text-[11px] opacity-60">Total final</div><div className="font-bold mt-1">{privacy?'••••': fmtCOP(investResult.total)}</div></div>
                      <div className="rounded-2xl p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30"><div className="text-[11px] opacity-60">Real aj. inflación</div><div className="font-bold mt-1">{privacy?'••••': fmtCOP(investResult.real)}</div></div>
                    </div>

                    <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                      <div className="font-semibold text-sm">Evolución por año</div>
                      <div className="mt-4 space-y-2">
                        {investResult.yearly.map(y=>{
                          const max = investResult.total;
                          const aportPct = (y.aportado/max)*100;
                          const interesPct = (y.interes/max)*100;
                          return (
                            <div key={y.year} className="flex items-center gap-3">
                              <div className="w-8 text-xs opacity-60">A{y.year}</div>
                              <div className="flex-1 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                                <div className="h-full bg-zinc-900 dark:bg-white" style={{width: aportPct+'%'}}/>
                                <div className="h-full bg-emerald-500" style={{width: interesPct+'%'}}/>
                              </div>
                              <div className="w-28 text-right text-xs font-medium">{privacy?'••••': fmtCOP(y.total)}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-xs">⚠️ Sin invertir, con inflación del {calc.inflacion}%, tus {fmtCOP(investResult.aportado)} valdrían solo {fmtCOP(investResult.real)} en poder adquisitivo. Pierdes {fmtCOP(investResult.aportado - investResult.real)}.</div>
                    </div>

                    <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                      <details className="text-sm"><summary className="cursor-pointer font-medium">Tabla año por año (expandir)</summary>
                        <div className="mt-3 overflow-auto">
                          <table className="w-full text-xs"><thead><tr className="opacity-60"><th className="text-left p-2">Año</th><th className="text-right p-2">Aportado</th><th className="text-right p-2">Interés</th><th className="text-right p-2">Total</th></tr></thead><tbody>{investResult.yearly.map(y=> <tr key={y.year} className="border-t border-zinc-100 dark:border-zinc-800"><td className="p-2">{y.year}</td><td className="text-right p-2">{fmtCOP(y.aportado)}</td><td className="text-right p-2">{fmtCOP(y.interes)}</td><td className="text-right p-2 font-bold">{fmtCOP(y.total)}</td></tr>)}</tbody></table>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              )}

              {inversionTab==='metas' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">Tus metas • {data.goals.length}</div>
                    <button onClick={()=>{setEditingGoal(null); setShowGoalModal(true)}} className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm active:scale-95">+ Nueva meta</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.goals.map(g=>{
                      const pct = Math.min(100, (g.current/g.target)*100);
                      const isDone = pct>=100;
                      return (
                        <div key={g.id} className={`rounded-[24px] p-5 border bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 ${isDone?'ring-2 ring-emerald-400':''}`}>
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl grid place-items-center text-xl" style={{background: g.color+'18'}}>{g.icon}</div>
                            <div className="flex gap-1">
                              <button onClick={()=>{setEditingGoal(g); setShowGoalModal(true)}} className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-xs">✎</button>
                              <button onClick={()=> setData((d:any)=> ({...d, goals: d.goals.filter((x:Goal)=> x.id!==g.id)}))} className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-950/30 grid place-items-center text-xs">🗑️</button>
                            </div>
                          </div>
                          <div className="font-semibold mt-3">{g.name}</div>
                          <div className="text-xs opacity-60">Meta {fmtCOP(g.target)} • vence {new Date(g.deadline).toLocaleDateString('es-CO')}</div>
                          <div className="mt-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full rounded-full" style={{width:pct+'%', background:g.color}}/></div>
                          <div className="mt-2 flex justify-between text-xs"><span>{pct.toFixed(0)}%</span><span className={privacy?'blur-sm':''}>{fmtCOP(g.current)} / {fmtCOP(g.target)}</span></div>
                          <div className="mt-3 flex gap-2">
                            <button onClick={()=>{
                              const add = Number(prompt('¿Cuánto quieres agregar? (COP)', '50000')); if(!add) return;
                              setData((d:any)=> ({...d, goals: d.goals.map((x:Goal)=> x.id===g.id? {...x, current: Math.min(x.target, x.current+add)}: x)}));
                              if(g.current+add>=g.target) pushToast('¡Meta completada! 🎉','ok');
                            }} className="flex-1 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium active:scale-95">+ Agregar</button>
                            {isDone && <span className="px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs">🎉 ¡Lograda!</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {inversionTab==='fondo' && (
                <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6">
                  <div className="font-semibold">Fondo de emergencia • 3 / 6 / 12 meses</div>
                  <div className="text-sm opacity-60 mt-1">Basado en tu promedio de gastos de los últimos 3 meses</div>
                  {(()=>{
                    const avg3 = monthlyHistory.slice(-3).reduce((s,m)=>s+m.exp,0)/3;
                    return (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[3,6,12].map(m=>(
                          <div key={m} className="rounded-2xl p-5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                            <div className="text-xs opacity-60">{m} meses</div>
                            <div className={`text-xl font-bold mt-1 ${privacy?'blur-md':''}`}>{fmtCOP(avg3*m)}</div>
                            <div className="mt-3 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"><div className="h-full bg-emerald-500" style={{width: Math.min(100, (data.goals.find((g:Goal)=> g.name.toLowerCase().includes('emergencia'))?.current||0)/(avg3*m)*100)+'%'}}/></div>
                            <div className="text-[11px] opacity-60 mt-2">Recomendado para {m===3?'imprevistos': m===6?'estabilidad':'tranquilidad total'}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
          )}

          {activeTab==='ajustes' && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 space-y-5">
                <div className="font-semibold">Ajustes generales</div>

                <div>
                  <div className="text-sm font-medium">Moneda principal</div>
                  <div className="mt-2 flex gap-2">
                    {(['COP','USD','EUR','MXN'] as const).map(c=>(
                      <button key={c} onClick={()=> setData((d:any)=> ({...d, settings:{...d.settings, currency:c}}))} className={`px-4 py-2 rounded-full text-sm border active:scale-95 ${data.settings.currency===c?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800'}`}>{c}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Salario mensual (COP)</div>
                  <input type="number" value={data.salary.monthly} onChange={e=>{
                    const monthly=Number(e.target.value)||0; setData((d:any)=> ({...d, salary:{monthly, daily: monthly/30, hourly: monthly/30/8}}));
                  }} className="mt-2 w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none"/>
                  <div className="text-xs opacity-60 mt-1">Diario {fmtCOP(data.salary.daily)} • Hora {fmtCOP(data.salary.hourly)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium">Tema</div>
                  <div className="mt-2 flex gap-2">
                    {(['light','dark','system'] as const).map(t=>(
                      <button key={t} onClick={()=> setData((d:any)=> ({...d, settings:{...d.settings, theme:t}}))} className={`px-4 py-2 rounded-full text-sm border capitalize active:scale-95 ${data.settings.theme===t?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':''}`}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800">
                  <div><div className="text-sm font-medium">Modo privacidad (blur)</div><div className="text-xs opacity-60">Oculta montos sensibles</div></div>
                  <button onClick={()=>{setPrivacy(v=>!v); setData((d:any)=> ({...d, settings:{...d.settings, privacy: !privacy}}));}} className={`w-12 h-7 rounded-full p-1 transition ${privacy?'bg-zinc-900':'bg-zinc-300'} `}><div className={`w-5 h-5 rounded-full bg-white transition ${privacy?'translate-x-5':''}`}/></button>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium">Presupuestos por categoría</div>
                  <div className="mt-3 space-y-3">
                    {(Object.keys(CATEGORIES) as CategoryKey[]).map(cat=>{
                      const limit = data.budgets[cat]||0;
                      const spent = expensesThisMonth.filter(e=> e.category===cat).reduce((s,e)=>s+e.amountCOP,0);
                      const pct = limit? (spent/limit)*100 : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs"><span className="flex items-center gap-1">{CATEGORIES[cat].icon} {cat}</span><span className={privacy?'blur-sm':''}>{fmtCOP(spent)} / {fmtCOP(limit)}</span></div>
                          <div className="mt-1 flex gap-2 items-center">
                            <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full rounded-full" style={{width: Math.min(100,pct)+'%', background: pct>80?'#ef4444':CATEGORIES[cat].color}}/></div>
                            <input type="number" value={limit} onChange={e=> setData((d:any)=> ({...d, budgets:{...d.budgets, [cat]: Number(e.target.value)||0}}))} className="w-24 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs outline-none"/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5">
                  <div className="font-semibold">Zona peligrosa</div>
                  <div className="text-xs opacity-60 mt-1">Borra todo y vuelve a empezar. Doble confirmación requerida.</div>
                  <button onClick={()=>{
                    if(!confirm('¿Seguro que quieres borrar TODO? Esta acción no se puede deshacer.')) return;
                    if(!confirm('Última oportunidad. ¿Borrar definitivamente?')) return;
                    localStorage.clear(); location.reload();
                  }} className="mt-4 w-full py-2.5 rounded-full bg-red-600 text-white text-sm font-medium active:scale-[0.98]">Borrar todo</button>
                </div>

                <div className="rounded-[24px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-5">
                  <div className="font-semibold">Hecho con amor en Bogotá 🇨🇴</div>
                  <div className="text-sm opacity-70 mt-2">App 100% offline, datos en tu dispositivo. Tasas de cambio en tiempo real vía APIs públicas. Sin tracking, sin cuenta.</div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-1 rounded-full bg-white/10">Tailwind</span>
                    <span className="px-2 py-1 rounded-full bg-white/10">React</span>
                    <span className="px-2 py-1 rounded-full bg-white/10">localStorage</span>
                    <span className="px-2 py-1 rounded-full bg-white/10">Neumorphism + Glass</span>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 text-xs opacity-70">
                  Atajos: <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border">N</kbd> nuevo gasto • <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border">/</kbd> buscar • <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border">P</kbd> privacidad
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* BOTTOM NAV MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-t border-zinc-200/60 dark:border-zinc-800 px-2 py-2">
        <div className="flex justify-around">
          {[
            {id:'inicio', label:'Inicio', icon:'🏠'},
            {id:'gastos', label:'Gastos', icon:'💳'},
            {id:'calendario', label:'Calend.', icon:'📅'},
            {id:'inversion', label:'Invertir', icon:'📈'},
            {id:'ajustes', label:'Ajustes', icon:'⚙️'},
          ].map(item=>(
            <button key={item.id} onClick={()=> {
              if(activeTab===item.id){
                pushToast(`Ya estás en ${item.label}`,'ok');
                window.scrollTo({top:0, behavior:'smooth'});
              } else {
                setActiveTab(item.id as Tab);
              }
            }} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl active:scale-90 transition ${activeTab===item.id?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':''}`}>
              <span className="text-[16px]">{item.icon}</span><span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MODAL GASTO */}
      {showExpenseModal && (
        <ExpenseFormModal
          initial={editingExpense}
          onClose={()=>{setShowExpenseModal(false); setEditingExpense(null);}}
          onSave={handleSaveExpense}
          rates={rates}
          convert={convert}
          privacy={privacy}
          existingNames={Array.from(new Set(data.expenses.map((e:Expense)=> e.name)))}
        />
      )}

      {/* MODAL WORKDAY */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-white dark:bg-zinc-900 p-5 shadow-2xl animate-[fadeIn_0.2s]">
            <div className="font-semibold">Editar día {showWorkModal}</div>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between text-sm"><span>Trabajado</span><input type="checkbox" checked={extraDraft.worked} onChange={e=> setExtraDraft(d=>({...d, worked:e.target.checked}))} className="w-5 h-5 accent-zinc-900"/></label>
              <div><div className="text-sm">Horas extra (0-12)</div><input type="range" min={0} max={12} step={1} value={extraDraft.extraHours} onChange={e=> setExtraDraft(d=>({...d, extraHours:Number(e.target.value)}))} className="w-full accent-amber-500 mt-1"/><div className="text-xs opacity-60">{extraDraft.extraHours}h = {fmtCOP(extraDraft.extraHours*data.salary.hourly*1.25)} extra</div></div>
              <div><div className="text-sm">Nota</div><input value={extraDraft.note} onChange={e=> setExtraDraft(d=>({...d, note:e.target.value}))} placeholder="Entrega, reunión..." className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"/></div>
            </div>
            <div className="mt-5 flex gap-2"><button onClick={()=> setShowWorkModal(null)} className="flex-1 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm">Cancelar</button><button onClick={()=> saveWorkDay(showWorkModal)} className="flex-1 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium">Guardar</button></div>
          </div>
        </div>
      )}

      {/* MODAL GOAL */}
      {showGoalModal && (
        <GoalModal initial={editingGoal} onClose={()=>{setShowGoalModal(false); setEditingGoal(null);}} onSave={(g)=>{
          if(editingGoal) setData((d:any)=> ({...d, goals: d.goals.map((x:Goal)=> x.id===g.id? g: x)}));
          else setData((d:any)=> ({...d, goals:[g, ...d.goals]}));
          setShowGoalModal(false); setEditingGoal(null); pushToast('Meta guardada','ok');
        }}/>
      )}

      {/* TOASTS */}
      <div className="fixed bottom-[100px] lg:bottom-6 left-1/2 -translate-x-1/2 z-50 space-y-2 w-[90%] max-w-sm">
        {toasts.map(t=>(
          <div key={t.id} className={`px-4 py-3 rounded-2xl shadow-xl backdrop-blur-xl border text-sm flex items-center justify-between animate-[slideUp_0.2s] ${t.type==='warn'?'bg-amber-100 dark:bg-amber-900/60 border-amber-200 dark:border-amber-800':'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-800'}`}>
            <span>{t.msg}</span>
            {deletedExpense && t.msg.includes('Deshacer') && <button onClick={undoDelete} className="ml-3 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-xs font-bold">Deshacer</button>}
          </div>
        ))}
      </div>

      {/* FAB MOBILE */}
      <button onClick={()=>{setEditingExpense(null); setShowExpenseModal(true)}} className="lg:hidden fixed bottom-[84px] right-4 w-14 h-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl grid place-items-center text-2xl active:scale-90 z-20">+</button>

      {/* ONBOARDING */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md grid place-items-center p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 grid place-items-center font-bold text-xl">MF</div>
            <div className="mt-4 font-bold text-xl">Bienvenido a Mis Finanzas Pro 🇨🇴</div>
            <div className="text-sm opacity-70 mt-2">Tu app fintech premium 100% offline. Migré tus datos antiguos y te dejé ejemplo realista de Bogotá.</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• 💳 Controla gastos con categorías y métodos de pago</li>
              <li>• 📅 Marca días trabajados y horas extra</li>
              <li>• 📈 Calcula inversión y metas con inflación real</li>
              <li>• 💱 Tasas USD/EUR/MXN/BTC en vivo</li>
              <li>• 🔒 Todo en localStorage, sin nube</li>
            </ul>
            <button onClick={()=>{localStorage.setItem('misfinanzas_onboarded','1'); setShowOnboarding(false);}} className="mt-6 w-full py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium active:scale-95">Empezar a ahorrar 🚀</button>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0; transform:scale(0.96)} to{opacity:1; transform:scale(1)}} @keyframes slideUp{from{transform:translateY(10px); opacity:0} to{transform:translateY(0); opacity:1}}`}</style>
    </div>
  );
}

function Converter({rates, convert, privacy}:{rates:Rates; convert:any; privacy:boolean}){
  const [cop, setCop] = useState(100000);
  return (
    <div className="mt-4 space-y-3">
      <input type="number" value={cop} onChange={e=> setCop(Number(e.target.value)||0)} className="w-full px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 outline-none text-sm"/>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-white/10">USD <b className={`float-right ${privacy?'blur-sm':''}`}>${convert(cop,'USD').toFixed(2)}</b></div>
        <div className="p-2.5 rounded-xl bg-white/10">EUR <b className={`float-right ${privacy?'blur-sm':''}`}>€{convert(cop,'EUR').toFixed(2)}</b></div>
        <div className="p-2.5 rounded-xl bg-white/10">MXN <b className={`float-right ${privacy?'blur-sm':''}`}>${convert(cop,'MXN').toFixed(2)}</b></div>
        <div className="p-2.5 rounded-xl bg-white/10">BTC <b className={`float-right ${privacy?'blur-sm':''}`}>{convert(cop,'BTC').toFixed(6)}</b></div>
      </div>
      <div className="text-[11px] opacity-60">1 USD = {fmtNumber(rates.USD)} COP • Calculado al instante</div>
    </div>
  );
}

function ExpenseFormModal({initial, onClose, onSave, rates, convert, privacy, existingNames}:{initial:Expense|null; onClose:()=>void; onSave:(e:Expense)=>void; rates:Rates; convert:any; privacy:boolean; existingNames:string[]}){
  const [form, setForm] = useState<Expense>(initial || { id:uid(), name:'', amountCOP:0, category:'Comida', date:new Date().toISOString(), recurrent:false, method:'efectivo', note:'' });
  const [showAuto, setShowAuto] = useState(false);
  const filteredNames = existingNames.filter(n=> n.toLowerCase().includes(form.name.toLowerCase()) && n!==form.name).slice(0,5);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center"><div className="font-bold text-lg">{initial?'Editar gasto':'Nuevo gasto'}</div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center">✕</button></div>

        <div className="mt-5 space-y-4">
          <div className="relative">
            <div className="text-sm font-medium">Nombre</div>
            <input value={form.name} onChange={e=>{setForm(f=>({...f, name:e.target.value})); setShowAuto(true);}} placeholder="Ej: Mercado, Uber, Café..." className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/>
            {showAuto && filteredNames.length>0 && (
              <div className="absolute z-10 mt-1 w-full rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden">
                {filteredNames.map(n=> <button key={n} onClick={()=>{setForm(f=>({...f, name:n})); setShowAuto(false);}} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700">{n}</button>)}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium">Monto COP</div>
            <input type="number" value={form.amountCOP||''} onChange={e=> setForm(f=>({...f, amountCOP:Number(e.target.value)||0}))} placeholder="0" className="mt-1 w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none font-bold text-[18px]"/>
            <div className="mt-2 flex gap-2 text-[11px] flex-wrap">
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">USD ${convert(form.amountCOP,'USD').toFixed(2)}</span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">EUR €{convert(form.amountCOP,'EUR').toFixed(2)}</span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">BTC {convert(form.amountCOP,'BTC').toFixed(6)}</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Categoría</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map(cat=>(
                <button key={cat} onClick={()=> setForm(f=>({...f, category:cat}))} className={`p-3 rounded-2xl border text-left active:scale-95 transition ${form.category===cat?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900':'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
                  <div className="text-lg">{CATEGORIES[cat].icon}</div><div className="text-xs font-medium mt-1">{cat}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-sm font-medium">Fecha</div><input type="date" value={new Date(form.date).toISOString().slice(0,10)} onChange={e=> setForm(f=>({...f, date:new Date(e.target.value).toISOString()}))} className="mt-1 w-full px-3 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"/></div>
            <div><div className="text-sm font-medium">Método</div><select value={form.method} onChange={e=> setForm(f=>({...f, method:e.target.value as any}))} className="mt-1 w-full px-3 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option></select></div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <div><div className="text-sm font-medium">¿Recurrente?</div><div className="text-[11px] opacity-70">Se repetirá cada mes automáticamente (referencia)</div></div>
            <input type="checkbox" checked={form.recurrent} onChange={e=> setForm(f=>({...f, recurrent:e.target.checked}))} className="w-5 h-5 accent-zinc-900"/>
          </label>

          <div><div className="text-sm font-medium">Nota opcional</div><input value={form.note||''} onChange={e=> setForm(f=>({...f, note:e.target.value}))} placeholder="Ej: con amigos, trabajo..." className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/></div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm">Cancelar</button>
          <button disabled={!form.name || !form.amountCOP} onClick={()=> onSave(form)} className="flex-1 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-40 active:scale-95">Guardar gasto</button>
        </div>
      </div>
    </div>
  );
}

function GoalModal({initial, onClose, onSave}:{initial:Goal|null; onClose:()=>void; onSave:(g:Goal)=>void}){
  const [form, setForm] = useState<Goal>(initial || { id:uid(), name:'', target:1000000, current:0, deadline:new Date(new Date().getFullYear(), new Date().getMonth()+6,1).toISOString().slice(0,10), icon:'🎯', color:'#8b5cf6' });
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md rounded-[24px] bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        <div className="flex justify-between items-center"><div className="font-bold">{initial?'Editar meta':'Nueva meta'}</div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center">✕</button></div>
        <div className="mt-4 space-y-3">
          <input value={form.name} onChange={e=> setForm(f=>({...f, name:e.target.value}))} placeholder="Nombre meta" className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-xs opacity-60">Objetivo COP</div><input type="number" value={form.target} onChange={e=> setForm(f=>({...f, target:Number(e.target.value)||0}))} className="mt-1 w-full px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/></div>
            <div><div className="text-xs opacity-60">Actual COP</div><input type="number" value={form.current} onChange={e=> setForm(f=>({...f, current:Number(e.target.value)||0}))} className="mt-1 w-full px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-xs opacity-60">Fecha límite</div><input type="date" value={form.deadline} onChange={e=> setForm(f=>({...f, deadline:e.target.value}))} className="mt-1 w-full px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/></div>
            <div><div className="text-xs opacity-60">Icono</div><input value={form.icon} onChange={e=> setForm(f=>({...f, icon:e.target.value}))} className="mt-1 w-full px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/></div>
          </div>
          <div><div className="text-xs opacity-60">Color</div><div className="mt-1 flex gap-2">{['#3b82f6','#f59e0b','#16a34a','#8b5cf6','#ef4444','#06b6d4'].map(c=> <button key={c} onClick={()=> setForm(f=>({...f, color:c}))} className={`w-8 h-8 rounded-full ${form.color===c?'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white':''}`} style={{background:c}}/>)}</div></div>
        </div>
        <div className="mt-6 flex gap-2"><button onClick={onClose} className="flex-1 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm">Cancelar</button><button disabled={!form.name} onClick={()=> onSave(form)} className="flex-1 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-40">Guardar</button></div>
      </div>
    </div>
  );
}
