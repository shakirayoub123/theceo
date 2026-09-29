import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileDown } from 'lucide-react'

const downloadAssessmentsPDF = (formAnswers, clientName = 'Client') => {
  const lines = []
  lines.push(`THE CEO INFLUENCERS`)
  lines.push(`Assessment Responses — ${clientName}`)
  lines.push(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
  lines.push('')
  lines.push('='.repeat(70))
  lines.push('')

  formAnswers.forEach((form, idx) => {
    lines.push(`ASSESSMENT ${idx + 1}: ${(form.questionnaireTitle || 'Questionnaire').toUpperCase()}`)
    lines.push('-'.repeat(50))
    if (Array.isArray(form.data) && form.data.length > 0) {
      form.data.forEach((entry, i) => {
        lines.push(`Q${i + 1}: ${entry.question || 'Question'}`)
        lines.push(`A:  ${entry.answer || '(no answer)'}`)
        lines.push('')
      })
    } else {
      lines.push('No responses recorded.')
      lines.push('')
    }
    lines.push('')
  })

  const text = lines.join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${clientName.replace(/\s+/g, '_')}_Assessments.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const FormAnswersCard = ({ formAnswers = [], clientName = 'Client' }) => {
  if (!Array.isArray(formAnswers) || formAnswers.length === 0) {
    return (
      <Card className='border-2 border-[#F6B72D] bg-white'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg font-semibold text-foreground'>
            Questionnaire Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground font-exo'>
            No questionnaire responses available.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-2 border-[#F6B72D] bg-white'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold text-foreground'>
            Questionnaire Responses
          </CardTitle>
          <button
            onClick={() => downloadAssessmentsPDF(formAnswers, clientName)}
            className='inline-flex items-center gap-2 bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-semibold text-sm px-4 py-2 rounded-full transition-all duration-200'
            title='Download all assessment answers as PDF'
          >
            <FileDown className='h-4 w-4' />
            Download PDF
          </button>
        </div>
      </CardHeader>
      <CardContent className='font-exo'>
        <ScrollArea className='h-[480px] pr-2'>
          <div className='space-y-6'>
            {formAnswers.map((form, index) => (
              <div
                key={`${form.questionnaireTitle || 'form'}-${index}`}
                className='rounded-lg border border-border bg-muted/30 p-4 space-y-4'
              >
                <h3 className='text-md font-semibold text-foreground'>
                  {form.questionnaireTitle || 'Questionnaire'}
                </h3>
                <div className='space-y-3'>
                  {Array.isArray(form.data) && form.data.length > 0 ? (
                    form.data.map((entry, entryIndex) => (
                      <div
                        key={`${entry.question || 'question'}-${entryIndex}`}
                        className='border-b border-border/70 pb-3 last:border-b-0 last:pb-0'
                      >
                        <p className='text-sm font-semibold text-foreground'>
                          {entry.question || 'Question'}
                        </p>
                        <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                          {entry?.answer}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      No responses recorded.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
