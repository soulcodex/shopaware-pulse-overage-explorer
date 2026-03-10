import { NoteAuthor } from './note-author';
import { ShopId } from '../model/shop-id';
import { TenantId } from '../model/tenant-id';
/**
 * SupportNote entity - child entity of Shop aggregate
 */
export class SupportNote {
  readonly id: string;
  readonly shopId: ShopId;
  readonly tenantId: TenantId;
  readonly author: NoteAuthor;
  readonly content: string;
  readonly createdAt: Date;

  constructor(data: {
    id: string;
    shopId: ShopId;
    tenantId: TenantId;
    author: NoteAuthor;
    content: string;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.shopId = data.shopId;
    this.tenantId = data.tenantId;
    this.author = data.author;
    this.content = data.content;
    this.createdAt = data.createdAt;
  }

  equals(other: SupportNote): boolean {
    return this.id === other.id;
  }
}

/**
 * Creates a new SupportNote with server-generated id and timestamp
 */
export function createSupportNote(data: {
  shopId: ShopId;
  tenantId: TenantId;
  author: NoteAuthor;
  content: string;
}): SupportNote {
  return new SupportNote({
    id: crypto.randomUUID(),
    shopId: data.shopId,
    tenantId: data.tenantId,
    author: data.author,
    content: data.content,
    createdAt: new Date(),
  });
}
