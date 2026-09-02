import { useEffect, useState } from 'react'
import { GROUPS, TOOLS, toolOf, type Tool } from '../lib/tools'
import { Signal } from './Icons'
import { useSettings } from '../store'
import { Discount, Loan, Percent, SalesTax, Savings, Tip, UnitPrice } from './tools/Money'
import { DateTool, GradeAverage, Hex, WorldTime } from './tools/Everyday'
import { FuelCost, FuelEfficiency } from './tools/Vehicle'
import { BodyMetrics, Ovulation } from './tools/Health'
import { Currency } from './tools/Currency'

const SCREENS: Record<string, () => React.ReactElement> = {
  discount: Discount,
  salestax: SalesTax,
  tip: Tip,
  unitprice: UnitPrice,
  percent: Percent,
  loan: Loan,
  savings: Savings,
  currency: Currency,
  date: DateTool,
  worldtime: WorldTime,
  hex: Hex,
  grade: GradeAverage,
  fuelcost: FuelCost,
  fuelefficiency: FuelEfficiency,
  body: BodyMetrics,
  ovulation: Ovulation,
}

function Back() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Whether this device thinks it has a connection.
 *
 * Only ever used to decorate the one card that needs one. It is a hint and not
 * a promise: a browser can report itself online while sitting on a hotel
 * network that answers nothing, which is exactly why the currency screen
 * still has to handle a failed request rather than trusting this.
 */
function useOnline(): boolean {
  const [online, setOnline] = useState(() => {
    try {
      return navigator.onLine !== false
    } catch {
      return true
    }
  })
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}

export function Tools() {
  const { settings, set } = useSettings()
  const online = useOnline()
  const open = settings.tool ? toolOf(settings.tool) : undefined

  if (open) {
    const Screen = SCREENS[open.id]
    return (
      <div className="tools">
        <div className="tool-head">
          <button className="chip" aria-label="Back to the tools" onClick={() => set({ tool: '' })}>
            <Back />
          </button>
          <div className="tool-title">
            <h2>{open.name}</h2>
            <span>{open.hint}</span>
          </div>
          {/* No signal mark up here on purpose. The screen below knows whether
              the service actually answered, which the device's own idea of
              being online does not: a hotel network reports itself connected
              and answers nothing. Two marks that can disagree are worse than
              the one that is right. */}
        </div>
        <div className="tool-body">{Screen ? <Screen /> : null}</div>
      </div>
    )
  }

  return (
    <div className="tools">
      <div className="tool-grid">
        {GROUPS.map((group) => (
          <section key={group.id}>
            <h2 className="group-name">{group.name}</h2>
            <div className="cards">
              {TOOLS.filter((tool) => tool.group === group.id).map((tool) => (
                <ToolCard key={tool.id} tool={tool} online={online} onOpen={() => set({ tool: tool.id })} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function ToolCard({ tool, online, onOpen }: { tool: Tool; online: boolean; onOpen: () => void }) {
  return (
    <button className="card" onClick={onOpen} data-offline={tool.needsNetwork && !online}>
      <span className="card-name">
        {tool.name}
        {/* The only card that carries a mark, because it is the only one that
            stops working without a signal. Crossed through when there is none,
            so the reason a tap will disappoint is visible before the tap. */}
        {tool.needsNetwork ? (
          <span className="card-signal" data-on={online} aria-label={online ? 'Needs a connection' : 'Needs a connection, and there is none'}>
            <Signal on={online} />
          </span>
        ) : null}
      </span>
      <span className="card-hint">{tool.needsNetwork && !online ? 'No connection' : tool.hint}</span>
    </button>
  )
}
