export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD') // Normalize to decompose accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .trim();
}
