import { AppError } from "./appError";

export class DuplicateKeyError extends AppError {
  constructor(field: string) {
    super(`${field} already in use`, 409);
    this.name = this.constructor.name;
  }
}
