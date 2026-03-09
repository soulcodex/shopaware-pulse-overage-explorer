import { CreateNoteCommand } from './create-note.command';
import { ShopRepository } from '../../../domain/shop/repository/shop.repository';
import { createSupportNote } from '../../../domain/shop/note/support-note';
import { ShopNotFoundException } from '../../../domain/shop/exception/shop-not-found.exception';

/**
 * CreateNoteHandler - handles the CreateNoteCommand
 */
export class CreateNoteHandler {
  constructor(private readonly shopRepository: ShopRepository) {}

  async handle(command: CreateNoteCommand): Promise<void> {
    // Find the shop within tenant scope
    const shop = await this.shopRepository.findById(command.tenantId, command.shopId);

    if (!shop) {
      throw new ShopNotFoundException(command.shopId);
    }

    // Create the note
    const note = createSupportNote({
      shopId: shop.id,
      tenantId: command.tenantId,
      author: command.author,
      content: command.content,
    });

    // Add note to shop
    shop.addNote(note);

    // Persist the shop (with the new note)
    await this.shopRepository.save(shop);
  }
}
