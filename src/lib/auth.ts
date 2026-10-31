import accounts from '@/data/dummy-accounts.json';

export type UserRole = 'parent' | 'teacher' | 'psychologist';

export type Account = {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
};

// TODO(backend): ganti dengan API login beneran
export function login(contact: string, password: string): Account | null {
  const key = contact.trim().toLowerCase();
  const account = (accounts as Account[]).find(
    (a) => (a.email.toLowerCase() === key || a.phone === key) && a.password === password
  );
  return account ?? null;
}
