import Image from 'next/image'
import { UserIcon } from './UserIcon'
import { Loading } from './Loading'
import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  highlight: function (code: string, lang: string) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  }
})

export function ChatItem({
  content,
  is_from_bot,
  loading = false
}: {
  content: string
  is_from_bot: boolean
  loading?: boolean
}) {
  const background = is_from_bot ? 'bg-gray-800' : 'bg-gray-600'

  return (
    <li className={`w-full text-gray-100 ${background}`}>
      <div className="flex-col">
        <div className="md:max-w-2xl lg:max-w-xl xl:max-w-3xl p-6 m-auto flex flex-row items-start space-x-4">
          {is_from_bot ? (
            <Image src="/fullcycle_logo.png" width={30} height={30} alt="" />
          ) : (
            <UserIcon className="w-[30px] flex flex-col relative start" />
          )}

          <div
            className="relative w-[calc(100%-115px)] flex flex-col gap-1 transition duration-100 ease-linear break-words"
            dangerouslySetInnerHTML={{
              __html: marked(content, { breaks: true }) //sanitize: true
            }}
          />
        </div>
        {loading && (
          <div className="flex items-center justify-center pb-2">
            <Loading />
          </div>
        )}
      </div>
    </li>
  )
}
