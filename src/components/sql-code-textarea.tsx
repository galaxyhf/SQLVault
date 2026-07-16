"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, UIEvent } from "react";
import { highlightSqlLines } from "@/lib/sql-highlight";
import { cn } from "@/lib/utils";

type SqlCodeTextareaProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

export function SqlCodeTextarea({ id, name, defaultValue = "", placeholder, className }: SqlCodeTextareaProps) {
  const [value, setValue] = useState(defaultValue);
  const highlightRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = highlightSqlLines(value || " ");

  useEffect(() => {
    function updateFromTextarea() {
      const nextValue = textareaRef.current?.value ?? "";

      setValue((currentValue) => (currentValue === nextValue ? currentValue : nextValue));
    }

    const interval = window.setInterval(updateFromTextarea, 100);

    return () => window.clearInterval(interval);
  }, []);

  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (!highlightRef.current) return;

    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  }

  function syncValue() {
    if (!textareaRef.current) return;

    setValue(textareaRef.current.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${textarea.value.slice(0, start)}  ${textarea.value.slice(end)}`;

    textarea.value = nextValue;
    setValue(nextValue);
    window.requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <div className="border-b px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">SQL</span>
      </div>
      <div className="relative h-56 overflow-hidden">
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden p-0 font-mono text-sm leading-6"
        >
          <code>
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-[3.5rem_minmax(0,1fr)]">
                <span className="select-none border-r bg-secondary/40 px-4 text-right text-muted-foreground">
                  {index + 1}
                </span>
                <span className="px-4" dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }} />
              </div>
            ))}
          </code>
        </pre>
        {!value ? (
          <span className="pointer-events-none absolute left-[4.5rem] top-0 font-mono text-sm leading-6 text-muted-foreground">
            {placeholder}
          </span>
        ) : null}
        <textarea
          ref={textareaRef}
          id={id}
          name={name}
          defaultValue={defaultValue}
          onChange={(event) => setValue(event.target.value)}
          onInput={(event) => setValue(event.currentTarget.value)}
          onClick={syncValue}
          onFocus={syncValue}
          onBlur={syncValue}
          onKeyUp={syncValue}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="absolute inset-0 resize-none overflow-auto bg-transparent py-0 pl-[4.5rem] pr-4 font-mono text-sm leading-6 text-transparent caret-foreground outline-none selection:bg-primary/30 focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
