const tokenPattern =
  /(--.*$)|('[^']*')|\b(\d+(?:\.\d+)?)\b|\b(select|insert|update|delete|create|alter|drop|truncate)\b|\b(from|where|group|by|order|having|limit|offset|top|set|values|into|returning)\b|\b(join|inner|left|right|full|outer|cross|on|union|all)\b|\b(and|or|not|in|exists|is|null|like|between)\b|\b(case|when|then|else|end|as|distinct)\b/gi;

const tokenClasses = {
  comment: "text-muted-foreground italic",
  string: "text-green-700 dark:text-green-400",
  number: "text-orange-600 dark:text-orange-400",
  command: "font-semibold text-blue-700 dark:text-blue-400",
  clause: "font-semibold text-blue-700 dark:text-blue-400",
  join: "font-semibold text-blue-700 dark:text-blue-400",
  logic: "font-semibold text-blue-700 dark:text-blue-400",
  expression: "font-semibold text-purple-700 dark:text-purple-400",
};

export function highlightSqlLine(line: string) {
  const escaped = line
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return escaped.replace(
    tokenPattern,
    (token, comment, string, number, command, clause, join, logic, expression) => {
      const className =
        (comment && tokenClasses.comment) ||
        (string && tokenClasses.string) ||
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
