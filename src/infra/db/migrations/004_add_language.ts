export const migration004 = `
ALTER TABLE Settings ADD COLUMN language TEXT NOT NULL DEFAULT 'es-ES';
`;
