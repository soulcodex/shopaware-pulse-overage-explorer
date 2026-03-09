/**
 * ShopId value object - represents a shop identifier
 */
export class ShopId {
  readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ShopId must not be blank');
    }
    this.value = value;
  }

  equals(other: ShopId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
