const tokenPattern =
  /\b(\d+(?:\.\d+)?)\b|\b(select|insert|update|delete|create|alter|drop|truncate)\b|\b(from|where|group|by|order|having|limit|offset|top|set|values|into|returning)\b|\b(join|inner|left|right|full|outer|cross|on|union|all)\b|\b(and|or|not|in|exists|is|null|like|between)\b|\b(case|when|then|else|end|as|distinct)\b/gi;

const tokenClasses = {
  comment: "italic text-emerald-700 dark:text-emerald-400",
  string: "text-green-700 dark:text-green-400",
  number: "text-orange-600 dark:text-orange-400",
  command: "font-semibold text-blue-700 dark:text-blue-400",
  clause: "font-semibold text-blue-700 dark:text-blue-400",
  join: "font-semibold text-blue-700 dark:text-blue-400",
  logic: "font-semibold text-blue-700 dark:text-blue-400",
  expression: "font-semibold text-purple-700 dark:text-purple-400",
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrapToken(value: string, className: string) {
  return `<span class="${className}">${escapeHtml(value)}</span>`;
}

function highlightSqlTokens(value: string) {
  return escapeHtml(value).replace(
    tokenPattern,
    (token, number, command, clause, join, logic, expression) => {
      const className =
        (number && tokenClasses.number) ||
        (command && tokenClasses.command) ||
        (clause && tokenClasses.clause) ||
        (join && tokenClasses.join) ||
        (logic && tokenClasses.logic) ||
        (expression && tokenClasses.expression);

      return className ? `<span class="${className}">${token}</span>` : token;
    },
  );
}

function findStringEnd(line: string, start: number) {
  let cursor = start + 1;

  while (cursor < line.length) {
    if (line[cursor] !== "'") {
      cursor += 1;
      continue;
    }

    if (line[cursor + 1] === "'") {
      cursor += 2;
      continue;
    }

    return cursor + 1;
  }

  return line.length;
}

function highlightLine(line: string, startsInsideBlockComment: boolean) {
  let cursor = 0;
  let inBlockComment = startsInsideBlockComment;
  let highlighted = "";

  while (cursor < line.length) {
    if (inBlockComment) {
      const commentEnd = line.indexOf("*/", cursor);

      if (commentEnd === -1) {
        highlighted += wrapToken(line.slice(cursor), tokenClasses.comment);
        return { highlighted, inBlockComment: true };
      }

      highlighted += wrapToken(line.slice(cursor, commentEnd + 2), tokenClasses.comment);
      cursor = commentEnd + 2;
      inBlockComment = false;
      continue;
    }

    if (line.startsWith("--", cursor)) {
      highlighted += wrapToken(line.slice(cursor), tokenClasses.comment);
      break;
    }

    if (line.startsWith("/*", cursor)) {
      const commentEnd = line.indexOf("*/", cursor + 2);

      if (commentEnd === -1) {
        highlighted += wrapToken(line.slice(cursor), tokenClasses.comment);
        return { highlighted, inBlockComment: true };
      }

      highlighted += wrapToken(line.slice(cursor, commentEnd + 2), tokenClasses.comment);
      cursor = commentEnd + 2;
      continue;
    }

    if (line[cursor] === "'") {
      const stringEnd = findStringEnd(line, cursor);
      highlighted += wrapToken(line.slice(cursor, stringEnd), tokenClasses.string);
      cursor = stringEnd;
      continue;
    }

    let tokenEnd = cursor + 1;

    while (
      tokenEnd < line.length &&
      line[tokenEnd] !== "'" &&
      !line.startsWith("--", tokenEnd) &&
      !line.startsWith("/*", tokenEnd)
    ) {
      tokenEnd += 1;
    }

    highlighted += highlightSqlTokens(line.slice(cursor, tokenEnd));
    cursor = tokenEnd;
  }

  return { highlighted, inBlockComment };
}

export function highlightSqlLines(sql: string) {
  let inBlockComment = false;

  return sql.split("\n").map((line) => {
    const result = highlightLine(line, inBlockComment);
    inBlockComment = result.inBlockComment;
    return result.highlighted;
  });
}
