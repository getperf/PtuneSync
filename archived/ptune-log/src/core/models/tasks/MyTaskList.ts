export class MyTaskList {
  constructor(
    public id: string,
    public title: string,
    public updated?: string,
    public description?: string,
    public key?: string
  ) {}

  toString(): string {
    return `${this.title} (${this.id})`;
  }
}
