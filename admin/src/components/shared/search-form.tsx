import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

// pencarian lewat URL (?q=), tanpa JavaScript di client
export function SearchForm({
  placeholder,
  defaultValue,
  keep = {},
}: {
  placeholder: string;
  defaultValue?: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <form role="search" className="relative w-full sm:w-72">
      {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" defaultValue={defaultValue} placeholder={placeholder} className="h-10 rounded-xl bg-white pl-10" />
    </form>
  );
}
