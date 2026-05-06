export const migration005 = `
ALTER TABLE Settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'system';
`;
