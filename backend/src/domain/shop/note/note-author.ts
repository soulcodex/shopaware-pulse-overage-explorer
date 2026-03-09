/**
 * NoteAuthor value object - represents the author of a support note
 */
export class NoteAuthor {
  readonly id: string;
  readonly name: string;

  constructor(data: { id: string; name: string }) {
    if (!data.id || data.id.trim().length === 0) {
      throw new Error('Author id must not be blank');
    }
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Author name must not be blank');
    }
    this.id = data.id;
    this.name = data.name;
  }

  equals(other: NoteAuthor): boolean {
    return this.id === other.id && this.name === other.name;
  }
}
