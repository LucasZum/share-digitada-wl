import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4
  labels?: [string, string, string, string]
}

export function StepIndicator({
  currentStep,
  labels = ['Valor', 'Cartão', 'Dados', 'Resultado'],
}: StepIndicatorProps) {
  return (
    <div className="bg-white rounded-xl border border-terminalBorder px-3 py-3">
      <div className="flex items-center gap-1">
        {([1, 2, 3, 4] as const).map((step, i) => (
          <div key={step} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  step < currentStep && 'bg-success text-white',
                  step === currentStep && 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/20',
                  step > currentStep && 'bg-gray-100 text-terminalLabel border-2 border-gray-200'
                )}
              >
                {step < currentStep ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : step}
              </div>
              <span className="text-[9px] font-medium text-terminalLabel">{labels[i]}</span>
            </div>
            {step < 4 && (
              <div className={cn('step-line', step < currentStep && 'completed')} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
