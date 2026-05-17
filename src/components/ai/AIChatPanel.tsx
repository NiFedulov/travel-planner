'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, X, Bot, User } from 'lucide-react'
import { useUIStore } from '@/lib/store/uiStore'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AIChatPanel() {
  const { chatOpen, setChatOpen } = useUIStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: updated[updated.length - 1].content + data.text,
                  }
                  return updated
                })
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setStreaming(false)
    }
  }

  if (!chatOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl border bg-white shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '520px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-sky-500">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-white" />
          <span className="font-semibold text-white text-sm">Travel AI Assistant</span>
        </div>
        <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: '300px', maxHeight: '380px' }}>
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm pt-8">
            <Bot className="h-10 w-10 mx-auto mb-2 text-teal-200" />
            <p>Ask me anything about your trip!</p>
            <p className="text-xs mt-1">Visas, attractions, local tips...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-teal-600" />
              </div>
            )}
            <div className={cn(
              'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-teal-600 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            )}>
              {msg.content || (streaming && i === messages.length - 1 ? (
                <span className="animate-pulse">...</span>
              ) : '')}
            </div>
            {msg.role === 'user' && (
              <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about visas, places, tips..."
          className="flex-1 text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
          disabled={streaming}
        />
        <button
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
