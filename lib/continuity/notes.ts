export function isOperationalContinuityNote(input: {
  path: string;
  title?: string;
  body?: string;
  section?: string;
}): boolean {
  const path = input.path.toLowerCase();
  if (input.section === "templates" || path.includes("/templates/") || path.startsWith("99 templates/") || path.startsWith("templates/")) {
    return false;
  }
  return !/\{\{[^}]+\}\}/.test(`${input.title ?? ""} ${input.body ?? ""}`);
}
