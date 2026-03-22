export class TemplateRenderer {
  static render(template: string, vars: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(vars)) {
      result = result.split(`{{${key}}}`).join(value);
    }

    return result;
  }
}
