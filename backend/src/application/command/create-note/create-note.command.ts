import { ShopId } from '../../../domain/shop/model/shop-id';
import { TenantId } from '../../../domain/shop/model/tenant-id';
import { NoteAuthor } from '../../../domain/shop/note/note-author';

/**
 * CreateNoteCommand - command to create a support note
 */
export class CreateNoteCommand {
  readonly tenantId: TenantId;
  readonly shopId: ShopId;
  readonly author: NoteAuthor;
  readonly content: string;

  constructor(data: {
    tenantId: TenantId;
    shopId: ShopId;
    author: NoteAuthor;
    content: string;
  }) {
    this.tenantId = data.tenantId;
    this.shopId = data.shopId;
    this.author = data.author;
    this.content = data.content;
  }
}
