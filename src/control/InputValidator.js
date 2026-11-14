/**
 * Пакет Control — Валідатор даних
 * Спільний предок BaseCalculator та клас InputValidator <<Control>>
 */

export class InputValidator {
  validate(value) {
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    if (str.length === 0) return false;
    const num = Number(str);
    return Number.isFinite(num) && Number.isInteger(num);
  }

  checkRange(value, min = 1, max = 10000) {
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

  validateArticleInput(data) {
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

    const dangerousPattern = /<script\b[^>]*>|javascript:|onerror=|onload=/i;
    if (
      dangerousPattern.test(title) ||
      dangerousPattern.test(summary) ||
      dangerousPattern.test(content)
    ) {
      return {
        isValid: false,
        errorMessage:
          'Виявлено заборонені керуючі теги або скрипт. Збереження заблоковано модулем безпеки.',
      };
    }

    return { isValid: true };
  }
}

export class BaseCalculator {
  constructor(validator = new InputValidator()) {
    this.validator = validator;
  }

  checkInput(value, min = 1, max = 5000) {
    return this.validator.checkRange(value, min, max);
  }
}
