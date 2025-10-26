import { useState } from "react";
import { CategoryModal } from "./CategoryModal";

export function CategoryCreateButton({
  onCreated,
  items,
  refetch,
  loading
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline font-medium ml-auto"
      >
        Nova
      </button>
      <CategoryModal
        open={open}
        setOpen={setOpen}
        onCreated={onCreated}
        items={items}
        refetch={refetch}
        loading={loading}
      />
    </>
  );
}
