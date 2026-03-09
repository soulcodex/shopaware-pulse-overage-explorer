import { ShopId } from '../model/shop-id.js';

/**
 * ShopNotFoundException - thrown when a shop cannot be found
 */
export class ShopNotFoundException extends Error {
  readonly shopId: ShopId;

  constructor(shopId: ShopId) {
    super(`Shop with id '${shopId.value}' not found`);
    this.name = 'ShopNotFoundException';
    this.shopId = shopId;
  }
}
