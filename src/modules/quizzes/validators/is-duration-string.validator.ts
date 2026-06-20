import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValidDurationString } from '../utils/duration.util'

export function IsDurationString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDurationString',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid duration string`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return isValidDurationString(value)
        },
      },
    })
  }
}
