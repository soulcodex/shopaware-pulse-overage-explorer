/**
 * TenantId value object - represents a tenant identifier
 */
export class TenantId {
  readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId must not be blank');
    }
    this.value = value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
