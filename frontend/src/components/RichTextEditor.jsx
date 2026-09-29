import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

const RichTextEditor = ({ value, onChange, placeholder }) => {
  return (
    <div className='border-2 border-[#F6B72D] rounded-lg overflow-hidden bg-white ckeditor-wrapper'>
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
        onChange={(event, editor) => {
          const data = editor.getData()
          onChange(data)
        }}
        config={{
          placeholder: placeholder || 'Enter description...',
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            '|',
            'link',
            'bulletedList',
            'numberedList',
            '|',
            'indent',
            'outdent',
            '|',
            'blockQuote',
            'insertTable',
            '|',
            'undo',
            'redo',
          ],
        }}
      />
    </div>
  )
}

export default RichTextEditor
