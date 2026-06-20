import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

export function IsNumberKeyObject(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNumberKeyObject',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'object' || value === null) {
            return false
          }

          return Object.keys(value).every((key) => !isNaN(Number(key)))
        },

        defaultMessage() {
          return 'All keys must be numbers'
        },
      },
    })
  }
}
