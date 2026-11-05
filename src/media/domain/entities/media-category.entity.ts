export interface MediaCategoryProps {
  id: string;
  name: string;
  description: string | null;
}

export class MediaCategory {
  private props: MediaCategoryProps;

  constructor(props: MediaCategoryProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }
}
