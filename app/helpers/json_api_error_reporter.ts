import { errors } from '@vinejs/vine'
import {
   FieldContext,
   ErrorReporterContract
} from '@vinejs/vine/types'

export class JSONAPIErrorReporter implements ErrorReporterContract {
  /**
   * A flag to know if one or more errors have been
   * reported
   */
  hasErrors: boolean = false

  /**
   * A collection of errors. Feel free to give accurate types
   * to this property
   */
  errors: any[] = []

  /**
   * VineJS call the report method
   */
  report(
    message: string,
    rule: string,
    field: FieldContext,
    meta?: any
  ) {
    this.hasErrors = true

    /**
     * Collecting errors as per the JSONAPI spec
     */
    this.errors.push({
      field: field.name,
      detail: message,
    })
  }

  formatErrors(errorsArray: { field: string; detail: string }[]): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
  
    errorsArray.forEach(error => {
      errors[error.field] = error.detail;
    });
  
    return errors;
  }

  /**
   * Creates and returns an instance of the
   * ValidationError class
   */
  createError() {
    return new errors.E_VALIDATION_ERROR(this.formatErrors(this.errors))
  }
}