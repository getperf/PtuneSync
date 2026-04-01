export interface TagPosition {
  tag: string;
  position: {
    start: { offset: number };
    end: { offset: number };
  };
}
