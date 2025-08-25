import {
  MessageType,
  MessageStatus,
  type Message
} from '../../../../types/entities';
import MessageStatusIndicator from '../../../../components/MessageStatusIndicator';
import { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { messagesApi } from '../../../../api/messages';

interface MessageItemProps {
  message: Message;
  onOpenFile: (path: string, name: string) => void;
}

const getMessageTypeLabel = (type: MessageType) => {
  switch (type) {
    case MessageType.System:
      return 'System';
    case MessageType.User:
      return 'User';
    case MessageType.Agent:
      return 'Agent';
    case MessageType.Tool:
      return 'Tool';
    default:
      return 'Unknown';
  }
};

const getMessageBgColor = (type: MessageType) => {
  switch (type) {
    case MessageType.User:
      return 'bg-purple-100/60 dark:bg-purple-900/80 text-neutral-900 dark:text-neutral-100';
    case MessageType.Agent:
      return 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100';
    case MessageType.Tool:
      return 'bg-neutral-200/50 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100';
    case MessageType.System:
      return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200';
    default:
      return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200';
  }
};

export default function MessageItem({ message, onOpenFile }: MessageItemProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleFilePathClick = useCallback(
    (filePath: string) => {
      // Normalize the path (remove any quotes, trim whitespace)
      const normalizedPath = filePath.replace(/['"]/g, '').trim();

      // Check if path contains line number (e.g., "file.js:123")
      const lineNumberMatch = normalizedPath.match(/^(.+):(\d+)$/);
      const actualPath = lineNumberMatch ? lineNumberMatch[1] : normalizedPath;
      const lineNumber = lineNumberMatch
        ? parseInt(lineNumberMatch[2], 10)
        : undefined;

      // Extract filename from path
      const fileName = actualPath.split(/[/\\]/).pop() || actualPath;

      // Call onOpenFile with the path and filename
      // Note: You may want to extend onOpenFile to accept line number as well
      if (onOpenFile) {
        onOpenFile(actualPath, fileName);

        // If there's a line number, you could potentially navigate to it
        // This would require extending the onOpenFile interface or adding a separate callback
        if (lineNumber) {
          console.log(`Should navigate to line ${lineNumber} in ${actualPath}`);
          // TODO: Implement line number navigation if needed
        }
      }
    },
    [onOpenFile]
  );

  const formatMessageContent = useMemo(() => {
    // Pre-process content to convert file paths to markdown links
    // const processedContent = message.content.replace(
    //   /(((\S+)\\)*(\w*)\.[\w]+(:\d+)?)/gm,
    //   (match, path) => {
    //     // Create a markdown link with a special protocol
    //     const normalized = path.replace(/\\/g, '/').trim(); // Normalize path
    //     return match.replace(path, `[${path}](file://${normalized})`);
    //   }
    // );
    const processedContent = message.content;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => url}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            // Check if this is truly inline code (single backticks)
            if (!className && inline !== false) {
              return (
                <code
                  className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono mx-0.5"
                  {...props}>
                  {children}
                </code>
              );
            }

            // This is a code block (triple backticks)
            return (
              <code className="font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre({ children, className, ...props }) {
            // Extract language from the code element if present
            const codeElement = children as any;
            const codeProps = codeElement?.props;
            const classMatch = /language-(\w+)/.exec(
              codeProps?.className || ''
            );
            const language = classMatch ? classMatch[1] : '';

            return (
              <pre
                className="bg-neutral-900 text-neutral-100 p-3 rounded mt-2 mb-2 overflow-x-auto text-sm block"
                {...props}>
                {language && (
                  <div className="text-neutral-400 text-xs mb-2">{language}</div>
                )}
                {children}
              </pre>
            );
          },
          p({ children }) {
            return <p className="mb-2 whitespace-pre-line">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside mb-2">{children}</ul>;
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-inside mb-2">{children}</ol>
            );
          },
          li({ children }) {
            return <li className="mb-1">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-2 mt-3">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>;
          },
          h3({ children }) {
            return (
              <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 py-1 mb-2 italic">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            // Check if this is a file:// link
            if (href && href.startsWith('file://')) {
              const filePath = href.replace('file://', '');
              return (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFilePathClick(filePath);
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit underline-offset-auto"
                  title={`Open ${filePath}`}>
                  {children}
                </button>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:underline">
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto mb-2">
                <table className="min-w-full border border-neutral-300 dark:border-neutral-600">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-neutral-100 dark:bg-neutral-700">{children}</thead>
            );
          },
          th({ children }) {
            return (
              <th className="border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-neutral-300 dark:border-neutral-600 px-3 py-2">
                {children}
              </td>
            );
          },
          hr() {
            return <hr className="my-3 border-neutral-300 dark:border-neutral-600" />;
          },
          strong({ children }) {
            return <strong className="font-bold">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          }
        }}>
        {processedContent}
      </ReactMarkdown>
    );
  }, [handleFilePathClick, message.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCancelMessage = async () => {
    if (isCanceling) return;

    setIsCanceling(true);
    try {
      // For working messages (Agent/Tool), use the cancel API that actually stops the agent
      if (message.status === MessageStatus.Working) {
        const { sessionsApi } = await import('../../../../api');
        await sessionsApi.cancelMessage(message.sessionId, message.id);
      } else {
        // For pending user messages, just update status
        await messagesApi.update(message.sessionId, message.id, {
          status: MessageStatus.Failed
        });
      }
      // The message will be updated via SignalR, so no need for callback
    } catch (err) {
      console.error('Failed to cancel message: ', err);
    } finally {
      setIsCanceling(false);
    }
  };

  const canCancelMessage =
    (message.type === MessageType.User &&
      message.status === MessageStatus.Pending) ||
    ((message.type === MessageType.Agent ||
      message.type === MessageType.Tool) &&
      message.status === MessageStatus.Working);

  return (
    <div
      className={
        'flex justify-start ' +
        (message.type === MessageType.Tool ? '' : 'pb-4')
      }>
      <div className="flex max-w-4xl">
        <div
          className={`px-4 py-3 max-w-none ${getMessageBgColor(message.type)}`}>
          {/* Message Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageStatusIndicator
                status={message.status}
                type={message.type}
              />
              <span className="text-xs opacity-75">
                {getMessageTypeLabel(message.type)}
              </span>
              <span className="text-xs opacity-50">
                {new Date(message.updatedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {canCancelMessage && (
                <button
                  onClick={handleCancelMessage}
                  disabled={isCanceling}
                  className="p-1 text-xs opacity-50 hover:opacity-100 duration-200 rounded hover:bg-red-500/20 text-red-600 dark:text-red-400"
                  title={
                    message.status === MessageStatus.Working
                      ? 'Stop processing'
                      : 'Cancel message'
                  }>
                  {isCanceling ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-1 text-xs opacity-50 hover:opacity-100 duration-200 rounded hover:bg-black/10 dark:hover:bg-white/10"
                title="Copy message content">
                {copySuccess ? (
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 002 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Message Content */}
          <div className="text-sm font-mono leading-relaxed select-text">
            {formatMessageContent}
          </div>

          {/* Metadata */}
          {message.metadata && (
            <details className="mt-2">
              <summary className="text-xs opacity-75 hover:opacity-100">
                Metadata
              </summary>
              <pre className="text-xs opacity-60 mt-1 bg-black/10 dark:bg-white/10 p-2 rounded">
                {message.metadata}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
