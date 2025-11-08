import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsDateStringConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    // Accept ISO 8601 formats:
    // - YYYY-MM-DD (simple date)
    // - YYYY-MM-DDTHH:mm:ss.sssZ (full ISO)
    // - YYYY-MM-DDTHH:mm:ssZ
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    
    if (!isoDateRegex.test(value)) {
      return false;
    }

    // Check if it's a valid date
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  defaultMessage(args: ValidationArguments) {
    return 'dateDeNaissance must be a valid ISO 8601 date string (format: YYYY-MM-DD)';
  }
}

export function IsDateStringFlexible(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateStringConstraint,
    });
  };
}

