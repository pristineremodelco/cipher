import { useState } from 'react'
import { Field, Readout, Segment, Tool } from '../Form'
import { discount, loan, percentChange, percentIs, percentOf, salesTax, savings, tip, unitPrice } from '../../lib/tools'
import { useSettings } from '../../store'

/** Money to two places, always, because money has two places. */
function money(value: number, grouping: boolean): string {
  if (!Number.isFinite(value)) return ''
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: grouping,
  }).format(value)
}

function plain(value: number, places: number, grouping: boolean): string {
  if (!Number.isFinite(value)) return ''
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: places,
    useGrouping: grouping,
  }).format(value)
}

function useMoney() {
  const { settings } = useSettings()
  return {
    money: (value: number) => money(value, settings.grouping),
    plain: (value: number, places = 2) => plain(value, places, settings.grouping),
  }
}

export function Discount() {
  const [price, setPrice] = useState('')
  const [percent, setPercent] = useState('20')
  const { money } = useMoney()
  const result = discount(Number(price), Number(percent))
  return (
    <Tool>
      <Field label="Price" prefix="$" value={price} onChange={setPrice} placeholder="0.00" />
      <Field label="Off" suffix="%" value={percent} onChange={setPercent} />
      <Readout
        rows={[
          { label: 'You pay', value: price ? `$${money(result.pay)}` : '', lead: true },
          { label: 'You save', value: price ? `$${money(result.saved)}` : '' },
        ]}
      />
    </Tool>
  )
}

export function SalesTax() {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('8.25')
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const { money } = useMoney()
  const result = salesTax(Number(amount), Number(rate), mode === 'remove')
  return (
    <Tool
      note={
        mode === 'remove'
          ? 'Taking the rate off the total is not the same calculation as adding it on, because the tax was a percentage of the smaller number. This does the right one.'
          : undefined
      }
    >
      <Segment
        value={mode}
        onChange={setMode}
        options={[
          { id: 'add', name: 'Add tax on' },
          { id: 'remove', name: 'Take it back off' },
        ]}
      />
      <Field
        label={mode === 'add' ? 'Price before tax' : 'Total paid'}
        prefix="$"
        value={amount}
        onChange={setAmount}
        placeholder="0.00"
      />
      <Field label="Rate" suffix="%" value={rate} onChange={setRate} />
      <Readout
        rows={[
          {
            label: mode === 'add' ? 'Total' : 'Price before tax',
            value: amount ? `$${money(mode === 'add' ? result.total : result.before)}` : '',
            lead: true,
          },
          { label: 'Tax', value: amount ? `$${money(result.tax)}` : '' },
        ]}
      />
    </Tool>
  )
}

export function Tip() {
  const [bill, setBill] = useState('')
  const [percent, setPercent] = useState('20')
  const [people, setPeople] = useState('1')
  const { money } = useMoney()
  const heads = Math.max(1, Math.floor(Number(people)) || 1)
  const result = tip(Number(bill), Number(percent), heads)
  return (
    <Tool>
      <Field label="Bill" prefix="$" value={bill} onChange={setBill} placeholder="0.00" />
      <Segment
        label="Tip"
        value={percent}
        onChange={setPercent}
        options={[
          { id: '15', name: '15%' },
          { id: '18', name: '18%' },
          { id: '20', name: '20%' },
          { id: '25', name: '25%' },
        ]}
      />
      <Field label="Or type one" suffix="%" value={percent} onChange={setPercent} />
      <Field label="Split between" suffix={heads === 1 ? 'person' : 'people'} value={people} onChange={setPeople} />
      <Readout
        rows={[
          { label: 'Total', value: bill ? `$${money(result.total)}` : '', lead: true },
          { label: 'Tip', value: bill ? `$${money(result.tip)}` : '' },
          ...(heads > 1
            ? [{ label: `Each of ${heads}`, value: bill ? `$${money(result.each)}` : '' }]
            : []),
        ]}
      />
    </Tool>
  )
}

export function UnitPrice() {
  const [aPrice, setAPrice] = useState('')
  const [aSize, setASize] = useState('')
  const [bPrice, setBPrice] = useState('')
  const [bSize, setBSize] = useState('')
  const [unit, setUnit] = useState('oz')
  const { plain } = useMoney()

  const a = unitPrice(Number(aPrice), Number(aSize))
  const b = unitPrice(Number(bPrice), Number(bSize))
  const both = Number.isFinite(a) && Number.isFinite(b)
  const cheaper = !both ? '' : a === b ? 'The same' : a < b ? 'The first one' : 'The second one'
  const gap = both && a !== b ? Math.abs(a - b) / Math.max(a, b) : NaN

  return (
    <Tool>
      <Field label="Unit" value={unit} onChange={setUnit} hint="Whatever is on the label: oz, lb, sq ft, each" />
      <div className="tool-pair">
        <Field label="First price" prefix="$" value={aPrice} onChange={setAPrice} placeholder="0.00" />
        <Field label="Size" suffix={unit} value={aSize} onChange={setASize} />
      </div>
      <div className="tool-pair">
        <Field label="Second price" prefix="$" value={bPrice} onChange={setBPrice} placeholder="0.00" />
        <Field label="Size" suffix={unit} value={bSize} onChange={setBSize} />
      </div>
      <Readout
        rows={[
          { label: 'Cheaper', value: cheaper, lead: true, note: Number.isFinite(gap) ? `by ${plain(gap * 100, 1)}%` : undefined },
          { label: 'First', value: Number.isFinite(a) ? `$${plain(a, 4)} / ${unit}` : '' },
          { label: 'Second', value: Number.isFinite(b) ? `$${plain(b, 4)} / ${unit}` : '' },
        ]}
      />
    </Tool>
  )
}

export function Percent() {
  const [mode, setMode] = useState<'of' | 'is' | 'change'>('of')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const { plain } = useMoney()
  const x = Number(a)
  const y = Number(b)
  const filled = a !== '' && b !== ''

  const answer =
    mode === 'of' ? percentOf(x, y) : mode === 'is' ? percentIs(x, y) : percentChange(x, y)
  const label =
    mode === 'of' ? `${a || '?'}% of ${b || '?'}` : mode === 'is' ? `${a || '?'} as a percent of ${b || '?'}` : `From ${a || '?'} to ${b || '?'}`
  const value = !filled || !Number.isFinite(answer)
    ? ''
    : mode === 'of'
      ? plain(answer, 6)
      : `${plain(answer, 4)}%`

  return (
    <Tool>
      <Segment
        value={mode}
        onChange={setMode}
        options={[
          { id: 'of', name: 'X% of Y' },
          { id: 'is', name: 'X is ?% of Y' },
          { id: 'change', name: 'X to Y' },
        ]}
      />
      <Field label={mode === 'of' ? 'Percent' : mode === 'is' ? 'The part' : 'From'} suffix={mode === 'of' ? '%' : undefined} value={a} onChange={setA} />
      <Field label={mode === 'of' ? 'Of' : mode === 'is' ? 'The whole' : 'To'} value={b} onChange={setB} />
      <Readout
        rows={[{ label, value, lead: true }]}
        note={mode === 'change' && Number.isFinite(answer) && filled ? (answer >= 0 ? 'An increase.' : 'A decrease.') : undefined}
      />
    </Tool>
  )
}

export function Loan() {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('6.5')
  const [years, setYears] = useState('30')
  const { money, plain } = useMoney()
  const result = loan(Number(amount), Number(rate), Number(years))
  const ready = Number(amount) > 0 && Number(years) > 0
  return (
    <Tool note="A level payment loan, compounded monthly. No fees, insurance or escrow, so a lender's figure will be higher.">
      <Field label="Amount borrowed" prefix="$" value={amount} onChange={setAmount} placeholder="0.00" />
      <div className="tool-pair">
        <Field label="Interest" suffix="%/yr" value={rate} onChange={setRate} />
        <Field label="Over" suffix="years" value={years} onChange={setYears} />
      </div>
      <Readout
        rows={[
          { label: 'Every month', value: ready ? `$${money(result.payment)}` : '', lead: true },
          { label: 'Total interest', value: ready ? `$${money(result.interest)}` : '' },
          { label: 'Paid in the end', value: ready ? `$${money(result.total)}` : '' },
          { label: 'Payments', value: ready ? plain(result.months, 0) : '' },
        ]}
      />
    </Tool>
  )
}

export function Savings() {
  const [start, setStart] = useState('')
  const [monthly, setMonthly] = useState('')
  const [rate, setRate] = useState('4')
  const [years, setYears] = useState('10')
  const { money } = useMoney()
  const result = savings(Number(start) || 0, Number(monthly) || 0, Number(rate), Number(years))
  const ready = Number(years) > 0 && (Number(start) > 0 || Number(monthly) > 0)
  return (
    <Tool note="Compounded monthly, paid in at each month's end. No tax, no inflation.">
      <Field label="Starting with" prefix="$" value={start} onChange={setStart} placeholder="0.00" />
      <Field label="Adding each month" prefix="$" value={monthly} onChange={setMonthly} placeholder="0.00" />
      <div className="tool-pair">
        <Field label="Return" suffix="%/yr" value={rate} onChange={setRate} />
        <Field label="For" suffix="years" value={years} onChange={setYears} />
      </div>
      <Readout
        rows={[
          { label: 'Ends up as', value: ready ? `$${money(result.total)}` : '', lead: true },
          { label: 'Of which you put in', value: ready ? `$${money(result.paidIn)}` : '' },
          { label: 'And interest added', value: ready ? `$${money(result.interest)}` : '' },
        ]}
      />
    </Tool>
  )
}
