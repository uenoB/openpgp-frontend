export class Items<X> {
  private constructor(private readonly items: Set<X>) {}

  static from<X>(items: Iterable<X>): Items<X> {
    return new Items<X>(new Set(items))
  }

  [Symbol.iterator](): IterableIterator<X> {
    return this.items.values()
  }

  get size(): number {
    return this.items.size
  }

  add(items: Iterable<X>): Items<X> {
    const newItems = new Set(this.items)
    for (const i of items) newItems.add(i)
    return new Items(newItems)
  }

  replace(oldItem: X, newItem: X): Items<X> {
    const newItems = new Set<X>()
    for (const i of this.items) newItems.add(i === oldItem ? newItem : i)
    return new Items(newItems)
  }

  delete(item: X): Items<X> {
    const newItems = new Set(this.items)
    newItems.delete(item)
    return new Items(newItems)
  }

  has(item: X): boolean {
    return this.items.has(item)
  }
}
