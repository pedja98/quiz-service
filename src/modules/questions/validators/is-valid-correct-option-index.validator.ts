import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export function IsValidCorrectOptionIndex(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidCorrectOptionIndex',
      target: object.constructor,
      propertyName,
      options: {
        message: 'correctOptionIndex must be a valid index within the options array (0 to options.length - 1)',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const target = args.object as { options?: unknown[] }
          if (typeof value !== 'number' || !Number.isInteger(value)) return false
          if (!Array.isArray(target.options)) return false
          return value >= 0 && value < target.options.length
        },
      },
    })
  }
}
