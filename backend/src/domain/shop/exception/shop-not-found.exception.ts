import { ShopId } from '../model/shop-id.js';

/**
 * Thrown when a shop cannot be found for the given tenant.
 *
 * Returns 404 rather than 403 on cross-tenant access to prevent tenant
 * enumeration — callers cannot distinguish "not found" from "belongs to
 * another tenant". See ADR-0003.
 */
export class ShopNotFoundException extends Error {
  readonly shopId: ShopId;

  constructor(shopId: ShopId) {
    super(`No shop with id '${shopId.value}' was found`);
    this.name = 'ShopNotFoundException';
    this.shopId = shopId;
  }
}
