import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const getProgressForForm = (form) => {
  if (!Array.isArray(form?.data)) {
    return { total: 0, answered: 0, percent: 0 }
  }

  const total = form.data.length
  const answered = form.data.filter((entry) => {
    const answer = entry?.answer
    return answer !== null && answer !== undefined && `${answer}`.trim() !== ''
  }).length

  const percent = total > 0 ? Math.round((answered / total) * 100) : 0
  return { total, answered, percent }
}

export const QuestionnaireProgressCard = ({ formAnswers = [] }) => {
  if (!Array.isArray(formAnswers) || formAnswers.length === 0) {
    return (
      <Card className='border-2 border-[#F6B72D] bg-white'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg font-semibold text-foreground'>
            Questionnaire Progress
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
        <CardTitle className='text-lg font-semibold text-foreground'>
          Questionnaire Progress
        </CardTitle>
      </CardHeader>
      <CardContent className='font-exo space-y-4'>
        {formAnswers.map((form, index) => {
          const { total, answered, percent } = getProgressForForm(form)
          return (
            <div
              key={`${form.questionnaireTitle || 'form'}-${index}`}
              className='rounded-lg border border-border bg-muted/30 p-4 space-y-3'
            >
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-foreground'>
                  {form.questionnaireTitle || 'Questionnaire'}
                </h3>
                <span className='text-xs text-gray-500'>
                  {answered}/{total} answered
                </span>
              </div>
              <div className='h-2 w-full rounded-full bg-gray-200'>
                <div
                  className='h-2 rounded-full bg-[#F6B72D]'
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className='text-xs text-gray-500'>{percent}% complete</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
