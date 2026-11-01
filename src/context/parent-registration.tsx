import { createContext, use, useState, type ReactNode } from 'react';

export type Role = 'parent' | 'teacher';
export type Gender = 'male' | 'female';
export type SchoolLevel = 'TK' | 'SD' | 'SMP';

// data pendaftaran shadow teacher (layar pendidikan & pengalaman)
export type TeacherRegistration = {
  education: string | null;
  institution: string;
  major: string;
  ijazahUri: string | null;
  certificateUri: string | null;
  experience: string | null;
  specializations: string[];
  cvUri: string | null;
  bio: string;
};

export type ParentRegistration = {
  account: { fullName: string; contact: string; password: string };
  identity: { ktpUri: string | null; domicile: string };
  child: {
    name: string;
    birthDate: string;
    gender: Gender | null;
    schoolLevel: SchoolLevel | null;
    domicile: string;
  };
  needs: { conditions: string[]; medicalRecordUri: string | null };
  teacher: TeacherRegistration;
};

const initialState: ParentRegistration = {
  account: { fullName: '', contact: '', password: '' },
  identity: { ktpUri: null, domicile: '' },
  child: { name: '', birthDate: '', gender: null, schoolLevel: null, domicile: '' },
  needs: { conditions: [], medicalRecordUri: null },
  teacher: {
    education: null,
    institution: '',
    major: '',
    ijazahUri: null,
    certificateUri: null,
    experience: null,
    specializations: [],
    cvUri: null,
    bio: '',
  },
};

type ContextValue = {
  data: ParentRegistration;
  update: <K extends keyof ParentRegistration>(
    section: K,
    values: Partial<ParentRegistration[K]>
  ) => void;
  reset: () => void;
};

const ParentRegistrationContext = createContext<ContextValue | null>(null);

export function ParentRegistrationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialState);

  const value: ContextValue = {
    data,
    update: (section, values) =>
      setData((prev) => ({ ...prev, [section]: { ...prev[section], ...values } })),
    reset: () => setData(initialState),
  };

  return <ParentRegistrationContext value={value}>{children}</ParentRegistrationContext>;
}

export function useParentRegistration() {
  const ctx = use(ParentRegistrationContext);
  if (!ctx) throw new Error('useParentRegistration must be used inside ParentRegistrationProvider');
  return ctx;
}
