/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import locale from '@kratos-pages/shared/i18n/locale/en.json';

/**
 * This service is a custom translation service
 *
 * @class I18nService
 */
@Injectable({
  providedIn: 'root',
})
export class I18nService {
  locale: any = locale;

  /**
   * Search translation in `locale/en.json` based on parameters
   *
   * @param group
   * @param id
   * @param context - Optionnal, if provided try to translate it with {@link translateContext}
   * @returns Translation if found
   *
   * @fires {@link interpolation}
   */
  getTranslation(group: string, id: string, context?: any) {
    if (!group || !id) {
      console.log('missing info');
      return;
    }

    if (context !== undefined) {
      const translation = this.locale?.[group]?.[id];
      if (translation) {
        return this.interpolation(translation, context);
      } else {
        console.log(`translation not found ${group} ${id}`);
        return;
      }
    } else {
      return this.locale?.[group]?.[id];
    }
  }

  /**
   * @private Substitute placeholder with context value
   *
   * @param translation Template sentence
   * @param context The real value (translated if possible)
   * @returns The translation with substitution
   *
   * @fires {@link translateContext} to translate the context
   */
  private interpolation(translation: string, context: any): string {
    for (const [key, value] of Object.entries(context)) {
      const param = `{{ ${key} }}`;
      const text = this.translateContext(key, value as string);
      translation = translation.replace(param, text);
    }
    return translation;
  }

  /**
   * @private Translate a context value
   *
   * @param key
   * @param value
   * @returns Translation if found
   */
  private translateContext(key: string, value: string | number) {
    if (typeof value === 'number') {
      value = value.toString();
    }

    if (value.includes('is not valid "email"')) {
      const emailValue = value.split('"')[1];
      const template = this.locale?.['ui']?.['invalid_email'] || `"${emailValue}" is not a valid email`;
      value = template.replace('{{value}}', emailValue);
    }
    return this.locale?.['context']?.[key]?.[value] || value;
  }
}
