import { useState } from 'react'
import { Choice, DateField, Field, Readout, Segment, Tool } from '../Form'
import { ACTIVITY, bmi, bmiBand, bmr, ovulation, type BodyUnits, type Sex } from '../../lib/tools'

function show(value: number, places = 1): string {
  if (!Number.isFinite(value)) return ''
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: places }).format(value)
}

function toInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
function fromInput(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const [y, m, d] = text.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}
function longDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function BodyMetrics() {
  const [units, setUnits] = useState<BodyUnits>('us')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [activity, setActivity] = useState(ACTIVITY[1].id)

  const us = units === 'us'
  const index = bmi(Number(weight), Number(height), units)
  const rest = bmr(Number(weight), Number(height), Number(age), sex, units)
  const factor = ACTIVITY.find((item) => item.id === activity)?.factor ?? 1.375

  return (
    <Tool note="BMI is a rough screen and says nothing about how much of the weight is muscle. Daily energy uses Mifflin St Jeor, which is an estimate for an average body and not a prescription.">
      <Segment
        value={units}
        onChange={(next) => {
          setUnits(next)
          setWeight('')
          setHeight('')
        }}
        options={[
          { id: 'us' as const, name: 'Pounds and inches' },
          { id: 'metric' as const, name: 'Kilograms and centimetres' },
        ]}
      />
      <div className="tool-pair">
        <Field label="Weight" suffix={us ? 'lb' : 'kg'} value={weight} onChange={setWeight} />
        <Field label="Height" suffix={us ? 'in' : 'cm'} value={height} onChange={setHeight} />
      </div>
      <div className="tool-pair">
        <Field label="Age" suffix="years" value={age} onChange={setAge} />
        <Choice
          label="For the energy sum"
          value={sex}
          onChange={setSex}
          options={[
            { id: 'male' as const, name: 'Male' },
            { id: 'female' as const, name: 'Female' },
          ]}
        />
      </div>
      <Choice
        label="How active"
        value={activity}
        onChange={setActivity}
        options={ACTIVITY.map((item) => ({ id: item.id, name: item.name }))}
      />
      <Readout
        rows={[
          { label: 'BMI', value: show(index, 1), lead: true, note: bmiBand(index) || undefined },
          { label: 'At rest', value: Number.isFinite(rest) ? `${show(rest, 0)} kcal/day` : '' },
          { label: 'With that activity', value: Number.isFinite(rest) ? `${show(rest * factor, 0)} kcal/day` : '' },
        ]}
      />
    </Tool>
  )
}

export function Ovulation() {
  const [last, setLast] = useState(toInput(new Date()))
  const [cycle, setCycle] = useState('28')
  const start = fromInput(last)
  const result = start ? ovulation(start, Number(cycle)) : null

  return (
    <Tool note="Ovulation is taken as fourteen days before the next period is due, and the due date as two hundred and eighty days from the last one. Both are averages of other people's cycles, so treat every date here as a rough guide rather than a fact about yours.">
      <DateField label="First day of the last period" value={last} onChange={setLast} />
      <Field label="Cycle length" suffix="days" value={cycle} onChange={setCycle} hint="Usually 21 to 35" />
      <Readout
        rows={[
          {
            label: 'Most fertile',
            value: result ? `${longDate(result.fertileFrom)} to ${longDate(result.fertileTo)}` : '',
            lead: true,
          },
          { label: 'Ovulation around', value: result ? longDate(result.ovulates) : '' },
          { label: 'Next period due', value: result ? longDate(result.next) : '' },
          { label: 'Due date if pregnant now', value: result ? longDate(result.due) : '' },
        ]}
      />
    </Tool>
  )
}
