import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';

// Helpers do Handlebars
Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

Handlebars.registerHelper('join', function(array, separator) {
  return array.join(separator);
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('ne', function(a, b) {
  return a !== b;
});

Handlebars.registerHelper('or', function(a, b) {
  return a || b;
});

Handlebars.registerHelper('and', function(a, b) {
  return a && b;
});

Handlebars.registerHelper('uppercase', function(str: string) {
  return str?.toUpperCase();
});

Handlebars.registerHelper('lowercase', function(str: string) {
  return str?.toLowerCase();
});

Handlebars.registerHelper('capitalize', function(str: string) {
  return str?.charAt(0).toUpperCase() + str?.slice(1);
});

export class TemplateEngine {
  private templatesDir: string;

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }

  async render(templateName: string, data: any): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    return template(data);
  }

  async renderToFile(templateName: string, data: any, outputPath: string): Promise<void> {
    const content = await this.render(templateName, data);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}
