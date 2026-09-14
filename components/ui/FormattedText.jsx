/**
 * FormattedText component
 * Converts plain text to formatted text with:
 * - URLs converted to clickable links
 * - Line breaks preserved
 */

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function FormattedText({ text, className = "" }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => {
        if (!line.trim()) {
          // Empty line - render a line break
          return <br key={lineIndex} />;
        }

        const parts = line.split(URL_REGEX);

        return (
          <span key={lineIndex}>
            {parts.map((part, partIndex) => {
              // Check if this part is a URL
              if (URL_REGEX.test(part)) {
                return (
                  <a
                    key={partIndex}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 break-all"
                  >
                    {part}
                  </a>
                );
              }
              return <span key={partIndex}>{part}</span>;
            })}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}
