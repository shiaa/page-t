import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div
      className="prose prose-slate max-w-none 
                 prose-headings:font-bold prose-headings:tracking-tight 
                 prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                 prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
                 prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
                 prose-p:leading-relaxed prose-p:mb-4
                 prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                 prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                 prose-li:mb-1
                 prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic
                 prose-img:rounded-lg prose-img:shadow-md"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            // 行内代码
            if (!match) {
              return (
                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }

            // 代码块（带语法高亮）
            return (
              <div className="my-4 rounded-lg overflow-hidden border border-slate-200">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-300 text-xs font-mono">
                  <span>{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          },
          // 表格样式增强
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-slate-200 rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-slate-200 bg-slate-50 px-4 py-2 text-left text-sm font-semibold text-slate-700">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-slate-200 px-4 py-2 text-sm text-slate-600">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
