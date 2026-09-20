import { useCallback, useEffect, useState } from 'react'
import { Field, Readout, Tool } from '../Form'
import { ageOf, convertMoney, currencyName, fetchRates, loadRates, type Rates } from '../../lib/rates'
import { Signal } from '../Icons'
import { useSettings } from '../../store'

type State = 'idle' | 'asking' | 'fresh' | 'stale' | 'nothing'

export function Currency() {
  const { settings, set } = useSettings()
  const [rates, setRates] = useState<Rates | null>(loadRates)
  /**
   * It asks the moment it opens, so 'asking' is where it starts rather than
   * something the mount effect has to set: a state the first render already
   * knows about does not need a second render to arrive at.
   */
  const [state, setState] = useState<State>('asking')
  const [amount, setAmount] = useState('100')
  const [trouble, setTrouble] = useState('')

  const refresh = useCallback(async (announce = true) => {
    // Both of these are already where they need to be on the first run, so
    // nothing is set until there is something to say.
    if (announce) {
      setState('asking')
      setTrouble('')
    }
    try {
      const next = await fetchRates()
      setRates(next)
      setState('fresh')
    } catch (error) {
      // Whatever went wrong, the answer for the person holding the phone is
      // the same: these are the rates from last time, and here is how old.
      setTrouble(error instanceof Error && error.name === 'AbortError' ? 'The rate service did not answer.' : 'Could not reach the rate service.')
      setState(loadRates() ? 'stale' : 'nothing')
    }
  }, [])

  useEffect(() => {
    void refresh(false)
  }, [refresh])

  const codes = rates ? Object.keys(rates.rates).sort() : []
  const from = codes.includes(settings.currencyFrom) ? settings.currencyFrom : codes[0] ?? 'USD'
  const to = codes.includes(settings.currencyTo) ? settings.currencyTo : codes[1] ?? 'EUR'
  const value = Number(amount)
  const converted = rates ? convertMoney(value, from, to, rates) : NaN
  const one = rates ? convertMoney(1, from, to, rates) : NaN

  const money = (n: number) =>
    Number.isFinite(n)
      ? new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: settings.grouping,
        }).format(n)
      : ''

  if (!rates) {
    return (
      <Tool>
        <div className="offline">
          <Signal on={false} />
          <strong>{state === 'asking' ? 'Asking for rates' : 'No rates yet'}</strong>
          <p>
            {state === 'asking'
              ? 'One moment.'
              : 'This is the one screen here that needs a signal. Everything else in the app works with the aeroplane mode on; an exchange rate is a live number and there is nothing honest to show without one.'}
          </p>
          {state !== 'asking' ? (
            <button className="ghost" onClick={() => void refresh()}>
              Try again
            </button>
          ) : null}
        </div>
      </Tool>
    )
  }

  return (
    <Tool>
      <div className="rates-bar" data-state={state}>
        <Signal on={state === 'fresh'} />
        <span className="rates-when">
          {state === 'asking'
            ? 'Asking for rates'
            : state === 'fresh'
              ? `Rates for ${rates.date}, just fetched`
              : `Rates for ${rates.date}, fetched ${ageOf(rates)}`}
        </span>
        <button className="ghost tiny" disabled={state === 'asking'} onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
      {trouble ? <p className="tool-note">{trouble} Showing what was last fetched.</p> : null}

      <Field label="Amount" value={amount} onChange={setAmount} />
      <div className="tool-pair">
        <label className="tool-field">
          <span className="tool-label">From</span>
          <span className="tool-input">
            <select value={from} onChange={(e) => set({ currencyFrom: e.target.value })}>
              {codes.map((code) => (
                <option key={code} value={code}>
                  {code} {currencyName(code) === code ? '' : `· ${currencyName(code)}`}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="tool-field">
          <span className="tool-label">To</span>
          <span className="tool-input">
            <select value={to} onChange={(e) => set({ currencyTo: e.target.value })}>
              {codes.map((code) => (
                <option key={code} value={code}>
                  {code} {currencyName(code) === code ? '' : `· ${currencyName(code)}`}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>
      <Readout
        rows={[
          { label: currencyName(to), value: amount ? `${money(converted)} ${to}` : '', lead: true },
          { label: `One ${from}`, value: `${money(one)} ${to}` },
        ]}
        note="European Central Bank reference rates, published once a working day. Not what a bank or card will give you."
      />
    </Tool>
  )
}
