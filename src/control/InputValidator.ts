/**
 * Пакет Control — Валідатор даних
 * Спільний предок BaseCalculator та клас InputValidator <<Control>>
 */

export interface IValidationOutcome {
  isValid: boolean;
  errorMessage?: string;
  normalizedNumber?: number;
}

/**
 * Клас InputValidator <<Control>>
 * Блокує некоректні значення у калькуляторах та перевіряє статті довідника перед публікацією
 */
export class InputValidator {
  public validate(value: string | number): boolean {
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    if (str.length === 0) return false;
    const num = Number(str);
    return Number.isFinite(num) && Number.isInteger(num);
  }

  public checkRange(value: string | number, min = 1, max = 10000): IValidationOutcome {
    const str = String(value ?? '').trim();
    if (!str) {
      return {
        isValid: false,
        errorMessage: 'Введіть кількість предметів або блоків (поле не може бути порожнім).',
      };
    }

    const num = Number(str);
    if (!Number.isFinite(num)) {
      return {
        isValid: false,
        errorMessage: 'Некоректний формат числа. Використовуйте лише цифри.',
      };
    }

    if (!Number.isInteger(num)) {
      return {
        isValid: false,
        errorMessage: 'Кількість повинна бути цілим числом (без дробової частини).',
      };
    }

    if (num < min) {
      return {
        isValid: false,
        errorMessage: `Значення повинно бути не менше ${min}. Від’ємні або нульові кількості недопустимі.`,
      };
    }

    if (num > max) {
      return {
        isValid: false,
        errorMessage: `Значення перевищує максимально допустимий ліміт (${max} од. за один розрахунок).`,
      };
    }

    return {
      isValid: true,
      normalizedNumber: num,
    };
  }

  public validateArticleInput(data: {
    title?: string;
    summary?: string;
    content?: string;
    categoryId?: number;
    patchVersion?: string;
  }): IValidationOutcome {
    const title = (data.title || '').trim();
    const summary = (data.summary || '').trim();
    const content = (data.content || '').trim();

    if (title.length < 5 || title.length > 140) {
      return {
        isValid: false,
        errorMessage: 'Заголовок статті має містити від 5 до 140 символів.',
      };
    }

    if (summary.length < 10) {
      return {
        isValid: false,
        errorMessage: 'Короткий опис (анотація) має містити щонайменше 10 символів.',
      };
    }

    if (content.length < 30) {
      return {
        isValid: false,
        errorMessage: 'Повний текст статті занадто короткий (мінімум 30 символів).',
      };
    }

    // Перевірка на відсутність шкідливого вмісту (XSS / скрипти)
    const dangerousPattern = /<script\b[^>]*>|javascript:|onerror=|onload=/i;
    if (dangerousPattern.test(title) || dangerousPattern.test(summary) || dangerousPattern.test(content)) {
      return {
        isValid: false,
        errorMessage: 'Виявлено заборонені керуючі теги або скрипт. Збереження заблоковано модулем безпеки.',
      };
    }

    return { isValid: true };
  }
}

/**
 * Абстрактний клас BaseCalculator <<Control>>
 * Спільний предок для RaidCalculator та RecycleCalculator
 */
export abstract class BaseCalculator {
  protected validator: InputValidator;

  constructor(validator: InputValidator = new InputValidator()) {
    this.validator = validator;
  }

  public checkInput(value: string | number, min = 1, max = 5000): IValidationOutcome {
    return this.validator.checkRange(value, min, max);
  }
}
