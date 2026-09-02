import { useState } from 'react'
import { Field, Readout, Segment, Tool } from '../Form'
import { fuelCost, fuelEfficiency, type FuelUnits } from '../../lib/tools'

const UNITS: { id: FuelUnits; name: string }[] = [
  { id: 'us', name: 'Miles and gallons' },
  { id: 'metric', name: 'Kilometres and litres' },
]

function show(value: number, places = 2): string {
  if (!Number.isFinite(value)) return ''
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: places }).format(value)
}

export function FuelCost() {
  const [units, setUnits] = useState<FuelUnits>('us')
  const [distance, setDistance] = useState('')
  const [efficiency, setEfficiency] = useState(units === 'us' ? '25' : '8')
  const [price, setPrice] = useState('')
  const us = units === 'us'
  const result = fuelCost(Number(distance), Number(efficiency), Number(price), units)
  const ready = Number(distance) > 0 && Number(efficiency) > 0

  return (
    <Tool>
      <Segment
        value={units}
        onChange={(next) => {
          setUnits(next)
          // The number means the opposite thing in the other system, so
          // carrying it across would be worse than starting again.
          setEfficiency(next === 'us' ? '25' : '8')
        }}
        options={UNITS}
      />
      <Field label="Distance" suffix={us ? 'mi' : 'km'} value={distance} onChange={setDistance} />
      <Field
        label="The vehicle does"
        suffix={us ? 'mpg' : 'L/100km'}
        value={efficiency}
        onChange={setEfficiency}
      />
      <Field label="Fuel price" prefix="$" suffix={us ? '/gal' : '/L'} value={price} onChange={setPrice} />
      <Readout
        rows={[
          { label: 'The trip costs', value: ready && price ? `$${show(result.cost)}` : '', lead: true },
          { label: 'Fuel used', value: ready ? `${show(result.fuel)} ${us ? 'gal' : 'L'}` : '' },
        ]}
      />
    </Tool>
  )
}

export function FuelEfficiency() {
  const [units, setUnits] = useState<FuelUnits>('us')
  const [distance, setDistance] = useState('')
  const [fuel, setFuel] = useState('')
  const us = units === 'us'
  const result = fuelEfficiency(Number(distance), Number(fuel), units)
  const ready = Number(distance) > 0 && Number(fuel) > 0

  return (
    <Tool note="One trip and one fill, said every way it is usually said. The three figures are worked out from the same pair, so they cannot disagree with each other.">
      <Segment value={units} onChange={setUnits} options={UNITS} />
      <Field label="Distance driven" suffix={us ? 'mi' : 'km'} value={distance} onChange={setDistance} />
      <Field label="Fuel used" suffix={us ? 'gal' : 'L'} value={fuel} onChange={setFuel} />
      <Readout
        rows={[
          { label: 'Miles per gallon', value: ready ? show(result.mpg) : '', lead: us },
          { label: 'Litres per 100 km', value: ready ? show(result.l100km) : '', lead: !us },
          { label: 'Kilometres per litre', value: ready ? show(result.kml) : '' },
        ]}
      />
    </Tool>
  )
}
