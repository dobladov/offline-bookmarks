export interface Item {
    name: string;
    url?: string;
    guid?: string;
    path?: string;
    children?: Item[];
}